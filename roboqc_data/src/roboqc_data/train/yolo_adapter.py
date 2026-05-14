"""Thin Ultralytics YOLO adapter (det + seg).

Default weights target **YOLO26** (Ultralytics, released 2026-01-14):
NMS-free end-to-end inference, edge-optimised, supports detection /
segmentation / classification / pose / OBB. YOLO11 (Sep 2024) and the
older YOLOv8 family remain accessible by passing ``weights="..."`` in
``cfg.extra``.
"""

from __future__ import annotations

from ..export.yolo_seg import manifest_to_yolo_seg
from ..schema.records import Manifest
from .base import TrainAdapter, TrainConfig, TrainResult, skipped_result

DEFAULT_SEG_WEIGHTS = "yolo26n-seg.pt"
DEFAULT_DET_WEIGHTS = "yolo26n.pt"


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
        default_weights = DEFAULT_SEG_WEIGHTS if mode == "seg" else DEFAULT_DET_WEIGHTS
        weights = str(cfg.extra.get("weights", default_weights))

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
