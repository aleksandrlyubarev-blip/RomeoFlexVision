"""Application settings: JSON config + dotenv secrets under ~/NeuronVisionDisplay/."""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv
from pydantic import BaseModel, ConfigDict, Field, SecretStr

from ..utils.paths import (
    app_root,
    config_path,
    ensure_app_dirs,
    secrets_path,
    sessions_root,
)

EngineName = Literal["grok", "gemma"]


class QualityThresholds(BaseModel):
    model_config = ConfigDict(strict=True, frozen=True)

    sharpness_min: float = 0.5
    exposure_min: float = 0.5
    framing_min: float = 0.5
    all_must_pass: bool = False


class Settings(BaseModel):
    """Runtime settings. Frozen so threads can share without locking."""

    model_config = ConfigDict(strict=True, frozen=True, arbitrary_types_allowed=True)

    grok_api_key: SecretStr | None = None
    grok_model: str = "grok-2-vision-1212"
    grok_endpoint: str = "https://api.x.ai/v1/chat/completions"
    grok_timeout_s: float = 15.0

    engine: EngineName = "grok"

    camera_index: int = 0
    target_fps: int = 30
    quality_hz: float = 5.0
    inference_max_side: int = 512

    quality: QualityThresholds = Field(default_factory=QualityThresholds)

    sessions_dir: Path = Field(default_factory=sessions_root)
    product_profile_path: Path | None = None

    @classmethod
    def load(cls) -> "Settings":
        """Read config.json + secrets.env, create the app dirs."""
        ensure_app_dirs()

        secrets = secrets_path()
        if secrets.exists():
            load_dotenv(secrets, override=False)

        data: dict[str, object] = {}
        cfg = config_path()
        if cfg.exists():
            try:
                data = json.loads(cfg.read_text())
            except json.JSONDecodeError:
                data = {}

        api_key = os.environ.get("GROK_API_KEY") or data.pop("grok_api_key", None)
        if api_key:
            data["grok_api_key"] = api_key

        if "sessions_dir" in data and isinstance(data["sessions_dir"], str):
            data["sessions_dir"] = Path(data["sessions_dir"]).expanduser()
        if "product_profile_path" in data and isinstance(data["product_profile_path"], str):
            data["product_profile_path"] = Path(data["product_profile_path"]).expanduser()

        return cls(**data)

    def save(self) -> None:
        """Persist non-secret fields to ~/NeuronVisionDisplay/config.json."""
        ensure_app_dirs()
        payload = self.model_dump(mode="json")
        payload.pop("grok_api_key", None)  # secrets stay in dotenv
        config_path().write_text(json.dumps(payload, indent=2))


def write_secrets(grok_api_key: str) -> Path:
    """Write or update secrets.env with the Grok API key. Returns the path."""
    ensure_app_dirs()
    path = secrets_path()
    lines: list[str] = []
    found = False
    if path.exists():
        for raw in path.read_text().splitlines():
            if raw.startswith("GROK_API_KEY="):
                lines.append(f"GROK_API_KEY={grok_api_key}")
                found = True
            else:
                lines.append(raw)
    if not found:
        lines.append(f"GROK_API_KEY={grok_api_key}")
    path.write_text("\n".join(lines) + "\n")
    try:
        path.chmod(0o600)
    except OSError:
        pass
    return path


def app_root_path() -> Path:
    return app_root()
