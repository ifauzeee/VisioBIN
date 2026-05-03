import argparse
import json
import os
import time
import glob
import sys
import platform

import cv2
import numpy as np
import requests
import onnxruntime as ort

# ─────────────────────────────────────────────────────────────────
# Konfigurasi default
# ─────────────────────────────────────────────────────────────────
DEFAULT_ONNX       = os.environ.get("VISIOBIN_ONNX", "best.onnx")
DEFAULT_BACKEND    = os.environ.get("VISIOBIN_BACKEND", "http://localhost:8080/api/v1/classifications")
DEFAULT_BIN_ID     = os.environ.get("VISIOBIN_BIN_ID", "VBIN-01")
DEFAULT_THRESHOLD  = float(os.environ.get("VISIOBIN_THRESHOLD", "0.75"))
DEFAULT_COOLDOWN   = float(os.environ.get("VISIOBIN_COOLDOWN", "3.0"))
DEFAULT_MOCK_DIR   = "test_images"
DEFAULT_UART_PORT  = os.environ.get("VISIOBIN_UART_PORT", None) # Default None agar tidak error jika tidak dipakai
DEFAULT_UART_BAUD  = int(os.environ.get("VISIOBIN_UART_BAUD", "115200"))
CAPTURE_DIR        = "captures"

