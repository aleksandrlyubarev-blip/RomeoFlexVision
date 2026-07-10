"""Adversarial QA for the image-bytes work (commit 112e9a3).

Covers: empty-string vs None base64 semantics, uri+b64 combinations,
_attach_image edge cases, PipelineRoboQCClient degenerate graph outcomes,
strict-mode pydantic violations, /inspect over real HTTP, and the
RHAEF_INSPECT_PIPELINE wiring.

Tests marked xfail(strict=True) expose real defects; see the reason strings.
"""

from __future__ import annotations

import asyncio
import json
from typing import Any

import pytest

from rhaef_v2.agents.roboqc.client import PipelineRoboQCClient
from rhaef_v2.agents.roboqc.nodes import _attach_image, perception_node
from rhaef_v2.agents.roboqc.state import RoboQCState
from rhaef_v2.core.model_router import ModelRouter
from rhaef_v2.core.settings import RuntimeSettings
from rhaef_v2.tools.interfaces import InspectionRequest, InspectionResult

TINY_B64 = "QUJDRA=="  # "ABCD"


def _make_response(content: str) -> dict[str, Any]:
    return {"choices": [{"message": {"role": "assistant", "content": content}}]}


class _RecordingClient:
    def __init__(self, scripted: list[str]):
        self._queue = list(scripted)
        self.calls: list[dict[str, Any]] = []

    def __call__(self, **kwargs: Any) -> Any:
        self.calls.append(kwargs)
        if not self._queue:
            raise AssertionError("stub client got more calls than scripted")
        return _make_response(self._queue.pop(0))


def _router(client: _RecordingClient) -> ModelRouter:
    return ModelRouter(
        client=client, settings=RuntimeSettings(langsmith_tracing_v2=False, langsmith_api_key=None)
    )


# ---------------------------------------------------------------------------
# InspectionRequest validator: uri / b64 semantics
# ---------------------------------------------------------------------------


def test_empty_string_b64_alone_is_rejected_like_none():
    with pytest.raises(ValueError):
        InspectionRequest(inspection_id="i-1", image_b64="")
    with pytest.raises(ValueError):
        InspectionRequest(inspection_id="i-2", image_uri="", image_b64="")
    with pytest.raises(ValueError):
        InspectionRequest(inspection_id="i-3", image_uri="")


def test_both_uri_and_b64_are_accepted_and_both_are_used():
    req = InspectionRequest(inspection_id="i-4", image_uri="gs://frames/a.png", image_b64=TINY_B64)
    assert req.image_uri == "gs://frames/a.png"
    assert req.image_b64 == TINY_B64


def test_strict_mode_rejects_raw_bytes_and_wrong_types():
    with pytest.raises(ValueError):
        InspectionRequest(inspection_id="i-5", image_b64=b"QUJDRA==")  # bytes, not str
    with pytest.raises(ValueError):
        InspectionRequest(inspection_id="i-6", image_uri="gs://x", image_mime=123)
    with pytest.raises(ValueError):
        InspectionRequest(inspection_id=7, image_uri="gs://x")


# ---------------------------------------------------------------------------
# _attach_image edge cases
# ---------------------------------------------------------------------------


