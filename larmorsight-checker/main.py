"""Single entry point per TZ §4.4: `python main.py`."""

from __future__ import annotations

import sys

from larmorsight_checker.app import run

if __name__ == "__main__":
    sys.exit(run())
