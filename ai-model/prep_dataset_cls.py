"""
Dataset Preparation Script untuk YOLOv5 Classification
======================================================
Script ini akan mengatur ulang dataset Kaggle (Organik vs Anorganik) 
agar sesuai dengan struktur folder yang dibutuhkan YOLOv5-cls.

Struktur asal (Kaggle):
- archive/DATASET/TRAIN/O/*.jpg
- archive/DATASET/TRAIN/R/*.jpg
- archive/DATASET/TEST/O/*.jpg
- archive/DATASET/TEST/R/*.jpg

Struktur tujuan (YOLOv5-cls):
- visiobin_cls_dataset/
  ├── train/
  │   ├── Organic/     (berisi gambar O)
  │   └── Inorganic/   (berisi gambar R)
  └── val/
      ├── Organic/
      └── Inorganic/
"""

import os
import shutil
from pathlib import Path

def main():
    base_src = Path("archive/DATASET")
    base_dst = Path("visiobin_cls_dataset")

    if not base_src.exists():
        print(f"❌ Error: Folder '{base_src}' tidak ditemukan. Pastikan dataset kaggle diekstrak di ai-model/archive/")
        return

    # Buat direktori tujuan
    for split in ["train", "val"]:
        for cls_name in ["Organic", "Inorganic"]:
            (base_dst / split / cls_name).mkdir(parents=True, exist_ok=True)

    print("Mulai mengatur dataset classification YOLOv5...")

    # Mapping nama Kaggle ke nama kelas AI kita
    mapping = {
        "O": "Organic",
        "R": "Inorganic"
    }

    # Proses TRAIN
    train_src = base_src / "TRAIN"
    if train_src.exists():
        for src_cls, dst_cls in mapping.items():
            src_dir = train_src / src_cls
            dst_dir = base_dst / "train" / dst_cls
            if src_dir.exists():
                files = list(src_dir.glob("*.jpg"))
                print(f"Copying {len(files)} files dari TRAIN/{src_cls} ke train/{dst_cls}...")
                for f in files:
                    shutil.copy2(f, dst_dir / f.name)

    # Proses TEST -> Validation
    test_src = base_src / "TEST"
    if test_src.exists():
        for src_cls, dst_cls in mapping.items():
            src_dir = test_src / src_cls
            dst_dir = base_dst / "val" / dst_cls
            if src_dir.exists():
                files = list(src_dir.glob("*.jpg"))
                print(f"Copying {len(files)} files dari TEST/{src_cls} ke val/{dst_cls}...")
                for f in files:
                    shutil.copy2(f, dst_dir / f.name)

    print("Berhasil! Dataset siap digunakan untuk YOLOv5-cls.")
    print("Upload folder 'visiobin_cls_dataset' tersebut (di zip lebih dulu) ke Google Drive untuk ditraining di Colab!")

if __name__ == "__main__":
    main()
