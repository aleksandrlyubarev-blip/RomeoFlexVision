"""Tests for iteration-8 additions:

- VelmRoboQCClient (rhaef_v2 RoboQCClient Protocol implementation)
- build_velm_api_services factory
- CLI commands: roboqc-data velm, roboqc-data logic-qa
"""

from __future__ import annotations

import asyncio
import json

import pytest
from rhaef_v2.tools.interfaces import InspectionRequest, InspectionResult
from typer.testing import CliRunner

from roboqc_data.cli.main import app
from roboqc_data.inspection_client import (
    MODEL_VERSION,
    VelmRoboQCClient,
    _is_pass,
    _severity_to_confidence,
    build_velm_api_services,
)
from roboqc_data.logic.velm import (
    HeuristicVlmClassifier,
    RouterBackedVlmClassifier,
    VelmPipeline,
)
from roboqc_data.schema.taxonomy import DefectClass

runner = CliRunner()


# ---------- Helpers ---------------------------------------------------


@pytest.fixture
def _stub_litellm_cost(monkeypatch):
    import litellm

    monkeypatch.setattr(litellm, "completion_cost", lambda **_: 0.0)


class _FakeResponse:
    def __init__(self, content: str) -> None:
        choice = type("Choice", (), {"message": {"role": "assistant", "content": content}})()
        self.choices = [choice]
        self.model = "fake/test-model"


def _make_router(content: str):
    from rhaef_v2.core.model_router import ModelRouter

    return ModelRouter(client=lambda **_: _FakeResponse(content))


# ---------- VelmRoboQCClient -----------------------------------------


def test_velm_client_passes_clean_image_returns_ok_inspection_result():
    client = VelmRoboQCClient()
    payload = InspectionRequest(inspection_id="i1", image_uri="file:///station/clean.png")
    result = asyncio.run(client.run_check(payload))
    assert isinstance(result, InspectionResult)
    assert result.inspection_id == "i1"
    assert result.overall_pass is True
    assert result.model_version == MODEL_VERSION
    # When heuristic classifier returns OK, we surface a single ok defect.
    assert len(result.defects) == 1
    assert result.defects[0].defect_class == "ok"


def test_velm_client_critical_verdict_flips_requires_hitl(_stub_litellm_cost):
    router = _make_router(
        json.dumps(
            {
                "defect_class": "connector_damage",
                "severity": "critical",
                "rework": "Replace before next station.",
            }
        )
    )
    classifier = RouterBackedVlmClassifier(router=router)
    pipeline = VelmPipeline(classifier=classifier, score_threshold=0.4)
    client = VelmRoboQCClient(pipeline=pipeline)

    payload = InspectionRequest(inspection_id="i2", image_uri="file:///station/cm.png")
    result = asyncio.run(client.run_check(payload))
    assert result.overall_pass is False
    assert result.requires_hitl is True
    assert result.defects[0].defect_class == "connector_damage"
    assert result.defects[0].confidence > 0.0


def test_velm_client_cosmetic_verdict_passes_but_low_confidence_still_routes_hitl(_stub_litellm_cost):
    router = _make_router(
        json.dumps(
            {
                "defect_class": "connector_damage",
                "severity": "cosmetic",
                "rework": "",
            }
        )
    )
    classifier = RouterBackedVlmClassifier(router=router)
    pipeline = VelmPipeline(classifier=classifier, score_threshold=0.4)
    client = VelmRoboQCClient(pipeline=pipeline)

    payload = InspectionRequest(inspection_id="i3", image_uri="file:///station/scr.png")
    result = asyncio.run(client.run_check(payload))
    # Cosmetic-only -> overall_pass=True per VELM, but expert_score*factor < 0.85
    # so we still flag HITL. This is the conservative path.
    assert result.overall_pass is True
    assert result.requires_hitl is True


def test_severity_to_confidence_mapping():
    # Higher severity multiplies the expert score by a higher factor.
    score = 0.8
    assert _severity_to_confidence("critical", score) > _severity_to_confidence("major", score)
    assert _severity_to_confidence("major", score) > _severity_to_confidence("minor", score)
    assert _severity_to_confidence("minor", score) > _severity_to_confidence("cosmetic", score)
    assert _severity_to_confidence("cosmetic", score) > _severity_to_confidence("ok", score)
    assert 0.0 <= _severity_to_confidence("unknown_severity", score) <= 1.0


def test_is_pass_helper():
    assert _is_pass("ok") is True
    assert _is_pass("cosmetic") is True
    assert _is_pass("major") is False
    assert _is_pass("critical") is False


# ---------- build_velm_api_services factory --------------------------


def test_build_velm_api_services_returns_apiservices():
    services = build_velm_api_services()
    assert services is not None
    # roboqc_client should be a VelmRoboQCClient instance.
    assert isinstance(services.roboqc_client, VelmRoboQCClient)


def test_build_velm_api_services_accepts_custom_pipeline():
    pipeline = VelmPipeline(classifier=HeuristicVlmClassifier(), score_threshold=0.99)
    services = build_velm_api_services(pipeline=pipeline)
    assert services is not None
    assert services.roboqc_client.pipeline is pipeline


# ---------- CLI commands ---------------------------------------------


def test_cli_velm_command_runs_on_heuristic_path():
    result = runner.invoke(app, ["velm", "--image", "file:///station/x.png"])
    assert result.exit_code == 0, result.output
    payload = json.loads(result.output.strip().splitlines()[-1])
    assert payload["image_uri"] == "file:///station/x.png"
    assert payload["overall_pass"] is True
    assert isinstance(payload["verdicts"], list)


def test_cli_velm_score_threshold_filters_out_low_score_candidates():
    # Heuristic expert emits score=0.6; with --score-threshold 0.99 the
    # candidate is filtered and no verdicts are emitted.
    result = runner.invoke(
        app,
        ["velm", "--image", "file:///station/x.png", "--score-threshold", "0.99"],
    )
    assert result.exit_code == 0, result.output
    payload = json.loads(result.output.strip().splitlines()[-1])
    assert payload["verdicts"] == []
    assert payload["overall_pass"] is True


def test_cli_logic_qa_emits_checks_and_passes_on_heuristic():
    result = runner.invoke(
        app,
        [
            "logic-qa",
            "--ref",
            "file:///ref/a.png",
            "--ref",
            "file:///ref/b.png",
            "--test",
            "file:///test/x.png",
        ],
    )
    assert result.exit_code == 0, result.output
    payload = json.loads(result.output.strip().splitlines()[-1])
    assert payload["test_image_uri"] == "file:///test/x.png"
    assert payload["overall_pass"] is True
    assert payload["defect_class"] == DefectClass.WRONG_ROUTING.value
    # Heuristic synthesise returns a non-empty checklist.
    assert len(payload["checks"]) >= 1
