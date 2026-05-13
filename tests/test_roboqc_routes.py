"""Tests for the new roboqc dataset/inspection routes added to rhaef_v2/api/routes.py."""

import asyncio
import json
from pathlib import Path

from rhaef_v2.api.routes import (
    APIServices,
    SynthPreviewRequest,
    build_dataset_summary,
    build_synth_preview,
    run_inspection,
)
from rhaef_v2.core.model_router import ModelRouter
from rhaef_v2.core.policies import FrictionPolicyEngine
from rhaef_v2.schemas.api import APIError
from rhaef_v2.tools.interfaces import InspectionRequest, InspectionResult


def _fake_client(**_):  # mirror the existing fake in routes.py
    return type("R", (), {"choices": [type("C", (), {"message": {"role": "a", "content": "ok"}})()]})()


def _services(dataset_root: Path | None = None) -> APIServices:
    return APIServices(
        model_router=ModelRouter(client=_fake_client),
        policy_engine=FrictionPolicyEngine(),
        dataset_root=dataset_root,
    )


def test_dataset_manifest_missing_returns_api_error(tmp_path):
    summary = build_dataset_summary(tmp_path / "does_not_exist")
    assert isinstance(summary, APIError)
    assert summary.code == "MANIFEST_NOT_FOUND"


def test_dataset_manifest_summarises_records(tmp_path):
    manifest_dir = tmp_path / "m"
    manifest_dir.mkdir()
    (manifest_dir / "manifest.json").write_text(
        json.dumps(
            {
                "manifest_id": "m1",
                "manifest_sha256": "abc",
                "taxonomy_version": "1.0.0",
            }
        )
    )
    records = [
        {
            "source": {"license": "CC-BY-4.0"},
            "annotations": [{"defect_class": "connector_damage"}],
        },
        {
            "source": {"license": "CC-BY-4.0"},
            "annotations": [],
        },
        {
            "source": {"license": "MVTec AD"},
            "annotations": [
                {"defect_class": "connector_damage"},
                {"defect_class": "screw_missing"},
            ],
        },
    ]
    (manifest_dir / "records.jsonl").write_text("\n".join(json.dumps(r) for r in records))

    summary = build_dataset_summary(manifest_dir)
    assert summary.manifest_id == "m1"
    assert summary.record_count == 3
    assert summary.license_breakdown == {"CC-BY-4.0": 2, "MVTec AD": 1}
    assert summary.class_breakdown == {"connector_damage": 2, "screw_missing": 1}


def test_synth_preview_enumerates_record_ids():
    response = build_synth_preview(
        SynthPreviewRequest(target_class="connector_damage", count=2, seed=42)
    )
    assert response.manifest_id == "brigada-connector_damage-42"
    assert len(response.record_ids) == 2
    assert response.record_ids[0].endswith("_0000")


def test_inspect_runs_stub_client():
    services = _services()
    payload = InspectionRequest(inspection_id="x1", image_uri="memory://x")
    result = asyncio.run(run_inspection(payload, services))
    assert isinstance(result, InspectionResult)
    assert result.inspection_id == "x1"
    assert result.overall_pass is True
    assert result.model_version.startswith("stub-")
