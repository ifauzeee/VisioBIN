"""
VisioBin AI Model Test Inference
================================
Script ini digunakan untuk melakukan pengetesan inference (prediksi) 
menggunakan web-camera di laptop, sebelum AI ditanamkan ke Raspberry Pi.

Cara Jalan:
1. Pastikan python sudah terinstall
2. pip install torch torchvision torchaudio opencv-python numpy
3. python test_inference.py --weights best.pt
"""

import cv2
import torch
import argparse
import time

def main(weights_path):
    print(f"Loading YOLOv5 model from {weights_path}...")
    
    # Load model (menggunakan YOLOv5 torch.hub)
    model = torch.hub.load('ultralytics/yolov5', 'custom', path=weights_path, force_reload=False)
    
    # Set batas confidence (misal: hanya menembak jika yakin 60% keatas)
    model.conf = 0.60
    
    # Buka WebCam (0 adalah index kamera bawaan laptop)
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
            
        # Lakukan deteksi
        results = model(frame)
        
        # Hitung waktu inference
        inf_time = (time.time() - start_time) * 1000
        
        # Hasil bounding boxes dan labels didapatkan dari results
        # Render otomatis dengan method bawaan YOLOv5 .render()
        annotated_frame = results.render()[0]
        
        # Tambahkan FPS/Time Info ke pojok kiri atas
        cv2.putText(annotated_frame, f"Inf Time: {inf_time:.1f}ms", 
                    (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
        
        cv2.imshow("VisioBin - AI Classification Test", annotated_frame)
        
        # Cek tombol keluar
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
            
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--weights', type=str, default='yolov5n.pt', help='path to best.pt')
    args = parser.parse_args()
    
    main(args.weights)
