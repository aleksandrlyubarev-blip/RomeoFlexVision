"""PKU-Market-PCB ingest adapter.

PKU-PCB labels 6 small-defect classes on printed circuit boards:
missing_hole, mouse_bite, open_circuit, short, spur, spurious_copper.

Layout expected at ``root``::

    images/<defect_name>/<id>.jpg
    Annotations/<defect_name>/<id>.txt   (one bbox per line: cls x1 y1 x2 y2)

Each ``.txt`` annotation in PKU-PCB stores absolute pixel coordinates
(x1, y1, x2, y2). We normalise them to the canonical [0,1] bbox form.
"""

from __future__ import annotations

from pathlib import Path
from typing import Iterable

from ..schema.records import (
    Annotation,
    BBox,
    ImageRecord,
    SourceInfo,
)
from ..schema.splits import SplitSpec
from ..schema.taxonomy import DefectClass
from .base import BaseAdapter
from .licenses import PKU_PCB

CLASS_MAP: dict[str, DefectClass] = {
    "missing_hole": DefectClass.CONNECTOR_DAMAGE,
    "mouse_bite": DefectClass.CONNECTOR_DAMAGE,
    "open_circuit": DefectClass.CABLE_NOT_SEATED,
    "short": DefectClass.CABLE_CROSSED,
    "spur": DefectClass.CONNECTOR_DAMAGE,
    "spurious_copper": DefectClass.CONNECTOR_DAMAGE,
}

_IMAGE_SUFFIXES = (".jpg", ".jpeg", ".png", ".JPG", ".JPEG", ".PNG")


class PKUPCBAdapter(BaseAdapter):
    name = "pku_pcb"
    license_info = PKU_PCB

    def discover(self, root: Path) -> Iterable[Path]:
        images_root = root / "images"
        if not images_root.is_dir():
            return
        for defect_dir in sorted(p for p in images_root.iterdir() if p.is_dir()):
            for img_path in sorted(defect_dir.iterdir()):
                if img_path.suffix in _IMAGE_SUFFIXES:
                    yield img_path

    def to_record(self, raw: Path, root: Path, split_spec: SplitSpec) -> ImageRecord:
        rel = raw.relative_to(root)
        defect_name = rel.parts[1]
        defect = CLASS_MAP.get(defect_name, DefectClass.OK)
        width, height = self._image_dims(raw)
        record_id = f"pku_pcb/{defect_name}/{raw.stem}"

        ann_path = root / "Annotations" / defect_name / f"{raw.stem}.txt"
        annotations = self._parse_annotations(ann_path, defect, record_id, width, height)

        return ImageRecord(
            record_id=record_id,
            uri=raw.resolve().as_uri(),
            sha256=self._hash_file(raw),
            width=width,
            height=height,
            split=split_spec.assign(record_id),
            source=SourceInfo(
                dataset="pku_pcb",
                license=self.license_info.name,
                attribution="PKU OL Lab",
                original_id=str(rel),
            ),
            annotations=annotations,
            tags=(f"native_defect:{defect_name}",),
        )

    @staticmethod
    def _parse_annotations(
        ann_path: Path,
        defect: DefectClass,
        record_id: str,
        width: int,
        height: int,
    ) -> tuple[Annotation, ...]:
        if not ann_path.is_file() or defect is DefectClass.OK:
            return ()
        out: list[Annotation] = []
        for idx, line in enumerate(ann_path.read_text().splitlines()):
            parts = line.strip().split()
            if len(parts) < 5:
                continue
            try:
                x1, y1, x2, y2 = (float(parts[-4]), float(parts[-3]), float(parts[-2]), float(parts[-1]))
            except ValueError:
                continue
            x = max(0.0, min(x1, x2) / width)
            y = max(0.0, min(y1, y2) / height)
            w = max(1.0, abs(x2 - x1)) / width
            h = max(1.0, abs(y2 - y1)) / height
            w = min(w, 1.0 - x)
            h = min(h, 1.0 - y)
            if w <= 0.0 or h <= 0.0:
                continue
            out.append(
                Annotation(
                    id=f"{record_id}#{idx}",
                    defect_class=defect,
                    bbox=BBox(x=x, y=y, w=w, h=h, image_w=width, image_h=height),
                    provenance="human",
                )
            )
        return tuple(out)
