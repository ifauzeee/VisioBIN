"""
VisioBin AI Bridge
==================
Menghubungkan kamera → model YOLOv5 → backend REST API.

Usage (development, Windows):
    python ai_bridge.py --source 0

Usage (production, Raspberry Pi):
    python ai_bridge.py --source 0 --url http://<backend-ip>:8080/api/v1/classifications

Usage (mock/testing tanpa kamera):
    python ai_bridge.py --mock --mock-dir test_images/
"""

import argparse
import json
import os
import pathlib
import platform
import sys
import time
import glob

import cv2
import requests
import torch
import numpy as np

# ─────────────────────────────────────────────────────────────────
# Patch kompatibilitas lintas OS HANYA saat dev di Windows
# TIDAK diaktifkan di Linux/Raspberry Pi
# ─────────────────────────────────────────────────────────────────
if platform.system() == "Windows":
    pathlib.PosixPath = pathlib.WindowsPath


# ─────────────────────────────────────────────────────────────────
# Konfigurasi default (dapat di-override via argparse atau env var)
# ─────────────────────────────────────────────────────────────────
DEFAULT_WEIGHTS    = os.environ.get("VISIOBIN_WEIGHTS", "best.pt")
DEFAULT_BACKEND    = os.environ.get("VISIOBIN_BACKEND", "http://localhost:8080/api/v1/classifications")
DEFAULT_BIN_ID     = os.environ.get("VISIOBIN_BIN_ID", "VBIN-01")
DEFAULT_THRESHOLD  = float(os.environ.get("VISIOBIN_THRESHOLD", "0.85"))
DEFAULT_COOLDOWN   = float(os.environ.get("VISIOBIN_COOLDOWN", "3.0"))
LOW_CONF_LOGFILE   = os.environ.get("VISIOBIN_LOW_CONF_LOG", "low_confidence_log.jsonl")


