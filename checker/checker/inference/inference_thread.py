"""Single-slot, drop-newest inference worker."""

from __future__ import annotations

import threading
from pathlib import Path

from PyQt6.QtCore import QObject, pyqtSignal, pyqtSlot

from ..utils.logging import get_logger
from .ai_engine import AIEngine, CaptureResult

_log = get_logger()


class InferenceWorker(QObject):
    """Runs in a QThread; never call requests.post on the GUI thread."""

    inference_done = pyqtSignal(str, object)  # capture_id, CaptureResult
    busy_changed = pyqtSignal(bool)

    def __init__(self, engine: AIEngine) -> None:
        super().__init__()
        self._engine = engine
        self._busy = False
        self._lock = threading.Lock()

    def set_engine(self, engine: AIEngine) -> None:
        with self._lock:
            self._engine = engine

    @pyqtSlot(str, str, str)
    def submit(self, capture_id: str, jpeg_path: str, prompt: str) -> None:
        with self._lock:
            if self._busy:
                _log.warning("InferenceWorker busy; dropping request for capture %s", capture_id)
                return
            self._busy = True
        self.busy_changed.emit(True)
        try:
            jpeg_bytes = Path(jpeg_path).read_bytes()
            result = self._engine.analyze(jpeg_bytes, prompt)
        except Exception as exc:
            _log.exception("InferenceWorker: engine.analyze raised: %s", exc)
            result = CaptureResult(
                verdict="unknown",
                confidence=0.0,
                notes=f"Engine error: {exc!s}",
                engine=getattr(self._engine, "name", "unknown"),
            )
        finally:
            with self._lock:
                self._busy = False
            self.busy_changed.emit(False)
        self.inference_done.emit(capture_id, result)
