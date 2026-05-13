"""Thin Ultralytics YOLO adapter (det + seg)."""

from __future__ import annotations

from ..export.yolo_seg import manifest_to_yolo_seg
from ..schema.records import Manifest
from .base import TrainAdapter, TrainConfig, TrainResult, skipped_result


class YoloAdapter:
    name = "ultralytics_yolo"
    supported_modes = ("det", "seg")

    def fit(self, manifest: Manifest, cfg: TrainConfig) -> TrainResult:
        try:
            from ultralytics import YOLO  # type: ignore
        except Exception as exc:  # pragma: no cover - exercised in [train] env
            return skipped_result(self.name, manifest, f"ultralytics not installed: {exc}")

        data_yaml = manifest_to_yolo_seg(manifest, cfg.workdir / "data")
        mode = str(cfg.extra.get("mode", "seg")).lower()
        weights = str(cfg.extra.get("weights", "yolov8n-seg.pt" if mode == "seg" else "yolov8n.pt"))

        model = YOLO(weights)  # pragma: no cover
        result = model.train(  # pragma: no cover
            data=str(data_yaml),
            epochs=cfg.epochs,
            imgsz=cfg.image_size,
            batch=cfg.batch_size,
            project=str(cfg.workdir),
        )

        return TrainResult(  # pragma: no cover
            adapter=self.name,
            model_uri=str(result.save_dir / "weights" / "best.pt"),
            metrics={},
            manifest_sha256=manifest.manifest_sha256,
            seed=manifest.seed,
            status="ok",
            notes=f"mode={mode}",
        )


_adapter: TrainAdapter = YoloAdapter()
