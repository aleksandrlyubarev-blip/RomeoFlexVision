"""VisA (Spot-the-Diff) ingest adapter.

Layout expected at ``root``::

    <category>/Data/Images/Normal/<id>.JPG
    <category>/Data/Images/Anomaly/<id>.JPG
    <category>/Data/Masks/Anomaly/<id>.png       (optional, per-image mask)
    <category>/image_anno.csv                    (split metadata)

We do not consume the ``split`` column from ``image_anno.csv``; the
canonical Manifest split is deterministic from ``SplitSpec`` so two
adapters produce comparable splits for the same seed. Categories are
mapped to RoboQC defect classes with a coarse heuristic — concrete
labels are added per-category as the dataset is curated.
"""

from __future__ import annotations

from collections.abc import Iterable
from pathlib import Path

from ..schema.records import (
    Annotation,
    BBox,
    ImageRecord,
    MaskRef,
    SourceInfo,
)
from ..schema.splits import SplitSpec
from ..schema.taxonomy import DefectClass
from .base import BaseAdapter
from .licenses import VISA

CATEGORY_MAP: dict[str, DefectClass] = {
    "candle": DefectClass.CONNECTOR_DAMAGE,
    "capsules": DefectClass.CONNECTOR_DAMAGE,
    "cashew": DefectClass.CONNECTOR_DAMAGE,
    "chewinggum": DefectClass.CONNECTOR_DAMAGE,
    "fryum": DefectClass.CONNECTOR_DAMAGE,
    "macaroni1": DefectClass.CONNECTOR_DAMAGE,
    "macaroni2": DefectClass.CONNECTOR_DAMAGE,
    "pcb1": DefectClass.CONNECTOR_DAMAGE,
    "pcb2": DefectClass.CONNECTOR_DAMAGE,
    "pcb3": DefectClass.CONNECTOR_DAMAGE,
    "pcb4": DefectClass.CONNECTOR_DAMAGE,
    "pipe_fryum": DefectClass.CONNECTOR_DAMAGE,
}

_IMAGE_SUFFIXES = (".jpg", ".jpeg", ".png", ".JPG", ".JPEG", ".PNG")


class VisAAdapter(BaseAdapter):
    name = "visa"
    license_info = VISA

    def discover(self, root: Path) -> Iterable[Path]:
        for category_dir in sorted(p for p in root.iterdir() if p.is_dir()):
            images_root = category_dir / "Data" / "Images"
            if not images_root.is_dir():
                continue
            for subset in ("Normal", "Anomaly"):
                subset_dir = images_root / subset
                if not subset_dir.is_dir():
                    continue
                for img_path in sorted(subset_dir.iterdir()):
                    if img_path.suffix in _IMAGE_SUFFIXES:
                        yield img_path

    def to_record(self, raw: Path, root: Path, split_spec: SplitSpec) -> ImageRecord:
        rel = raw.relative_to(root)
        category = rel.parts[0]
        subset = rel.parts[3]  # Data/Images/<subset>/...
        is_anomaly = subset.lower() == "anomaly"
        defect = CATEGORY_MAP.get(category, DefectClass.OK) if is_anomaly else DefectClass.OK
        width, height = self._image_dims(raw)
        record_id = f"visa/{category}/{subset}/{raw.stem}"

        mask_ref = self._maybe_mask(root, category, raw.stem) if is_anomaly else None
        annotations: tuple[Annotation, ...] = ()
        if is_anomaly:
            annotations = (
                Annotation(
                    id=f"{record_id}#0",
                    defect_class=defect,
                    bbox=BBox(x=0.0, y=0.0, w=1.0, h=1.0, image_w=width, image_h=height),
                    mask=mask_ref,
                    provenance="human",
                ),
            )

        return ImageRecord(
            record_id=record_id,
            uri=raw.resolve().as_uri(),
            sha256=self._hash_file(raw),
            width=width,
            height=height,
            split=split_spec.assign(record_id),
            source=SourceInfo(
                dataset="visa",
                license=self.license_info.name,
                attribution="Amazon Science / Spot-Diff",
                original_id=str(rel),
            ),
            annotations=annotations,
            tags=(f"category:{category}", f"subset:{subset.lower()}"),
        )

    def _maybe_mask(self, root: Path, category: str, stem: str) -> MaskRef | None:
        candidate = root / category / "Data" / "Masks" / "Anomaly" / f"{stem}.png"
        if not candidate.is_file():
            return None
        return MaskRef(
            uri=candidate.resolve().as_uri(),
            sha256=self._hash_file(candidate),
            encoding="png_binary",
        )
