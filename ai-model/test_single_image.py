import argparse
import pathlib
import time
import cv2
import torch
import torch.nn.functional as F
import numpy as np

# Patch untuk kompatibilitas model antar Sistem Operasi
pathlib.PosixPath = pathlib.WindowsPath

def preprocess(img_bgr, size=224):
    """Konversi BGR ke normalized BCHW tensor."""
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    img_resized = cv2.resize(img_rgb, (size, size), interpolation=cv2.INTER_AREA)
    img_chw = np.transpose(img_resized, (2, 0, 1))
    return torch.from_numpy(img_chw).unsqueeze(0).float() / 255.0

def get_tta_variants(frame):
    """Menghasilkan variasi gambar untuk Test-Time Augmentation."""
    h, w, _ = frame.shape
    variants = [frame]  # Original
    
    # Horizontal Flip
    variants.append(cv2.flip(frame, 1))
    
    # Center Crop (80%)
    mh, mw = int(h * 0.1), int(w * 0.1)
    variants.append(frame[mh:h-mh, mw:w-mw])
    
    # Brightness Adjustments
    variants.append(cv2.convertScaleAbs(frame, alpha=1.2, beta=20))
    variants.append(cv2.convertScaleAbs(frame, alpha=0.8, beta=-20))
    
    return [preprocess(v) for v in variants]

def predict(image_path, weights):
    print(f"Initializing model: {weights}")
    
    try:
        model = torch.hub.load('ultralytics/yolov5', 'custom', path=weights, force_reload=False)
        model.eval()
    except Exception as e:
        print(f"Error loading model: {e}")
        return

    frame = cv2.imread(image_path)
    if frame is None:
        print(f"Error: Image '{image_path}' not found.")
        return

    # Jalankan TTA
    tensors = get_tta_variants(frame)
    all_probs = []

    with torch.no_grad():
        for t in tensors:
            output = model(t)
            # Normalisasi output format YOLOv5-cls
            logits = output[0] if isinstance(output, (list, tuple)) else output
            probs = F.softmax(logits.squeeze(), dim=0)
            all_probs.append(probs)

    # Ensemble: Rata-rata probabilitas
    avg_probs = torch.stack(all_probs).mean(dim=0)
    pred_idx = torch.argmax(avg_probs).item()
    conf = avg_probs[pred_idx].item()

    labels = {0: 'Inorganic', 1: 'Organic'}
    res_label = labels.get(pred_idx, 'Unknown')

    # Output Console
    print("-" * 30)
    print(f"PREDICTION RESULT")
    print("-" * 30)
    print(f"Class      : {res_label}")
    print(f"Confidence : {conf * 100:.2f}%")
    print(f"Organic    : {avg_probs[1].item() * 100:.2f}%")
    print(f"Inorganic  : {avg_probs[0].item() * 100:.2f}%")
    print("-" * 30)

    # Visualisasi
    h, w, _ = frame.shape
    color = (0, 255, 0) if pred_idx == 1 else (0, 165, 255)
    font_scale = max(0.8, w / 1000)
    
    cv2.putText(frame, f"{res_label} ({conf * 100:.1f}%)", (20, 50), 
                cv2.FONT_HERSHEY_SIMPLEX, font_scale, color, 2)

    cv2.imshow("VisioBin AI - Single Test", frame)
    cv2.waitKey(0)
    cv2.destroyAllWindows()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('image', type=str)
    parser.add_argument('--weights', type=str, default='best.pt')
    args = parser.parse_args()
    
    predict(args.image, args.weights)