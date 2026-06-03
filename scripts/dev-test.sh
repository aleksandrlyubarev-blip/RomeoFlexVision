#!/usr/bin/env bash
# Run the test suites that have no special hardware needs.
# (The checker PyQt6 suite is opt-in; see scripts/dev-setup.sh --checker.)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "==> rhaef_v2 (root) tests"
python -m pytest tests/ -q

echo "==> roboqc_data tests"
( cd roboqc_data && python -m pytest -q )

echo "==> ruff"
ruff check rhaef_v2 scripts tests
( cd roboqc_data && ruff check src tests )

if [[ -x ./.venv-checker/bin/python ]]; then
  echo "==> checker tests (offscreen)"
  QT_QPA_PLATFORM=offscreen ./.venv-checker/bin/python -m pytest checker -q
fi

echo "==> All green."
