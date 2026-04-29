import argparse
import time
import pathlib
import cv2
import torch
import numpy as np

# Cross-platform compatibility for pathlib
pathlib.PosixPath = pathlib.WindowsPath

def main(weights, source):
    print(f"Loading model: {weights}")
    
    # Load model (force_reload=False to use cache)
    model = torch.hub.load('ultralytics/yolov5', 'custom', path=weights)
    
    try:
        source = int(source)
    except ValueError:
        pass
        
    cap = cv2.VideoCapture(source)
    if not cap.isOpened():
        print("Error: Could not open camera.")
        return

    print("Inference active. Press 'q' to exit.")
    
    # Class mapping
    classes = {0: 'Inorganic', 1: 'Organic'}

    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        start_time = time.time()
            
        # Image preprocessing (BCHW format)
        img = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        img = cv2.resize(img, (224, 224))
        img = img.transpose((2, 0, 1))  # HWC to CHW
        img = np.expand_dims(img, axis=0)  # Add batch dimension
        
        tensor = torch.from_numpy(img).float() / 255.0
        
        # Inference
        with torch.no_grad():
            output = model(tensor)
            probs = torch.softmax(output[0], dim=0)
            idx = torch.argmax(probs).item()
            conf = probs[idx].item()
        
        label = classes.get(idx, "Unknown")
        latency = (time.time() - start_time) * 1000
        
        # UI Overlay
        color = (0, 255, 0) if "Organic" in label else (0, 165, 255)
        text = f"{label} ({conf*100:.1f}%)"
        
        cv2.putText(frame, text, (20, 50), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1.2, color, 3)
        cv2.putText(frame, f"Latency: {latency:.1f} ms", (20, 90), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (200, 200, 200), 2)
        
        cv2.imshow("VisioBin - Inference Test", frame)
        
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
            
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--weights', type=str, default='best.pt')
    parser.add_argument('--source', type=str, default='0')
    args = parser.parse_args()
    
    main(args.weights, args.source)