"""MVTec AD ingest adapter.

Layout expected at ``root``::

    <category>/train/good/<id>.png       -> OK, split=train
    <category>/test/good/<id>.png        -> OK, split=test
    <category>/test/<defect>/<id>.png    -> defect, split=test
    <category>/ground_truth/<defect>/<id>_mask.png  (optional)

Per-category native defect names are mapped to :class:`DefectClass`
via :data:`CLASS_MAP`. Unmapped defects fall back to OK with a tag
so they are not silently lost.
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
from ..schema.splits import Split, SplitSpec
from ..schema.taxonomy import DefectClass
from .base import BaseAdapter
from .licenses import MVTEC_AD

CLASS_MAP: dict[str, DefectClass] = {
    "good": DefectClass.OK,
    "scratch": DefectClass.CONNECTOR_DAMAGE,
    "scratch_head": DefectClass.CONNECTOR_DAMAGE,
    "scratch_neck": DefectClass.CONNECTOR_DAMAGE,
    "bent": DefectClass.CONNECTOR_DAMAGE,
    "bent_lead": DefectClass.CONNECTOR_DAMAGE,
    "bent_wire": DefectClass.CABLE_CROSSED,
    "cut": DefectClass.CABLE_CROSSED,
    "cut_inner_insulation": DefectClass.CABLE_NOT_SEATED,
    "cut_outer_insulation": DefectClass.CABLE_NOT_SEATED,
    "missing_wire": DefectClass.CABLE_NOT_SEATED,
    "missing_cable": DefectClass.CABLE_NOT_SEATED,
    "poke_insulation": DefectClass.CABLE_NOT_SEATED,
    "broken": DefectClass.LATCH_BROKEN,
    "broken_large": DefectClass.LATCH_BROKEN,
    "broken_small": DefectClass.LATCH_BROKEN,
    "fabric_interior": DefectClass.CONNECTOR_DAMAGE,
    "metal_contamination": DefectClass.CONNECTOR_DAMAGE,
    "thread": DefectClass.WRONG_ROUTING,
    "color": DefectClass.CONNECTOR_DAMAGE,
    "hole": DefectClass.CONNECTOR_DAMAGE,
}


class MVTecADAdapter(BaseAdapter):
    name = "mvtec_ad"
    license_info = MVTEC_AD

    def discover(self, root: Path) -> Iterable[Path]:
        for category_dir in sorted(p for p in root.iterdir() if p.is_dir()):
            for split_dir in ("train", "test"):
                images_dir = category_dir / split_dir
                if not images_dir.is_dir():
                    continue
                for defect_dir in sorted(p for p in images_dir.iterdir() if p.is_dir()):
                    yield from sorted(defect_dir.glob("*.png"))

    def to_record(self, raw: Path, root: Path, split_spec: SplitSpec) -> ImageRecord:
        rel = raw.relative_to(root)
        category, native_split, defect_name = rel.parts[0], rel.parts[1], rel.parts[2]
        split: Split = "train" if native_split == "train" else split_spec.assign(str(rel))
        defect = CLASS_MAP.get(defect_name, DefectClass.OK)
        width, height = self._image_dims(raw)
        content_sha = self._hash_file(raw)
        record_id = f"mvtec_ad/{category}/{native_split}/{defect_name}/{raw.stem}"

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
            sha256=content_sha,
            width=width,
            height=height,
            split=split,
            source=SourceInfo(
                dataset="mvtec_ad",
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
        candidate = root / category / "ground_truth" / defect_name / f"{stem}_mask.png"
        if not candidate.is_file():
            return None
        return MaskRef(
            uri=candidate.resolve().as_uri(),
            sha256=self._hash_file(candidate),
            encoding="png_binary",
        )
