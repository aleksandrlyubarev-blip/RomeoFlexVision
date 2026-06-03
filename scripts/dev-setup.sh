#!/usr/bin/env bash
# Reproducible dev/test bootstrap for the monorepo.
#
# Installs every component so that `pytest` and the Node builds run green in a
# fresh checkout (CI sandbox, Claude Code on the web, or a clean laptop).
# Idempotent: safe to re-run.
#
# Usage:
#   scripts/dev-setup.sh            # python packages + node builds
#   scripts/dev-setup.sh --checker  # also set up the PyQt6 checker venv
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "==> Python: rhaef_v2 (root) + roboqc_data[cv,brigada]"
python -m pip install --upgrade pip >/dev/null
pip install -e .
pip install -e './roboqc_data[cv,brigada]' opencv-python-headless

# Some sandbox images ship a half-built cffi (No module named '_cffi_backend'),
# which makes cryptography -> litellm import explode. Repair it defensively.
if ! python -c "import _cffi_backend" 2>/dev/null; then
  echo "==> Repairing cffi backend"
  pip install --force-reinstall cffi
fi

echo "==> Sanity: import the package trees"
python -c "import rhaef_v2, roboqc_data; print('python imports ok')"

if command -v npm >/dev/null 2>&1; then
  for d in romeoflexvision telegram-bot voice-gateway; do
    echo "==> Node: $d"
    ( cd "$d" && (npm ci 2>/dev/null || npm install) )
  done
else
  echo "!! npm not found; skipping Node components"
fi

if [[ "${1:-}" == "--checker" ]]; then
  echo "==> checker desktop app (PyQt6) venv -> .venv-checker"
  # PyQt6 needs system GL/EGL libs; install them when apt + privileges exist.
  if command -v apt-get >/dev/null 2>&1; then
    apt-get install -y -q libegl1 libgl1 libxkbcommon0 libdbus-1-3 || \
      echo "!! could not apt-get Qt libs (need root?); checker tests may fail to import"
  fi
  python -m venv .venv-checker
  ./.venv-checker/bin/pip install -e './checker[dev]'
  echo "   run checker tests with: QT_QPA_PLATFORM=offscreen ./.venv-checker/bin/python -m pytest checker"
fi

echo "==> Done. Run tests with: scripts/dev-test.sh"
