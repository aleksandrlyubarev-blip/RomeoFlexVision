"""Three quality metric bars + verdict badge."""

from __future__ import annotations

from PyQt6.QtCore import Qt, pyqtSlot
from PyQt6.QtWidgets import QFormLayout, QHBoxLayout, QLabel, QProgressBar, QVBoxLayout, QWidget

from ..inference.quality_validator import QualityReport


class _MetricBar(QProgressBar):
    def __init__(self) -> None:
        super().__init__()
        self.setRange(0, 100)
        self.setValue(0)
        self.setTextVisible(True)
        self.setFormat("%p%")

    def update_score(self, score: float) -> None:
        self.setValue(int(score * 100))
        if score > 0.7:
            level = "good"
        elif score > 0.4:
            level = "warn"
        else:
            level = "bad"
        self.setProperty("level", level)
        self.style().unpolish(self)
        self.style().polish(self)


class QualityPanel(QWidget):
    def __init__(self, parent=None) -> None:
        super().__init__(parent)
        title = QLabel("Quality")
        title.setObjectName("sectionTitle")

        self._sharpness = _MetricBar()
        self._exposure = _MetricBar()
        self._framing = _MetricBar()

        form = QFormLayout()
        form.setLabelAlignment(Qt.AlignmentFlag.AlignLeft)
        form.addRow("Sharpness", self._sharpness)
        form.addRow("Exposure", self._exposure)
        form.addRow("Framing", self._framing)

        self._verdict = QLabel("WAITING")
        self._verdict.setObjectName("verdictBadge")
        self._verdict.setAlignment(Qt.AlignmentFlag.AlignCenter)

        verdict_row = QHBoxLayout()
        verdict_row.addWidget(QLabel("Status:"))
        verdict_row.addWidget(self._verdict, 1)

        layout = QVBoxLayout(self)
        layout.addWidget(title)
        layout.addLayout(form)
        layout.addLayout(verdict_row)
        layout.addStretch(1)

    @pyqtSlot(QualityReport)
    def update_quality(self, report: QualityReport) -> None:
        self._sharpness.update_score(report.sharpness)
        self._exposure.update_score(report.exposure)
        self._framing.update_score(report.framing)
        self._verdict.setText(report.verdict.upper())
        self._verdict.setProperty("verdict", report.verdict)
        self.style().unpolish(self._verdict)
        self.style().polish(self._verdict)
