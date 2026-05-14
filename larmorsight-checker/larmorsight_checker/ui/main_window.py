"""Main window: wires camera, quality worker, inference worker, session manager."""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PyQt6.QtCore import Qt, QThread, pyqtSlot
from PyQt6.QtGui import QAction, QKeySequence, QShortcut
from PyQt6.QtWidgets import (
    QHBoxLayout,
    QInputDialog,
    QLabel,
    QMainWindow,
    QMessageBox,
    QPushButton,
    QStatusBar,
    QToolBar,
    QVBoxLayout,
    QWidget,
)

from ..camera.camera_thread import CameraThread
from ..camera.uvc_camera import UVCCamera
from ..config.settings import Settings
from ..inference.ai_engine import AIEngine, CaptureResult
from ..inference.grok_engine import GrokEngine
from ..inference.inference_thread import InferenceWorker
from ..inference.prompts import qc_prompt
from ..inference.quality_thread import QualityWorker
from ..inference.quality_validator import evaluate
from ..session.session_manager import CameraInfo, SessionManager
from ..utils.logging import get_logger
from .capture_panel import CapturePanel
from .preview_widget import PreviewWidget
from .quality_panel import QualityPanel
from .settings_dialog import SettingsDialog

_log = get_logger()


def _build_engine(settings: Settings) -> AIEngine | None:
    if settings.engine != "grok":
        return None
    if settings.grok_api_key is None:
        return None
    return GrokEngine(
        api_key=settings.grok_api_key.get_secret_value(),
        model=settings.grok_model,
        endpoint=settings.grok_endpoint,
        timeout_s=settings.grok_timeout_s,
        max_side=settings.inference_max_side,
    )


