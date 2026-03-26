"""
Image to Cartoon Conversion - Flask Backend
============================================
Entry point for the Flask web application.
"""

import os
from flask import Flask
from flask_cors import CORS
from routes.cartoon_routes import cartoon_bp

def create_app():
    """Application factory pattern for Flask."""
    app = Flask(__name__)

    # ── Configuration ────────────────────────────────────────────────────────
    app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024  # 10 MB upload limit
    app.config["UPLOAD_FOLDER"] = os.path.join(os.path.dirname(__file__), "uploads")
    app.config["OUTPUT_FOLDER"] = os.path.join(os.path.dirname(__file__), "outputs")
    app.config["ALLOWED_EXTENSIONS"] = {"png", "jpg", "jpeg", "webp", "bmp"}

    # ── Ensure directories exist ─────────────────────────────────────────────
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
    os.makedirs(app.config["OUTPUT_FOLDER"], exist_ok=True)

    # ── CORS (allow React dev server) ────────────────────────────────────────
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # ── Register blueprints ──────────────────────────────────────────────────
    app.register_blueprint(cartoon_bp, url_prefix="/api")

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True)
