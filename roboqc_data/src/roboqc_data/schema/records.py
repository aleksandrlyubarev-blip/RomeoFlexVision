"""Canonical Pydantic v2 schema for RoboQC dataset records.

All models are strict and frozen (immutable). Conversion to/from
on-disk JSONL is done via Pydantic's built-in serialization
(``model_dump_json`` / ``model_validate_json``).

Adapters in :mod:`roboqc_data.export` consume :class:`Manifest`
instances and emit COCO / YOLO-seg / Anomalib-folder layouts.
"""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from .splits import Split
from .taxonomy import TAXONOMY_VERSION, DefectClass


class BBox(BaseModel):
    """Normalized bounding box (xywh in [0,1]).

    ``image_w`` / ``image_h`` are kept on the bbox so it round-trips
    losslessly to absolute coords when needed.
    """

    model_config = ConfigDict(strict=True, frozen=True)

    x: float = Field(ge=0.0, le=1.0)
    y: float = Field(ge=0.0, le=1.0)
    w: float = Field(gt=0.0, le=1.0)
    h: float = Field(gt=0.0, le=1.0)
    image_w: int = Field(gt=0)
    image_h: int = Field(gt=0)


class Polygon(BaseModel):
    model_config = ConfigDict(strict=True, frozen=True)

    points: tuple[tuple[float, float], ...]


class MaskRef(BaseModel):
    """Reference to a binary mask stored alongside the image."""

    model_config = ConfigDict(strict=True, frozen=True)

    uri: str
    sha256: str
    encoding: Literal["png_binary", "rle"] = "png_binary"


class AnomalyHeatmapRef(BaseModel):
    """Reference to a float anomaly heatmap (Anomalib output)."""

    model_config = ConfigDict(strict=True, frozen=True)

    uri: str
    sha256: str
    range: tuple[float, float] = (0.0, 1.0)


Provenance = Literal["human", "grounded_sam2", "sam3", "brigada", "auto"]


class Annotation(BaseModel):
    model_config = ConfigDict(strict=True, frozen=True)

    id: str
    defect_class: DefectClass
    bbox: BBox | None = None
    polygon: Polygon | None = None
    mask: MaskRef | None = None
    heatmap: AnomalyHeatmapRef | None = None
    confidence: float | None = Field(default=None, ge=0.0, le=1.0)
    provenance: Provenance


class StationContext(BaseModel):
    """Hook for future real plant-floor data.

    All fields are optional — public benchmarks leave them blank.
    """

    model_config = ConfigDict(strict=True, frozen=True)

    station_id: str | None = None
    sop_id: str | None = None
    work_order: str | None = None
    captured_at: datetime | None = None
    operator_id: str | None = None


SourceDataset = Literal[
    "mvtec_ad",
    "mvtec_ad_2",
    "mvtec_loco",
    "visa",
    "isp_ad",
    "pku_pcb",
    "dagm_2007",
    "real_iad_d3",
    "brigada",
    "plant",
    "custom",
]


class SourceInfo(BaseModel):
    model_config = ConfigDict(strict=True, frozen=True)

    dataset: SourceDataset
    license: str
    attribution: str | None = None
    original_id: str


class ImageRecord(BaseModel):
    model_config = ConfigDict(strict=True, frozen=True)

    record_id: str
    uri: str
    sha256: str
    width: int = Field(gt=0)
    height: int = Field(gt=0)
    split: Split
    source: SourceInfo
    station: StationContext | None = None
    annotations: tuple[Annotation, ...] = ()
    tags: tuple[str, ...] = ()


class Manifest(BaseModel):
    """Top-level dataset manifest.

    On disk: ``manifest.json`` carries everything except records, and
    records are streamed to ``records.jsonl`` (one ImageRecord per
    line). :func:`roboqc_data.schema.hashing.manifest_digest` computes
    ``manifest_sha256``.
    """

    model_config = ConfigDict(strict=True, frozen=True)

    manifest_id: str
    created_at: datetime
    seed: int
    taxonomy_version: str = TAXONOMY_VERSION
    manifest_sha256: str
    records: tuple[ImageRecord, ...] = ()
