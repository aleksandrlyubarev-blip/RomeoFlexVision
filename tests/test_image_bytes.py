"""Путь инлайн-байтов изображения: state → perception → /inspect-клиент.

Роадмап (неделя 2, трек B): пайплайн должен принимать байты/base64 кадра,
а не только URI-строку, и /inspect должен вызывать реальный пайплайн.
"""

from __future__ import annotations

import asyncio
import base64
import json
from typing import Any

import pytest

from rhaef_v2.agents.roboqc.client import PipelineRoboQCClient
from rhaef_v2.agents.roboqc.nodes import _attach_image, perception_node
from rhaef_v2.agents.roboqc.state import RoboQCState
from rhaef_v2.core.model_router import ModelRouter
from rhaef_v2.tools.interfaces import InspectionRequest

# Настоящий минимальный JPEG (1x1, белый) — пайплайн обрабатывает реальные байты.
TINY_JPEG = base64.b64encode(
    bytes.fromhex(
        "ffd8ffe000104a46494600010100000100010000ffdb004300ffffffffffffffffffffffffffffffffffff"
        "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        "ffffffffffc00011080001000103012200021101031101ffc4001f000001050101010101010000000000"
        "00000102030405060708090a0bffc400b5100002010303020403050504040000017d0102030004110512"
        "2131410613516107227114328191a1082342b1c11552d1f02433627282090a161718191a25262728292a"
        "3435363738393a434445464748494a535455565758595a636465666768696a737475767778797a838485"
        "868788898a92939495969798999aa2a3a4a5a6a7a8a9aab2b3b4b5b6b7b8b9bac2c3c4c5c6c7c8c9cad2"
        "d3d4d5d6d7d8d9dae1e2e3e4e5e6e7e8e9eaf1f2f3f4f5f6f7f8f9faffda0008010100003f00fbfe80"
        "ffd9"
    )
).decode("ascii")


def _make_response(content: str) -> dict[str, Any]:
    return {"choices": [{"message": {"role": "assistant", "content": content}}]}


class _RecordingClient:
    """Скриптованный стаб, запоминающий kwargs каждого вызова."""

    def __init__(self, scripted: list[str]):
        self._queue = list(scripted)
        self.calls: list[dict[str, Any]] = []

    def __call__(self, **kwargs: Any) -> Any:
        self.calls.append(kwargs)
        if not self._queue:
            raise AssertionError("Стаб-клиент получил больше вызовов, чем ожидалось")
        return _make_response(self._queue.pop(0))


def test_inspection_request_requires_uri_or_bytes():
    with pytest.raises(ValueError):
        InspectionRequest(inspection_id="i-1")

    by_uri = InspectionRequest(inspection_id="i-2", image_uri="gs://frames/a.png")
    assert by_uri.image_b64 is None

    by_bytes = InspectionRequest(inspection_id="i-3", image_b64=TINY_JPEG)
    assert by_bytes.image_uri is None
    assert by_bytes.image_mime == "image/jpeg"


def test_attach_image_converts_last_user_message_to_multimodal():
    messages = [
        {"role": "system", "content": "ты инспектор"},
        {"role": "user", "content": "опиши кадр"},
    ]
    attached = _attach_image(messages, TINY_JPEG, "image/jpeg")

    assert attached[0]["content"] == "ты инспектор"
    parts = attached[1]["content"]
    assert parts[0] == {"type": "text", "text": "опиши кадр"}
    assert parts[1]["type"] == "image_url"
    assert parts[1]["image_url"]["url"] == f"data:image/jpeg;base64,{TINY_JPEG}"
    # Исходный список не мутируется.
    assert messages[1]["content"] == "опиши кадр"


def test_perception_node_sends_pixels_to_vision_model():
    client = _RecordingClient([json.dumps({"facts": [], "objects": [], "lighting": "ok"})])
    router = ModelRouter(client=client)
    state = RoboQCState(image_b64=TINY_JPEG, subject="PCB")

    asyncio.run(perception_node(state, router=router))

    sent = client.calls[0]["messages"]
    user_parts = [m["content"] for m in sent if m.get("role") == "user"][0]
    image_parts = [p for p in user_parts if isinstance(p, dict) and p.get("type") == "image_url"]
    assert image_parts, "vision-модель должна получить инлайн-кадр, а не только текст"
    assert image_parts[0]["image_url"]["url"].startswith("data:image/jpeg;base64,")


DEFECT_RUN = [
    json.dumps({"facts": ["винт A1 отсутствует"], "objects": ["PCB"], "lighting": "ровное"}),
    json.dumps({"hypotheses": [{"defect_class": "SCREW_MISSING", "confidence": 0.82, "why": "пустое отверстие"}]}),
    json.dumps({"next_step": "call_specialist", "args": {"defect_class": "SCREW_MISSING"}, "rationale": "ok"}),
    json.dumps({"verdict": "defect", "confidence": 0.9, "evidence": ["пустое отверстие A1"]}),
    json.dumps({"command": "reject", "args": {"bin": "reject"}, "defect_tag": "SCREW_MISSING"}),
    json.dumps({"decision": "accept"}),
]


def test_pipeline_client_runs_inspection_on_real_jpeg_bytes():
    client = _RecordingClient(DEFECT_RUN)
    pipeline = PipelineRoboQCClient(router=ModelRouter(client=client))
    request = InspectionRequest(inspection_id="insp-42", image_b64=TINY_JPEG, station_id="WC-07")

    result = asyncio.run(pipeline.run_check(request))

    assert result.inspection_id == "insp-42"
    assert result.overall_pass is False
    assert result.requires_hitl is False
    assert result.confidence == 0.9
    assert result.model_version == "rhaef-v2-roboqc-r1"
    assert [d.defect_class for d in result.defects] == ["SCREW_MISSING"]
    # Первый вызов (perception) получил именно пиксели.
    first_user = [m for m in client.calls[0]["messages"] if m.get("role") == "user"][0]
    assert any(
        isinstance(p, dict) and p.get("type") == "image_url" for p in first_user["content"]
    )


PASS_RUN = [
    json.dumps({"facts": ["всё на месте"], "objects": ["PCB"], "lighting": "ровное"}),
    json.dumps({"hypotheses": []}),
    json.dumps({"next_step": "accept", "args": {}, "rationale": "чисто"}),
    json.dumps({"command": "pick", "args": {}, "defect_tag": None}),
    json.dumps({"decision": "accept"}),
]


def test_pipeline_client_pass_verdict():
    pipeline = PipelineRoboQCClient(router=ModelRouter(client=_RecordingClient(PASS_RUN)))
    request = InspectionRequest(inspection_id="insp-43", image_b64=TINY_JPEG)

    result = asyncio.run(pipeline.run_check(request))

    assert result.overall_pass is True
    assert result.requires_hitl is False
    assert result.defects == ()
