"""Thin RT-DETR adapter.

Uses Ultralytics RT-DETR when available; falls back to a
``status="skipped"`` TrainResult otherwise so dependents can introspect
the adapter without the optional ``[train]`` extra installed.
"""

from __future__ import annotations

from ..export.coco import write_coco
from ..export.yolo_seg import manifest_to_yolo_seg
from ..schema.records import Manifest
from .base import TrainAdapter, TrainConfig, TrainResult, skipped_result


class RTDETRAdapter:
    name = "rtdetr"

    def fit(self, manifest: Manifest, cfg: TrainConfig) -> TrainResult:
        try:
            from ultralytics import RTDETR  # type: ignore
        except Exception as exc:  # pragma: no cover - exercised in [train] env
            return skipped_result(self.name, manifest, f"ultralytics RTDETR not installed: {exc}")

        data_yaml = manifest_to_yolo_seg(manifest, cfg.workdir / "data_yolo")
        write_coco(manifest, cfg.workdir / "data_coco" / "annotations.json")
        weights = str(cfg.extra.get("weights", "rtdetr-l.pt"))

        model = RTDETR(weights)  # pragma: no cover
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
        )


_adapter: TrainAdapter = RTDETRAdapter()