class AIBridge:
    """Pipeline kamera → YOLOv5 → REST API dengan mock mode."""

    LABELS = {0: "Inorganic", 1: "Organic"}

    def __init__(self, weights, source, backend_url, bin_id, threshold, cooldown, mock, mock_dir):
        self.weights      = weights
        self.source       = int(source) if (not mock and str(source).isdigit()) else source
        self.url          = backend_url
        self.bin_id       = bin_id
        self.threshold    = threshold
        self.cooldown     = cooldown
        self.mock         = mock
        self.mock_dir     = mock_dir
        self.last_send    = 0

        print(f"[INIT] Platform : {platform.system()} ({platform.machine()})")
        print(f"[INIT] Weights  : {weights}")
        print(f"[INIT] Bin ID   : {bin_id}")
        print(f"[INIT] Threshold: {threshold}")
        print(f"[INIT] Cooldown : {cooldown}s")
        print(f"[INIT] Mode     : {'MOCK' if mock else 'LIVE CAMERA'}")

        self._load_model()
        if not mock:
            self.cap = cv2.VideoCapture(self.source)

    # ── Model Loading ──────────────────────────────────────────────

    def _load_model(self):
        """Load YOLOv5 classification model dari local weights."""
        try:
            self.model = torch.hub.load(
                "ultralytics/yolov5", "custom",
                path=self.weights,
                force_reload=False,
                verbose=False
            )
            self.model.eval()
            print(f"[MODEL] Loaded: {self.weights}")
        except Exception as e:
            print(f"[ERROR] Gagal load model: {e}")
            sys.exit(1)

    # ── Inference ──────────────────────────────────────────────────

    def _infer(self, frame_bgr):
        """
        Jalankan inferensi pada frame.
        Mengembalikan (label, confidence, inference_ms).
        """
        start = time.time()

        img = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        img = cv2.resize(img, (224, 224))
        img = np.transpose(img, (2, 0, 1))
        img = np.expand_dims(img, axis=0)
        tensor = torch.from_numpy(img.copy()).float() / 255.0

        with torch.no_grad():
            results = self.model(tensor)
            probs   = torch.softmax(results[0], dim=0)
            idx     = torch.argmax(probs).item()
            conf    = probs[idx].item()

        label   = self.LABELS.get(idx, "Unknown")
        inf_ms  = (time.time() - start) * 1000
        return label, conf, inf_ms

    # ── Logging ────────────────────────────────────────────────────

    def _log_low_confidence(self, label, conf, inf_ms):
        """Simpan prediksi di bawah threshold ke file JSONL untuk analisis."""
        entry = {
            "ts":         time.time(),
            "label":      label,
            "confidence": round(conf, 4),
            "inf_ms":     round(inf_ms, 1),
            "bin_id":     self.bin_id,
        }
        try:
            with open(LOW_CONF_LOGFILE, "a") as f:
                f.write(json.dumps(entry) + "\n")
        except Exception as e:
            print(f"[WARN] Gagal tulis low-conf log: {e}")

    # ── Backend Communication ──────────────────────────────────────

    def _send_classification(self, label, conf, inf_ms):
        """Kirim hasil klasifikasi ke backend API."""
        payload = {
            "bin_id":           self.bin_id,
            "predicted_class":  label,
            "confidence":       round(float(conf), 4),
            "inference_time_ms": int(inf_ms),
        }
        try:
            resp = requests.post(self.url, json=payload, timeout=2)
            if resp.status_code == 201:
                print(f"[BACKEND] ✓ Terkirim: {label} ({conf*100:.1f}%) | {inf_ms:.0f}ms")
            else:
                print(f"[BACKEND] ✗ HTTP {resp.status_code}: {resp.text[:100]}")
        except requests.exceptions.ConnectionError:
            print(f"[BACKEND] ✗ Backend tidak tersedia ({self.url})")
        except Exception as e:
            print(f"[ERROR] Gagal kirim ke backend: {e}")

    # ── Decision Logic ─────────────────────────────────────────────

    def _process_result(self, label, conf, inf_ms):
        """Proses hasil inferensi: kirim atau log berdasarkan threshold & cooldown."""
        now = time.time()

        if conf >= self.threshold:
            if (now - self.last_send) >= self.cooldown:
                self._send_classification(label, conf, inf_ms)
                self.last_send = now
            else:
                remaining = self.cooldown - (now - self.last_send)
                print(f"[SKIP] {label} ({conf*100:.1f}%) — cooldown {remaining:.1f}s")
        else:
            print(f"[LOW]  {label} ({conf*100:.1f}%) — di bawah threshold {self.threshold*100:.0f}%")
            self._log_low_confidence(label, conf, inf_ms)

    # ── Overlay UI ─────────────────────────────────────────────────

    def _draw_overlay(self, frame, label, conf):
        """Gambar label & confidence pada frame kamera (mode live)."""
        color   = (0, 200, 50) if label == "Organic" else (0, 140, 255)
        overlay = frame.copy()
        cv2.rectangle(overlay, (0, 0), (400, 70), (0, 0, 0), -1)
        cv2.addWeighted(overlay, 0.4, frame, 0.6, 0, frame)
        cv2.putText(frame, f"{label}  {conf*100:.1f}%",
                    (15, 45), cv2.FONT_HERSHEY_DUPLEX, 1.2, color, 2)
        cv2.putText(frame, f"BIN: {self.bin_id}",
                    (15, 65), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
        return frame

    # ── Run Modes ──────────────────────────────────────────────────

    def run_mock(self):
        """
        Mode mock: baca gambar dari folder --mock-dir satu per satu.
        Berguna untuk testing tanpa kamera fisik.
        """
        pattern = os.path.join(self.mock_dir, "*.png")
        pattern_jpg = os.path.join(self.mock_dir, "*.jpg")
        images = sorted(glob.glob(pattern) + glob.glob(pattern_jpg))

        if not images:
            print(f"[MOCK] Tidak ada gambar di folder: {self.mock_dir}")
            print(f"[MOCK] Pastikan ada file .png/.jpg di sana.")
            sys.exit(1)

        print(f"[MOCK] Ditemukan {len(images)} gambar. Memproses...")
        print("-" * 60)

        for img_path in images:
            frame = cv2.imread(img_path)
            if frame is None:
                print(f"[MOCK] Skip: {img_path} (tidak bisa dibaca)")
                continue

            label, conf, inf_ms = self._infer(frame)
            print(f"[MOCK] {os.path.basename(img_path):<30} → {label} ({conf*100:.1f}%) | {inf_ms:.0f}ms")
            self._process_result(label, conf, inf_ms)
            time.sleep(1.5)

        print("-" * 60)
        print("[MOCK] Selesai memproses semua gambar.")

    def run_live(self):
        """Mode live: baca frame dari kamera secara real-time."""
        if not self.cap.isOpened():
            print(f"[ERROR] Kamera tidak ditemukan (source={self.source})")
            print("[HINT]  Coba --source 0 atau path video file")
            sys.exit(1)

        print("[LIVE] VisioBin AI Bridge Aktif... (tekan 'q' untuk keluar)")
        print("-" * 60)

        while True:
            ret, frame = self.cap.read()
            if not ret:
                print("[LIVE] Frame tidak bisa dibaca. Kamera terputus?")
                break

            label, conf, inf_ms = self._infer(frame)
            self._process_result(label, conf, inf_ms)
            frame = self._draw_overlay(frame, label, conf)

            cv2.imshow("VisioBin AI Bridge", frame)
            if cv2.waitKey(1) & 0xFF == ord("q"):
                print("[LIVE] Keluar...")
                break

        self.cap.release()
        cv2.destroyAllWindows()

    def run(self):
        """Entry point: pilih mode berdasarkan --mock flag."""
        if self.mock:
            self.run_mock()
        else:
            self.run_live()


# ─────────────────────────────────────────────────────────────────
# CLI Entry Point
# ─────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="VisioBin AI Bridge — Raspberry Pi Edge AI pipeline"
    )
    parser.add_argument("--weights",    type=str,   default=DEFAULT_WEIGHTS,    help="Path ke model .pt")
    parser.add_argument("--source",     type=str,   default="0",                help="Kamera index (0,1) atau path video")
    parser.add_argument("--url",        type=str,   default=DEFAULT_BACKEND,    help="URL endpoint klasifikasi backend")
    parser.add_argument("--bin-id",     type=str,   default=DEFAULT_BIN_ID,     help="ID tempat sampah ini")
    parser.add_argument("--threshold",  type=float, default=DEFAULT_THRESHOLD,  help="Minimum confidence untuk dikirim (0.0–1.0)")
    parser.add_argument("--cooldown",   type=float, default=DEFAULT_COOLDOWN,   help="Jeda minimum antar pengiriman (detik)")
    parser.add_argument("--mock",       action="store_true",                    help="Mode mock: gunakan gambar dari folder")
    parser.add_argument("--mock-dir",   type=str,   default="test_images",      help="Folder gambar untuk mode mock")
    args = parser.parse_args()

    bridge = AIBridge(
        weights     = args.weights,
        source      = args.source,
        backend_url = args.url,
        bin_id      = args.bin_id,
        threshold   = args.threshold,
        cooldown    = args.cooldown,
        mock        = args.mock,
        mock_dir    = args.mock_dir,
    )
    bridge.run()