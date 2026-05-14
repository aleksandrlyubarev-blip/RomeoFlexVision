"""MVTec AD 2 ingest adapter.

MVTec AD 2 (arXiv:2503.21622, IJCV 2026) is the 2026 successor to
MVTec AD. It adds 8 new industrial scenarios with > 8 000 high-res
images covering harder use cases: transparent / overlapping objects,
dark-field and back-light illumination, high-variance normal data,
and extremely small defects. SOTA methods sit below 60 % average
AU-PRO on it, which makes it the right benchmark to keep RoboQC
honest as the brigada-trained models mature.

Layout expected at ``root``::

    <scenario>/train/good/<id>.png
    <scenario>/validation/good/<id>.png
    <scenario>/test_public/good/<id>.png
    <scenario>/test_public/bad/<id>.png
    <scenario>/test_private/good/<id>.png         (held out)
    <scenario>/test_private/bad/<id>.png          (held out)
    <scenario>/ground_truth/test_public/bad/<id>_mask.png   (optional)

We ingest train/validation/test_public; the private split is
deliberately skipped because it is the leaderboard hold-out.

The native bad/good split is mapped to RoboQC's
:class:`DefectClass.CONNECTOR_DAMAGE` as a coarse default — each new
MVTec AD 2 scenario should be reclassified to the correct wedge
class as the team curates it (see :data:`SCENARIO_MAP`).
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
from .licenses import MVTEC_AD_2

# Per-scenario mapping is intentionally conservative — every "bad"
# sample lands on CONNECTOR_DAMAGE until the team labels a finer
# class. Override here as MVTec AD 2 scenarios get curated.
SCENARIO_MAP: dict[str, DefectClass] = {}

DEFAULT_DEFECT = DefectClass.CONNECTOR_DAMAGE

_NATIVE_SPLITS = ("train", "validation", "test_public")
_BAD_SUBSETS = ("bad",)
_GOOD_SUBSETS = ("good",)


class MVTecAD2Adapter(BaseAdapter):
    name = "mvtec_ad_2"
    license_info = MVTEC_AD_2

    def discover(self, root: Path) -> Iterable[Path]:
        for scenario_dir in sorted(p for p in root.iterdir() if p.is_dir()):
            for native_split in _NATIVE_SPLITS:
                split_dir = scenario_dir / native_split
                if not split_dir.is_dir():
                    continue
                for subset in sorted(p for p in split_dir.iterdir() if p.is_dir()):
                    yield from sorted(subset.glob("*.png"))

    def to_record(self, raw: Path, root: Path, split_spec: SplitSpec) -> ImageRecord:
        rel = raw.relative_to(root)
        scenario, native_split, subset = rel.parts[0], rel.parts[1], rel.parts[2]
        split: Split = (
            "train"
            if native_split == "train"
            else ("val" if native_split == "validation" else split_spec.assign(str(rel)))
        )
        is_bad = subset in _BAD_SUBSETS
        defect = SCENARIO_MAP.get(scenario, DEFAULT_DEFECT) if is_bad else DefectClass.OK
        width, height = self._image_dims(raw)
        record_id = f"mvtec_ad_2/{scenario}/{native_split}/{subset}/{raw.stem}"

        mask_ref = self._maybe_mask(root, scenario, native_split, subset, raw.stem) if is_bad else None
        annotations: tuple[Annotation, ...] = ()
        if is_bad:
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
                dataset="mvtec_ad_2",
                license=self.license_info.name,
                attribution="MVTec Software GmbH",
                original_id=str(rel),
            ),
            annotations=annotations,
            tags=(f"scenario:{scenario}", f"native_split:{native_split}", f"subset:{subset}"),
        )

    def _maybe_mask(
        self,
        root: Path,
        scenario: str,
        native_split: str,
        subset: str,
        stem: str,
    ) -> MaskRef | None:
        # MVTec AD 2 only ships masks for the public test split.
        if native_split != "test_public" or subset not in _BAD_SUBSETS:
            return None
        candidate = root / scenario / "ground_truth" / native_split / subset / f"{stem}_mask.png"
        if not candidate.is_file():
            return None
        return MaskRef(
            uri=candidate.resolve().as_uri(),
            sha256=self._hash_file(candidate),
            encoding="png_binary",
        )
