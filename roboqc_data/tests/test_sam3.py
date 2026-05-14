"""Tests for the SAM 3 label-assist backend.

In CI without GPU/weights we exercise three things:
1. Construction without ``sam3`` installed raises a clear RuntimeError.
2. The Protocol contract is satisfied (name + provenance + detect signature).
3. A hand-rolled fake predictor produces canonical Proposals.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pytest
from PIL import Image

from roboqc_data.label_assist.grounded_sam2 import LabelAssistant, LabelPrompt
from roboqc_data.label_assist.sam3 import Sam3Backend
from roboqc_data.schema.taxonomy import DefectClass


def test_sam3_backend_raises_when_dependency_missing():
    with pytest.raises(RuntimeError, match="sam3 package is not installed"):
        Sam3Backend()


def test_sam3_backend_advertises_protocol_fields():
    assert Sam3Backend.name == "sam3"
    assert Sam3Backend.provenance == "sam3"
    # detect is defined and accepts (image_path, prompt) — instance method check.
    assert callable(getattr(Sam3Backend, "detect", None))


class _FakeSam3Backend:
    """In-test stand-in mirroring the Sam3Backend Protocol."""

    name = "sam3"
    provenance = "sam3"

    def detect(self, image_path: Path, prompt: LabelPrompt):
        from roboqc_data.label_assist.grounded_sam2 import Proposal
        from roboqc_data.schema.records import BBox

        with Image.open(image_path) as im:
            width, height = im.width, im.height
        bbox = BBox(x=0.1, y=0.1, w=0.4, h=0.3, image_w=width, image_h=height)
        return [Proposal(bbox=bbox, mask=None, confidence=0.9)]


def test_label_assistant_with_sam3_shaped_backend_records_sam3_provenance(tmp_path):
    images = tmp_path / "imgs"
    images.mkdir()
    Image.fromarray(np.full((48, 48, 3), 120, dtype=np.uint8)).save(images / "a.png")

    assistant = LabelAssistant(backend=_FakeSam3Backend())
    prompts = [LabelPrompt(text="missing screw", target_class=DefectClass.SCREW_MISSING)]
    records = assistant.propose(images, prompts)

    assert len(records) == 1
    record = records[0]
    assert record.record_id.startswith("sam3/")
    assert record.tags == ("backend:sam3",)
    assert len(record.annotations) == 1
    annotation = record.annotations[0]
    assert annotation.provenance == "sam3"
    assert annotation.confidence == pytest.approx(0.9)
    assert annotation.bbox is not None
    assert annotation.bbox.w == pytest.approx(0.4)
