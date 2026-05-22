import argparse
import json
import os
import time
import sys
import numpy as np
import cv2
import requests
import onnxruntime as ort
from picamera2 import Picamera2
from env_config import load_root_env, require_env

load_root_env()

DEFAULT_ONNX      = os.environ.get("VISIOBIN_ONNX", "best.onnx")
DEFAULT_BACKEND   = require_env("VISIOBIN_BACKEND")
DEFAULT_BIN_ID    = os.environ.get("VISIOBIN_BIN_ID", "VBIN-01")
DEFAULT_THRESHOLD = float(os.environ.get("VISIOBIN_THRESHOLD", "0.75"))
DEFAULT_COOLDOWN  = float(os.environ.get("VISIOBIN_COOLDOWN", "3.0"))
CAPTURE_DIR       = "captures"

LABELS = {0: "Anorganik", 1: "Organik"}

def load_model(model_path):
    session = ort.InferenceSession(model_path, providers=['CPUExecutionProvider'])
    input_name = session.get_inputs()[0].name
    print(f"✅ Model loaded: {model_path}")
    return session, input_name

def preprocess(frame):
    img = cv2.resize(frame, (224, 224))
    img = img.astype(np.float32) / 255.0
    img = np.transpose(img, (2, 0, 1))
    img = np.expand_dims(img, axis=0)
    return img

def infer(session, input_name, img):
    t0 = time.time()
    outputs = session.run(None, {input_name: img})
    ms = int((time.time() - t0) * 1000)
    probs = outputs[0][0]
    idx = int(np.argmax(probs))
    conf = float(probs[idx])
    return LABELS[idx], conf, ms

def send_to_backend(url, bin_id, label, conf, token=None):
    payload = {
        "bin_id": bin_id,
        "label": label,
        "confidence": round(conf, 4),
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    try:
        r = requests.post(url, json=payload, headers=headers, timeout=5)
        print(f"   📡 Backend: {r.status_code}")
    except Exception as e:
        print(f"   ❌ Backend error: {e}")

def main():
    parser = argparse.ArgumentParser(description="VisioBin AI Bridge - Picamera2 Edition")
    parser.add_argument("--onnx",      default=DEFAULT_ONNX)
    parser.add_argument("--url",       default=DEFAULT_BACKEND)
    parser.add_argument("--bin-id",    default=DEFAULT_BIN_ID)
    parser.add_argument("--threshold", type=float, default=DEFAULT_THRESHOLD)
    parser.add_argument("--cooldown",  type=float, default=DEFAULT_COOLDOWN)
    parser.add_argument("--capture",   action="store_true", help="Save captured frames")
    parser.add_argument("--token",     default=None, help="Bearer token untuk API")
    parser.add_argument("--width",     type=int, default=640)
    parser.add_argument("--height",    type=int, default=480)
    args = parser.parse_args()

    print("🚀 VisioBin AI Bridge (Picamera2 Edition)")
    print(f"   Model    : {args.onnx}")
    print(f"   Backend  : {args.url}")
    print(f"   Bin ID   : {args.bin_id}")
    print(f"   Threshold: {args.threshold}")
    print(f"   Cooldown : {args.cooldown}s")

    session, input_name = load_model(args.onnx)

    if args.capture and not os.path.exists(CAPTURE_DIR):
        os.makedirs(CAPTURE_DIR)

    picam2 = Picamera2()
    config = picam2.create_preview_configuration(
        main={"size": (args.width, args.height), "format": "RGB888"}
    )
    picam2.configure(config)
    picam2.start()
    time.sleep(2)
    print("📷 Camera started! Running inference loop... Ctrl+C to stop.\n")

    last_send = 0
    try:
        while True:
            frame = picam2.capture_array()
            img = preprocess(frame)
            label, conf, ms = infer(session, input_name, img)

            status = "✅" if conf >= args.threshold else "🔸"
            print(f"{status} {label} ({conf*100:.1f}%) | {ms}ms", end="\r")

            now = time.time()
            if conf >= args.threshold and (now - last_send) >= args.cooldown:
                print(f"\n🎯 Detected: {label} ({conf*100:.1f}%) | {ms}ms")
                send_to_backend(args.url, args.bin_id, label, conf, args.token)
                if args.capture:
                    fname = f"{CAPTURE_DIR}/{label}_{int(now)}.jpg"
                    cv2.imwrite(fname, cv2.cvtColor(frame, cv2.COLOR_RGB2BGR))
                    print(f"   📸 Saved: {fname}")
                last_send = now

            time.sleep(0.1)

    except KeyboardInterrupt:
        print("\n\n⛔ Stopped.")
    finally:
        picam2.stop()
        print("✅ Camera released.")

if __name__ == "__main__":
    main()
