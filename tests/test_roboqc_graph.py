"""End-to-end smoke-тест LangGraph-пайплайна RoboQC.

Использует stub-клиент в ModelRouter — без сети. Покрывает perception -> scene -> planner ->
specialist -> action -> critic и retry-ветку.
"""

from __future__ import annotations

import asyncio
import json
from typing import Any

import pytest

from rhaef_v2.agents.roboqc.graph import run
from rhaef_v2.agents.roboqc.state import RoboQCState
from rhaef_v2.core.model_router import ModelRouter


def _make_response(content: str) -> dict[str, Any]:
    return {"choices": [{"message": {"role": "assistant", "content": content}}]}


class _StubClient:
    """Возвращает заготовленный JSON в порядке вызовов."""

    def __init__(self, scripted: list[str]):
        self._queue = list(scripted)

    def __call__(self, **_: Any) -> Any:
        if not self._queue:
            raise AssertionError("Стаб-клиент получил больше вызовов, чем ожидалось")
        return _make_response(self._queue.pop(0))


HAPPY_PATH = [
    json.dumps({"facts": ["винт A1 отсутствует"], "objects": ["PCB"], "lighting": "ровное"}),
    json.dumps({"hypotheses": [{"defect_class": "SCREW_MISSING", "confidence": 0.82, "why": "пустое отверстие"}]}),
    json.dumps({"next_step": "call_specialist", "args": {"defect_class": "SCREW_MISSING"}, "rationale": "высокая confidence"}),
    json.dumps({"verdict": "defect", "confidence": 0.9, "evidence": ["пустое крепёжное отверстие в A1"]}),
    json.dumps({"command": "reject", "args": {"bin": "reject"}, "defect_tag": "SCREW_MISSING"}),
    json.dumps({"decision": "accept"}),
]


def _stub_router(script: list[str]) -> ModelRouter:
    client = _StubClient(script)
    return ModelRouter(client=client)


def test_roboqc_pipeline_happy_path():
    router = _stub_router(HAPPY_PATH)
    state = RoboQCState(image_uri="gs://fixtures/screw_01.png", subject="PCB", workcell_id="WC-12")
    final = asyncio.run(run(state, router=router))
    assert final.action is not None
    assert final.action.command == "reject"
    assert final.action.defect_tag == "SCREW_MISSING"
    assert final.specialist is not None
    assert final.specialist.verdict == "defect"
    assert final.critic and final.critic.decision == "accept"
    assert final.retries == 0


RETRY_THEN_ACCEPT = [
    # Первый проход: critic выдаёт retry.
    json.dumps({"facts": ["слабое освещение"], "objects": ["PCB"], "lighting": "плохое"}),
    json.dumps({"hypotheses": [{"defect_class": "SCREW_MISSING", "confidence": 0.45, "why": "не видно"}]}),
    json.dumps({"next_step": "emit_action", "args": {}, "rationale": "низкая confidence, но пропускаем"}),
    # specialist не вызывается, т.к. next_step != call_specialist.
    json.dumps({"command": "pick", "args": {}, "defect_tag": None}),
    json.dumps({"decision": "retry", "reason": "низкая confidence", "suggestion": "запроси re_image"}),
    # Второй проход: planner -> specialist -> action -> critic accept.
    json.dumps({"next_step": "request_reimage", "args": {"required_views": ["top", "side"]}, "rationale": "нужен лучший кадр"}),
    json.dumps({"command": "re_image", "args": {"views": ["top", "side"]}, "defect_tag": None}),
    json.dumps({"decision": "accept"}),
]


def test_roboqc_pipeline_retry_loop():
    router = _stub_router(RETRY_THEN_ACCEPT)
    state = RoboQCState(image_uri="gs://fixtures/dark_01.png", max_retries=2)
    final = asyncio.run(run(state, router=router))
    assert final.action is not None
    assert final.action.command == "re_image"
    assert final.retries == 1
    assert final.critic and final.critic.decision == "accept"


def test_sglang_backend_requires_base_url(monkeypatch):
    """build_sglang_client падает, если ни параметр, ни env не заданы."""
    from rhaef_v2.core.backends.sglang import build_sglang_client

    monkeypatch.delenv("SGLANG_BASE_URL", raising=False)
    monkeypatch.delenv("SGLANG_VISION_BASE_URL", raising=False)
    try:
        with pytest.raises(RuntimeError):
            build_sglang_client()
    except RuntimeError as exc:
        # либо litellm не установлен — тоже приемлемый исход, тест проверяет fail-fast.
        assert "SGLang" in str(exc) or "litellm" in str(exc)
