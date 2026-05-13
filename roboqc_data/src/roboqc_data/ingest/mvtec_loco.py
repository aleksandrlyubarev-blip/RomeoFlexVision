"""MVTec LOCO ingest adapter.

LOCO is the logical-anomaly companion to MVTec AD. Layout at ``root``::

    <category>/train/good/<id>.png
    <category>/test/good/<id>.png
    <category>/test/logical_anomalies/<id>.png
    <category>/test/structural_anomalies/<id>.png
    <category>/ground_truth/logical_anomalies/<id>/000.png   (multi-mask)
    <category>/ground_truth/structural_anomalies/<id>/000.png

Native defect subtype → RoboQC class:
- ``logical_anomalies``  → ``WRONG_ROUTING`` (wrong-position / missing-part)
- ``structural_anomalies`` → ``CONNECTOR_DAMAGE`` (scratches, dents, etc.)
"""

from __future__ import annotations

from pathlib import Path
from typing import Iterable

from ..schema.records import (
    Annotation,
    BBox,
    ImageRecord,
    MaskRef,
    SourceInfo,
)
from ..schema.splits import Split, SplitSpec
from ..schema.taxonomy import DefectClass
from .base import BaseAdapter
from .licenses import MVTEC_LOCO

CLASS_MAP: dict[str, DefectClass] = {
    "good": DefectClass.OK,
    "logical_anomalies": DefectClass.WRONG_ROUTING,
    "structural_anomalies": DefectClass.CONNECTOR_DAMAGE,
}


class MVTecLOCOAdapter(BaseAdapter):
    name = "mvtec_loco"
    license_info = MVTEC_LOCO

    def discover(self, root: Path) -> Iterable[Path]:
        for category_dir in sorted(p for p in root.iterdir() if p.is_dir()):
            for split_dir in ("train", "test"):
                images_dir = category_dir / split_dir
                if not images_dir.is_dir():
                    continue
                for defect_dir in sorted(p for p in images_dir.iterdir() if p.is_dir()):
                    for img_path in sorted(defect_dir.glob("*.png")):
                        yield img_path

    def to_record(self, raw: Path, root: Path, split_spec: SplitSpec) -> ImageRecord:
        rel = raw.relative_to(root)
        category, native_split, defect_name = rel.parts[0], rel.parts[1], rel.parts[2]
        split: Split = "train" if native_split == "train" else split_spec.assign(str(rel))
        defect = CLASS_MAP.get(defect_name, DefectClass.OK)
        width, height = self._image_dims(raw)
        record_id = f"mvtec_loco/{category}/{native_split}/{defect_name}/{raw.stem}"

        mask_ref = self._maybe_mask(root, category, defect_name, raw.stem)
        annotations: tuple[Annotation, ...] = ()
        if defect is not DefectClass.OK:
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
            split=split,
            source=SourceInfo(
                dataset="mvtec_loco",
                license=self.license_info.name,
                attribution="MVTec Software GmbH",
                original_id=str(rel),
            ),
            annotations=annotations,
            tags=(f"category:{category}", f"native_defect:{defect_name}"),
        )

    def _maybe_mask(
        self,
        root: Path,
        category: str,
        defect_name: str,
        stem: str,
    ) -> MaskRef | None:
        gt_dir = root / category / "ground_truth" / defect_name / stem
        if not gt_dir.is_dir():
            return None
        masks = sorted(gt_dir.glob("*.png"))
        if not masks:
            return None
        # LOCO ships one or more masks per sample; we expose the first one
        # and leave multi-mask fusion to a follow-up transform.
        first = masks[0]
        return MaskRef(
            uri=first.resolve().as_uri(),
            sha256=self._hash_file(first),
            encoding="png_binary",
        )
