import argparse
import pathlib
import time
import cv2
import requests
import torch
import numpy as np

# Patch untuk kompatibilitas model lintas OS
pathlib.PosixPath = pathlib.WindowsPath

class AIBridge:
    def __init__(self, weights, source, backend_url):
        self.weights = weights
        self.source = int(source) if source.isdigit() else source
        self.url = backend_url
        self.cooldown = 3.0
        self.threshold = 0.85
        self.bin_id = "VBIN-01"
        self.labels = {0: 'Inorganic', 1: 'Organic'}
        
        self.model = torch.hub.load('ultralytics/yolov5', 'custom', path=self.weights)
        self.cap = cv2.VideoCapture(self.source)

    def send_classification(self, label, confidence, inference_ms):
        payload = {
            "bin_id": self.bin_id,
            "predicted_class": label,
            "confidence": float(confidence),
            "inference_time_ms": int(inference_ms)
        }
        try:
            resp = requests.post(self.url, json=payload, timeout=1)
            if resp.status_code == 201:
                print(f"[BACKEND] Success: {label} ({confidence*100:.1f}%)")
        except Exception as e:
            print(f"[ERROR] Connection failed: {e}")

    def run(self):
        if not self.cap.isOpened():
            print("Error: Camera not found.")
            return

        last_send = 0
        print("VisioBin AI Bridge Active...")

        while True:
            ret, frame = self.cap.read()
            if not ret:
                break

            start = time.time()
            
            # Preprocessing & Inference
            img = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            img = cv2.resize(img, (224, 224))
            img = np.transpose(img, (2, 0, 1))
            img = np.expand_dims(img, axis=0)
            tensor = torch.from_numpy(img).float() / 255.0

            with torch.no_grad():
                results = self.model(tensor)
                probs = torch.softmax(results[0], dim=0)
                idx = torch.argmax(probs).item()
                conf = probs[idx].item()

            label = self.labels.get(idx, 'Unknown')
            inf_ms = (time.time() - start) * 1000
            now = time.time()

            if conf > self.threshold and (now - last_send) > self.cooldown:
                self.send_classification(label, conf, inf_ms)
                last_send = now

            # UI Feedback
            color = (0, 255, 0) if label == "Organic" else (0, 165, 255)
            cv2.putText(frame, f"{label} ({conf*100:.1f}%)", (20, 50), 
                        cv2.FONT_HERSHEY_SIMPLEX, 1, color, 2)
            
            cv2.imshow("VisioBin AI Bridge", frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

        self.cap.release()
        cv2.destroyAllWindows()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--weights', type=str, default='best.pt')
    parser.add_argument('--source', type=str, default='0')
    parser.add_argument('--url', type=str, default='http://localhost:8080/api/v1/classifications')
    args = parser.parse_args()

    bridge = AIBridge(args.weights, args.source, args.url)
    bridge.run()