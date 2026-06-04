# 🧠 VisioBin AI Model

Modul Edge AI untuk klasifikasi sampah Organik / Anorganik menggunakan YOLOv8 Classification yang berjalan di Raspberry Pi.

## Model

| File | Ukuran | Format | Digunakan untuk |
|---|---|---|---|
| `best.pt` | ~8.1 MB | PyTorch | Development / retraining |
| `best.onnx` | ~16.7 MB | ONNX | **Produksi Raspberry Pi** |
| `best.onnx.data` | ~16 MB | Data | (bagian dari ONNX) |

**Kelas output:** `organic` / `inorganic`

## File Utama

| File | Deskripsi |
|---|---|
| `ai_bridge_onnx.py` | Kamera → YOLOv8 ONNX → kirim hasil ke Backend + ESP32 |
| `uart_bridge.py` | Baca data UART dari ESP32 → kirim ke Backend API |
| `ai_bridge_picam.py` | Versi khusus Pi Camera (CSI) |
| `stream_server.py` | Streaming kamera ke web browser |
| `test_inference.py` | Test inferensi dengan gambar statis |
| `test_single_image.py` | Test satu gambar spesifik |
| `export_tflite.py` | Export model ke TFLite (opsional) |

## Instalasi Dependencies

```bash
pip install onnxruntime opencv-python numpy requests pyserial
```

Untuk Raspberry Pi (ARM):
```bash
pip install onnxruntime-openvino  # atau versi lite untuk Pi
```

## Menjalankan di Raspberry Pi

### Mode 1: UART Bridge saja (tanpa kamera, hanya relay sensor data)
```bash
python uart_bridge.py
```

Baca data JSON dari ESP32 via UART (`/dev/ttyUSB0`) dan kirim ke Backend API secara otomatis.

### Mode 2: AI + Kamera (produksi penuh)
```bash
# Kamera USB / webcam
python ai_bridge_onnx.py \
  --onnx best.onnx \
  --uart-port /dev/ttyUSB0 \
  --capture

# Pi Camera CSI
python ai_bridge_picam.py
```

### Mode 3: Test dengan gambar statis (tanpa kamera)
```bash
python ai_bridge_onnx.py \
  --onnx best.onnx \
  --mock \
  --mock-dir test_images
```

### Mode 4: Stream kamera ke browser
```bash
python stream_server.py
# Buka: http://<ip-raspberry>:8000/stream
```

## Alur Kerja AI

```
Kamera (Pi Camera / USB)
      ↓
ai_bridge_onnx.py
      ↓
YOLOv8 ONNX Inferensi
      ↓ (hasil: organic / inorganic, confidence)
      ├─→ POST /api/v1/classifications   (ke Backend)
      └─→ UART: "CLASSIFY:ORGANIC\n"    (ke ESP32 → Servo)
```

## Environment Variables (dari root `.env`)

```env
VISIOBIN_BACKEND=http://localhost:8082/api/v1/classifications
VISIOBIN_BACKEND_API_BASE=http://localhost:8082/api/v1
VISIOBIN_ONNX=best.onnx
VISIOBIN_BIN_ID=VBIN-01
VISIOBIN_CAMERA=0
VISIOBIN_THRESHOLD=0.75     # Confidence minimum untuk klasifikasi
VISIOBIN_COOLDOWN=3.0       # Jeda antar klasifikasi (detik)
VISIOBIN_UART_PORT=/dev/ttyUSB0
VISIOBIN_UART_BAUD=115200
VISIOBIN_INTERVAL=5.0       # Interval UART bridge (detik)
```

## Retraining Model (Google Colab)

Jika ingin melatih ulang model dengan dataset baru:

1. Siapkan dataset dalam struktur:
   ```
   dataset/
   ├── train/
   │   ├── organic/      (foto sampah organik)
   │   └── inorganic/    (foto sampah anorganik)
   └── val/
       ├── organic/
       └── inorganic/
   ```

2. Upload ke Google Drive, buka Google Colab dengan GPU T4

3. Training:
   ```python
   from ultralytics import YOLO
   model = YOLO('yolov8n-cls.pt')
   model.train(data='/content/dataset', epochs=50, imgsz=224)
   ```

4. Export ke ONNX:
   ```python
   model.export(format='onnx', imgsz=224)
   ```

5. Download `best.onnx` → taruh di folder `ai-model/`

> 📄 Konfigurasi lengkap di root [`README.md`](../README.md)
