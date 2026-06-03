"""Tests for the MVTec AD 2 ingest adapter."""

from __future__ import annotations

from _fixtures import make_mvtec_ad_2_tree

from roboqc_data.ingest.mvtec_ad_2 import MVTecAD2Adapter
from roboqc_data.schema.splits import SplitSpec
from roboqc_data.schema.taxonomy import DefectClass


def test_mvtec_ad_2_adapter_emits_train_val_and_test_records(tmp_path):
    root = make_mvtec_ad_2_tree(tmp_path / "raw")
    manifest = MVTecAD2Adapter().build_manifest(root, SplitSpec(seed=19))

    # 4 records: train/good, validation/good, test_public/good, test_public/bad
    assert len(manifest.records) == 4
    bad_records = [r for r in manifest.records if r.annotations]
    good_records = [r for r in manifest.records if not r.annotations]
    assert len(bad_records) == 1
    assert len(good_records) == 3
    bad = bad_records[0]
    assert bad.annotations[0].defect_class is DefectClass.CONNECTOR_DAMAGE
    assert bad.annotations[0].mask is not None
    assert bad.source.dataset == "mvtec_ad_2"
    assert bad.source.license == "MVTec AD 2"


def test_mvtec_ad_2_train_record_has_train_split(tmp_path):
    root = make_mvtec_ad_2_tree(tmp_path / "raw")
    manifest = MVTecAD2Adapter().build_manifest(root, SplitSpec(seed=19))
    train_record = next(r for r in manifest.records if "train/good" in r.record_id)
    val_record = next(r for r in manifest.records if "validation/good" in r.record_id)
    assert train_record.split == "train"
    assert val_record.split == "val"


def test_mvtec_ad_2_tags_carry_scenario_and_subset(tmp_path):
    root = make_mvtec_ad_2_tree(tmp_path / "raw", scenario="overlapping_objects")
    manifest = MVTecAD2Adapter().build_manifest(root, SplitSpec(seed=19))
    tags = {tag for r in manifest.records for tag in r.tags}
    assert "scenario:overlapping_objects" in tags
    assert "subset:bad" in tags
    assert "subset:good" in tags
