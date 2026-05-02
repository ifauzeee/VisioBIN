"""
VisioBin TFLite Export Script
==============================
Mengonversi model YOLOv5 (.pt) ke format ONNX dan TFLite
untuk inferensi yang lebih ringan di Raspberry Pi (ARM CPU).

Usage:
    python export_tflite.py
    python export_tflite.py --weights best.pt --img-size 224 --int8

Catatan:
    - ONNX: kompatibel langsung, lebih cepat ~20-30% vs PyTorch
    - TFLite INT8: quantized, ~75% lebih kecil, paling cepat di ARM
"""

import argparse
import os
import sys
import platform
import pathlib
import time

# Patch untuk dev di Windows
if platform.system() == "Windows":
    pathlib.PosixPath = pathlib.WindowsPath


def export_onnx(weights: str, img_size: int, output_dir: str) -> str:
    """Export model YOLOv5 ke format ONNX."""
    import torch
    import torch.onnx

    print(f"\n{'='*60}")
    print(" STEP 1: Export ke ONNX")
    print(f"{'='*60}")

    # Load model
    print(f"[1/3] Loading model: {weights}")
    model = torch.hub.load(
        "ultralytics/yolov5", "custom",
        path=weights,
        force_reload=False,
        verbose=False
    )
    model.eval()
    print(f"[2/3] Model loaded ({sum(p.numel() for p in model.parameters()):,} params)")

    # Dummy input untuk export
    dummy_input = torch.randn(1, 3, img_size, img_size)

    # Path output
    onnx_path = os.path.join(output_dir, "best.onnx")

    print(f"[3/3] Exporting ke ONNX: {onnx_path}")
    torch.onnx.export(
        model,
        dummy_input,
        onnx_path,
        opset_version=12,
        input_names=["images"],
        output_names=["output"],
        dynamic_axes={
            "images": {0: "batch"},
            "output": {0: "batch"},
        },
        verbose=False,
    )

    size_mb = os.path.getsize(onnx_path) / 1e6
    print(f"     ✅ ONNX berhasil: {onnx_path} ({size_mb:.1f} MB)")
    return onnx_path


def export_tflite(onnx_path: str, img_size: int, int8: bool, output_dir: str) -> str:
    """Konversi ONNX ke TFLite via tf2onnx + TensorFlow."""
    print(f"\n{'='*60}")
    print(" STEP 2: Konversi ONNX → TFLite")
    print(f"{'='*60}")

    try:
        import tensorflow as tf
        import onnx
        from onnx_tf.backend import prepare
    except ImportError as e:
        print(f"\n[ERROR] Dependensi tidak terinstal: {e}")
        print("[HINT]  Jalankan: pip install tensorflow onnx onnx-tf")
        print("[NOTE]  Untuk Raspberry Pi, gunakan:")
        print("        pip install tensorflow-aarch64 onnx onnx-tf")
        sys.exit(1)

    # Load ONNX model
    print(f"[1/4] Loading ONNX model dari: {onnx_path}")
    onnx_model = onnx.load(onnx_path)

    # Konversi ke TF saved model
    saved_model_dir = os.path.join(output_dir, "tf_saved_model")
    print(f"[2/4] Konversi ke TF SavedModel: {saved_model_dir}")
    tf_rep = prepare(onnx_model)
    tf_rep.export_graph(saved_model_dir)

    # Konversi ke TFLite
    print(f"[3/4] Konversi ke TFLite (int8={int8})...")
    converter = tf.lite.TFLiteConverter.from_saved_model(saved_model_dir)

    if int8:
        converter.optimizations = [tf.lite.Optimize.DEFAULT]
        converter.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS_INT8]
        converter.inference_input_type  = tf.int8
        converter.inference_output_type = tf.int8

        # Representative dataset untuk kalibrasi INT8
        def representative_dataset():
            import numpy as np
            for _ in range(100):
                data = np.random.rand(1, 3, img_size, img_size).astype(np.float32)
                yield [data]

        converter.representative_dataset = representative_dataset
        tflite_filename = "best_int8.tflite"
    else:
        converter.optimizations = [tf.lite.Optimize.DEFAULT]
        tflite_filename = "best_fp16.tflite"

    tflite_model = converter.convert()

    tflite_path = os.path.join(output_dir, tflite_filename)
    print(f"[4/4] Menyimpan: {tflite_path}")
    with open(tflite_path, "wb") as f:
        f.write(tflite_model)

    size_mb = os.path.getsize(tflite_path) / 1e6
    print(f"     ✅ TFLite berhasil: {tflite_path} ({size_mb:.1f} MB)")
    return tflite_path


