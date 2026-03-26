"""
cartoon_routes.py
=================
Flask Blueprint exposing REST endpoints for image cartoonization.

Endpoints
---------
POST /api/cartoon/opencv   – Convert image using classical OpenCV pipeline
POST /api/cartoon/ai       – Convert image using deep-learning stylization
GET  /api/outputs/<fname>  – Serve a processed output image
GET  /api/health           – Health-check
"""

import os
import uuid
import logging
from flask import Blueprint, request, jsonify, send_from_directory, current_app
from werkzeug.utils import secure_filename

from utils.opencv_cartoon import cartoonize_opencv
from utils.dl_cartoon import cartoonize_dl

# ── Blueprint ────────────────────────────────────────────────────────────────
cartoon_bp = Blueprint("cartoon", __name__)
logger = logging.getLogger(__name__)


# ── Helpers ──────────────────────────────────────────────────────────────────

def allowed_file(filename: str) -> bool:
    """Return True if the file extension is permitted."""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    return ext in current_app.config["ALLOWED_EXTENSIONS"]


def save_upload(file) -> tuple[str, str]:
    """
    Save an uploaded FileStorage object to the uploads folder.

    Returns
    -------
    (unique_stem, full_path)
        unique_stem – UUID-prefixed stem used to name output files
        full_path   – absolute path to the saved upload
    """
    original_name = secure_filename(file.filename)
    stem = str(uuid.uuid4())
    save_name = f"{stem}_{original_name}"
    full_path = os.path.join(current_app.config["UPLOAD_FOLDER"], save_name)
    file.save(full_path)
    return stem, full_path


def output_url(filename: str) -> str:
    """Build the public URL for an output file."""
    return f"/api/outputs/{filename}"


# ── Routes ───────────────────────────────────────────────────────────────────

@cartoon_bp.route("/health", methods=["GET"])
def health():
    """Simple health-check endpoint."""
    return jsonify({"status": "ok", "message": "Cartoon API is running"}), 200


@cartoon_bp.route("/cartoon/opencv", methods=["POST"])
def cartoon_opencv():
    """
    Convert an uploaded image to cartoon style using OpenCV.

    Expects
    -------
    multipart/form-data with field ``image``.

    Returns
    -------
    JSON  { output_url, filename }
    """
    if "image" not in request.files:
        return jsonify({"error": "No image field in request"}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400
    if not allowed_file(file.filename):
        return jsonify({"error": "Unsupported file type. Use PNG, JPG, JPEG, WEBP or BMP"}), 415

    try:
        stem, upload_path = save_upload(file)
        output_filename = f"{stem}_opencv.png"
        output_path = os.path.join(current_app.config["OUTPUT_FOLDER"], output_filename)

        cartoonize_opencv(upload_path, output_path)

        return jsonify({
            "output_url": output_url(output_filename),
            "filename": output_filename,
            "method": "opencv"
        }), 200

    except ValueError as exc:
        logger.warning("OpenCV cartoonization value error: %s", exc)
        return jsonify({"error": str(exc)}), 422
    except Exception as exc:
        logger.exception("Unexpected error in OpenCV cartoonization")
        return jsonify({"error": "Internal server error", "detail": str(exc)}), 500


@cartoon_bp.route("/cartoon/ai", methods=["POST"])
def cartoon_ai():
    """
    Convert an uploaded image to cartoon style using a deep-learning model.

    Expects
    -------
    multipart/form-data with field ``image``.

    Returns
    -------
    JSON  { output_url, filename }
    """
    if "image" not in request.files:
        return jsonify({"error": "No image field in request"}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400
    if not allowed_file(file.filename):
        return jsonify({"error": "Unsupported file type. Use PNG, JPG, JPEG, WEBP or BMP"}), 415

    try:
        stem, upload_path = save_upload(file)
        output_filename = f"{stem}_ai.png"
        output_path = os.path.join(current_app.config["OUTPUT_FOLDER"], output_filename)

        cartoonize_dl(upload_path, output_path)

        return jsonify({
            "output_url": output_url(output_filename),
            "filename": output_filename,
            "method": "ai"
        }), 200

    except ValueError as exc:
        logger.warning("DL cartoonization value error: %s", exc)
        return jsonify({"error": str(exc)}), 422
    except Exception as exc:
        logger.exception("Unexpected error in DL cartoonization")
        return jsonify({"error": "Internal server error", "detail": str(exc)}), 500


@cartoon_bp.route("/outputs/<path:filename>", methods=["GET"])
def serve_output(filename):
    """Serve a processed output image."""
    return send_from_directory(current_app.config["OUTPUT_FOLDER"], filename)


# ── Error handlers (registered on the blueprint) ─────────────────────────────

@cartoon_bp.app_errorhandler(413)
def file_too_large(exc):
    return jsonify({"error": "File too large. Maximum allowed size is 10 MB"}), 413
