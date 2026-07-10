"""Engine selection + local-engine-unavailable boundary.

Covers the gap called out in the roadmap: GemmaEngine is a NotImplementedError
placeholder, and the app must degrade gracefully (no crash, an 'unknown'
CaptureResult) whenever the selected engine is missing, unavailable, or raises.
All mock-based; no network, no camera, no visible GUI (offscreen Qt).
"""

from __future__ import annotations

import os

# Must be set before the first PyQt6 import in this process for headless CI.
os.environ.setdefault("QT_QPA_PLATFORM", "offscreen")

import pytest
from pydantic import SecretStr

from checker.config.settings import Settings
from checker.inference.ai_engine import AIEngine, CaptureResult
from checker.inference.gemma_engine import GemmaEngine
from checker.inference.grok_engine import GrokEngine
from checker.inference.inference_thread import InferenceWorker
from checker.ui.main_window import _build_engine


class _RaisingEngine(AIEngine):
    name = "raising"

    def __init__(self, exc: Exception) -> None:
        self._exc = exc

    def analyze(self, jpeg_bytes: bytes, prompt: str) -> CaptureResult:
        raise self._exc


def _collect(worker: InferenceWorker) -> tuple[list[tuple[str, object]], list[bool]]:
    results: list[tuple[str, object]] = []
    busy_events: list[bool] = []
    worker.inference_done.connect(lambda cid, res: results.append((cid, res)))
    worker.busy_changed.connect(busy_events.append)
    return results, busy_events


# ------------------------- GemmaEngine placeholder contract -------------------------


def test_gemma_engine_is_flagged_unavailable() -> None:
    assert GemmaEngine.available is False
    assert GemmaEngine.name == "gemma"


def test_gemma_engine_analyze_raises_not_implemented() -> None:
    engine = GemmaEngine()
    with pytest.raises(NotImplementedError, match="v0.2"):
        engine.analyze(b"\xff\xd8fake", "prompt")


# ------------------------- _build_engine selection -------------------------


def test_build_engine_grok_with_key_returns_grok() -> None:
    settings = Settings(grok_api_key=SecretStr("xai-test"), grok_model="grok-vision-x")
    engine = _build_engine(settings)
    assert isinstance(engine, GrokEngine)
    assert engine.name == "grok"


def test_build_engine_grok_without_key_returns_none() -> None:
    settings = Settings(grok_api_key=None)
    assert _build_engine(settings) is None


def test_build_engine_gemma_returns_none_not_gemma_instance() -> None:
    """v0.1 must never wire the placeholder engine, even if config says gemma."""
    settings = Settings(engine="gemma", grok_api_key=SecretStr("xai-test"))
    assert _build_engine(settings) is None


def test_build_engine_gemma_without_key_returns_none() -> None:
    settings = Settings(engine="gemma", grok_api_key=None)
    assert _build_engine(settings) is None


# ------------------------- InferenceWorker fault containment -------------------------


def _write_jpeg(tmp_path) -> str:
    p = tmp_path / "capture.jpg"
    p.write_bytes(b"\xff\xd8\xff\xe0fake-jpeg")
    return str(p)


def test_worker_contains_not_implemented_from_gemma(tmp_path) -> None:
    """If a future regression wires GemmaEngine in, submit() must not crash."""
    worker = InferenceWorker(GemmaEngine())
    results, busy_events = _collect(worker)

    worker.submit("001", _write_jpeg(tmp_path), "prompt")

    assert len(results) == 1
    capture_id, result = results[0]
    assert capture_id == "001"
    assert isinstance(result, CaptureResult)
    assert result.verdict == "unknown"
    assert result.confidence == 0.0
    assert "Engine error" in result.notes
    assert result.engine == "gemma"
    # busy flag must be released even on failure
    assert busy_events == [True, False]


def test_worker_contains_arbitrary_engine_exception(tmp_path) -> None:
    worker = InferenceWorker(_RaisingEngine(RuntimeError("model weights missing")))
    results, _ = _collect(worker)

    worker.submit("002", _write_jpeg(tmp_path), "prompt")

    assert len(results) == 1
    _, result = results[0]
    assert result.verdict == "unknown"
    assert "model weights missing" in result.notes
    assert result.engine == "raising"


def test_worker_contains_missing_capture_file(tmp_path) -> None:
    worker = InferenceWorker(GemmaEngine())
    results, busy_events = _collect(worker)

    worker.submit("003", str(tmp_path / "does_not_exist.jpg"), "prompt")

    assert len(results) == 1
    _, result = results[0]
    assert result.verdict == "unknown"
    assert "Engine error" in result.notes
    assert busy_events == [True, False]


def test_worker_recovers_after_engine_failure(tmp_path, canned_engine) -> None:
    """A failed analyze() must not leave the worker stuck busy."""
    worker = InferenceWorker(GemmaEngine())
    results, _ = _collect(worker)
    jpeg = _write_jpeg(tmp_path)

    worker.submit("004", jpeg, "prompt")
    worker.set_engine(canned_engine)
    worker.submit("005", jpeg, "prompt")

    assert [cid for cid, _ in results] == ["004", "005"]
    assert results[0][1].verdict == "unknown"
    assert results[1][1].verdict == "pass"
    assert results[1][1].engine == "canned"
