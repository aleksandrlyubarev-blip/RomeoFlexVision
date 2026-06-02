"""Settings load/save round-trip + paths helpers."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

import checker.utils.paths as paths_mod
from checker.config.settings import Settings, write_secrets


@pytest.fixture
def isolated_home(tmp_path, monkeypatch) -> Path:
    monkeypatch.setenv("HOME", str(tmp_path))
    monkeypatch.delenv("GROK_API_KEY", raising=False)
    # Path.home() reads HOME on POSIX so the override propagates.
    assert Path.home() == tmp_path
    return tmp_path


def test_load_creates_app_dirs(isolated_home) -> None:
    settings = Settings.load()
    assert (isolated_home / "NeuronVisionDisplay").is_dir()
    assert (isolated_home / "NeuronVisionDisplay" / "sessions").is_dir()
    assert (isolated_home / "NeuronVisionDisplay" / "logs").is_dir()
    assert settings.engine == "grok"
    assert settings.grok_api_key is None


def test_load_picks_up_env(isolated_home, monkeypatch) -> None:
    monkeypatch.setenv("GROK_API_KEY", "xai-from-env")
    settings = Settings.load()
    assert settings.grok_api_key is not None
    assert settings.grok_api_key.get_secret_value() == "xai-from-env"


def test_save_strips_secret(isolated_home) -> None:
    settings = Settings.load().model_copy(update={"camera_index": 3, "grok_model": "grok-vision-test"})
    settings.save()
    payload = json.loads((isolated_home / "NeuronVisionDisplay" / "config.json").read_text())
    assert payload["camera_index"] == 3
    assert payload["grok_model"] == "grok-vision-test"
    assert "grok_api_key" not in payload


def test_product_profile_path_round_trips(isolated_home) -> None:
    profile_path = isolated_home / "profile.json"
    settings = Settings.load().model_copy(update={"product_profile_path": profile_path})
    settings.save()

    loaded = Settings.load()

    assert loaded.product_profile_path == profile_path


def test_write_secrets_creates_file(isolated_home) -> None:
    path = write_secrets("xai-new-key")
    assert path.exists()
    contents = path.read_text()
    assert "GROK_API_KEY=xai-new-key" in contents


def test_write_secrets_replaces_existing(isolated_home) -> None:
    write_secrets("xai-old")
    write_secrets("xai-new")
    contents = (isolated_home / "NeuronVisionDisplay" / "secrets.env").read_text()
    assert "xai-old" not in contents
    assert "GROK_API_KEY=xai-new" in contents


def test_paths_helpers(isolated_home) -> None:
    assert paths_mod.app_root() == isolated_home / "NeuronVisionDisplay"
    paths_mod.ensure_app_dirs()
    new = paths_mod.new_session_dir("Demo Assembly!")
    assert new.exists()
    assert "Demo-Assembly" in new.name
