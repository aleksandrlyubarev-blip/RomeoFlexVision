"""Thin RT-DETR adapter.

Default path is Ultralytics' ``RTDETR`` (RT-DETR baseline, CVPR 2024).
Two more recent options exist and can be plugged in by passing
``weights="..."`` in ``cfg.extra``:

- **RT-DETRv4** (2025-11-18, arXiv): adds a Deep Semantic Injector
  (DINOv3-ViT-B) on top of the deep CNN backbone with gradient-guided
  adaptive modulation; "painless" AP boost at no deployment cost.
  Not in Ultralytics yet — use the RT-DETRs/RT-DETRv4 reference repo.
- **RT-DETRv3** (WACV 2025 Oral): hierarchical dense positive
  supervision via an auxiliary CNN branch + self-attention
  perturbation for diversified label assignment.
- **RT-DETRv2** (Jul 2024, on HuggingFace as ``rt_detr_v2``): bag-of-
  freebies improvements over RT-DETR; available via
  ``transformers.RTDetrV2ForObjectDetection`` if the team prefers the
  HF route.

If ``ultralytics`` is missing the adapter returns
``status="skipped"`` so dependents can introspect it without the
optional ``[train]`` extra installed.
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
