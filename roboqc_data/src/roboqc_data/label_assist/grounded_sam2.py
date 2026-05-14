"""Label-assist scaffolding (bootstrap-only, never runtime).

Originally targeted Grounded SAM 2 (Grounding DINO + Florence-2 + SAM 2);
the canonical backend is now SAM 3 (see :mod:`roboqc_data.label_assist.sam3`),
which folds open-vocabulary detection and segmentation into one model and
ships better numbers on industrial defects per the Nov-2025 release
(arXiv:2511.16719). This module keeps the shared types and orchestration
so any Protocol-shaped backend plugs in.

Output is a queue of canonical ``Annotation`` records with provenance
set by the backend (``"sam3"`` for SAM 3 / 3.1, ``"grounded_sam2"`` for
the legacy chain) for human review.
"""

from __future__ import annotations

from pathlib import Path
from typing import Protocol
from uuid import uuid4

from pydantic import BaseModel, ConfigDict, Field

from ..ingest.base import BaseAdapter
from ..schema.records import Annotation, BBox, ImageRecord, MaskRef, Provenance, SourceInfo
from ..schema.splits import SplitSpec
from ..schema.taxonomy import DefectClass

_IMAGE_SUFFIXES = (".jpg", ".jpeg", ".png", ".JPG", ".JPEG", ".PNG")


class LabelPrompt(BaseModel):
    model_config = ConfigDict(strict=True, frozen=True)

    text: str
    target_class: DefectClass
    box_threshold: float = Field(default=0.35, ge=0.0, le=1.0)
    text_threshold: float = Field(default=0.25, ge=0.0, le=1.0)


class Proposal(BaseModel):
    """A single backend hit before it is folded into an Annotation."""

    model_config = ConfigDict(strict=True, frozen=True)

    bbox: BBox
    mask: MaskRef | None
    confidence: float = Field(ge=0.0, le=1.0)


class LabelAssistBackend(Protocol):
    """Structural type every label-assist backend must satisfy."""

    name: str
    provenance: Provenance

    def detect(self, image_path: Path, prompt: LabelPrompt) -> list[Proposal]: ...


# Back-compat alias — older code/imports reference GroundedSAM2Backend.
GroundedSAM2Backend = LabelAssistBackend


class StubGroundedSAM2Backend:
    """Deterministic backend for tests and CI.

    Returns one centred bounding box per prompt at the configured
    confidence threshold. No mask is produced — that signals to the
    caller that a real backend is needed for segmentation.
    """

    name = "stub-grounded-sam2"
    provenance: Provenance = "grounded_sam2"

    def detect(self, image_path: Path, prompt: LabelPrompt) -> list[Proposal]:
        from PIL import Image

        with Image.open(image_path) as im:
            width, height = im.width, im.height
        bbox = BBox(x=0.25, y=0.25, w=0.5, h=0.5, image_w=width, image_h=height)
        return [Proposal(bbox=bbox, mask=None, confidence=prompt.box_threshold)]


def _default_backend() -> LabelAssistBackend:
    """Prefer a real SAM 3 backend; fall back to the deterministic stub.

    SAM 3 was released by Meta in Nov 2025 and supersedes the
    Grounded SAM 2 pipeline for our open-vocabulary label-assist
    use case. We import lazily so the dependency stays optional.
    """
    try:
        from .sam3 import Sam3Backend  # noqa: PLC0415

        return Sam3Backend()
    except Exception:
        return StubGroundedSAM2Backend()


class LabelAssistant:
    """Bootstraps weak labels for an unlabelled image folder.

    Args:
        backend: any :class:`LabelAssistBackend`-shaped object.
            Defaults to a real SAM 3 backend if installed, otherwise
            :class:`StubGroundedSAM2Backend`.

    Example:
        >>> assistant = LabelAssistant()
        >>> prompts = [LabelPrompt(text="screw", target_class=DefectClass.SCREW_MISSING)]
        >>> # assistant.propose(images_dir, prompts) -> list[ImageRecord]
    """

    def __init__(self, backend: LabelAssistBackend | None = None) -> None:
        self.backend = backend or _default_backend()

    def propose(
        self,
        image_dir: Path,
        prompts: list[LabelPrompt],
        split_spec: SplitSpec | None = None,
    ) -> list[ImageRecord]:
        if not prompts:
            raise ValueError("at least one LabelPrompt is required")
        split = split_spec or SplitSpec(seed=0)
        records: list[ImageRecord] = []
        for image_path in sorted(p for p in image_dir.rglob("*") if p.suffix in _IMAGE_SUFFIXES):
            annotations: list[Annotation] = []
            for prompt in prompts:
                for hit in self.backend.detect(image_path, prompt):
                    annotations.append(
                        Annotation(
                            id=f"{image_path.stem}#{uuid4().hex[:8]}",
                            defect_class=prompt.target_class,
                            bbox=hit.bbox,
                            mask=hit.mask,
                            confidence=hit.confidence,
                            provenance=self.backend.provenance,
                        )
                    )
            width, height = BaseAdapter._image_dims(image_path)
            record_id = f"{self.backend.provenance}/{image_path.stem}"
            records.append(
                ImageRecord(
                    record_id=record_id,
                    uri=image_path.resolve().as_uri(),
                    sha256=BaseAdapter._hash_file(image_path),
                    width=width,
                    height=height,
                    split=split.assign(record_id),
                    source=SourceInfo(
                        dataset="custom",
                        license="see-attribution",
                        attribution=f"label-assist backend: {self.backend.name}",
                        original_id=str(image_path),
                    ),
                    annotations=tuple(annotations),
                    tags=(f"backend:{self.backend.name}",),
                )
            )
        return records
