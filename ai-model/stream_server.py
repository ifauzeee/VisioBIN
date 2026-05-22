import io
import time
import threading
import numpy as np
import cv2
import onnxruntime as ort
from picamera2 import Picamera2
from http.server import BaseHTTPRequestHandler, HTTPServer
from env_config import env_float, env_int, load_root_env, require_env

load_root_env()

LABELS = {0: "Anorganik", 1: "Organik"}
MODEL_PATH = require_env("VISIOBIN_ONNX")
WIDTH = env_int("CAMERA_CAPTURE_WIDTH")
HEIGHT = env_int("CAMERA_CAPTURE_HEIGHT")
THRESHOLD = env_float("VISIOBIN_THRESHOLD")
STREAM_HOST = require_env("CAMERA_STREAM_HOST")
STREAM_PORT = env_int("CAMERA_STREAM_PORT")

# Shared state
latest_frame = None
latest_result = {"label": "...", "conf": 0.0, "ms": 0}
lock = threading.Lock()

def load_model():
    session = ort.InferenceSession(MODEL_PATH, providers=['CPUExecutionProvider'])
    input_name = session.get_inputs()[0].name
    return session, input_name

def inference_loop():
    global latest_frame, latest_result
    session, input_name = load_model()
    picam2 = Picamera2()
    config = picam2.create_preview_configuration(
        main={"size": (WIDTH, HEIGHT), "format": "RGB888"}
    )
    picam2.configure(config)
    picam2.start()
    time.sleep(2)
    print("📷 Camera started!")

    while True:
        frame = picam2.capture_array()
        img = cv2.resize(frame, (224, 224)).astype(np.float32) / 255.0
        img = np.expand_dims(np.transpose(img, (2, 0, 1)), axis=0)

        t0 = time.time()
        outputs = session.run(None, {input_name: img})
        ms = int((time.time() - t0) * 1000)
        probs = outputs[0][0]
        idx = int(np.argmax(probs))
        conf = float(probs[idx])
        label = LABELS[idx]

        # Draw overlay on frame
        bgr = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
        color = (0, 200, 0) if conf >= THRESHOLD else (0, 140, 255)
        cv2.rectangle(bgr, (0, 0), (WIDTH, 60), (0, 0, 0), -1)
        cv2.putText(bgr, f"{label} {conf*100:.1f}%", (10, 35),
                    cv2.FONT_HERSHEY_SIMPLEX, 1.0, color, 2)
        cv2.putText(bgr, f"{ms}ms", (WIDTH-80, 35),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 1)

        _, jpeg = cv2.imencode('.jpg', bgr, [cv2.IMWRITE_JPEG_QUALITY, 70])

        with lock:
            latest_frame = jpeg.tobytes()
            latest_result = {"label": label, "conf": conf, "ms": ms}

        time.sleep(0.05)

class StreamHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # suppress logs

    def do_GET(self):
        if self.path == "/":
            self.send_response(200)
            self.send_header("Content-Type", "text/html")
            self.end_headers()
            html = """<!DOCTYPE html>
<html>
<head>
  <title>VisioBin Live</title>
  <style>
    body { background:#111; color:#eee; font-family:sans-serif; text-align:center; margin:0; padding:20px; }
    h1 { color:#4ade80; }
    img { border:2px solid #333; border-radius:8px; max-width:100%; }
    #status { margin-top:12px; font-size:1.2em; }
  </style>
</head>
<body>
  <h1>🗑️ VisioBin Live Camera</h1>
  <img src="/stream" /><br>
  <div id="status">Memuat...</div>
  <script>
    setInterval(() => {
      fetch('/result').then(r=>r.json()).then(d => {
        document.getElementById('status').innerHTML =
          `<b style="color:${d.conf>=0.5?'#4ade80':'#fb923c'}">${d.label}</b> &mdash; ${(d.conf*100).toFixed(1)}% &mdash; ${d.ms}ms`;
      });
    }, 500);
  </script>
</body>
</html>"""
            self.wfile.write(html.encode())

        elif self.path == "/stream":
            self.send_response(200)
            self.send_header("Content-Type", "multipart/x-mixed-replace; boundary=frame")
            self.end_headers()
            try:
                while True:
                    with lock:
                        frame = latest_frame
                    if frame:
                        self.wfile.write(b"--frame\r\n")
                        self.wfile.write(b"Content-Type: image/jpeg\r\n\r\n")
                        self.wfile.write(frame)
                        self.wfile.write(b"\r\n")
                    time.sleep(0.05)
            except Exception:
                pass

        elif self.path == "/result":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            import json
            with lock:
                self.wfile.write(json.dumps(latest_result).encode())

if __name__ == "__main__":
    t = threading.Thread(target=inference_loop, daemon=True)
    t.start()
    print(f"🌐 Stream server running at {require_env('CAMERA_STREAM_URL')}")
    print("   Buka di browser laptop kamu!")
    HTTPServer((STREAM_HOST, STREAM_PORT), StreamHandler).serve_forever()
