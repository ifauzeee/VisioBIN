"""
VisioBin AI Model Test Inference (YOLOv5 Classification)
========================================================
Script ini digunakan untuk melakukan pengetesan inference (klasifikasi gambar) 
menggunakan web-camera di laptop.
Karena kita menggunakan YOLOv5-cls (bukan object detection), outputnya adalah probabilitas kelas 
pada keseluruhan Frame layar kamera.

Cara Jalan:
1. Pastikan python sudah terinstall
2. pip install torch torchvision torchaudio opencv-python numpy
3. python test_inference_cls.py --weights best.pt
"""

import cv2
import torch
import argparse
import time
import pathlib

# Fix for loading models trained on Linux (Colab) in Windows
temp = pathlib.PosixPath
pathlib.PosixPath = pathlib.WindowsPath

def main(weights_path, source):
    print(f"Loading YOLOv5-cls model from {weights_path}...")
    
    # Load classificiation model menggunakan torch.hub
    model = torch.hub.load('ultralytics/yolov5', 'custom', path=weights_path, force_reload=False)
    
    # Buka WebCam (0 untuk bawaan, 1, 2, dll untuk webcam external/DroidCam)
    # Cek jika source bisa berupa angka (kamera USB) atau string (IP Camera)
    try:
        source = int(source)
    except Exception:
        pass
        
    cap = cv2.VideoCapture(source)
    
    if not cap.isOpened():
        print("❌ WebCam tidak terdeteksi!")
        return

    print("✅ Kamera On. Tekan 'q' untuk keluar.")
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        start_time = time.time()
            
        # Karena ini classification, input HANYA menerima format BCHW Tensor (Batch, Channel, Height, Width)
        import numpy as np
        
        # 1. BGR ke RGB
        img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # 2. Resize ke ukuran 224x224 (sesuai setting training kita: --img 224)
        img_resized = cv2.resize(img_rgb, (224, 224))
        
        # 3. Ubah format dari HWC (Height, Width, Channel) ke CHW
        img_chw = np.transpose(img_resized, (2, 0, 1))
        
        # 4. Tambah dimensi Batch menjadi -> BCHW (1, 3, 224, 224)
        img_bchw = np.expand_dims(img_chw, axis=0)
        
        # 5. Ubah jadi Tensor PyTorch, dan normalisasi pixel (0 - 1)
        input_tensor = torch.from_numpy(img_bchw).float() / 255.0
        
        # Inference (Masukkan Tensor ke Model)
        results = model(input_tensor)
        
        # Ambil probabilitas (Gunakan Softmax agar skor menjadi 0-100%)
        pred = torch.softmax(results[0], dim=0) 
        
        # Argmax untuk mendapatkan index prediksi
        pred_idx = torch.argmax(pred).item()
        confidence = pred[pred_idx].item()
        
        # Nama Label (0: Inorganic, 1: Organic)
        names_mapping = {0: 'Inorganic', 1: 'Organic'} 
        class_name = names_mapping[pred_idx]
        
        inf_time = (time.time() - start_time) * 1000
        
        # UI Box Info
        color = (0, 255, 0) if "Organic" in class_name else (0, 165, 255) # Hijau organik, Orange anorganik
        
        cv2.putText(frame, f"Deteksi: {class_name} ({confidence*100:.1f}%)", 
                    (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.2, color, 3)
                    
        cv2.putText(frame, f"Speed: {inf_time:.1f} ms", 
                    (20, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (200, 200, 200), 2)
        
        cv2.imshow("VisioBin - AI Classification Test", frame)
        
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
            
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--weights', type=str, default='best.pt', help='path to best.pt')
    parser.add_argument('--source', type=str, default='0', help='Kamera source (0 untuk laptop, 1/2 untuk DroidCam)')
    args = parser.parse_args()
    
    main(args.weights, args.source)
