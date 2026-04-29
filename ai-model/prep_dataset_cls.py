import shutil
from pathlib import Path

def prepare_yolo_dataset(source_path, target_path):
    base_src = Path(source_path)
    base_dst = Path(target_path)

    if not base_src.exists():
        print(f"Error: Source directory '{base_src}' not found.")
        return

    # Mapping source structure to target
    # Kaggle: TRAIN/O, TRAIN/R, TEST/O, TEST/R
    # YOLO: train/Organic, train/Inorganic, val/Organic, val/Inorganic
    mapping = {"O": "Organic", "R": "Inorganic"}
    splits = {"TRAIN": "train", "TEST": "val"}

    print("Reorganizing dataset for YOLOv5 classification...")

    for src_split, dst_split in splits.items():
        for src_cls, dst_cls in mapping.items():
            src_dir = base_src / src_split / src_cls
            dst_dir = base_dst / dst_split / dst_cls

            if not src_dir.exists():
                continue

            dst_dir.mkdir(parents=True, exist_ok=True)
            files = list(src_dir.glob("*.jpg"))
            
            print(f"Copying {len(files)} files: {src_split}/{src_cls} -> {dst_split}/{dst_cls}")
            for f in files:
                shutil.copy2(f, dst_dir / f.name)

    print("Dataset preparation complete.")

if __name__ == "__main__":
    prepare_yolo_dataset("archive/DATASET", "visiobin_cls_dataset")