"""5 Hz quality worker. Read-and-clear latest-frame pattern, runs in a QThread."""

from __future__ import annotations

import threading

import numpy as np
from PyQt6.QtCore import QObject, QTimer, pyqtSignal, pyqtSlot

from ..utils.logging import get_logger
from .quality_validator import QualityReport, evaluate

_log = get_logger()


class QualityWorker(QObject):
    """Lives in a QThread; throttles 30 Hz frame stream down to ~5 Hz of QualityReports."""

    quality_updated = pyqtSignal(QualityReport)

    def __init__(self, period_ms: int = 200) -> None:
        super().__init__()
        self._period_ms = period_ms
        self._latest: np.ndarray | None = None
        self._lock = threading.Lock()
        self._timer: QTimer | None = None

    def start(self) -> None:
        if self._timer is not None:
            return
        self._timer = QTimer()
        self._timer.setInterval(self._period_ms)
        self._timer.timeout.connect(self._tick)
        self._timer.start()

    def stop(self) -> None:
        if self._timer is not None:
            self._timer.stop()
            self._timer = None

    @pyqtSlot(object, float)
    def on_frame(self, frame_bgr: object, ts: float) -> None:
        if not isinstance(frame_bgr, np.ndarray):
            return
        with self._lock:
            self._latest = frame_bgr  # already copied by CameraThread before emit

    def _tick(self) -> None:
        with self._lock:
            frame = self._latest
            self._latest = None
        if frame is None:
            return
        try:
            report = evaluate(frame)
        except Exception as exc:
            _log.exception("QualityWorker: evaluate failed: %s", exc)
            return
        self.quality_updated.emit(report)
