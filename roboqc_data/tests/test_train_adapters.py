"""Tests for the thin training-adapter wrappers.

In the ``[cv,brigada]`` CI environment the heavy ML deps are not
installed, so every adapter should return ``status="skipped"`` with a
clear note. Tests verify the wiring contract — manifest hash carried
through, TrainResult validated by Pydantic — without exercising any
GPU code paths.
"""

from __future__ import annotations

from datetime import datetime, timezone

from roboqc_data.schema.records import Manifest
from roboqc_data.train.anomalib_adapter import AnomalibAdapter
from roboqc_data.train.base import TrainConfig, TrainResult
from roboqc_data.train.rtdetr_adapter import RTDETRAdapter
from roboqc_data.train.yolo_adapter import YoloAdapter


def _empty_manifest() -> Manifest:
    return Manifest(
        manifest_id="m-empty",
        created_at=datetime(2026, 5, 13, tzinfo=timezone.utc),
        seed=21,
        manifest_sha256="deadbeef",
        records=(),
    )


def _cfg(workdir, name: str, **extra) -> TrainConfig:
    return TrainConfig(name=name, workdir=workdir / name, extra=extra)


def test_anomalib_adapter_reports_skipped_without_dep(tmp_path):
    result = AnomalibAdapter().fit(_empty_manifest(), _cfg(tmp_path, "anomalib"))
    assert isinstance(result, TrainResult)
    assert result.status == "skipped"
    assert result.adapter == "anomalib"
    assert "anomalib not installed" in result.notes
    assert result.manifest_sha256 == "deadbeef"


def test_yolo_adapter_reports_skipped_without_dep(tmp_path):
    result = YoloAdapter().fit(_empty_manifest(), _cfg(tmp_path, "yolo", mode="seg"))
    assert result.status == "skipped"
    assert result.adapter == "ultralytics_yolo"
    assert "ultralytics" in result.notes


def test_rtdetr_adapter_reports_skipped_without_dep(tmp_path):
    result = RTDETRAdapter().fit(_empty_manifest(), _cfg(tmp_path, "rtdetr"))
    assert result.status == "skipped"
    assert result.adapter == "rtdetr"


def test_adapters_supported_models_metadata():
    assert "patchcore" in AnomalibAdapter.supported_models
    assert "seg" in YoloAdapter.supported_modes
