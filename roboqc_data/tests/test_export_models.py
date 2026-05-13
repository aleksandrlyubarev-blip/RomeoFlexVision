from pathlib import Path

from roboqc_data.export_models.base import ExportConfig
from roboqc_data.export_models.onnx_export import ONNXExportAdapter, export
from roboqc_data.export_models.tensorrt_export import TensorRTExportAdapter


def test_onnx_pass_through_returns_ok(tmp_path):
    fake = tmp_path / "model.onnx"
    fake.write_bytes(b"")
    artifact = ONNXExportAdapter().export(f"onnx://{fake}", ExportConfig(target="onnx"))
    assert artifact.status == "ok"
    assert artifact.output_path == fake
    assert artifact.notes == "pass-through"


def test_onnx_rejects_wrong_target():
    artifact = ONNXExportAdapter().export("yolo:///x.pt", ExportConfig(target="tensorrt"))
    assert artifact.status == "skipped"
    assert "wrong target" in artifact.notes


def test_onnx_yolo_without_dep_is_skipped():
    artifact = ONNXExportAdapter().export("yolo:///nonexistent.pt", ExportConfig(target="onnx"))
    assert artifact.status == "skipped"
    assert "yolo" in artifact.notes.lower() or "unsupported" in artifact.notes.lower()


def test_tensorrt_without_trtexec_is_skipped(tmp_path):
    fake = tmp_path / "m.onnx"
    fake.write_bytes(b"")
    artifact = TensorRTExportAdapter().export(
        f"onnx://{fake}", ExportConfig(target="tensorrt")
    )
    # On CI runners without TensorRT, trtexec is not on PATH so the
    # adapter must report skipped, not crash.
    assert artifact.status == "skipped"


def test_export_convenience_returns_ok_for_pass_through(tmp_path):
    fake = tmp_path / "model.onnx"
    fake.write_bytes(b"\x00")
    artifact = export(f"onnx://{fake}", target="onnx")
    assert artifact.status == "ok"
    assert isinstance(artifact.output_path, Path)
