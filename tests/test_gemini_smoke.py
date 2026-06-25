"""Tests for the production Gemini smoke-check used by /healthz/gemini.

No network: a fake completion client stands in for litellm. Covers the happy path
(Gemini actually answers -> ok) and the silent-fallback path (Vertex fails, router
drops to a non-Gemini model -> degraded), which is the case the deployed health
probe exists to catch.
"""

from __future__ import annotations

import asyncio
from typing import Any

import pytest

from rhaef_v2.core.graph import gemini_smoke_check
from rhaef_v2.core.model_router import ModelRouter


def _response(model: str, content: str = "pong") -> Any:
    choice = type("Choice", (), {"message": {"role": "assistant", "content": content}})()
    return type("Resp", (), {"model": model, "choices": [choice]})()


@pytest.fixture(autouse=True)
def _clear_override(monkeypatch: pytest.MonkeyPatch) -> None:
    # Keep the resolved model deterministic regardless of the runner's environment.
    monkeypatch.delenv("RHAEF_GEMINI_MODEL", raising=False)


def test_smoke_ok_when_gemini_answers() -> None:
    def client(**_: Any) -> Any:
        return _response("vertex_ai/gemini-2.5-flash")

    result = asyncio.run(gemini_smoke_check(ModelRouter(client=client)))
    assert result["status"] == "ok"
    assert result["gemini_used"] is True
    assert result["answered_model"] == "vertex_ai/gemini-2.5-flash"
    assert result["reply"] == "pong"


def test_smoke_degraded_on_silent_fallback() -> None:
    calls: list[str] = []

    def client(**kwargs: Any) -> Any:
        model = kwargs["model"]
        calls.append(model)
        if model.startswith("vertex_ai/"):
            raise RuntimeError("vertex unreachable")
        return _response(model)

    result = asyncio.run(gemini_smoke_check(ModelRouter(client=client)))
    # Router fell back vertex_ai/gemini-2.5-flash -> qwen/qwen3.6-plus.
    assert calls[0].startswith("vertex_ai/")
    assert result["status"] == "degraded"
    assert result["gemini_used"] is False
    assert "gemini" not in result["answered_model"].lower()


def test_smoke_uses_override_model(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("RHAEF_GEMINI_MODEL", "vertex_ai/gemini-2.5-pro")
    seen: list[str] = []

    def client(**kwargs: Any) -> Any:
        seen.append(kwargs["model"])
        return _response(kwargs["model"])

    result = asyncio.run(gemini_smoke_check(ModelRouter(client=client)))
    assert seen == ["vertex_ai/gemini-2.5-pro"]
    assert result["requested_model"] == "vertex_ai/gemini-2.5-pro"
    assert result["status"] == "ok"
