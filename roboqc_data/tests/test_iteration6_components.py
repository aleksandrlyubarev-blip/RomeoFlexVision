"""Tests for iteration-6 additions:

- AnomalyDinoAdapter (training-free anomaly via DINOv2)
- LogicQA logical-anomaly checker (with router-backed VLM)
- LuxonisOakExportAdapter (YOLO -> OAK archive)
- MMDDomainAdapter / gaussian_kernel_mmd (UDA regulariser)

Every adapter is tested in its skip / fallback path so the suite
runs on the [cv,brigada] CI without heavy ML deps.
"""

from __future__ import annotations

import asyncio
from datetime import UTC, datetime

import pytest

from roboqc_data.adapt.mmd import MMDConfig, MMDDomainAdapter, gaussian_kernel_mmd
from roboqc_data.export_models.base import ExportConfig
from roboqc_data.export_models.luxonis_oak import LuxonisOakExportAdapter
from roboqc_data.logic.logic_qa import (
    HeuristicLogicQa,
    LogicQaCheck,
    LogicQaResult,
    RouterBackedLogicQa,
)
from roboqc_data.schema.records import Manifest
from roboqc_data.schema.taxonomy import DefectClass
from roboqc_data.train.anomaly_dino_adapter import AnomalyDinoAdapter
from roboqc_data.train.base import TrainConfig, TrainResult

# ---------- AnomalyDINO ----------------------------------------------


def _empty_manifest() -> Manifest:
    return Manifest(
        manifest_id="m-empty",
        created_at=datetime(2026, 5, 14, tzinfo=UTC),
        seed=42,
        manifest_sha256="cafebabe",
        records=(),
    )


def test_anomaly_dino_adapter_skips_without_dep(tmp_path):
    cfg = TrainConfig(name="adino", workdir=tmp_path / "adino")
    result = AnomalyDinoAdapter().fit(_empty_manifest(), cfg)
    assert isinstance(result, TrainResult)
    assert result.status == "skipped"
    assert result.adapter == "anomaly_dino"
    assert "anomaly_dino not installed" in result.notes


# ---------- LogicQA ---------------------------------------------------


def test_heuristic_logic_qa_returns_fixed_checklist():
    qa = HeuristicLogicQa()
    checks = asyncio.run(qa.synthesise(["file:///ref/a.png"]))
    assert len(checks) >= 1
    assert all(isinstance(c, LogicQaCheck) for c in checks)
    result = asyncio.run(qa.inspect("file:///test/x.png", list(checks)))
    assert isinstance(result, LogicQaResult)
    assert result.overall_pass is True


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


def test_router_backed_logic_qa_synthesises_checklist(_stub_litellm_cost):
    import json

    router = _make_router(json.dumps(["Is screw A present?", "Is screw B fully seated?"]))
    qa = RouterBackedLogicQa(router=router)
    checks = asyncio.run(qa.synthesise(["file:///ref/a.png"]))
    assert [c.question for c in checks] == ["Is screw A present?", "Is screw B fully seated?"]


def test_router_backed_logic_qa_inspect_flags_no_findings(_stub_litellm_cost):
    import json

    body = json.dumps(
        [
            {"question": "Is cable routed correctly?", "answer": "no", "explanation": "Crosses hot zone"},
            {"question": "Is latch closed?", "answer": "yes", "explanation": ""},
        ]
    )
    router = _make_router(body)
    qa = RouterBackedLogicQa(router=router)
    result = asyncio.run(
        qa.inspect(
            "file:///test/x.png",
            [
                LogicQaCheck(question="Is cable routed correctly?"),
                LogicQaCheck(question="Is latch closed?"),
            ],
        )
    )
    assert result.overall_pass is False
    assert result.defect_class is DefectClass.WRONG_ROUTING
    assert len(result.findings) == 2


def test_router_backed_logic_qa_falls_back_on_garbage(_stub_litellm_cost):
    router = _make_router("not json")
    qa = RouterBackedLogicQa(router=router)
    result = asyncio.run(qa.inspect("file:///test/x.png", [LogicQaCheck(question="ok?")]))
    # Heuristic fallback always passes when no findings.
    assert result.overall_pass is True


# ---------- Luxonis OAK export ---------------------------------------


def test_luxonis_oak_rejects_wrong_target(tmp_path):
    fake = tmp_path / "m.onnx"
    fake.write_bytes(b"\x00")
    artifact = LuxonisOakExportAdapter().export(f"onnx://{fake}", ExportConfig(target="onnx"))
    assert artifact.status == "skipped"
    assert "wrong target" in artifact.notes


def test_luxonis_oak_requires_onnx_scheme():
    artifact = LuxonisOakExportAdapter().export("yolo:///x.pt", ExportConfig(target="luxonis_oak"))
    assert artifact.status == "skipped"
    assert "onnx://" in artifact.notes


def test_luxonis_oak_skipped_when_tools_missing(tmp_path):
    fake = tmp_path / "m.onnx"
    fake.write_bytes(b"\x00")
    artifact = LuxonisOakExportAdapter().export(
        f"onnx://{fake}",
        ExportConfig(target="luxonis_oak"),
    )
    # CI does not ship the luxonis/tools CLI, so the adapter must
    # report skipped, not crash.
    assert artifact.status == "skipped"


# ---------- MMD domain adaptation -------------------------------------


def test_mmd_config_defaults():
    cfg = MMDConfig()
    assert cfg.weight == pytest.approx(0.1)
    assert cfg.kernel == "gaussian"
    assert len(cfg.sigmas) >= 1


def test_mmd_loss_zero_on_identical_features():
    pytest.importorskip("torch")
    import torch

    feats = torch.randn(8, 4)
    loss = gaussian_kernel_mmd(feats, feats.clone())
    assert float(loss.detach()) == pytest.approx(0.0, abs=1e-5)


def test_mmd_adapter_returns_task_loss_plus_term():
    pytest.importorskip("torch")
    import torch

    source = torch.randn(8, 4)
    target = torch.randn(8, 4) + 5.0
    adapter = MMDDomainAdapter(MMDConfig(weight=0.5))
    task_loss = torch.tensor(1.0)
    total = adapter.loss(task_loss, source, target)
    assert float(total.detach()) > float(task_loss.detach())