class AIBridgeONNX:
    """
    Pipeline Kamera → ONNX Runtime → REST API.
    Didesain khusus untuk efisiensi di Raspberry Pi / Edge Devices.
    """

    LABELS = {0: "Anorganik", 1: "Organik"}

    def __init__(self, model_path, source, backend_url, bin_id, threshold, cooldown, capture, 
                 mock=False, mock_dir=DEFAULT_MOCK_DIR, uart_port=None, uart_baud=115200):
        self.model_path   = model_path
        self.source       = int(source) if (not mock and str(source).isdigit()) else source
        self.url          = backend_url
        self.bin_id       = bin_id
        self.threshold    = threshold
        self.cooldown     = cooldown
        self.capture      = capture
        self.mock         = mock
        self.mock_dir     = mock_dir
        self.uart_port    = uart_port
        self.uart_baud    = uart_baud
        self.last_send    = 0
        self.ser          = None

        if capture and not os.path.exists(CAPTURE_DIR):
            os.makedirs(CAPTURE_DIR)

        print(f"🚀 VisioBin AI Bridge (ONNX Version) Starting...")
        print(f"   Model    : {model_path}")
        print(f"   Backend  : {backend_url}")
        print(f"   Bin ID   : {bin_id}")
        print(f"   Mode     : {'MOCK (Images)' if mock else 'LIVE (Camera)'}")
        if uart_port:
            print(f"   UART     : {uart_port} @ {uart_baud} baud")
        
        self._load_model()
        self._init_serial()
        if not mock:
            self.cap = cv2.VideoCapture(self.source)

    def _load_model(self):
        """Inisialisasi ONNX Runtime session."""
        try:
            # Gunakan CPU Execution Provider (standar untuk Raspberry Pi)
            # Jika ada GPU (NVIDIA), bisa gunakan CUDAExecutionProvider
            providers = ['CPUExecutionProvider']
            self.session = ort.InferenceSession(self.model_path, providers=providers)
            self.input_name = self.session.get_inputs()[0].name
            print(f"✅ ONNX Model Loaded Successfully on {ort.get_device()}")
        except Exception as e:
            print(f"❌ Failed to load ONNX model: {e}")
            sys.exit(1)

    def _init_serial(self):
        """Inisialisasi koneksi serial ke ESP32 (opsional)."""
        if not self.uart_port:
            return

        try:
            import serial
            self.ser = serial.Serial(self.uart_port, self.uart_baud, timeout=1)
            print(f"🔌 [SERIAL] Connected to ESP32 on {self.uart_port}")
        except Exception as e:
            print(f"⚠️ [SERIAL] Warning: Could not open serial port {self.uart_port}: {e}")
            print("   (Program tetap berjalan tanpa kontrol servo)")

    def _preprocess(self, frame):
        """Persiapkan frame untuk input model (Resize, Transpose, Normalize)."""
        img = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        img = cv2.resize(img, (224, 224))
        img = img.astype(np.float32) / 255.0
        img = np.transpose(img, (2, 0, 1)) # HWC to CHW
        img = np.expand_dims(img, axis=0)  # Add Batch dimension
        return img

    def _infer(self, frame):
        """Jalankan inferensi ONNX."""
        start_time = time.time()
        input_data = self._preprocess(frame)
        
        outputs = self.session.run(None, {self.input_name: input_data})
        probs = outputs[0][0]
        
        # Softmax manual karena output ONNX mungkin berupa raw logits
        exp_probs = np.exp(probs - np.max(probs))
        probs = exp_probs / exp_probs.sum()
        
        idx = np.argmax(probs)
        conf = probs[idx]
        
        label = self.LABELS.get(idx, "Unknown")
        inference_ms = (time.time() - start_time) * 1000
        
        return label, conf, inference_ms

    def _send_to_backend(self, label, conf, inf_ms, frame=None):
        """Kirim hasil klasifikasi ke REST API."""
        payload = {
            "bin_id": self.bin_id,
            "predicted_class": label.lower(),
            "confidence": round(float(conf), 4),
            "inference_time_ms": int(inf_ms)
        }
        
        headers = {
            "Content-Type": "application/json",
            "X-API-Key": os.environ.get("VISIOBIN_API_KEY", "visiobin-iot-secret-key")
        }

        try:
            resp = requests.post(self.url, json=payload, headers=headers, timeout=3)
            if resp.status_code == 201:
                print(f"📡 [BACKEND] Success: {label} ({conf*100:.1f}%) | {inf_ms:.0f}ms")
                
                # Simpan gambar jika fitur capture aktif
                if self.capture and frame is not None:
                    ts = int(time.time())
                    label_clean = label.replace(" ", "_")
                    fname = f"{CAPTURE_DIR}/{label_clean}_{ts}.jpg"
                    cv2.imwrite(fname, frame)
                    print(f"📸 [CAPTURE] Saved: {fname}")
                
                # Kirim perintah ke Servo via UART jika tersedia
                self._send_servo_command(label)
            else:
                print(f"⚠️ [BACKEND] HTTP {resp.status_code}: {resp.text[:100]}")
        except Exception as e:
            print(f"❌ [BACKEND] Connection Error: {e}")

    def _send_servo_command(self, label):
        """Kirim perintah gerak servo ke ESP32."""
        if not self.ser or not self.ser.is_open:
            return

        try:
            cmd = f"CLASSIFY:{label.upper()}\n"
            self.ser.write(cmd.encode('utf-8'))
            print(f"⚙️ [SERIAL] Sent to ESP32: {cmd.strip()}")
        except Exception as e:
            print(f"❌ [SERIAL] Error sending command: {e}")

    def run_live(self):
        """Loop utama pemrosesan kamera."""
        if not self.cap.isOpened():
            print(f"❌ Error: Could not open video source {self.source}")
            return

        print("📺 Live Stream Started. Press 'q' to quit.")
        
        while True:
            ret, frame = self.cap.read()
            if not ret:
                break

            label, conf, inf_ms = self._infer(frame)
            
            # Draw UI
            color = (0, 255, 0) if label == "Organik" else (255, 165, 0)
            cv2.putText(frame, f"{label} ({conf*100:.1f}%)", (20, 50), 
                        cv2.FONT_HERSHEY_SIMPLEX, 1, color, 2)
            cv2.putText(frame, f"Latency: {inf_ms:.1f}ms", (20, 90), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)

            # Decision Logic
            now = time.time()
            if conf >= self.threshold and (now - self.last_send) >= self.cooldown:
                self._send_to_backend(label, conf, inf_ms, frame)
                self.last_send = now

            cv2.imshow("VisioBin - Edge AI ONNX", frame)
            
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

        self.cap.release()
        cv2.destroyAllWindows()

    def run_mock(self):
        """Mode mock: baca gambar dari folder satu per satu."""
        pattern = os.path.join(self.mock_dir, "*.png")
        pattern_jpg = os.path.join(self.mock_dir, "*.jpg")
        images = sorted(glob.glob(pattern) + glob.glob(pattern_jpg))

        if not images:
            print(f"❌ [MOCK] Tidak ada gambar .png/.jpg di folder: {self.mock_dir}")
            return

        print(f"🖼️ [MOCK] Memproses {len(images)} gambar...")
        print("-" * 60)

        for img_path in images:
            frame = cv2.imread(img_path)
            if frame is None:
                continue

            label, conf, inf_ms = self._infer(frame)
            print(f"📄 {os.path.basename(img_path):<25} → {label} ({conf*100:.1f}%) | {inf_ms:.0f}ms")
            
            # Tampilkan visualisasi
            display_frame = frame.copy()
            color = (0, 255, 0) if label == "Organik" else (255, 165, 0)
            cv2.putText(display_frame, f"{label} ({conf*100:.1f}%)", (20, 50), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
            cv2.imshow("VisioBin - Mock Mode (ONNX)", display_frame)
            
            # Decision Logic (Kirim ke backend)
            now = time.time()
            if conf >= self.threshold and (now - self.last_send) >= self.cooldown:
                self._send_to_backend(label, conf, inf_ms, frame)
                self.last_send = now

            # Tunggu tombol untuk lanjut ke gambar berikutnya (0 = selamanya)
            print("   ⌨️  Tekan tombol APA SAJA di jendela gambar untuk lanjut...")
            key = cv2.waitKey(0) 
            if key & 0xFF == ord('q'):
                break

        print("-" * 60)
        print("✅ [MOCK] Selesai.")
        cv2.destroyAllWindows()

    def run(self):
        """Entry point: pilih mode berdasarkan mock flag."""
        if self.mock:
            self.run_mock()
        else:
            self.run_live()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--onnx",      default=DEFAULT_ONNX)
    parser.add_argument("--source",    default="0")
    parser.add_argument("--url",       default=DEFAULT_BACKEND)
    parser.add_argument("--bin-id",    default=DEFAULT_BIN_ID)
    parser.add_argument("--threshold", type=float, default=DEFAULT_THRESHOLD)
    parser.add_argument("--cooldown",  type=float, default=DEFAULT_COOLDOWN)
    parser.add_argument("--capture",   action="store_true", help="Save successful classification images")
    parser.add_argument("--mock",      action="store_true", help="Mode mock: gunakan gambar dari folder")
    parser.add_argument("--mock-dir",  default=DEFAULT_MOCK_DIR, help="Folder gambar untuk mode mock")
    parser.add_argument("--uart-port", default=DEFAULT_UART_PORT, help="Serial port untuk ESP32 (misal: COM3 atau /dev/ttyUSB0)")
    parser.add_argument("--uart-baud", type=int, default=DEFAULT_UART_BAUD, help="Baud rate serial")
    
    args = parser.parse_args()
    
    bridge = AIBridgeONNX(
        args.onnx, args.source, args.url, args.bin_id, 
        args.threshold, args.cooldown, args.capture,
        args.mock, args.mock_dir,
        args.uart_port, args.uart_baud
    )
    bridge.run()
