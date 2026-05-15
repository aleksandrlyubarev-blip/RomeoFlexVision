"""Tests for iteration-9 additions:

- ConformalPredictor (calibrate + decide + threshold property)
- VelmRoboQCClient with calibrated predictor overrides hard-coded threshold
- Triton deployment template loads + structurally validates
- End-to-end: VelmRoboQCClient -> rhaef_v2 /inspect via build_velm_api_services
"""

from __future__ import annotations

import asyncio
from pathlib import Path

import pytest
import yaml
from rhaef_v2.api.routes import run_inspection
from rhaef_v2.tools.interfaces import InspectionRequest

from roboqc_data.calibration.conformal import (
    ConformalConfig,
    ConformalPredictor,
)
from roboqc_data.inspection_client import VelmRoboQCClient, build_velm_api_services
from roboqc_data.logic.velm import VelmPipeline

# ---------- ConformalPredictor ----------------------------------------


def test_conformal_predictor_calibrate_returns_threshold():
    predictor = ConformalPredictor(ConformalConfig(alpha=0.1))
    confidences = [0.95, 0.92, 0.88, 0.90, 0.93, 0.85, 0.91, 0.94, 0.89, 0.96]
    threshold = predictor.calibrate(confidences)
    assert 0.0 <= threshold <= 1.0
    assert predictor.is_calibrated
    assert predictor.n_calibration == len(confidences)


def test_conformal_predictor_rejects_empty_calibration():
    with pytest.raises(ValueError, match="non-empty"):
        ConformalPredictor().calibrate([])


def test_conformal_predictor_decide_routes_low_confidence_to_hitl():
    predictor = ConformalPredictor(ConformalConfig(alpha=0.1))
    # All calibration confidences high → low non-conformity → low threshold.
    predictor.calibrate([0.95] * 20)
    # 0.50 is far below threshold so requires HITL.
    decision_low = predictor.decide(0.50)
    assert decision_low.requires_hitl is True
    # 0.99 is above threshold so passes.
    decision_high = predictor.decide(0.99)
    assert decision_high.requires_hitl is False


def test_conformal_predictor_floor_threshold_clamps():
    predictor = ConformalPredictor(ConformalConfig(alpha=0.5, floor_threshold=0.10))
    predictor.calibrate([0.80, 0.85, 0.90])
    # floor_threshold caps the routing threshold from above.
    assert predictor.threshold <= 0.10


def test_conformal_predictor_threshold_unset_until_calibrated():
    predictor = ConformalPredictor()
    with pytest.raises(RuntimeError, match="calibrate"):
        _ = predictor.threshold


def test_conformal_predictor_rejects_out_of_range_confidence():
    predictor = ConformalPredictor()
    predictor.calibrate([0.9, 0.95])
    with pytest.raises(ValueError, match="\\[0,1\\]"):
        predictor.decide(1.5)


# ---------- VelmRoboQCClient with predictor ---------------------------


def test_velm_client_uses_predictor_threshold_over_hardcoded():
    # Predictor calibrated on *low-but-correct* confidences. The model
    # is consistently unsure but right — non-conformity is high, so the
    # routing threshold drops to ~0.2 and our heuristic pipeline's
    # confidence (0.30) clears it. The hard-coded 0.85 path would have
    # flagged this same prediction as HITL.
    predictor = ConformalPredictor(ConformalConfig(alpha=0.05))
    predictor.calibrate([0.20] * 50)
    assert predictor.threshold < 0.30  # sanity: predictor is permissive here
    client = VelmRoboQCClient(predictor=predictor)
    payload = InspectionRequest(inspection_id="x", image_uri="file:///station/x.png")
    result = asyncio.run(client.run_check(payload))
    assert result.overall_pass is True
    assert result.requires_hitl is False, (
        f"predictor threshold={predictor.threshold:.3f}, confidence={result.confidence:.3f}; "
        "expected confidence ≥ threshold so no HITL"
    )


