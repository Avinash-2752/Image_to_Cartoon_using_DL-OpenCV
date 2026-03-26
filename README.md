# 🎨 CartoonAI — Image to Cartoon Converter

Convert any photo into cartoon-style art with two independent methods:

| Method | Technology | Speed |
|---|---|---|
| ⚡ OpenCV | Bilateral filter + adaptive thresholding | < 2 s |
| 🤖 AI | Fast neural style transfer (Udnie ONNX, ~6 MB) | 5–30 s CPU |

---

## 📁 Project Structure

```
cartoon_app/
│
├── backend/                    ← Python Flask API
│   ├── app.py                  ← App factory + entry point
│   ├── requirements.txt
│   ├── routes/
│   │   ├── __init__.py
│   │   └── cartoon_routes.py   ← REST endpoints
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── opencv_cartoon.py   ← Classical OpenCV pipeline
│   │   └── dl_cartoon.py       ← Neural style transfer (ONNX)
│   ├── models/                 ← Auto-downloaded ONNX model lands here
│   ├── uploads/                ← Temp: incoming images
│   └── outputs/                ← Processed results served to frontend
│
└── frontend/                   ← React 18 + Vite + Tailwind CSS
    ├── index.html
    ├── package.json
    ├── vite.config.js          ← Dev-proxy /api → localhost:5000
    ├── tailwind.config.js
    ├── postcss.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx             ← Root component
        ├── index.css
        ├── hooks/
        │   └── useCartoon.js   ← All API calls + state
        └── components/
            ├── UploadZone.jsx  ← Drag-and-drop upload
            ├── ImageCard.jsx   ← Image display + download
            ├── ActionButtons.jsx
            └── LoadingSpinner.jsx
```

---

## ⚙️ Prerequisites

| Tool | Minimum version |
|---|---|
| Python | 3.10 |
| pip | 23+ |
| Node.js | 18 |
| npm | 9 |

---

## 🚀 Setup & Run

### Step 1 — Backend

```bash
# Navigate to backend
cd cartoon_app/backend

# Create virtual environment
python -m venv venv

# Activate — Linux / macOS
source venv/bin/activate

# Activate — Windows PowerShell
.\venv\Scripts\Activate.ps1

# Activate — Windows CMD
venv\Scripts\activate.bat

# Install Python dependencies
pip install -r requirements.txt

# Start Flask
python app.py
```

Flask starts at **http://localhost:5000**

---

### Step 2 — Frontend (new terminal)

```bash
cd cartoon_app/frontend

# Install Node dependencies
npm install

# Start Vite dev server
npm run dev
```

React app starts at **http://localhost:3000**

---

## 📖 Usage

1. Open **http://localhost:3000** in your browser
2. **Drop** an image onto the upload zone, or **click** to browse
   - Supported formats: PNG, JPG/JPEG, WEBP, BMP
   - Max size: 10 MB
3. Click **"⚡ Convert with OpenCV"** — fast, < 2 seconds
4. Click **"🤖 Convert with AI"** — painterly, 5–30 s on CPU
   - On the **first** AI call, the ONNX model (~6 MB) is auto-downloaded
5. View both results side-by-side
6. Click **Download** under either result to save it

---

## 🧠 How It Works

### OpenCV Pipeline (`utils/opencv_cartoon.py`)

```
Original
   └─► Downscale ×0.5
          └─► Bilateral filter ×7   ← smooth colours, preserve edges
                 └─► Upscale back
                 └─► Greyscale + median blur → adaptive threshold → edge mask
                        └─► bitwise_and(smooth, edge_mask) → cartoon
```

### AI Pipeline (`utils/dl_cartoon.py`)

```
Original
   └─► ONNX model (udnie-9, Fast Neural Style Transfer)
          └─► Forward pass → stylised float array
                 └─► Clip → uint8
                        └─► K-means colour quantisation (12 colours)
                               └─► Edge overlay → cartoon
```

The Udnie model was trained on Francis Picabia's abstract painting using
the method of [Johnson et al. 2016 — *Perceptual Losses for Real-Time Style Transfer*](https://arxiv.org/abs/1603.08155).

---

## 🛡️ Error Handling

| Scenario | HTTP | UI message |
|---|---|---|
| No image attached | 400 | "No image field in request" |
| Empty file | 400 | "No file selected" |
| Unsupported format | 415 | "Unsupported file type" |
| File > 10 MB | 413 | "File too large…" |
| Corrupt image | 422 | "Cannot read image…" |
| Model download fails | — | Falls back to enhanced OpenCV silently |

---

## 🔧 Production Build

```bash
# Build the React frontend
cd frontend
npm run build          # outputs to frontend/dist/

# You can then:
# A) Serve dist/ via Flask's static folder (copy dist → backend/static/dist)
# B) Deploy dist/ to a CDN (Vercel, Netlify, S3…) and point CORS to your domain
```

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.10, Flask 3, flask-cors, Werkzeug |
| Computer Vision | OpenCV 4.9, NumPy |
| Deep Learning | OpenCV DNN module (ONNX runtime) — no PyTorch/TF needed |
| Frontend | React 18, Vite 5, Tailwind CSS 3, Axios |
| Model | udnie-9.onnx (Fast Neural Style Transfer, MIT licence) |

---

## ❓ FAQ

**Q: Does this need a GPU?**  
No — everything runs on CPU. The AI inference takes 5–30 s depending on your machine.

**Q: What happens if the model can't be downloaded?**  
The app automatically falls back to an enhanced OpenCV pipeline that still produces a good cartoon result.

**Q: Can I change the AI style?**  
Yes — swap `udnie-9.onnx` for any other Fast NST ONNX model in `backend/models/` and update the `_MODEL_PATH` constant in `dl_cartoon.py`.

**Q: Where are processed images saved?**  
In `backend/outputs/`. They are NOT cleaned up automatically — you can add a cron job or call `shutil.rmtree` on startup to purge old files.

---

## 📄 Licence

MIT — free to use, modify and distribute.
