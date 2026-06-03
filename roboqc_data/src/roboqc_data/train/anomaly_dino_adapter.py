"""AnomalyDINO training-free anomaly adapter.

AnomalyDINO (NotebookLM review refs [22–24]) extracts patch features
from a DINOv2 backbone for a small set of "good" reference images and
flags as anomalous any test patch whose nearest-reference distance
exceeds an empirical threshold. Two properties make it attractive for
RoboQC:

- **Zero gradient steps.** Adding a new connector or screw type means
  swapping the reference set, not retraining a model.
- **Few-shot.** 1–8 reference images per class typically suffice,
  which fits the realities of early-NPI lines.

The adapter is a thin wrapper over the future ``anomaly_dino`` Python
package (still external as of May 2026). When the package is missing
it returns ``TrainResult(status="skipped")`` per the convention used
by the other train adapters.
"""

from __future__ import annotations

from pathlib import Path

from ..export.anomalib_folder import manifest_to_anomalib_folder
from ..schema.records import Manifest
from .base import TrainAdapter, TrainConfig, TrainResult, skipped_result


class AnomalyDinoAdapter:
    name = "anomaly_dino"
    default_backbone = "dinov2_vitb14"

    def fit(self, manifest: Manifest, cfg: TrainConfig) -> TrainResult:
        try:
            from anomaly_dino import build_reference  # type: ignore
        except Exception as exc:  # pragma: no cover - exercised in [train] env
            return skipped_result(
                self.name,
                manifest,
                f"anomaly_dino not installed: {exc}",
            )

        layout = manifest_to_anomalib_folder(manifest, cfg.workdir / "data")
        backbone = str(cfg.extra.get("backbone", self.default_backbone))
        n_shots = int(cfg.extra.get("n_shots", 4))

        normal_dir = Path(layout) / "normal"
        reference_paths = sorted(normal_dir.iterdir())[:n_shots]
        if not reference_paths:  # pragma: no cover
            return skipped_result(
                self.name,
                manifest,
                "no normal/good images in manifest after export",
            )

        bank = build_reference(  # pragma: no cover
            backbone=backbone,
            reference_paths=[str(p) for p in reference_paths],
        )
        # We do not run scoring in fit() — that is a separate inference
        # call. fit() just persists the bank so the production runtime
        # can load it via score_image(bank, ...).
        bank_path = cfg.workdir / "anomaly_dino_bank.pt"
        bank.save(str(bank_path))  # pragma: no cover

        return TrainResult(  # pragma: no cover
            adapter=self.name,
            model_uri=f"anomaly_dino://{bank_path}",
            metrics={"reference_shots": float(len(reference_paths))},
            manifest_sha256=manifest.manifest_sha256,
            seed=manifest.seed,
            status="ok",
            notes=f"backbone={backbone}, n_shots={n_shots}",
        )


_adapter: TrainAdapter = AnomalyDinoAdapter()