def test_velm_client_predictor_strict_calibration_flags_low_confidence():
    # Mirror case: predictor calibrated on highly-confident correct
    # predictions has a tight routing threshold (~0.99). The heuristic
    # pipeline's 0.30 confidence is therefore flagged for HITL even
    # though the hard-coded path would also flag it. Confirms the
    # predictor is honoured, not just used as a no-op.
    predictor = ConformalPredictor(ConformalConfig(alpha=0.05))
    predictor.calibrate([0.99] * 50)
    assert predictor.threshold > 0.95
    client = VelmRoboQCClient(predictor=predictor)
    payload = InspectionRequest(inspection_id="strict", image_uri="file:///station/x.png")
    result = asyncio.run(client.run_check(payload))
    assert result.requires_hitl is True


def test_velm_client_predictor_never_overrides_overall_pass_false():
    # Even with a generous predictor, a failing overall_pass forces HITL.
    predictor = ConformalPredictor(ConformalConfig(alpha=0.001))
    predictor.calibrate([0.99, 0.99])

    class _FailExpert:
        score: float = 0.99

        def candidates(self, image_uri):
            from roboqc_data.logic.velm import AnomalyCandidate
            from roboqc_data.schema.records import BBox

            return [
                AnomalyCandidate(
                    crop_uri=image_uri,
                    bbox=BBox(x=0.0, y=0.0, w=1.0, h=1.0, image_w=1, image_h=1),
                    score=0.99,
                )
            ]

    class _FailClassifier:
        async def classify(self, candidate, allowed_classes):
            from roboqc_data.logic.velm import VelmVerdict
            from roboqc_data.schema.taxonomy import DefectClass

            return VelmVerdict(
                candidate=candidate,
                defect_class=DefectClass.LEAK,
                severity="critical",
                rework="STOP THE LINE",
            )

    pipeline = VelmPipeline(
        expert=_FailExpert(),
        classifier=_FailClassifier(),
        score_threshold=0.4,
    )
    client = VelmRoboQCClient(pipeline=pipeline, predictor=predictor)
    payload = InspectionRequest(inspection_id="leak", image_uri="file:///station/leak.png")
    result = asyncio.run(client.run_check(payload))
    assert result.overall_pass is False
    assert result.requires_hitl is True


# ---------- build_velm_api_services with predictor --------------------


def test_build_velm_api_services_accepts_predictor():
    predictor = ConformalPredictor()
    predictor.calibrate([0.9, 0.95, 0.92])
    services = build_velm_api_services(predictor=predictor)
    assert services is not None
    assert services.roboqc_client.predictor is predictor


# ---------- E2E: rhaef_v2 /inspect through VELM-backed services -------


@pytest.fixture
def _stub_litellm_cost(monkeypatch):
    import litellm

    monkeypatch.setattr(litellm, "completion_cost", lambda **_: 0.0)


def test_e2e_rhaef_v2_inspect_through_velm_services(_stub_litellm_cost):
    """Full path: build_velm_api_services -> run_inspection -> InspectionResult."""
    services = build_velm_api_services()
    payload = InspectionRequest(inspection_id="e2e-1", image_uri="file:///station/e2e.png")
    result = asyncio.run(run_inspection(payload, services))
    assert result.inspection_id == "e2e-1"
    # Heuristic VELM stays in overall_pass=True territory.
    assert result.overall_pass is True
    # InspectionResult emits ≥1 defect (the synthetic ok-defect).
    assert len(result.defects) >= 1
    assert result.model_version.startswith("velm-pipeline-")


# ---------- Triton deployment template -------------------------------


def test_triton_template_loads_with_three_models():
    template_path = (
        Path(__file__).resolve().parents[1] / "src" / "roboqc_data" / "deploy" / "triton_inference_server.yaml"
    )
    data = yaml.safe_load(template_path.read_text())
    assert data["application"]["station_id"]
    model_names = {m["name"] for m in data["models"]}
    assert {"yolo26-seg", "patchcore_lite", "velm_orchestrator"} <= model_names
    # Orchestrator uses the python backend, the other two are native.
    by_name = {m["name"]: m for m in data["models"]}
    assert by_name["velm_orchestrator"]["platform"] == "python"
    assert by_name["yolo26-seg"]["platform"] == "onnxruntime_onnx"
    sink = data["sink"]
    assert sink["endpoint"].endswith("/api/inspections")
    assert sink["hitl_confidence_threshold"] == 0.85