def benchmark_tflite(tflite_path: str, img_size: int, n_runs: int = 20):
    """Benchmark kecepatan inferensi TFLite model."""
    print(f"\n{'='*60}")
    print(" STEP 3: Benchmark TFLite")
    print(f"{'='*60}")

    try:
        import tensorflow as tf
        import numpy as np
    except ImportError:
        print("[SKIP] TensorFlow tidak tersedia, skip benchmark")
        return

    interpreter = tf.lite.Interpreter(model_path=tflite_path)
    interpreter.allocate_tensors()

    input_details  = interpreter.get_input_details()
    output_details = interpreter.get_output_details()

    # Warm-up
    dummy = np.random.rand(1, 3, img_size, img_size).astype(np.float32)
    interpreter.set_tensor(input_details[0]["index"], dummy)
    interpreter.invoke()

    # Benchmark
    times = []
    for i in range(n_runs):
        data = np.random.rand(1, 3, img_size, img_size).astype(np.float32)
        t0 = time.perf_counter()
        interpreter.set_tensor(input_details[0]["index"], data)
        interpreter.invoke()
        times.append((time.perf_counter() - t0) * 1000)

    avg_ms  = sum(times) / len(times)
    min_ms  = min(times)
    max_ms  = max(times)

    print(f"[BENCH] Runs : {n_runs}")
    print(f"[BENCH] Avg  : {avg_ms:.1f} ms")
    print(f"[BENCH] Min  : {min_ms:.1f} ms")
    print(f"[BENCH] Max  : {max_ms:.1f} ms")
    print(f"[BENCH] Target Raspberry Pi: < 800ms ({'✅' if avg_ms < 800 else '⚠️ Mungkin lambat'})")


def main():
    parser = argparse.ArgumentParser(
        description="Export YOLOv5 model ke ONNX dan TFLite untuk Raspberry Pi"
    )
    parser.add_argument("--weights",   type=str,  default="best.pt", help="Path ke model .pt")
    parser.add_argument("--img-size",  type=int,  default=224,        help="Ukuran input gambar (px)")
    parser.add_argument("--int8",      action="store_true",           help="Quantisasi INT8 (lebih kecil, lebih cepat)")
    parser.add_argument("--output",    type=str,  default="exported", help="Folder output")
    parser.add_argument("--benchmark", action="store_true",           help="Jalankan benchmark setelah export")
    parser.add_argument("--onnx-only", action="store_true",           help="Hanya export ONNX, skip TFLite")
    args = parser.parse_args()

    os.makedirs(args.output, exist_ok=True)

    print("╔══════════════════════════════════════════════════════════╗")
    print("║       VisioBin Model Export Tool                        ║")
    print("╚══════════════════════════════════════════════════════════╝")
    print(f"  Weights  : {args.weights}")
    print(f"  Img Size : {args.img_size}x{args.img_size}")
    print(f"  Quantize : {'INT8' if args.int8 else 'FP16'}")
    print(f"  Output   : {args.output}/")

    if not os.path.exists(args.weights):
        print(f"\n[ERROR] File model tidak ditemukan: {args.weights}")
        sys.exit(1)

    # Step 1: Export ONNX
    onnx_path = export_onnx(args.weights, args.img_size, args.output)

    # Step 2: Export TFLite (opsional)
    if not args.onnx_only:
        tflite_path = export_tflite(onnx_path, args.img_size, args.int8, args.output)

        # Step 3: Benchmark
        if args.benchmark:
            benchmark_tflite(tflite_path, args.img_size)

    print(f"\n{'='*60}")
    print(" EXPORT SELESAI")
    print(f"{'='*60}")
    print(f" ONNX    : {args.output}/best.onnx")
    if not args.onnx_only:
        suffix = "int8" if args.int8 else "fp16"
        print(f" TFLite  : {args.output}/best_{suffix}.tflite")
    print("\n Deploy ke Raspberry Pi:")
    print(f"   scp {args.output}/best.onnx pi@<raspi-ip>:~/visiobin/ai-model/")
    print()


if __name__ == "__main__":
    main()
