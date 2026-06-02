"""Filesystem layout for ~/NeuronVisionDisplay/."""

from __future__ import annotations

from datetime import datetime
from pathlib import Path


def app_root() -> Path:
    return Path.home() / "NeuronVisionDisplay"


def sessions_root() -> Path:
    return app_root() / "sessions"


def logs_root() -> Path:
    return app_root() / "logs"


def models_root() -> Path:
    return app_root() / "models"


def secrets_path() -> Path:
    return app_root() / "secrets.env"


def config_path() -> Path:
    return app_root() / "config.json"


def ensure_app_dirs() -> None:
    for d in (app_root(), sessions_root(), logs_root(), models_root()):
        d.mkdir(parents=True, exist_ok=True)


def new_session_dir(name: str | None, *, root: Path | None = None, now: datetime | None = None) -> Path:
    """Build (and create) the per-session directory."""
    when = now or datetime.now().astimezone()
    safe = "session" if not name else "".join(c if c.isalnum() or c in "-_" else "-" for c in name).strip("-") or "session"
    folder = f"{when:%Y-%m-%d_%H%M}_{safe}"
    base = root or sessions_root()
    path = base / folder
    path.mkdir(parents=True, exist_ok=True)
    return path
