"""
opencv_cartoon.py
=================
Classical image-processing pipeline to convert a photo into a cartoon.

Algorithm
---------
1. Read image with OpenCV.
2. Downscale → apply bilateral filter repeatedly (smooths colours, keeps edges).
3. Convert to greyscale → detect edges with adaptive thresholding.
4. Combine smoothed colour image with edge mask.
5. Save result.

The bilateral filter is the key ingredient: it blurs uniform regions while
preserving sharp boundaries, giving that flat-colour cartoon look.
"""

import cv2
import numpy as np


def cartoonize_opencv(input_path: str, output_path: str) -> None:
    """
    Read an image, apply the cartoon pipeline, and write the result.

    Parameters
    ----------
    input_path  : str – absolute path to the source image.
    output_path : str – absolute path where the cartoon PNG will be saved.

    Raises
    ------
    ValueError  – if the image cannot be read (bad path / unsupported format).
    """
    # ── 1. Load ──────────────────────────────────────────────────────────────
    img = cv2.imread(input_path)
    if img is None:
        raise ValueError(f"Cannot read image at '{input_path}'. "
                         "Ensure the file exists and is a valid image.")

    # ── 2. Downscale for faster bilateral filtering ──────────────────────────
    # We work at half resolution and upscale later to keep processing quick.
    h, w = img.shape[:2]
    scale = 0.5
    small = cv2.resize(img, (int(w * scale), int(h * scale)),
                       interpolation=cv2.INTER_AREA)

    # ── 3. Bilateral filtering (repeated for stronger smoothing) ─────────────
    # d       = neighbourhood diameter
    # sigmaColor / sigmaSpace control how aggressively colours / space are blended
    smooth = small.copy()
    for _ in range(7):
        smooth = cv2.bilateralFilter(smooth, d=9, sigmaColor=75, sigmaSpace=75)

    # Upscale back to original resolution
    smooth = cv2.resize(smooth, (w, h), interpolation=cv2.INTER_LINEAR)

    # ── 4. Edge mask ─────────────────────────────────────────────────────────
    grey = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Slight blur before thresholding reduces noise-induced micro-edges
    grey_blur = cv2.medianBlur(grey, 7)

    # Adaptive threshold → bold dark lines on white background
    edges = cv2.adaptiveThreshold(
        grey_blur,
        maxValue=255,
        adaptiveMethod=cv2.ADAPTIVE_THRESH_MEAN_C,
        thresholdType=cv2.THRESH_BINARY,
        blockSize=9,
        C=2,
    )

    # Convert single-channel edge mask to 3-channel for blending
    edges_bgr = cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)

    # ── 5. Blend: darken smoothed image where edges are dark ─────────────────
    # bitwise_and zeroes out pixels where the edge mask is black (i.e. on an edge)
    cartoon = cv2.bitwise_and(smooth, edges_bgr)

    # ── 6. Save ──────────────────────────────────────────────────────────────
    cv2.imwrite(output_path, cartoon)
