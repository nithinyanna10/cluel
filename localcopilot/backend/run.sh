#!/usr/bin/env bash
# LocalCopilot Backend — dev launcher
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

VENV=".venv"

if [ ! -d "$VENV" ]; then
  echo "→ Creating Python virtual environment..."
  python3 -m venv "$VENV"
fi

# shellcheck disable=SC1090
source "$VENV/bin/activate"

echo "→ Installing / upgrading dependencies..."
pip install -q --upgrade pip
pip install -q -r requirements.txt

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  LocalCopilot Backend — http://127.0.0.1:8787  ║"
echo "╚══════════════════════════════════════════╝"
echo ""

exec uvicorn app.main:app \
  --host "${HOST:-127.0.0.1}" \
  --port "${PORT:-8787}" \
  --reload \
  --log-level info
