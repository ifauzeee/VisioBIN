# VisioBIN — AI Model Evaluation Checklist

Panduan evaluasi model AI klasifikasi sampah saat dipindahkan dari simulasi ke hardware nyata.

---

## 1. Pre-Deployment Checklist

### Model File
- [ ] Model TFLite (`waste_classifier.tflite`) tersedia di Raspberry Pi
- [ ] Label file (`labels.txt`) sesuai dengan output model (organic/inorganic)
- [ ] Model size < 50MB (optimal untuk edge inference)
- [ ] Model format: TensorFlow Lite (INT8 quantized preferred)

### Hardware Camera
- [ ] RPi Camera Module v2 terpasang dan terdeteksi (`vcgencmd get_camera`)
- [ ] Resolusi capture: 224x224 atau sesuai input model
- [ ] Pencahayaan cukup di area klasifikasi (tambahkan LED strip jika perlu)
- [ ] Focus distance sesuai (15-30cm dari objek sampah)

### Environment
- [ ] Python 3.9+ terinstall di RPi
- [ ] TensorFlow Lite runtime terinstall (`pip install tflite-runtime`)
- [ ] OpenCV terinstall (`pip install opencv-python-headless`)
- [ ] NumPy terinstall

---

## 2. Accuracy Testing Protocol

### Test Dataset
Siapkan minimal **100 gambar** sampah nyata:
- 50 organik (sisa makanan, daun, kayu)
- 50 anorganik (plastik, kaca, logam, kertas)

### Test Procedure
```bash
# 1. Capture test images
python capture_test_images.py --count 100 --output test_dataset/

# 2. Run batch inference
python evaluate_model.py --model waste_classifier.tflite --dataset test_dataset/

# 3. Check metrics
# Target: Accuracy >= 85%, Inference Time < 200ms
```

### Metrics to Track

| Metric | Target | Action if Below |
|--------|--------|-----------------|
| **Accuracy** | ≥ 85% | Retrain with more real-world data |
| **Precision (Organic)** | ≥ 80% | Add more organic training samples |
| **Precision (Inorganic)** | ≥ 80% | Add more inorganic training samples |
| **Recall** | ≥ 80% | Check for class imbalance |
| **Inference Time** | < 200ms | Use INT8 quantization |
| **Confidence Threshold** | ≥ 0.7 | Adjust threshold or retrain |

---

## 3. Real-World Validation Matrix

Test setiap kategori sampah berikut:

### Organik
| Item | Expected | Confidence Target |
|------|----------|-------------------|
| Sisa nasi/makanan | organic | > 0.8 |
| Kulit buah | organic | > 0.8 |
| Daun kering | organic | > 0.7 |
| Sisa sayuran | organic | > 0.8 |
| Tulang ayam | organic | > 0.7 |

### Anorganik
| Item | Expected | Confidence Target |
|------|----------|-------------------|
| Botol plastik | inorganic | > 0.8 |
| Kantong plastik | inorganic | > 0.7 |
| Kaleng minuman | inorganic | > 0.8 |
| Kertas/kardus | inorganic | > 0.7 |
| Gelas kaca | inorganic | > 0.8 |

### Edge Cases (Ambiguous)
| Item | Notes |
|------|-------|
| Kertas berminyak | Bisa dua-duanya, accept either |
| Tetra pak | Multi-material, prefer inorganic |
| Tissue bekas | Kontaminasi, prefer organic |

---

## 4. Performance Optimization

### Jika inference lambat (> 200ms):
1. **Quantize** model ke INT8: `tflite_converter --quantize`
2. **Reduce** input resolution: 224→160
3. **Enable** multi-threading: `interpreter.set_num_threads(4)`
4. **Consider** EdgeTPU USB Accelerator (Coral)

### Jika accuracy rendah (< 85%):
1. **Collect** 200+ gambar dari environment aktual
2. **Augment** data: rotate, flip, brightness variation
3. **Fine-tune** model with transfer learning
4. **Balance** dataset (50/50 organic/inorganic)
5. **Check** lighting conditions & camera angle

---

## 5. Monitoring di Produksi

Setelah deployment, monitor metrik berikut via dashboard:

- **Average confidence** per hari (target: > 0.75)
- **Classification distribution** (harus balanced, bukan 95% satu class)
- **Inference time trend** (jangan naik seiring waktu)
- **Error rate** (gagal inference / total attempts)

### Alert Triggers
- Confidence rata-rata < 0.6 selama 1 jam → cek kamera/pencahayaan
- Inference time > 500ms → cek CPU temperature RPi
- > 90% satu class → cek apakah kamera terhalang/kotor
