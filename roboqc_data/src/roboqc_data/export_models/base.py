"""Common types for trained-model export adapters.

Edge deployment (Jetson, server-side TensorRT) wants ONNX and TensorRT
engines, not raw checkpoints. Each adapter takes a trained-model URI
(adapter-specific scheme) plus an :class:`ExportConfig` and returns an
:class:`ExportArtifact` pointing at the produced engine on disk.

Heavy deps (onnx, onnxruntime, tensorrt) live behind the ``[export]``
extra. Adapters guard their imports and return ``status="skipped"`` if
the dep is missing — same pattern as :mod:`roboqc_data.train.base`.
"""

from __future__ import annotations

from pathlib import Path
from typing import Literal, Protocol

from pydantic import BaseModel, ConfigDict, Field

ExportTarget = Literal["onnx", "tensorrt"]


class ExportConfig(BaseModel):
    model_config = ConfigDict(strict=True)

    target: ExportTarget
    image_size: int = Field(default=256, ge=32)
    dynamic_axes: bool = True
    workspace_mb: int = Field(default=4096, ge=128)
    fp16: bool = False
    extra: dict[str, object] = {}


class ExportArtifact(BaseModel):
    model_config = ConfigDict(strict=True, frozen=True)

    adapter: str
    target: ExportTarget
    output_path: Path | None
    status: Literal["ok", "skipped"]
    notes: str = ""


class ModelExportAdapter(Protocol):
    name: str

    def export(self, model_uri: str, cfg: ExportConfig) -> ExportArtifact: ...


def skipped_artifact(adapter: str, target: ExportTarget, reason: str) -> ExportArtifact:
    return ExportArtifact(
        adapter=adapter,
        target=target,
        output_path=None,
        status="skipped",
        notes=reason,
    )
