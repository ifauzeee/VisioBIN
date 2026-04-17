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

def main(weights_path):
    print(f"Loading YOLOv5-cls model from {weights_path}...")
    
    # Load classificiation model menggunakan torch.hub
    model = torch.hub.load('ultralytics/yolov5', 'custom', path=weights_path, force_reload=False)
    
    # Buka WebCam
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("❌ WebCam tidak terdeteksi!")
        return

    print("✅ Kamera On. Tekan 'q' untuk keluar.")
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        start_time = time.time()
            
        # Karena ini classification, input langsung pass ke model
        # Tapi model butuh gambar format RGB.
        img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Inference
        results = model(img_rgb)
        
        # Ambil probabilitas terbesar
        # Untuk YOLOv5-cls, results berbentuk list tensor probabilities.
        pred = results[0] # output tensor for the first image
        
        # Argmax untuk mendapatkan index prediksi
        pred_idx = torch.argmax(pred).item()
        confidence = pred[pred_idx].item()
        
        # Nama Label dari model (0: Inorganic, 1: Organic -> Tergantung mapping saat training!)
        # Secara otomatis YOLO akan menyimpan namelist di model.names
        class_name = model.names[pred_idx] if hasattr(model, 'names') else f"Class {pred_idx}"
        
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
    args = parser.parse_args()
    
    main(args.weights)
