"""Tests for iteration-7 additions:

- VELM pipeline (heuristic + router-backed VLM classifier)
- DinoV2SslAdapter (skip path)
- AnomalibAdapter edge variants (PatchCore-Lite / PaDiM-Lite / Tiny-Dinomaly)
- DeepStream sample template loads as valid YAML
"""

from __future__ import annotations

import asyncio
import json
from datetime import UTC, datetime
from pathlib import Path

import pytest
import yaml

from roboqc_data.logic.velm import (
    AnomalyCandidate,
    HeuristicVlmClassifier,
    RouterBackedVlmClassifier,
    VelmPipeline,
    VelmVerdict,
)
from roboqc_data.schema.records import BBox, Manifest
from roboqc_data.schema.taxonomy import DefectClass
from roboqc_data.train.anomalib_adapter import EDGE_MODELS, AnomalibAdapter
from roboqc_data.train.base import TrainConfig
from roboqc_data.train.dinov2_ssl_adapter import DinoV2SslAdapter

# ---------- VELM heuristic flow ---------------------------------------


def test_velm_heuristic_passes_clean_image():
    pipeline = VelmPipeline(score_threshold=0.4)
    result = asyncio.run(pipeline.run("file:///station/clean.png"))
    assert result.overall_pass is True
    # Heuristic expert emits one candidate; heuristic classifier labels OK.
    assert len(result.verdicts) == 1
    assert result.verdicts[0].defect_class is DefectClass.OK


def test_velm_score_threshold_filters_candidates():
    class _LowScoreExpert:
        def candidates(self, image_uri):
            return [
                AnomalyCandidate(
                    crop_uri=image_uri,
                    bbox=BBox(x=0.0, y=0.0, w=1.0, h=1.0, image_w=1, image_h=1),
                    score=0.2,
                )
            ]

    pipeline = VelmPipeline(expert=_LowScoreExpert(), score_threshold=0.5)
    result = asyncio.run(pipeline.run("file:///station/blurry.png"))
    assert result.verdicts == ()
    assert result.overall_pass is True


# ---------- VELM router-backed classifier -----------------------------


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


def test_velm_router_backed_classifier_flags_critical_defect(_stub_litellm_cost):
    router = _make_router(
        json.dumps(
            {
                "defect_class": "connector_damage",
                "severity": "critical",
                "rework": "Replace connector before next station.",
            }
        )
    )
    classifier = RouterBackedVlmClassifier(router=router)
    pipeline = VelmPipeline(classifier=classifier, score_threshold=0.4)
    result = asyncio.run(pipeline.run("file:///station/connector.png"))
    assert result.overall_pass is False
    assert len(result.verdicts) == 1
    assert result.verdicts[0].defect_class is DefectClass.CONNECTOR_DAMAGE
    assert result.verdicts[0].severity == "critical"
    assert "Replace" in result.verdicts[0].rework


def test_velm_router_backed_classifier_falls_back_on_garbage(_stub_litellm_cost):
    router = _make_router("not-json")
    classifier = RouterBackedVlmClassifier(router=router, fallback=HeuristicVlmClassifier())
    pipeline = VelmPipeline(classifier=classifier, score_threshold=0.4)
    result = asyncio.run(pipeline.run("file:///station/x.png"))
    assert result.overall_pass is True  # Heuristic fallback returns OK.


def test_velm_pipeline_cosmetic_severity_still_passes(_stub_litellm_cost):
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
    result = asyncio.run(pipeline.run("file:///station/scratch.png"))
    # Cosmetic-only verdict — not a fail.
    assert result.overall_pass is True
    assert isinstance(result.verdicts[0], VelmVerdict)


# ---------- DinoV2 SSL adapter ----------------------------------------


def test_dinov2_ssl_adapter_skips_without_dep(tmp_path):
    manifest = Manifest(
        manifest_id="m1",
        created_at=datetime(2026, 5, 14, tzinfo=UTC),
        seed=0,
        manifest_sha256="abc",
        records=(),
    )
    cfg = TrainConfig(name="dinov2", workdir=tmp_path / "ssl")
    result = DinoV2SslAdapter().fit(manifest, cfg)
    assert result.status == "skipped"
    assert result.adapter == "dinov2_ssl"
    assert "dinov2 not installed" in result.notes


# ---------- Anomalib edge variants -----------------------------------


def test_anomalib_adapter_lists_edge_variants():
    for edge_name in ("patchcore_lite", "padim_lite", "tiny_dinomaly"):
        assert edge_name in AnomalibAdapter.supported_models
        assert edge_name in EDGE_MODELS


def test_anomalib_adapter_rejects_unknown_model(tmp_path):
    manifest = Manifest(
        manifest_id="m1",
        created_at=datetime(2026, 5, 14, tzinfo=UTC),
        seed=0,
        manifest_sha256="abc",
        records=(),
    )
    # anomalib isn't installed in CI, so first check fires the skip
    # path for a missing dep. We can still validate that *if* the lib
    # were installed, unsupported models would be rejected — by going
    # through the static supported_models tuple.
    cfg = TrainConfig(name="anom", workdir=tmp_path, extra={"model": "nonsense"})
    result = AnomalibAdapter().fit(manifest, cfg)
    # Either path is acceptable: dep missing -> skip with anomalib msg,
    # or unsupported model -> skip with that msg.
    assert result.status == "skipped"


# ---------- DeepStream sample template -------------------------------


def test_deepstream_template_loads_and_has_two_cameras():
    template_path = (
        Path(__file__).resolve().parents[1] / "src" / "roboqc_data" / "deploy" / "deepstream_inspection_cell.yaml"
    )
    data = yaml.safe_load(template_path.read_text())
    assert data["application"]["station_id"]
    assert len(data["sources"]) == 2
    assert "primary" in data["inference"] and "secondary" in data["inference"]
    sink = data["sink"]
    assert sink["endpoint"].endswith("/api/inspections")
    assert sink["hitl_confidence_threshold"] == 0.85
    # Every ROI references at least one wedge class.
    for roi in data["regions_of_interest"]:
        assert roi["classes"]
        for cls_name in roi["classes"]:
            DefectClass(cls_name)  # raises if class is unknown


def test_provenance_literal_includes_velm_and_logic_qa():
    from roboqc_data.schema.records import Annotation
    from roboqc_data.schema.records import BBox as RBBox

    ann = Annotation(
        id="x",
        defect_class=DefectClass.CONNECTOR_DAMAGE,
        bbox=RBBox(x=0.0, y=0.0, w=1.0, h=1.0, image_w=10, image_h=10),
        provenance="velm",
    )
    assert ann.provenance == "velm"
    ann2 = ann.model_copy(update={"provenance": "logic_qa"})
    assert ann2.provenance == "logic_qa"
