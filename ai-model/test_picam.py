import numpy as np
from picamera2 import Picamera2
import onnxruntime as ort
import cv2
import time

LABELS = {0: "Anorganik", 1: "Organik"}

print("Loading model...")
session = ort.InferenceSession("best.onnx", providers=['CPUExecutionProvider'])
input_name = session.get_inputs()[0].name
input_shape = session.get_inputs()[0].shape
print(f"Model loaded! Input shape: {input_shape}")

print("Starting camera...")
picam2 = Picamera2()
config = picam2.create_still_configuration(main={"size": (640, 480), "format": "RGB888"})
picam2.configure(config)
picam2.start()
time.sleep(2)

print("Capturing frame...")
frame = picam2.capture_array()

img = cv2.resize(frame, (224, 224))
img = img.astype(np.float32) / 255.0
img = np.transpose(img, (2, 0, 1))
img = np.expand_dims(img, axis=0)

t0 = time.time()
outputs = session.run(None, {input_name: img})
ms = int((time.time() - t0) * 1000)

probs = outputs[0][0]
idx = int(np.argmax(probs))
conf = float(probs[idx])
print(f"Result: {LABELS[idx]} ({conf*100:.1f}%) | {ms}ms")

picam2.stop()
