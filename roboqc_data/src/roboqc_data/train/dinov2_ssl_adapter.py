"""NV-DINOv2 self-supervised pre-training adapter.

NotebookLM review [19–21] flagged NV-DINOv2 SSL pre-training as a
"step 0" that turns a generic pretrained backbone into a plant-
adapted one *before* any supervised training runs. The reported gain
is meaningful: ~98.5 % defect-detection accuracy after a small
supervised fine-tune on a SSL-adapted backbone.

The recipe for RoboQC:

1. Walk every ImageRecord whose source.dataset is ``plant`` (real
   factory frames, typically unlabelled).
2. Hand the raw image list to the ``dinov2`` SSL trainer.
3. Save the adapted backbone weights. Subsequent ``YoloAdapter`` /
   ``RTDETRAdapter`` calls reference this checkpoint via
   ``cfg.extra["backbone_init"]``.

Heavy dependency (the official ``dinov2`` repo / Anthropic-style NV
fork) is optional. Without it the adapter returns
``TrainResult(status="skipped")``.
"""

from __future__ import annotations

from pathlib import Path

from ..schema.records import Manifest
from .base import TrainAdapter, TrainConfig, TrainResult, skipped_result


class DinoV2SslAdapter:
    """SSL pre-training on unlabelled plant frames."""

    name = "dinov2_ssl"
    default_backbone = "vitb14"

    def fit(self, manifest: Manifest, cfg: TrainConfig) -> TrainResult:
        try:
            from dinov2.train import build_ssl_trainer  # type: ignore
        except Exception as exc:  # pragma: no cover - exercised without dep
            return skipped_result(self.name, manifest, f"dinov2 not installed: {exc}")

        plant_records = [r for r in manifest.records if r.source.dataset == "plant"]
        if len(plant_records) < 100:  # pragma: no cover
            return skipped_result(
                self.name,
                manifest,
                f"need >=100 plant records for SSL pre-training, got {len(plant_records)}",
            )

        image_uris = [r.uri for r in plant_records]
        ckpt_path = Path(cfg.workdir) / "dinov2_ssl.pt"
        trainer = build_ssl_trainer(  # pragma: no cover
            backbone=str(cfg.extra.get("backbone", self.default_backbone)),
            image_uris=image_uris,
            output_dir=str(cfg.workdir),
            epochs=cfg.epochs,
            batch_size=cfg.batch_size,
        )
        trainer.fit()  # pragma: no cover
        trainer.save(str(ckpt_path))  # pragma: no cover

        return TrainResult(  # pragma: no cover
            adapter=self.name,
            model_uri=f"dinov2://{ckpt_path}",
            metrics={"plant_frames": float(len(plant_records))},
            manifest_sha256=manifest.manifest_sha256,
            seed=manifest.seed,
            status="ok",
            notes=f"backbone={cfg.extra.get('backbone', self.default_backbone)}",
        )


_adapter: TrainAdapter = DinoV2SslAdapter()
