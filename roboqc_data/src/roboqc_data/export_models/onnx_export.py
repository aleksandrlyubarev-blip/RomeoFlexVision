"""ONNX export for trained checkpoints.

We accept three URI schemes so the same adapter handles all training
backends:

- ``yolo://<path-to-pt>``       — Ultralytics YOLO / RT-DETR `.pt`.
- ``anomalib://<path-to-ckpt>`` — Anomalib `.ckpt`.
- ``onnx://<path-to-onnx>``     — pass-through, used when the model is
  already in ONNX form.
"""

from __future__ import annotations

from pathlib import Path

from .base import ExportArtifact, ExportConfig, ExportTarget, skipped_artifact


class ONNXExportAdapter:
    name = "onnx"

    def export(self, model_uri: str, cfg: ExportConfig) -> ExportArtifact:
        if cfg.target != "onnx":
            return skipped_artifact(self.name, cfg.target, "wrong target for ONNXExportAdapter")
        scheme, _, path = model_uri.partition("://")
        if not path:
            return skipped_artifact(self.name, cfg.target, f"invalid model_uri: {model_uri}")
        path_obj = Path(path)

        if scheme == "onnx":
            return ExportArtifact(
                adapter=self.name,
                target="onnx",
                output_path=path_obj,
                status="ok",
                notes="pass-through",
            )

        try:
            if scheme == "yolo":
                from ultralytics import YOLO  # type: ignore

                model = YOLO(path)  # pragma: no cover
                onnx_path = model.export(  # pragma: no cover
                    format="onnx",
                    imgsz=cfg.image_size,
                    dynamic=cfg.dynamic_axes,
                    half=cfg.fp16,
                )
                return ExportArtifact(  # pragma: no cover
                    adapter=self.name,
                    target="onnx",
                    output_path=Path(onnx_path),
                    status="ok",
                )
            if scheme == "anomalib":
                from anomalib.engine import Engine  # type: ignore

                engine = Engine()  # pragma: no cover
                out = engine.export(  # pragma: no cover
                    model_path=path,
                    export_type="onnx",
                    workdir=str(cfg.extra.get("workdir", "exports")),
                )
                return ExportArtifact(  # pragma: no cover
                    adapter=self.name,
                    target="onnx",
                    output_path=Path(out),
                    status="ok",
                )
        except Exception as exc:  # pragma: no cover
            return skipped_artifact(self.name, "onnx", f"{scheme} export failed: {exc}")

        return skipped_artifact(self.name, "onnx", f"unsupported scheme: {scheme}")


def export(model_uri: str, target: ExportTarget = "onnx", **kwargs: object) -> ExportArtifact:
    """Convenience entry point used by the CLI."""
    cfg = ExportConfig(target=target, **kwargs)
    return ONNXExportAdapter().export(model_uri, cfg)
