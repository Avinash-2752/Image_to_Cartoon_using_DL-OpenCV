#!/usr/bin/env python3
"""
download_model.py
=================
Run this script once to pre-download the neural style transfer ONNX model
before starting the Flask server.

Usage
-----
    python download_model.py

The model (~6.4 MB) will be saved to  backend/models/udnie.onnx
It is also downloaded automatically on the first AI conversion request,
but running this script first avoids a timeout during the first API call.
"""

import os
import urllib.request
import sys

MODEL_DIR  = os.path.join(os.path.dirname(__file__), "backend", "models")
MODEL_PATH = os.path.join(MODEL_DIR, "udnie.onnx")
MODEL_URL  = (
    "https://github.com/onnx/models/raw/main/validated/"
    "vision/style_transfer/fast_neural_style/model/udnie-9.onnx"
)


def progress(count, block_size, total_size):
    percent = count * block_size * 100 // total_size
    bar = "█" * (percent // 5) + "░" * (20 - percent // 5)
    sys.stdout.write(f"\r  [{bar}] {percent:3d}%")
    sys.stdout.flush()


def main():
    os.makedirs(MODEL_DIR, exist_ok=True)

    if os.path.exists(MODEL_PATH) and os.path.getsize(MODEL_PATH) > 1_000_000:
        print(f"✅ Model already present: {MODEL_PATH}")
        return

    print(f"⬇  Downloading Udnie ONNX model (~6.4 MB)…")
    print(f"   Source : {MODEL_URL}")
    print(f"   Dest   : {MODEL_PATH}\n")

    try:
        urllib.request.urlretrieve(MODEL_URL, MODEL_PATH, reporthook=progress)
        print(f"\n\n✅ Model saved to {MODEL_PATH}")
    except Exception as exc:
        print(f"\n\n❌ Download failed: {exc}")
        if os.path.exists(MODEL_PATH):
            os.remove(MODEL_PATH)
        sys.exit(1)


if __name__ == "__main__":
    main()
