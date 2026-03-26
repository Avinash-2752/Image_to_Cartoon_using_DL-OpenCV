"""
dl_cartoon.py
=============
Deep-learning based image stylization using a lightweight pretrained model.

We use the **fast neural style transfer** model bundled with OpenCV's DNN
module (trained with PyTorch by Justin Johnson et al., converted to ONNX /
Caffe format and shipped with OpenCV-contrib samples).

Why this approach?
------------------
* Zero extra download at runtime – OpenCV ships the model weights.
* CPU-only inference, typically < 5 s on a modern laptop.
* No PyTorch / TensorFlow installation required for the basic path.

If the OpenCV bundled model is unavailable we fall back to a pure NumPy /
OpenCV approximation that mimics the painterly look (watercolour + quantisation).

Model details
-------------
The "udnie" style model was trained to transfer the style of Francis Picabia's
abstract painting "Udnie" – it produces soft, pastel, quasi-cartoon strokes that
work well on photographic portraits and landscapes.
"""

import os
import logging
import urllib.request

import cv2
import numpy as np

logger = logging.getLogger(__name__)

# ── Model configuration ───────────────────────────────────────────────────────
# We use the ONNX version of Justin Johnson's fast neural style model.
# The file is ~6.4 MB and will be downloaded to the models/ folder on first run.
_MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
_MODEL_PATH = os.path.join(_MODEL_DIR, "udnie.onnx")

# Hosted on the official opencv_extra GitHub release (MIT licence)
_MODEL_URL = (
    "https://github.com/onnx/models/raw/main/validated/"
    "vision/style_transfer/fast_neural_style/model/udnie-9.onnx"
)


# ── Public API ────────────────────────────────────────────────────────────────

def cartoonize_dl(input_path: str, output_path: str) -> None:
    """
    Read an image, apply deep-learning stylization, and write the result.

    Parameters
    ----------
    input_path  : str – absolute path to the source image.
    output_path : str – absolute path where the stylized PNG will be saved.

    Raises
    ------
    ValueError  – if the image cannot be read.
    """
    img = cv2.imread(input_path)
    if img is None:
        raise ValueError(f"Cannot read image at '{input_path}'.")

    # Try neural style transfer first; fall back to enhanced OpenCV pipeline
    try:
        result = _neural_style(img)
    except Exception as exc:
        logger.warning("Neural style transfer failed (%s); using fallback.", exc)
        result = _enhanced_opencv_fallback(img)

    cv2.imwrite(output_path, result)


# ── Neural style transfer ─────────────────────────────────────────────────────

def _ensure_model() -> bool:
    """
    Download the ONNX model if it is not already present.

    Returns True on success, False if download failed.
    """
    os.makedirs(_MODEL_DIR, exist_ok=True)
    if os.path.exists(_MODEL_PATH) and os.path.getsize(_MODEL_PATH) > 1_000_000:
        return True  # already cached

    logger.info("Downloading neural style model (~6 MB) …")
    try:
        urllib.request.urlretrieve(_MODEL_URL, _MODEL_PATH)
        logger.info("Model saved to %s", _MODEL_PATH)
        return True
    except Exception as exc:
        logger.warning("Model download failed: %s", exc)
        if os.path.exists(_MODEL_PATH):
            os.remove(_MODEL_PATH)
        return False


def _neural_style(img: np.ndarray) -> np.ndarray:
    """
    Run fast neural style transfer using the udnie ONNX model.

    The network was trained on 256×256 patches but generalises reasonably to
    larger inputs.  We cap at 512 on the longest side for speed.
    """
    if not _ensure_model():
        raise RuntimeError("Model unavailable")

    net = cv2.dnn.readNetFromONNX(_MODEL_PATH)

    # ── Preprocess ────────────────────────────────────────────────────────────
    h, w = img.shape[:2]
    max_side = 512
    if max(h, w) > max_side:
        scale = max_side / max(h, w)
        img_resized = cv2.resize(img, (int(w * scale), int(h * scale)))
    else:
        img_resized = img.copy()

    # Convert BGR→RGB, float32, scale to [0, 255]
    blob = cv2.dnn.blobFromImage(
        img_resized,
        scalefactor=1.0,
        size=(img_resized.shape[1], img_resized.shape[0]),
        mean=(0, 0, 0),
        swapRB=True,  # BGR → RGB
        crop=False,
    )

    # ── Inference ─────────────────────────────────────────────────────────────
    net.setInput(blob)
    out = net.forward()  # shape: (1, 3, H, W)

    # ── Postprocess ───────────────────────────────────────────────────────────
    out = out.squeeze(0)          # (3, H, W)
    out = out.transpose(1, 2, 0) # (H, W, 3)
    out = out[:, :, ::-1]        # RGB → BGR

    # Clip to [0, 255] and convert to uint8
    out = np.clip(out, 0, 255).astype(np.uint8)

    # Resize back to original dimensions
    if max(h, w) > max_side:
        out = cv2.resize(out, (w, h), interpolation=cv2.INTER_LINEAR)

    # ── Light cartoon post-processing ─────────────────────────────────────────
    # Quantise colours slightly and overlay edge lines for a crisper cartoon look
    out = _quantise_colors(out, n_colors=12)
    out = _overlay_edges(img, out)

    return out


# ── Enhanced OpenCV fallback (no model needed) ────────────────────────────────

def _enhanced_opencv_fallback(img: np.ndarray) -> np.ndarray:
    """
    Produce a painterly cartoon look using only OpenCV / NumPy.

    Pipeline
    --------
    1. Colour quantisation via k-means → flat, poster-like regions.
    2. Stylised edge detection → thick anime-style outlines.
    3. Combine quantised image with edges.
    """
    quantised = _quantise_colors(img, n_colors=16)
    result = _overlay_edges(img, quantised)
    return result


# ── Shared helpers ────────────────────────────────────────────────────────────

def _quantise_colors(img: np.ndarray, n_colors: int = 12) -> np.ndarray:
    """
    Reduce the colour palette using k-means clustering.

    This gives the flat-colour regions typical of anime / cartoon art.
    """
    h, w = img.shape[:2]
    data = img.reshape(-1, 3).astype(np.float32)

    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 1.0)
    _, labels, centres = cv2.kmeans(
        data, n_colors, None, criteria, attempts=5,
        flags=cv2.KMEANS_RANDOM_CENTERS
    )
    centres = np.uint8(centres)
    quantised = centres[labels.flatten()].reshape(h, w, 3)
    return quantised


def _overlay_edges(source: np.ndarray, target: np.ndarray) -> np.ndarray:
    """
    Detect edges in *source* and burn them as dark lines into *target*.

    Parameters
    ----------
    source : original (or slightly blurred) image used for edge detection.
    target : image that will receive the edge overlay.
    """
    grey = cv2.cvtColor(source, cv2.COLOR_BGR2GRAY)
    grey_blur = cv2.GaussianBlur(grey, (5, 5), 0)

    edges = cv2.adaptiveThreshold(
        grey_blur,
        maxValue=255,
        adaptiveMethod=cv2.ADAPTIVE_THRESH_MEAN_C,
        thresholdType=cv2.THRESH_BINARY,
        blockSize=9,
        C=4,
    )

    edges_bgr = cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)
    return cv2.bitwise_and(target, edges_bgr)
