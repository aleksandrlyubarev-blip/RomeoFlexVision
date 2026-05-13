from datetime import UTC, datetime

import pytest
from pydantic import ValidationError

from roboqc_data.schema.hashing import manifest_digest, sha256_bytes
from roboqc_data.schema.records import (
    Annotation,
    BBox,
    ImageRecord,
    Manifest,
    SourceInfo,
)
from roboqc_data.schema.splits import SplitSpec
from roboqc_data.schema.taxonomy import (
    TAXONOMY,
    TAXONOMY_VERSION,
    DefectCategory,
    DefectClass,
    category_of,
)


def test_taxonomy_covers_all_defect_classes():
    for defect in DefectClass:
        assert defect in TAXONOMY, f"taxonomy missing mapping for {defect}"


def test_category_of():
    assert category_of(DefectClass.SCREW_MISSING) is DefectCategory.FASTENER
    assert category_of(DefectClass.LEAK) is DefectCategory.FLUID
    assert category_of(DefectClass.OK) is DefectCategory.OK


def test_bbox_strict_validation():
    with pytest.raises(ValidationError):
        BBox(x=0.1, y=0.1, w=0.0, h=0.1, image_w=100, image_h=100)
    with pytest.raises(ValidationError):
        BBox(x=1.1, y=0.1, w=0.5, h=0.5, image_w=100, image_h=100)


def test_image_record_frozen():
    rec = _make_record("rec_1", DefectClass.OK)
    with pytest.raises(ValidationError):
        rec.record_id = "other"  # type: ignore[misc]


def test_manifest_round_trip():
    rec = _make_record("rec_1", DefectClass.SCREW_MISSING)
    digest = manifest_digest([(rec.record_id, rec.sha256)])
    manifest = Manifest(
        manifest_id="m1",
        created_at=datetime(2026, 5, 13, tzinfo=UTC),
        seed=42,
        manifest_sha256=digest,
        records=(rec,),
    )
    blob = manifest.model_dump_json()
    restored = Manifest.model_validate_json(blob)
    assert restored == manifest
    assert restored.taxonomy_version == TAXONOMY_VERSION


def test_split_spec_must_sum_to_one():
    with pytest.raises(ValidationError):
        SplitSpec(train=0.5, val=0.3, test=0.3)


def test_split_assignment_is_deterministic():
    spec = SplitSpec(seed=7)
    assert spec.assign("rec_a") == spec.assign("rec_a")
    distribution = {"train": 0, "val": 0, "test": 0}
    for i in range(500):
        distribution[spec.assign(f"rec_{i}")] += 1
    # roughly 0.8 / 0.1 / 0.1 — generous tolerance
    assert distribution["train"] > 380
    assert distribution["val"] > 30
    assert distribution["test"] > 30


def test_manifest_digest_is_order_independent():
    pairs = [("a", sha256_bytes(b"1")), ("b", sha256_bytes(b"2"))]
    assert manifest_digest(pairs) == manifest_digest(list(reversed(pairs)))


def _make_record(record_id: str, defect: DefectClass) -> ImageRecord:
    ann = Annotation(
        id=f"{record_id}_a1",
        defect_class=defect,
        bbox=BBox(x=0.1, y=0.1, w=0.2, h=0.2, image_w=100, image_h=100),
        provenance="human",
    )
    return ImageRecord(
        record_id=record_id,
        uri=f"file:///fake/{record_id}.png",
        sha256=sha256_bytes(record_id.encode()),
        width=100,
        height=100,
        split="train",
        source=SourceInfo(
            dataset="mvtec_ad",
            license="CC BY-NC-SA 4.0",
            original_id=record_id,
        ),
        annotations=(ann,),
    )
