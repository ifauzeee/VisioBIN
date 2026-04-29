import argparse
import time
import sys
import cv2
import torch

def run_inference(weights):
    print(f"Initializing model: {weights}")
    
    try:
        model = torch.hub.load('ultralytics/yolov5', 'custom', path=weights, force_reload=False)
        model.conf = 0.60
    except Exception as e:
        print(f"Failed to load model: {e}")
        sys.exit(1)

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Error: Camera not accessible.")
        return

    print("Inference started. Press 'q' to stop.")

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        t0 = time.time()
        results = model(frame)
        dt = (time.time() - t0) * 1000

        annotated_frame = results.render()[0]
        
        cv2.putText(
            annotated_frame, 
            f"Latency: {dt:.1f}ms", 
            (20, 40), 
            cv2.FONT_HERSHEY_SIMPLEX, 
            0.7, 
            (0, 255, 0), 
            2
        )

        cv2.imshow("VisioBin - AI Test", annotated_frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--weights', type=str, default='yolov5n.pt')
    args = parser.parse_args()
    
    run_inference(args.weights)