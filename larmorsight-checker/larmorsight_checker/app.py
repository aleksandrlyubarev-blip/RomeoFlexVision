"""Application bootstrap. Use `python main.py` to launch."""

from __future__ import annotations

import sys

from PyQt6.QtWidgets import QApplication

from .config.settings import Settings
from .ui.main_window import MainWindow, load_stylesheet
from .utils.logging import get_logger


def run() -> int:
    log = get_logger()
    log.info("LarmorSight Checker starting")

    settings = Settings.load()
    app = QApplication(sys.argv)
    app.setApplicationName("LarmorSight Checker")
    app.setStyleSheet(load_stylesheet())

    window = MainWindow(settings)
    window.show()
    return app.exec()
