"""Unit-тесты для рантайма AI-сотрудника LarmorSight (app.py)."""
from __future__ import annotations

import json
import logging
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

import app


@pytest.fixture(autouse=True)
def _clear_caches():
    """Каждый тест видит свежий system_prompt / skill_sections / anthropic_client."""
    app._skill_sections.cache_clear()
    app.system_prompt.cache_clear()
    app.anthropic_client.cache_clear()
    yield
    app._skill_sections.cache_clear()
    app.system_prompt.cache_clear()
    app.anthropic_client.cache_clear()


@pytest.fixture
def client() -> TestClient:
    return TestClient(app.app)


def test_root_metadata(client: TestClient) -> None:
    resp = client.get("/")
    assert resp.status_code == 200
    body = resp.json()
    assert body["service"] == "larmorsight-employee"
    assert body["employee"] == "research-analyst"
    assert body["model"] == "claude-opus-4-7"
    assert "GET /healthz" in body["endpoints"]
    assert "POST /run" in body["endpoints"]


def test_healthz(client: TestClient) -> None:
    resp = client.get("/healthz")
    assert resp.status_code == 200
    assert resp.json() == {"ok": True, "employee": "research-analyst"}


def test_system_prompt_without_skill_warns_operator() -> None:
    prompt = app.system_prompt()
    # роль и базовая инструкция всегда присутствуют
    assert "research-analyst" in prompt
    assert "AI-сотрудник LarmorSight" in prompt
    # без подключённого GCS секций нет → есть явная пометка для оператора
    assert "не загружен" in prompt


def test_run_validates_input(client: TestClient) -> None:
    # пустая задача → 422 от pydantic (min_length=1)
    resp = client.post("/run", json={"task": ""})
    assert resp.status_code == 422


def test_run_uses_prompt_caching_and_adaptive_thinking(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    """POST /run должен звать Anthropic SDK с кэшируемым system и adaptive thinking."""
    captured: dict = {}

    fake_message = SimpleNamespace(
        content=[SimpleNamespace(type="text", text="ответ сотрудника")],
        model="claude-opus-4-7",
        stop_reason="end_turn",
        usage=SimpleNamespace(
            model_dump=lambda: {
                "input_tokens": 10,
                "output_tokens": 5,
                "cache_creation_input_tokens": 0,
                "cache_read_input_tokens": 0,
            }
        ),
    )

    stream_cm = MagicMock()
    stream_cm.__enter__.return_value.get_final_message.return_value = fake_message
    stream_cm.__exit__.return_value = False

    def fake_stream(**kwargs):
        captured.update(kwargs)
        return stream_cm

    fake_client = MagicMock()
    fake_client.messages.stream.side_effect = fake_stream
    monkeypatch.setattr(app, "anthropic_client", lambda: fake_client)

    resp = client.post(
        "/run",
        json={
            "task": "Сделай экспресс-скан LarmorSight",
            "context": "Источник: pitch-deck.md",
        },
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["output"] == "ответ сотрудника"
    assert body["model"] == "claude-opus-4-7"
    assert body["stop_reason"] == "end_turn"
    assert body["usage"]["input_tokens"] == 10

    # promp caching: system — список из одного text-блока с cache_control: ephemeral
    assert isinstance(captured["system"], list) and len(captured["system"]) == 1
    sys_block = captured["system"][0]
    assert sys_block["type"] == "text"
    assert sys_block["cache_control"] == {"type": "ephemeral"}
    assert "research-analyst" in sys_block["text"]

    # adaptive thinking по умолчанию (LARMORSIGHT_THINKING="adaptive")
    assert captured["thinking"] == {"type": "adaptive"}

    # модель, max_tokens и пользовательское сообщение
    assert captured["model"] == "claude-opus-4-7"
    assert captured["max_tokens"] >= 256
    user_msg = captured["messages"][0]
    assert user_msg["role"] == "user"
    assert "экспресс-скан" in user_msg["content"]
    assert "Источник: pitch-deck.md" in user_msg["content"]


def test_json_formatter_serializes_extras() -> None:
    record = logging.LogRecord(
        name="larmorsight.employee",
        level=logging.INFO,
        pathname=__file__,
        lineno=1,
        msg="run completed",
        args=(),
        exc_info=None,
    )
    record.employee = "research-analyst"
    record.elapsed_ms = 1234
    record.input_tokens = 100
    out = app._JsonFormatter().format(record)
    payload = json.loads(out)
    assert payload["severity"] == "INFO"
    assert payload["message"] == "run completed"
    assert payload["logger"] == "larmorsight.employee"
    assert payload["employee"] == "research-analyst"
    assert payload["elapsed_ms"] == 1234
    assert payload["input_tokens"] == 100
    # стандартные поля LogRecord не утекают как поля payload
    assert "args" not in payload
    assert "msg" not in payload


def test_run_max_tokens_override(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    captured: dict = {}

    fake_message = SimpleNamespace(
        content=[SimpleNamespace(type="text", text="ok")],
        model="claude-opus-4-7",
        stop_reason="end_turn",
        usage=SimpleNamespace(model_dump=lambda: {}),
    )
    stream_cm = MagicMock()
    stream_cm.__enter__.return_value.get_final_message.return_value = fake_message

    def fake_stream(**kwargs):
        captured.update(kwargs)
        return stream_cm

    fake_client = MagicMock()
    fake_client.messages.stream.side_effect = fake_stream
    monkeypatch.setattr(app, "anthropic_client", lambda: fake_client)

    resp = client.post("/run", json={"task": "test", "max_tokens": 2048})
    assert resp.status_code == 200
    assert captured["max_tokens"] == 2048