class MainWindow(QMainWindow):
    def __init__(self, settings: Settings) -> None:
        super().__init__()
        self.setWindowTitle("LarmorSight Checker v0.1")
        self.resize(1280, 760)
        self._settings = settings

        self._session_manager = SessionManager(
            sessions_root_dir=settings.sessions_dir,
            ai_engine_name=settings.engine,
            sharpness_min=settings.quality.sharpness_min,
            exposure_min=settings.quality.exposure_min,
            framing_min=settings.quality.framing_min,
        )

        self._latest_frame: np.ndarray | None = None

        self._preview = PreviewWidget()
        self._quality_panel = QualityPanel()
        self._capture_panel = CapturePanel()

        self._capture_btn = QPushButton("📸 Capture (SPACE)")
        self._capture_btn.setObjectName("captureButton")
        self._capture_btn.setEnabled(False)
        self._capture_btn.clicked.connect(self._on_capture)

        right_col = QVBoxLayout()
        right_col.addWidget(self._quality_panel, 1)
        right_col.addWidget(self._capture_panel, 1)

        center = QHBoxLayout()
        center.addWidget(self._preview, 3)
        right_box = QWidget()
        right_box.setLayout(right_col)
        right_box.setMinimumWidth(320)
        center.addWidget(right_box, 1)

        bottom = QHBoxLayout()
        self._session_label = QLabel("No session")
        bottom.addWidget(self._session_label, 1)
        bottom.addWidget(self._capture_btn)

        wrapper = QVBoxLayout()
        wrapper.addLayout(center, 1)
        wrapper.addLayout(bottom)

        container = QWidget()
        container.setLayout(wrapper)
        self.setCentralWidget(container)

        self._build_toolbar()
        self.setStatusBar(QStatusBar())
        self._engine_status = QLabel("Engine: idle")
        self.statusBar().addPermanentWidget(self._engine_status)

        QShortcut(QKeySequence(Qt.Key.Key_Space), self, activated=self._on_capture)
        QShortcut(QKeySequence("Ctrl+N"), self, activated=self._on_new_session)
        QShortcut(QKeySequence("Ctrl+E"), self, activated=self._on_end_session)

        self._camera_thread: CameraThread | None = None
        self._quality_worker: QualityWorker | None = None
        self._quality_thread: QThread | None = None
        self._inference_worker: InferenceWorker | None = None
        self._inference_thread: QThread | None = None

        self._start_pipeline()

    # ------------------------- toolbar / menu -------------------------

    def _build_toolbar(self) -> None:
        toolbar = QToolBar()
        self.addToolBar(toolbar)

        new_session = QAction("New Session", self)
        new_session.triggered.connect(self._on_new_session)
        toolbar.addAction(new_session)

        end_session = QAction("End Session", self)
        end_session.triggered.connect(self._on_end_session)
        toolbar.addAction(end_session)

        toolbar.addSeparator()

        settings_action = QAction("Settings", self)
        settings_action.triggered.connect(self._on_open_settings)
        toolbar.addAction(settings_action)

        toolbar.addSeparator()
        reconnect = QAction("Reconnect Camera", self)
        reconnect.triggered.connect(self._restart_camera)
        toolbar.addAction(reconnect)

    # ------------------------- pipeline wiring -------------------------

    def _start_pipeline(self) -> None:
        self._start_camera()
        self._start_quality_worker()
        self._start_inference_worker()

    def _start_camera(self) -> None:
        cam = UVCCamera(
            index=self._settings.camera_index,
            fps=self._settings.target_fps,
        )
        self._camera_thread = CameraThread(cam, target_fps=self._settings.target_fps)
        self._camera_thread.frame_ready.connect(self._on_frame, Qt.ConnectionType.QueuedConnection)
        self._camera_thread.frame_ready.connect(self._preview.set_frame, Qt.ConnectionType.QueuedConnection)
        self._camera_thread.error.connect(self._on_camera_error, Qt.ConnectionType.QueuedConnection)
        self._camera_thread.start()

    def _start_quality_worker(self) -> None:
        self._quality_thread = QThread(self)
        self._quality_worker = QualityWorker(period_ms=int(1000 / self._settings.quality_hz))
        self._quality_worker.moveToThread(self._quality_thread)
        self._quality_thread.started.connect(self._quality_worker.start)
        self._quality_worker.quality_updated.connect(
            self._quality_panel.update_quality, Qt.ConnectionType.QueuedConnection
        )
        if self._camera_thread is not None:
            self._camera_thread.frame_ready.connect(
                self._quality_worker.on_frame, Qt.ConnectionType.QueuedConnection
            )
        self._quality_thread.start()

    def _start_inference_worker(self) -> None:
        engine = _build_engine(self._settings)
        if engine is None:
            self._engine_status.setText("Engine: not configured (set GROK_API_KEY in Settings)")
            return
        self._inference_thread = QThread(self)
        self._inference_worker = InferenceWorker(engine)
        self._inference_worker.moveToThread(self._inference_thread)
        self._inference_worker.inference_done.connect(
            self._on_inference_done, Qt.ConnectionType.QueuedConnection
        )
        self._inference_worker.busy_changed.connect(self._on_engine_busy, Qt.ConnectionType.QueuedConnection)
        self._inference_thread.start()
        self._engine_status.setText(f"Engine: {engine.name} ({self._settings.grok_model})")

    def _restart_camera(self) -> None:
        if self._camera_thread is not None:
            self._camera_thread.stop()
            self._camera_thread.wait(2000)
        self._start_camera()

    # ------------------------- slots -------------------------

    @pyqtSlot(object, float)
    def _on_frame(self, frame: object, _ts: float) -> None:
        if isinstance(frame, np.ndarray):
            self._latest_frame = frame
            if not self._capture_btn.isEnabled():
                self._capture_btn.setEnabled(True)

    @pyqtSlot(str)
    def _on_camera_error(self, message: str) -> None:
        QMessageBox.warning(self, "Camera", message)
        self._capture_btn.setEnabled(False)

    @pyqtSlot(bool)
    def _on_engine_busy(self, busy: bool) -> None:
        suffix = " (busy…)" if busy else ""
        engine_name = self._settings.engine
        self._engine_status.setText(f"Engine: {engine_name} ({self._settings.grok_model}){suffix}")

    def _on_new_session(self) -> None:
        if self._session_manager.is_open():
            QMessageBox.information(self, "Session", "End the current session first.")
            return
        name, ok = QInputDialog.getText(self, "New Session", "Session name (optional):")
        if not ok:
            return
        cam_info = CameraInfo(name=f"camera index {self._settings.camera_index}", resolution="1920x1080")
        session = self._session_manager.start(name.strip() or None, camera=cam_info)
        self._session_label.setText(f"Session: {session.name}  |  captures: 0")

    def _on_end_session(self) -> None:
        if not self._session_manager.is_open():
            return
        finished = self._session_manager.end()
        pdf = finished.dir / "session_summary.pdf"
        QMessageBox.information(
            self,
            "Session ended",
            f"Saved {finished.capture_count} captures to:\n{finished.dir}\n\nPDF: {pdf.name}",
        )
        self._session_label.setText("No session")

    def _on_capture(self) -> None:
        if self._latest_frame is None:
            return
        if not self._session_manager.is_open():
            QMessageBox.information(self, "No session", "Start a new session first (Ctrl+N).")
            return
        try:
            quality = evaluate(self._latest_frame)
        except Exception as exc:
            _log.exception("evaluate failed in _on_capture: %s", exc)
            return
        record = self._session_manager.add_capture(self._latest_frame, quality)
        self._preview.freeze(100)

        session = self._session_manager.session
        if session is None:
            return
        jpeg_path = session.dir / record.frame_path
        self._capture_panel.show_pending(jpeg_path)
        self._session_label.setText(f"Session: {session.name}  |  captures: {session.capture_count}")

        if self._inference_worker is not None:
            self._inference_worker.submit(record.capture_id, str(jpeg_path), qc_prompt())
        else:
            self._capture_panel.show_result(
                record.capture_id,
                CaptureResult(verdict="unknown", confidence=0.0, notes="No AI engine configured.", engine="none"),
            )

    @pyqtSlot(str, object)
    def _on_inference_done(self, capture_id: str, result: object) -> None:
        if not isinstance(result, CaptureResult):
            return
        self._capture_panel.show_result(capture_id, result)
        if self._session_manager.is_open():
            try:
                self._session_manager.attach_result(capture_id, result)
            except KeyError:
                _log.warning("attach_result: capture %s not in session", capture_id)

    def _on_open_settings(self) -> None:
        dialog = SettingsDialog(self._settings, parent=self)
        if dialog.exec():
            self._settings = dialog.updated_settings()
            QMessageBox.information(
                self,
                "Settings",
                "Saved. Restart the app to apply camera/engine changes.",
            )

    # ------------------------- shutdown -------------------------

    def closeEvent(self, event) -> None:
        if self._camera_thread is not None:
            self._camera_thread.stop()
            self._camera_thread.wait(2000)
        if self._quality_worker is not None:
            self._quality_worker.stop()
        if self._quality_thread is not None:
            self._quality_thread.quit()
            self._quality_thread.wait(1000)
        if self._inference_thread is not None:
            self._inference_thread.quit()
            self._inference_thread.wait(2000)
        if self._session_manager.is_open():
            try:
                self._session_manager.end()
            except Exception as exc:
                _log.warning("auto-end session on close failed: %s", exc)
        super().closeEvent(event)


def load_stylesheet() -> str:
    qss = Path(__file__).with_name("styles.qss")
    return qss.read_text() if qss.exists() else ""
