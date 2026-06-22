"""
VisioBin AI Bridge - Picamera2 Edition (dengan UART ke ESP32)
=============================================================
Alur kerja:
  Pi Camera → ONNX Inferensi → (confidence >= threshold)
                              ├─→ POST ke Backend API
                              └─→ UART: "CLASSIFY:ORGANIC\n" atau "CLASSIFY:INORGANIC\n"
                                        ↓
                                      ESP32 → Servo bergerak
"""
import argparse
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
DEFAULT_UART_PORT = os.environ.get("VISIOBIN_UART_PORT", "/dev/ttyUSB0")
DEFAULT_UART_BAUD = int(os.environ.get("VISIOBIN_UART_BAUD", "9600"))
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
        "predicted_class": label.lower(),
        "confidence": round(conf, 4),
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    try:
        r = requests.post(url, json=payload, headers=headers, timeout=5)
        print(f"   📡 Backend: {r.status_code}")
        return r.status_code in (200, 201)
    except Exception as e:
        print(f"   ❌ Backend error: {e}")
        return False


def init_serial(port, baud):
    """Buka koneksi serial ke ESP32. Return None jika gagal (non-fatal)."""
    try:
        import serial
        ser = serial.Serial(port, baud, timeout=1)
        print(f"🔌 Serial terhubung ke ESP32: {port} @ {baud} baud")
        return ser
    except Exception as e:
        print(f"⚠️  Serial tidak bisa dibuka ({port}): {e}")
        print("   Program tetap berjalan, servo tidak akan bergerak.")
        return None


def send_servo_command(ser, label):
    """
    Kirim perintah ke ESP32 via UART.
    Label "Organik"    → "CLASSIFY:ORGANIK\n"
    Label "Anorganik"  → "CLASSIFY:ANORGANIK\n"
    """
    if ser is None or not ser.is_open:
        return

    # Sesuaikan dengan perintah yang dibaca ESP32
    if "organik" in label.lower() and "an" not in label.lower():
        cmd = "CLASSIFY:ORGANIK\n"
    else:
        cmd = "CLASSIFY:ANORGANIK\n"

    try:
        ser.write(cmd.encode("utf-8"))
        print(f"   ⚙️  Kirim ke ESP32: {cmd.strip()}")
    except Exception as e:
        print(f"   ❌ Gagal kirim ke ESP32: {e}")


def main():
    parser = argparse.ArgumentParser(description="VisioBin AI Bridge - Picamera2 + UART Edition")
    parser.add_argument("--onnx",       default=DEFAULT_ONNX)
    parser.add_argument("--url",        default=DEFAULT_BACKEND)
    parser.add_argument("--bin-id",     default=DEFAULT_BIN_ID)
    parser.add_argument("--threshold",  type=float, default=DEFAULT_THRESHOLD)
    parser.add_argument("--cooldown",   type=float, default=DEFAULT_COOLDOWN)
    parser.add_argument("--capture",    action="store_true", help="Simpan frame saat deteksi")
    parser.add_argument("--token",      default=None, help="Bearer token untuk API")
    parser.add_argument("--width",      type=int, default=640)
    parser.add_argument("--height",     type=int, default=480)
    parser.add_argument("--uart-port",  default=DEFAULT_UART_PORT, help="Port serial ESP32")
    parser.add_argument("--uart-baud",  type=int, default=DEFAULT_UART_BAUD, help="Baud rate serial")
    parser.add_argument("--no-uart",    action="store_true", help="Nonaktifkan UART (tanpa servo)")
    args = parser.parse_args()

    print("🚀 VisioBin AI Bridge (Picamera2 + UART Edition)")
    print(f"   Model     : {args.onnx}")
    print(f"   Backend   : {args.url}")
    print(f"   Bin ID    : {args.bin_id}")
    print(f"   Threshold : {args.threshold}")
    print(f"   Cooldown  : {args.cooldown}s")
    print(f"   UART      : {'DISABLED' if args.no_uart else f'{args.uart_port} @ {args.uart_baud}'}")

    # --- Load model ---
    session, input_name = load_model(args.onnx)

    # --- Init serial ke ESP32 ---
    ser = None
    if not args.no_uart:
        ser = init_serial(args.uart_port, args.uart_baud)

    # --- Init capture dir ---
    if args.capture and not os.path.exists(CAPTURE_DIR):
        os.makedirs(CAPTURE_DIR)

    # --- Init kamera ---
    picam2 = Picamera2()
    config = picam2.create_preview_configuration(
        main={"size": (args.width, args.height), "format": "RGB888"}
    )
    picam2.configure(config)
    picam2.start()
    time.sleep(2)  # Tunggu kamera stabil
    print("\n📷 Kamera aktif! Menjalankan inferensi loop... Ctrl+C untuk berhenti.\n")

    last_send = 0

    try:
        while True:
            # Ambil frame dari kamera
            frame = picam2.capture_array()
            img = preprocess(frame)

            # Jalankan inferensi
            label, conf, ms = infer(session, input_name, img)

            # Tampilkan status realtime
            status = "✅" if conf >= args.threshold else "🔸"
            print(f"{status} {label} ({conf*100:.1f}%) | {ms}ms", end="\r")

            now = time.time()

            # Trigger: confidence cukup DAN cooldown sudah lewat
            if conf >= args.threshold and (now - last_send) >= args.cooldown:
                print(f"\n🎯 Terdeteksi: {label} ({conf*100:.1f}%) | {ms}ms")

                # 1. Kirim ke backend
                send_to_backend(args.url, args.bin_id, label, conf, args.token)

                # 2. Kirim perintah servo ke ESP32 via UART
                send_servo_command(ser, label)

                # 3. Simpan foto jika --capture aktif
                if args.capture:
                    fname = f"{CAPTURE_DIR}/{label}_{int(now)}.jpg"
                    # Frame dari picam2 adalah RGB, konvert ke BGR untuk cv2.imwrite
                    cv2.imwrite(fname, cv2.cvtColor(frame, cv2.COLOR_RGB2BGR))
                    print(f"   📸 Disimpan: {fname}")

                last_send = now

            time.sleep(0.1)

    except KeyboardInterrupt:
        print("\n\n⛔ Dihentikan.")
    finally:
        picam2.stop()
        if ser and ser.is_open:
            ser.close()
        print("✅ Kamera dan serial dilepas.")


if __name__ == "__main__":
    main()