import json

import numpy as np
from PIL import Image

from roboqc_data.label_assist.grounded_sam2 import (
    LabelAssistant,
    LabelPrompt,
    StubGroundedSAM2Backend,
)
from roboqc_data.label_assist.review_export import write_review_queue
from roboqc_data.schema.taxonomy import DefectClass


def _make_image(path):
    Image.fromarray(np.full((48, 48, 3), 150, dtype=np.uint8)).save(path)


def test_label_assistant_emits_records_with_grounded_sam2_provenance(tmp_path):
    images = tmp_path / "imgs"
    images.mkdir()
    _make_image(images / "a.png")
    _make_image(images / "b.png")

    prompts = [
        LabelPrompt(text="screw", target_class=DefectClass.SCREW_MISSING),
        LabelPrompt(text="bent pin", target_class=DefectClass.CONNECTOR_DAMAGE),
    ]
    records = LabelAssistant().propose(images, prompts)
    assert len(records) == 2
    for record in records:
        assert record.source.dataset == "custom"
        assert len(record.annotations) == 2
        for ann in record.annotations:
            assert ann.provenance == "grounded_sam2"
            assert ann.confidence is not None
            assert ann.bbox is not None


def test_label_assistant_review_queue_round_trips(tmp_path):
    images = tmp_path / "imgs"
    images.mkdir()
    _make_image(images / "a.png")
    prompts = [LabelPrompt(text="screw", target_class=DefectClass.SCREW_MISSING)]
    records = LabelAssistant().propose(images, prompts)
    out = tmp_path / "queue.jsonl"
    write_review_queue(records, out)
    lines = [json.loads(line) for line in out.read_text().splitlines() if line.strip()]
    assert len(lines) == 1
    assert lines[0]["annotations"][0]["provenance"] == "grounded_sam2"


def test_stub_backend_name_is_recognisable():
    assert StubGroundedSAM2Backend().name == "stub-grounded-sam2"
