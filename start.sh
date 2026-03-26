#!/usr/bin/env bash
# =============================================================================
# start.sh — convenience script to launch both backend and frontend together
#
# Usage:  bash start.sh
#
# Prerequisites:
#   • Python venv already created and activated  (or run with venv activated)
#   • pip install -r backend/requirements.txt already done
#   • npm install already done in frontend/
# =============================================================================

set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "🎨 CartoonAI — Starting services"
echo "================================="

# ── Backend ────────────────────────────────────────────────────────────────
echo ""
echo "⚙  Starting Flask backend on http://localhost:5000 …"
cd "$ROOT/backend"
python app.py &
BACKEND_PID=$!
echo "   PID: $BACKEND_PID"

# ── Frontend ───────────────────────────────────────────────────────────────
echo ""
echo "⚛  Starting React frontend on http://localhost:3000 …"
cd "$ROOT/frontend"
npm run dev &
FRONTEND_PID=$!
echo "   PID: $FRONTEND_PID"

echo ""
echo "✅ Both services running."
echo "   Open http://localhost:3000 in your browser."
echo "   Press Ctrl+C to stop."
echo ""

# Wait — kill both on Ctrl+C
trap "echo ''; echo 'Shutting down…'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM
wait
