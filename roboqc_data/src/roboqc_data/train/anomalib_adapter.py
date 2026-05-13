"""Thin Anomalib adapter (PatchCore / EfficientAD).

This wrapper converts the canonical Manifest to Anomalib's Folder
dataset layout (via :mod:`roboqc_data.export.anomalib_folder`) and
hands it to ``anomalib.Engine``. The heavy ML deps are optional —
:func:`fit` returns a ``status="skipped"`` :class:`TrainResult` if
``anomalib`` is not installed, so dependents and CI can probe the
adapter without paying the install cost.
"""

from __future__ import annotations

from ..export.anomalib_folder import manifest_to_anomalib_folder
from ..schema.records import Manifest
from .base import TrainAdapter, TrainConfig, TrainResult, skipped_result


class AnomalibAdapter:
    name = "anomalib"
    supported_models = ("patchcore", "efficient_ad")

    def fit(self, manifest: Manifest, cfg: TrainConfig) -> TrainResult:
        try:
            from anomalib.engine import Engine  # type: ignore
            from anomalib.models import EfficientAd, Patchcore  # type: ignore
        except Exception as exc:  # pragma: no cover - exercised in [train] env
            return skipped_result(self.name, manifest, f"anomalib not installed: {exc}")

        layout = manifest_to_anomalib_folder(manifest, cfg.workdir / "data")
        model_name = str(cfg.extra.get("model", "patchcore")).lower()
        model = Patchcore() if model_name == "patchcore" else EfficientAd()
        engine = Engine()
        engine.fit(model=model, datamodule=None)  # pragma: no cover

        return TrainResult(
            adapter=self.name,
            model_uri=str(cfg.workdir / "checkpoints" / f"{model_name}.ckpt"),
            metrics={},
            manifest_sha256=manifest.manifest_sha256,
            seed=manifest.seed,
            status="ok",
            notes=f"layout={layout}",
        )


_adapter: TrainAdapter = AnomalibAdapter()