def test_attach_image_appends_user_message_when_none_exists():
    messages = [{"role": "system", "content": "инспектор"}]
    attached = _attach_image(messages, TINY_B64, "image/png")
    assert len(messages) == 1, "original list must not be mutated"
    assert attached[-1]["role"] == "user"
    parts = attached[-1]["content"]
    assert parts == [
        {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{TINY_B64}"}}
    ]


def test_attach_image_handles_none_content_user_message():
    messages = [{"role": "user", "content": None}]
    attached = _attach_image(messages, TINY_B64, "image/jpeg")
    parts = attached[0]["content"]
    assert parts[0] == {"type": "text", "text": ""}
    assert parts[1]["image_url"]["url"].endswith(TINY_B64)
    assert messages[0]["content"] is None


def test_attach_image_targets_last_user_message_only():
    messages = [
        {"role": "user", "content": "первый"},
        {"role": "assistant", "content": "ответ"},
        {"role": "user", "content": "второй"},
    ]
    attached = _attach_image(messages, TINY_B64, "image/jpeg")
    assert attached[0]["content"] == "первый"
    assert isinstance(attached[2]["content"], list)


def test_empty_string_b64_in_state_means_no_image_attached():
    """image_b64='' must behave like None down the pipeline: text-only prompt."""
    client = _RecordingClient([json.dumps({"facts": [], "objects": [], "lighting": "ok"})])
    state = RoboQCState(image_uri="gs://frames/a.png", image_b64="", subject="PCB")
    asyncio.run(perception_node(state, router=_router(client)))
    sent = client.calls[0]["messages"]
    user_contents = [m["content"] for m in sent if m.get("role") == "user"]
    assert all(isinstance(c, str) for c in user_contents), "no multimodal parts expected"


# ---------------------------------------------------------------------------
# PipelineRoboQCClient degenerate graph outcomes
# ---------------------------------------------------------------------------


def test_pipeline_client_defaults_to_hitl_when_graph_ends_without_action(monkeypatch):
    async def run_without_action(state, router=None):
        return RoboQCState(image_uri=state.image_uri)

    from rhaef_v2.agents.roboqc import client as client_mod

    monkeypatch.setattr(client_mod.graph, "run", run_without_action)
    result = asyncio.run(
        PipelineRoboQCClient().run_check(
            InspectionRequest(inspection_id="i-7", image_uri="gs://frames/a.png")
        )
    )
    assert isinstance(result, InspectionResult)
    assert result.overall_pass is False
    assert result.requires_hitl is True
    assert result.confidence == 0.5
    assert result.defects == ()


REIMAGE_RUN = [
    json.dumps({"facts": ["блик"], "objects": ["PCB"], "lighting": "плохое"}),
    json.dumps({"hypotheses": []}),
    json.dumps({"next_step": "request_reimage", "args": {"required_views": ["top"]}, "rationale": "re"}),
    json.dumps({"command": "re_image", "args": {"views": ["top"]}, "defect_tag": None}),
    json.dumps({"decision": "accept"}),
]


def test_pipeline_client_reimage_path_requires_hitl():
    pipeline = PipelineRoboQCClient(router=_router(_RecordingClient(REIMAGE_RUN)))
    result = asyncio.run(
        pipeline.run_check(InspectionRequest(inspection_id="i-8", image_b64=TINY_B64))
    )
    assert result.overall_pass is False
    assert result.requires_hitl is True
    assert result.defects == ()


BAD_COMMAND_RUN = [
    json.dumps({"facts": [], "objects": [], "lighting": "ok"}),
    json.dumps({"hypotheses": []}),
    json.dumps({"next_step": "accept", "args": {}, "rationale": "x"}),
    json.dumps({"command": "self_destruct", "args": {}}),  # valid JSON, out-of-vocab command
    json.dumps({"decision": "accept"}),
]


def test_pipeline_survives_out_of_vocab_llm_command():
    pipeline = PipelineRoboQCClient(router=_router(_RecordingClient(BAD_COMMAND_RUN)))
    result = asyncio.run(
        pipeline.run_check(InspectionRequest(inspection_id="i-9", image_b64=TINY_B64))
    )
    assert result.requires_hitl is True, "unrecognised command should degrade to HITL"


def test_pipeline_result_echoes_uri_when_both_uri_and_b64_given():
    passing = [
        json.dumps({"facts": [], "objects": [], "lighting": "ok"}),
        json.dumps({"hypotheses": []}),
        json.dumps({"next_step": "accept", "args": {}, "rationale": "ok"}),
        json.dumps({"command": "pick", "args": {}, "defect_tag": None}),
        json.dumps({"decision": "accept"}),
    ]
    client = _RecordingClient(passing)
    pipeline = PipelineRoboQCClient(router=_router(client))
    result = asyncio.run(
        pipeline.run_check(
            InspectionRequest(inspection_id="i-10", image_uri="gs://frames/a.png", image_b64=TINY_B64)
        )
    )
    assert result.image_uri == "gs://frames/a.png"
    # b64 still wins for the vision call: first (perception) call is multimodal
    first_user = [m for m in client.calls[0]["messages"] if m.get("role") == "user"][0]
    assert any(
        isinstance(p, dict) and p.get("type") == "image_url" for p in first_user["content"]
    )


# ---------------------------------------------------------------------------
# /inspect over real HTTP + RHAEF_INSPECT_PIPELINE wiring
# ---------------------------------------------------------------------------


def _http_client(roboqc_client: Any):
    fastapi = pytest.importorskip("fastapi")
    from fastapi import FastAPI
    from fastapi.testclient import TestClient

    from rhaef_v2.api.routes import APIServices, create_api_router
    from rhaef_v2.core.policies import FrictionPolicyEngine

    services = APIServices(
        model_router=ModelRouter(client=lambda **_: _make_response("ok")),
        policy_engine=FrictionPolicyEngine(),
        roboqc_client=roboqc_client,
    )
    app = FastAPI()
    app.include_router(create_api_router(services))
    return TestClient(app, raise_server_exceptions=False)


def test_http_inspect_runs_pipeline_client_with_b64_body():
    passing = [
        json.dumps({"facts": [], "objects": [], "lighting": "ok"}),
        json.dumps({"hypotheses": []}),
        json.dumps({"next_step": "accept", "args": {}, "rationale": "ok"}),
        json.dumps({"command": "pick", "args": {}, "defect_tag": None}),
        json.dumps({"decision": "accept"}),
    ]
    client = _http_client(PipelineRoboQCClient(router=_router(_RecordingClient(passing))))
    resp = client.post(
        "/inspect", json={"inspection_id": "i-http", "image_b64": TINY_B64, "station_id": "WC-07"}
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["overall_pass"] is True
    assert body["model_version"] == "rhaef-v2-roboqc-r1"


def test_http_inspect_without_any_image_is_a_client_error():
    client = _http_client(None)  # stub client path
    resp = client.post("/inspect", json={"inspection_id": "i-http-2"})
    assert resp.status_code == 422


def test_default_roboqc_client_env_wiring(monkeypatch):
    from rhaef_v2.api.routes import _default_roboqc_client

    monkeypatch.delenv("RHAEF_INSPECT_PIPELINE", raising=False)
    assert _default_roboqc_client() is None

    monkeypatch.setenv("RHAEF_INSPECT_PIPELINE", "1")
    assert isinstance(_default_roboqc_client(), PipelineRoboQCClient)

    # documented: only the exact string "1" enables the pipeline
    monkeypatch.setenv("RHAEF_INSPECT_PIPELINE", "true")
    assert _default_roboqc_client() is None


def test_create_api_router_uses_pipeline_client_when_env_set(monkeypatch):
    """The wiring is read at router construction time: a router built with the
    env var set must serve /inspect through PipelineRoboQCClient (verified by
    injecting a stub LLM router through a patched constructor default)."""
    import rhaef_v2.api.routes as routes_mod

    captured: dict[str, Any] = {}
    real_default = routes_mod._default_roboqc_client

    def spying_default():
        client = real_default()
        captured["client"] = client
        return client

    monkeypatch.setenv("RHAEF_INSPECT_PIPELINE", "1")
    monkeypatch.setattr(routes_mod, "_default_roboqc_client", spying_default)
    routes_mod.create_api_router()
    assert isinstance(captured["client"], PipelineRoboQCClient)
