"""ISP-AD ingest adapter.

ISP-AD (Industrial Synthetic + Plant Anomaly Detection, arXiv:2503.04997)
mixes real and synthetic defects under a per-category layout. The
expected layout at ``root`` is::

    <category>/good/<id>.png                   (normal)
    <category>/defect/real/<id>.png            (real defects)
    <category>/defect/synthetic/<id>.png       (synthetic defects)
    <category>/masks/real/<id>.png             (optional)
    <category>/masks/synthetic/<id>.png        (optional)

We tag the provenance of each record with ``real`` or ``synthetic`` so
training experiments can ablate the contribution of the synthetic
subset.
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
from .licenses import ISP_AD


class ISPADAdapter(BaseAdapter):
    name = "isp_ad"
    license_info = ISP_AD

    def discover(self, root: Path) -> Iterable[Path]:
        for category_dir in sorted(p for p in root.iterdir() if p.is_dir()):
            good_dir = category_dir / "good"
            if good_dir.is_dir():
                for img_path in sorted(good_dir.glob("*.png")):
                    yield img_path
            for defect_origin in ("real", "synthetic"):
                defect_dir = category_dir / "defect" / defect_origin
                if not defect_dir.is_dir():
                    continue
                for img_path in sorted(defect_dir.glob("*.png")):
                    yield img_path

    def to_record(self, raw: Path, root: Path, split_spec: SplitSpec) -> ImageRecord:
        rel = raw.relative_to(root)
        parts = rel.parts
        category = parts[0]
        if parts[1] == "good":
            origin = "good"
            defect = DefectClass.OK
        else:
            origin = parts[2]  # real | synthetic
            defect = DefectClass.CONNECTOR_DAMAGE

        width, height = self._image_dims(raw)
        record_id = f"isp_ad/{category}/{origin}/{raw.stem}"

        mask_ref = self._maybe_mask(root, category, origin, raw.stem) if defect is not DefectClass.OK else None
        annotations: tuple[Annotation, ...] = ()
        if defect is not DefectClass.OK:
            annotations = (
                Annotation(
                    id=f"{record_id}#0",
                    defect_class=defect,
                    bbox=BBox(x=0.0, y=0.0, w=1.0, h=1.0, image_w=width, image_h=height),
                    mask=mask_ref,
                    provenance="human" if origin == "real" else "brigada",
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
                dataset="isp_ad",
                license=self.license_info.name,
                attribution="ISP-AD authors",
                original_id=str(rel),
            ),
            annotations=annotations,
            tags=(f"category:{category}", f"origin:{origin}"),
        )

    def _maybe_mask(self, root: Path, category: str, origin: str, stem: str) -> MaskRef | None:
        candidate = root / category / "masks" / origin / f"{stem}.png"
        if not candidate.is_file():
            return None
        return MaskRef(
            uri=candidate.resolve().as_uri(),
            sha256=self._hash_file(candidate),
            encoding="png_binary",
        )
