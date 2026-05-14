"""Logging setup: stderr + rotating file under ~/LarmorSight/logs/."""

from __future__ import annotations

import logging
import sys
from datetime import datetime
from logging.handlers import RotatingFileHandler

from .paths import ensure_app_dirs, logs_root

LOGGER_NAME = "larmorsight"
_configured = False


def get_logger() -> logging.Logger:
    global _configured
    logger = logging.getLogger(LOGGER_NAME)
    if _configured:
        return logger

    ensure_app_dirs()
    fmt = logging.Formatter("%(asctime)s %(levelname)-7s %(name)s: %(message)s")

    stderr_handler = logging.StreamHandler(sys.stderr)
    stderr_handler.setFormatter(fmt)
    stderr_handler.setLevel(logging.INFO)
    logger.addHandler(stderr_handler)

    log_path = logs_root() / f"checker_{datetime.now():%Y%m%d}.log"
    file_handler = RotatingFileHandler(log_path, maxBytes=5_000_000, backupCount=3)
    file_handler.setFormatter(fmt)
    file_handler.setLevel(logging.DEBUG)
    logger.addHandler(file_handler)

    logger.setLevel(logging.DEBUG)
    logger.propagate = False
    _configured = True
    return logger
