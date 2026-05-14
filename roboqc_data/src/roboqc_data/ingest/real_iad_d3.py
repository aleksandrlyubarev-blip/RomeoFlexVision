"""Real-IAD D3 ingest adapter.

Real-IAD D3 is a multimodal industrial anomaly detection dataset that
ships, per object, three aligned views: a high-resolution 2D RGB image,
a micrometre-scale 3D point cloud, and a photometric-stereo pseudo-3D
depth map. This is exactly the combination NotebookLM flagged as
useful for topology-heavy defects on PCB solder bridges, micrometre
dents, and similar fine surface features.

Layout expected at ``root``::

    <category>/train/good/rgb/<id>.png
    <category>/train/good/pointcloud/<id>.ply
    <category>/train/good/photometric/<id>.png
    <category>/test/good/rgb/<id>.png
    <category>/test/<defect>/rgb/<id>.png
    <category>/test/<defect>/pointcloud/<id>.ply
    <category>/test/<defect>/photometric/<id>.png
    <category>/ground_truth/<defect>/<id>_mask.png   (optional, 2D mask)

We only ingest the RGB stream into the canonical Manifest; the 3D
point-cloud and photometric companions live alongside and are
referenced via tags so a downstream multimodal trainer can pick them
up without re-walking the tree.
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
from .licenses import REAL_IAD_D3

# Real-IAD D3 native defect names → wedge taxonomy. Conservative until
# the team curates per-defect class mapping.
DEFECT_MAP: dict[str, DefectClass] = {
    "good": DefectClass.OK,
    "scratch": DefectClass.CONNECTOR_DAMAGE,
    "dent": DefectClass.CONNECTOR_DAMAGE,
    "missing": DefectClass.SCREW_MISSING,
    "misalign": DefectClass.CONNECTOR_NOT_SEATED,
    "solder_bridge": DefectClass.CABLE_CROSSED,
}


class RealIADD3Adapter(BaseAdapter):
    name = "real_iad_d3"
    license_info = REAL_IAD_D3

    def discover(self, root: Path) -> Iterable[Path]:
        for category_dir in sorted(p for p in root.iterdir() if p.is_dir()):
            for native_split in ("train", "test"):
                split_dir = category_dir / native_split
                if not split_dir.is_dir():
                    continue
                for defect_dir in sorted(p for p in split_dir.iterdir() if p.is_dir()):
                    rgb_dir = defect_dir / "rgb"
                    if rgb_dir.is_dir():
                        yield from sorted(rgb_dir.glob("*.png"))

    def to_record(self, raw: Path, root: Path, split_spec: SplitSpec) -> ImageRecord:
        rel = raw.relative_to(root)
        # <category>/<native_split>/<defect>/rgb/<id>.png
        category, native_split, defect_name = rel.parts[0], rel.parts[1], rel.parts[2]
        split: Split = "train" if native_split == "train" else split_spec.assign(str(rel))
        defect = DEFECT_MAP.get(defect_name, DefectClass.OK)
        width, height = self._image_dims(raw)
        record_id = f"real_iad_d3/{category}/{native_split}/{defect_name}/{raw.stem}"

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

        # Companion modalities — paths only, kept as tags so a
        # multimodal trainer can pick them up without re-walking.
        companion_dir = raw.parent.parent
        tags: list[str] = [f"category:{category}", f"native_defect:{defect_name}"]
        for modality, ext in (("pointcloud", "ply"), ("photometric", "png")):
            companion = companion_dir / modality / f"{raw.stem}.{ext}"
            if companion.is_file():
                tags.append(f"{modality}:{companion.resolve().as_uri()}")

        return ImageRecord(
            record_id=record_id,
            uri=raw.resolve().as_uri(),
            sha256=self._hash_file(raw),
            width=width,
            height=height,
            split=split,
            source=SourceInfo(
                dataset="real_iad_d3",
                license=self.license_info.name,
                attribution="Real-IAD D3 authors",
                original_id=str(rel),
            ),
            annotations=annotations,
            tags=tuple(tags),
        )

    def _maybe_mask(self, root: Path, category: str, defect_name: str, stem: str) -> MaskRef | None:
        candidate = root / category / "ground_truth" / defect_name / f"{stem}_mask.png"
        if not candidate.is_file():
            return None
        return MaskRef(
            uri=candidate.resolve().as_uri(),
            sha256=self._hash_file(candidate),
            encoding="png_binary",
        )
