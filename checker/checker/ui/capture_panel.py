"""Last-capture display: thumbnail + verdict + AI notes."""

from __future__ import annotations

from pathlib import Path

from PyQt6.QtCore import Qt, pyqtSlot
from PyQt6.QtGui import QPixmap
from PyQt6.QtWidgets import QHBoxLayout, QLabel, QPushButton, QVBoxLayout, QWidget

from ..inference.ai_engine import CaptureResult


class CapturePanel(QWidget):
    def __init__(self, parent=None) -> None:
        super().__init__(parent)
        title = QLabel("Last capture")
        title.setObjectName("sectionTitle")

        self._thumb = QLabel()
        self._thumb.setFixedSize(160, 120)
        self._thumb.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self._thumb.setStyleSheet("background-color:#000;border:1px solid #2d3036;")

        self._verdict = QLabel("—")
        self._verdict.setObjectName("verdictBadge")
        self._verdict.setAlignment(Qt.AlignmentFlag.AlignCenter)

        self._notes = QLabel("Press SPACE to capture once a session is active.")
        self._notes.setWordWrap(True)
        self._notes.setMinimumHeight(80)
        self._notes.setAlignment(Qt.AlignmentFlag.AlignTop)

        self._meta = QLabel("")
        self._meta.setStyleSheet("color:#9aa0a6;font-size:11px;")

        self._open_btn = QPushButton("Open in Preview")
        self._open_btn.setEnabled(False)

        thumb_row = QHBoxLayout()
        thumb_row.addWidget(self._thumb)
        verdict_col = QVBoxLayout()
        verdict_col.addWidget(self._verdict)
        verdict_col.addWidget(self._meta)
        verdict_col.addStretch(1)
        thumb_row.addLayout(verdict_col, 1)

        layout = QVBoxLayout(self)
        layout.addWidget(title)
        layout.addLayout(thumb_row)
        layout.addWidget(self._notes)
        layout.addWidget(self._open_btn)
        layout.addStretch(1)

        self._current_jpeg: Path | None = None
        self._open_btn.clicked.connect(self._open_in_preview)

    def show_pending(self, jpeg_path: Path) -> None:
        self._current_jpeg = jpeg_path
        if jpeg_path.exists():
            pix = QPixmap(str(jpeg_path)).scaled(
                self._thumb.size(),
                Qt.AspectRatioMode.KeepAspectRatio,
                Qt.TransformationMode.SmoothTransformation,
            )
            self._thumb.setPixmap(pix)
        self._verdict.setText("ANALYZING…")
        self._verdict.setProperty("verdict", "warn")
        self.style().unpolish(self._verdict)
        self.style().polish(self._verdict)
        self._notes.setText("Waiting for AI verdict…")
        self._meta.setText("")
        self._open_btn.setEnabled(True)

    @pyqtSlot(str, object)
    def show_result(self, _capture_id: str, result: object) -> None:
        if not isinstance(result, CaptureResult):
            return
        self._verdict.setText(result.verdict.upper())
        self._verdict.setProperty("verdict", result.verdict)
        self.style().unpolish(self._verdict)
        self.style().polish(self._verdict)
        notes = result.notes or "(no notes)"
        if result.defects:
            notes += "\nDefects: " + ", ".join(result.defects)
        self._notes.setText(notes)
        self._meta.setText(
            f"⏱ {result.latency_ms / 1000:.1f}s   confidence {result.confidence:.2f}   engine {result.engine}"
        )

    def _open_in_preview(self) -> None:
        if self._current_jpeg is None or not self._current_jpeg.exists():
            return
        import subprocess
        import sys

        if sys.platform == "darwin":
            subprocess.Popen(["open", str(self._current_jpeg)])
