"""QThread that owns a UVCCamera and emits frames at target_fps."""

from __future__ import annotations

import time

from PyQt6.QtCore import QThread, pyqtSignal

from ..utils.logging import get_logger
from .uvc_camera import UVCCamera

_log = get_logger()


class CameraThread(QThread):
    """Background grab loop. Emits (bgr_frame, capture_ts_monotonic_seconds)."""

    # Signal payload uses `object` to avoid registering a custom QMetaType for np.ndarray.
    frame_ready = pyqtSignal(object, float)
    error = pyqtSignal(str)

    def __init__(self, camera: UVCCamera, target_fps: int = 30, parent=None) -> None:
        super().__init__(parent)
        self._camera = camera
        self._target_fps = max(1, target_fps)
        self._stop = False

    def stop(self) -> None:
        self._stop = True

    def run(self) -> None:
        if not self._camera.is_open() and not self._camera.open():
            self.error.emit("Failed to open camera. Check Settings → Camera index.")
            return

        period = 1.0 / self._target_fps
        next_tick = time.monotonic()
        consecutive_failures = 0

        while not self._stop:
            frame = self._camera.read()
            if frame is None:
                consecutive_failures += 1
                if consecutive_failures > 30:
                    self.error.emit("Camera stopped delivering frames; reconnect via Settings.")
                    break
                self.msleep(20)
                continue
            consecutive_failures = 0
            self.frame_ready.emit(frame.copy(), time.monotonic())

            next_tick += period
            slack = next_tick - time.monotonic()
            if slack > 0:
                self.msleep(int(slack * 1000))
            else:
                next_tick = time.monotonic()

        self._camera.close()
        _log.info("CameraThread exited")
