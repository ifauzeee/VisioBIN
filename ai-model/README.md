# 🧠 VisioBin AI Model (YOLOv5n)

Mengingat laptop lokal seringkali belum ter-setup dengan Python dan GPU (CUDA), sangan disarankan untuk melakukan *Training* model di **Google Colab** secara gratis.

Folder ini menyimpan konfigurasi dataset dan script pengetesan *real-time* dengan webcam.

## 🚀 Langkah 1: Kumpulkan Dataset
1. Kumpulkan dataset foto sampah (minimal 300-500 foto, campur organik dan anorganik).
2. Lakukan anotasi *Bounding-Box* (bisa menggunakan [Roboflow](https://roboflow.com/) agar mudah direlasikan bentuk YOLOv5 PyTorch).
3. Export dataset dari Roboflow.

Struktur folder hasil export harus seperti ini:
```text
visiobin_dataset/
  ├── train/
  │   ├── images/
  │   └── labels/
  ├── valid/
  │   ├── images/
  │   └── labels/
  └── visiobin_dataset.yaml
```

## 🚀 Langkah 2: Training di Google Colab
1. Buka [Google Colab](https://colab.research.google.com/).
2. Buat Notebook baru, lalu **pilih runtime T4 GPU** (Runtime > Change runtime type > T4 GPU).
3. Jalankan kode di bawah ini pada cell (copy paste):

```python
# 1. Clone YOLOv5
!git clone https://github.com/ultralytics/yolov5
%cd yolov5
!pip install -qr requirements.txt

# 2. Download Dataset dari Roboflow (ganti dengan link export-mu)
!pip install roboflow
# Paste import code snippet dari roboflow di cell sini...

# 3. Mulai Training! (kita pakai yolov5n karena paling kecil & ringan untuk Raspberry Pi)
!python train.py --img 416 --batch 16 --epochs 100 --data ../visiobin_dataset/data.yaml --weights yolov5n.pt --cache
```

## 🚀 Langkah 3: Ekspor untuk Raspberry Pi (ONNX/TFLite)
Model hasil training (`best.pt`) bisa langsung dijalankan, tetapi untuk Raspberry Pi disarankan mengekspor ke `.onnx` atau `.tflite` agar lebih cepat:

```python
# Jalankan di Colab setelah training selesai
!python export.py --weights runs/train/exp/weights/best.pt --include onnx tflite --img 416
```
Kemudian **Download** file `best.onnx` atau `best.tflite` yang di-generate.

## 🚀 Langkah 4: Test Real-Time di Laptop Kamu
Setelah di-download, taruh file model kamu (misal: `best.pt`) ke dalam folder `ai-model/` ini.

1. Buka terminal (CMD / PowerShell).
2. Pastikan sudah install dependensi: 
   `pip install torch torchvision torchaudio opencv-python numpy`
3. Hitupkan Webcam laptop dan tes:
   `python test_inference.py --weights best.pt`
