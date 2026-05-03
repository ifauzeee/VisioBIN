# 🧠 VisioBin AI Model (YOLOv5 Classification)

Mengingat dataset kaggle yang kita gunakan adalah kumpulan foto *"full image"* tanpa _bounding box_, maka kita akan melatih model **YOLOv5 - Classification** (`yolov5n-cls.pt`). AI ini akan menjawab: *"Foto ini kelasnya Organik atau Anorganik?"*

Disarankan untuk melakukan *Training* model di **Google Colab** secara gratis karena butuh GPU.

## 🚀 Langkah 1: Format Kaggle Dataset
Agar bisa dilatih oleh YOLOv5-cls, dataset kamu sudah kita format ke struktur seperti ini otomatis oleh sistem:

```text
visiobin_cls_dataset/
  ├── train/
  │   ├── Organic/
  │   └── Inorganic/
  └── val/
      ├── Organic/
      └── Inorganic/
```

**Tugasmu:** Buka folder `ai-model` di laptopmu, jadikan folder `visiobin_cls_dataset` menjadi zip (`visiobin_cls_dataset.zip`) lalu **Upload ZIP itu ke Google Drive kamu**.

## 🚀 Langkah 2: Training di Google Colab
1. Buka [Google Colab](https://colab.research.google.com/).
2. Buat Notebook baru, lalu **pilih runtime T4 GPU** (Runtime > Change runtime type > T4 GPU).
3. Jalankan kode di bawah ini pada cell satu-per-satu (copy paste):

### 1. Mount Google Drive & Setup YOLO
```python
from google.colab import drive
drive.mount('/content/drive')

# Install YOLOv5 dari ultralytics
!git clone https://github.com/ultralytics/yolov5
%cd yolov5
!pip install -qr requirements.txt
```

### 2. Copy Dataset dari GDrive
```python
# Sesuaikan path-nya jika kamu taruh zip di dalam folder/sub-folder
!cp /content/drive/MyDrive/visiobin_cls_dataset.zip /content/
!unzip /content/visiobin_cls_dataset.zip -d /content/dataset/
```

### 3. Mulai Training (Classification Mode - 20 Epoch)
```python
# Kita menggunakan modul "classify/train.py" khusus classification
!python classify/train.py --model yolov5n-cls.pt --data /content/dataset/visiobin_cls_dataset --epochs 20 --img 224
```

## 🚀 Langkah 3: Ekspor untuk Raspberry Pi (ONNX/TFLite)
Model hasil training biasanya ada di `runs/train-cls/exp/weights/best.pt`.
Ekspor ke format yang ringan untuk Raspberry Pi:

```python
# Jalankan di Colab setelah training selesai
!python export.py --weights runs/train-cls/exp/weights/best.pt --include onnx tflite --img 224
```
Kemudian **Download** file `best.pt`, `best.onnx`, atau `best.tflite` dari navigasi file Colab di sebelah kiri layarmu.

## 🚀 Langkah 4: Test Real-Time di Laptop Kamu
Setelah di-download, taruh file model kamu (`best.pt`) ke dalam folder `ai-model/` ini.

1. Buka terminal (CMD / PowerShell).
2. Pastikan sudah install dependensi: 
   `pip install torch torchvision torchaudio opencv-python numpy onnxruntime`
3. Hidupkan Webcam laptop dan tes:
   `py ai_bridge.py --weights best.pt`

### ⚡ Versi High-Performance (Rekomendasi Raspberry Pi)
Gunakan versi ONNX untuk kecepatan maksimal di perangkat Edge:
1. Pastikan file `best.onnx` ada di folder ini.
2. Jalankan (Mode Live Kamera):
   `py ai_bridge_onnx.py --onnx best.onnx --capture`
3. Jalankan (Mode Mock Gambar - Jika kamera jelek/tidak ada):
   `py ai_bridge_onnx.py --onnx best.onnx --mock --mock-dir test_images`

*Fitur `--capture` akan menyimpan foto setiap kali klasifikasi berhasil ke folder `captures/`.*
