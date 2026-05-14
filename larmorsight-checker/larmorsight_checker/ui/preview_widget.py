"""Live camera preview QLabel with brief 'snap' freeze on capture."""

from __future__ import annotations

import time

import cv2
import numpy as np
from PyQt6.QtCore import Qt, pyqtSlot
from PyQt6.QtGui import QImage, QPainter, QPixmap
from PyQt6.QtWidgets import QLabel


class PreviewWidget(QLabel):
    def __init__(self, parent=None) -> None:
        super().__init__(parent)
        self.setObjectName("previewLabel")
        self.setMinimumSize(640, 360)
        self.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.setScaledContents(False)
        self._latest_pixmap: QPixmap | None = None
        self._frozen_until: float = 0.0
        self._reticle = True

    def set_reticle(self, enabled: bool) -> None:
        self._reticle = enabled
        if self._latest_pixmap is not None:
            self._render(self._latest_pixmap)

    def freeze(self, duration_ms: int = 100) -> None:
        self._frozen_until = time.monotonic() + duration_ms / 1000.0
        if self._latest_pixmap is not None:
            self._render(self._latest_pixmap, flash=True)

    @pyqtSlot(object, float)
    def set_frame(self, frame_bgr: object, _ts: float) -> None:
        if not isinstance(frame_bgr, np.ndarray):
            return
        if time.monotonic() < self._frozen_until:
            return
        rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        h, w, _ = rgb.shape
        # `.copy()` is mandatory — without it the QImage aliases numpy memory the next grab will overwrite.
        image = QImage(rgb.data, w, h, w * 3, QImage.Format.Format_RGB888).copy()
        self._latest_pixmap = QPixmap.fromImage(image)
        self._render(self._latest_pixmap)

    def _render(self, source: QPixmap, *, flash: bool = False) -> None:
        scaled = source.scaled(
            self.size(),
            Qt.AspectRatioMode.KeepAspectRatio,
            Qt.TransformationMode.SmoothTransformation,
        )
        canvas = QPixmap(scaled.size())
        canvas.fill(Qt.GlobalColor.black)
        painter = QPainter(canvas)
        painter.drawPixmap(0, 0, scaled)
        if self._reticle:
            self._draw_reticle(painter, canvas.width(), canvas.height())
        if flash:
            painter.fillRect(canvas.rect(), Qt.GlobalColor.white)
        painter.end()
        self.setPixmap(canvas)

    def _draw_reticle(self, painter: QPainter, w: int, h: int) -> None:
        pen = painter.pen()
        pen.setColor(Qt.GlobalColor.cyan)
        pen.setWidth(1)
        painter.setPen(pen)
        cx, cy = w // 2, h // 2
        painter.drawLine(cx - 12, cy, cx + 12, cy)
        painter.drawLine(cx, cy - 12, cx, cy + 12)
        side = int(min(w, h) * 0.6)
        painter.drawRect(cx - side // 2, cy - side // 2, side, side)
