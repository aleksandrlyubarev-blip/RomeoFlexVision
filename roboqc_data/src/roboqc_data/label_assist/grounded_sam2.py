"""Grounded SAM 2 label-assist (bootstrap-only).

This module proposes masks from a text prompt by chaining Grounding DINO
(open-vocabulary detection) and SAM 2 (segmentation). It is **not** a
runtime inference path — the output is a queue of canonical
``Annotation`` records with ``provenance="grounded_sam2"`` for human
review.

The real backend wrapper lives behind a Protocol so we can swap in a
remote service, an Ultralytics SAM2 export, or the reference
IDEA-Research repo without touching the canonical pipeline. The
default :class:`StubGroundedSAM2Backend` returns deterministic
mid-image boxes — it exists so CI can exercise the wiring without
downloading model weights.
"""

from __future__ import annotations

from pathlib import Path
from typing import Protocol
from uuid import uuid4

from pydantic import BaseModel, ConfigDict, Field

from ..ingest.base import BaseAdapter
from ..schema.records import Annotation, BBox, ImageRecord, MaskRef, SourceInfo
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


class GroundedSAM2Backend(Protocol):
    """Structural type the real backend must satisfy."""

    name: str

    def detect(self, image_path: Path, prompt: LabelPrompt) -> list[Proposal]: ...


class StubGroundedSAM2Backend:
    """Deterministic backend for tests and CI.

    Returns one centred bounding box per prompt at the configured
    confidence threshold. No mask is produced — that signals to the
    caller that a real backend is needed for segmentation.
    """

    name = "stub-grounded-sam2"

    def detect(self, image_path: Path, prompt: LabelPrompt) -> list[Proposal]:
        from PIL import Image

        with Image.open(image_path) as im:
            width, height = im.width, im.height
        bbox = BBox(x=0.25, y=0.25, w=0.5, h=0.5, image_w=width, image_h=height)
        return [Proposal(bbox=bbox, mask=None, confidence=prompt.box_threshold)]


class LabelAssistant:
    """Bootstraps weak labels for an unlabelled image folder.

    Args:
        backend: any :class:`GroundedSAM2Backend`-shaped object.
            Defaults to :class:`StubGroundedSAM2Backend`.

    Example:
        >>> assistant = LabelAssistant()
        >>> prompts = [LabelPrompt(text="screw", target_class=DefectClass.SCREW_MISSING)]
        >>> # assistant.propose(images_dir, prompts) -> list[ImageRecord]
    """

    def __init__(self, backend: GroundedSAM2Backend | None = None) -> None:
        self.backend = backend or StubGroundedSAM2Backend()

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
                            provenance="grounded_sam2",
                        )
                    )
            width, height = BaseAdapter._image_dims(image_path)
            record_id = f"grounded_sam2/{image_path.stem}"
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
                        attribution="grounded_sam2 backend: " + self.backend.name,
                        original_id=str(image_path),
                    ),
                    annotations=tuple(annotations),
                    tags=(f"backend:{self.backend.name}",),
                )
            )
        return records
