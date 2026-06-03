"""Common types for thin training-adapter wrappers.

Every adapter converts a canonical Manifest into its trainer's native
layout, calls a single ``fit``, and reports a TrainResult that carries
the manifest hash for reproducibility audits.

Heavy ML deps (anomalib, ultralytics, transformers, torch) are
optional extras. Adapters guard their imports so the rest of the
package stays importable without them.
"""

from __future__ import annotations

from pathlib import Path
from typing import Literal, Protocol

from pydantic import BaseModel, ConfigDict, Field

from ..schema.records import Manifest


class TrainConfig(BaseModel):
    model_config = ConfigDict(strict=True)

    name: str
    epochs: int = Field(default=1, ge=1)
    batch_size: int = Field(default=8, ge=1)
    image_size: int = Field(default=256, ge=32)
    workdir: Path
    extra: dict[str, object] = {}


class TrainResult(BaseModel):
    model_config = ConfigDict(strict=True, frozen=True)

    adapter: str
    model_uri: str
    metrics: dict[str, float]
    manifest_sha256: str
    seed: int
    status: Literal["ok", "skipped"]
    notes: str = ""


class TrainAdapter(Protocol):
    name: str

    def fit(self, manifest: Manifest, cfg: TrainConfig) -> TrainResult: ...


def skipped_result(adapter: str, manifest: Manifest, reason: str) -> TrainResult:
    """Helper for adapters that cannot run (missing optional dep)."""
    return TrainResult(
        adapter=adapter,
        model_uri="",
        metrics={},
        manifest_sha256=manifest.manifest_sha256,
        seed=manifest.seed,
        status="skipped",
        notes=reason,
    )
