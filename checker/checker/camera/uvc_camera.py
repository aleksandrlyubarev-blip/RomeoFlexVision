"""USB UVC camera wrapper. macOS uses AVFoundation backend by default."""

from __future__ import annotations

import sys
import time

import cv2
import numpy as np

from ..utils.logging import get_logger

_log = get_logger()


def _platform_backend() -> int:
    if sys.platform == "darwin":
        return cv2.CAP_AVFOUNDATION
    return cv2.CAP_ANY


class UVCCamera:
    """Synchronous OpenCV wrapper. Always called from a worker thread."""

    def __init__(self, index: int = 0, width: int = 1920, height: int = 1080, fps: int = 30) -> None:
        self._index = index
        self._width = width
        self._height = height
        self._fps = fps
        self._cap: cv2.VideoCapture | None = None

    def is_open(self) -> bool:
        return self._cap is not None and self._cap.isOpened()

    def open(self) -> bool:
        cap = cv2.VideoCapture(self._index, _platform_backend())
        if not cap.isOpened():
            _log.error("UVCCamera: cv2.VideoCapture(%d) failed", self._index)
            return False
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, self._width)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self._height)
        cap.set(cv2.CAP_PROP_FPS, self._fps)
        self._cap = cap
        _log.info(
            "UVCCamera opened idx=%d backend=%s requested=%dx%d@%d",
            self._index,
            cap.getBackendName(),
            self._width,
            self._height,
            self._fps,
        )
        # AVFoundation often returns None for the first ~200 ms after open; warm up briefly.
        deadline = time.monotonic() + 1.0
        while time.monotonic() < deadline:
            ok, _ = cap.read()
            if ok:
                break
            time.sleep(0.05)
        return True

    def read(self) -> np.ndarray | None:
        if not self.is_open() or self._cap is None:
            return None
        ok, frame = self._cap.read()
        if not ok or frame is None:
            return None
        return frame

    def close(self) -> None:
        if self._cap is not None:
            self._cap.release()
            self._cap = None
            _log.info("UVCCamera released idx=%d", self._index)

    @property
    def description(self) -> str:
        if not self.is_open() or self._cap is None:
            return f"UVC[{self._index}] (closed)"
        w = int(self._cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        h = int(self._cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        return f"UVC[{self._index}] {w}x{h}"
