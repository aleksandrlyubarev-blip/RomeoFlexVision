"""Settings dialog: camera index, Grok API key, engine selector."""

from __future__ import annotations

from PyQt6.QtWidgets import (
    QComboBox,
    QDialog,
    QDialogButtonBox,
    QFormLayout,
    QLineEdit,
    QSpinBox,
    QVBoxLayout,
)

from ..config.settings import Settings, write_secrets


class SettingsDialog(QDialog):
    def __init__(self, settings: Settings, parent=None) -> None:
        super().__init__(parent)
        self.setWindowTitle("Neuron Vision Display Settings")
        self._settings = settings

        self._camera_index = QSpinBox()
        self._camera_index.setRange(0, 8)
        self._camera_index.setValue(settings.camera_index)

        self._engine = QComboBox()
        self._engine.addItem("Grok (xAI cloud)", userData="grok")
        self._engine.addItem("Local Gemma — coming in v0.2", userData="gemma")
        self._engine.setCurrentIndex(0)
        # Disable the Gemma row (per TZ scope decision: v0.1 is Grok-only).
        self._engine.model().item(1).setEnabled(False)

        self._api_key = QLineEdit()
        self._api_key.setEchoMode(QLineEdit.EchoMode.Password)
        if settings.grok_api_key is not None:
            self._api_key.setText(settings.grok_api_key.get_secret_value())
        self._api_key.setPlaceholderText("xai-…")

        self._model = QLineEdit(settings.grok_model)
        self._product_profile = QLineEdit(str(settings.product_profile_path or ""))
        self._product_profile.setPlaceholderText("~/NeuronVisionDisplay/products/demo-assembly.json")

        form = QFormLayout()
        form.addRow("Camera index", self._camera_index)
        form.addRow("AI engine", self._engine)
        form.addRow("Grok API key", self._api_key)
        form.addRow("Grok model id", self._model)
        form.addRow("Product profile", self._product_profile)

        buttons = QDialogButtonBox(QDialogButtonBox.StandardButton.Save | QDialogButtonBox.StandardButton.Cancel)
        buttons.accepted.connect(self.accept)
        buttons.rejected.connect(self.reject)

        layout = QVBoxLayout(self)
        layout.addLayout(form)
        layout.addWidget(buttons)

    def updated_settings(self) -> Settings:
        api_key = self._api_key.text().strip()
        if api_key:
            write_secrets(api_key)
        new = self._settings.model_copy(
            update={
                "camera_index": self._camera_index.value(),
                "grok_model": self._model.text().strip() or self._settings.grok_model,
                "engine": self._engine.currentData() or "grok",
                "product_profile_path": self._profile_path(),
            }
        )
        new.save()
        return new

    def _profile_path(self):
        raw = self._product_profile.text().strip()
        if not raw:
            return None
        from pathlib import Path

        return Path(raw).expanduser()
