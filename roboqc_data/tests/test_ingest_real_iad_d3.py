"""Tests for the Real-IAD D3 ingest adapter."""

from __future__ import annotations

from _fixtures import make_real_iad_d3_tree

from roboqc_data.ingest.real_iad_d3 import RealIADD3Adapter
from roboqc_data.schema.splits import SplitSpec
from roboqc_data.schema.taxonomy import DefectClass


def test_real_iad_d3_builds_manifest_and_keeps_companion_modalities(tmp_path):
    root = make_real_iad_d3_tree(tmp_path / "raw")
    manifest = RealIADD3Adapter().build_manifest(root, SplitSpec(seed=13))

    # 3 RGB records: train/good, test/good, test/scratch
    assert len(manifest.records) == 3
    by_record_id = {r.record_id.split("/")[-2]: r for r in manifest.records}
    assert set(by_record_id) == {"good", "scratch"}

    scratch = next(r for r in manifest.records if "scratch" in r.record_id)
    assert scratch.annotations[0].defect_class is DefectClass.CONNECTOR_DAMAGE
    assert scratch.annotations[0].mask is not None
    assert scratch.source.dataset == "real_iad_d3"

    # Companion modality URIs are kept as tags.
    photometric_tag = next(t for t in scratch.tags if t.startswith("photometric:"))
    pointcloud_tag = next(t for t in scratch.tags if t.startswith("pointcloud:"))
    assert photometric_tag.endswith("/photometric/000.png")
    assert pointcloud_tag.endswith("/pointcloud/000.ply")


def test_real_iad_d3_train_split_is_native_train(tmp_path):
    root = make_real_iad_d3_tree(tmp_path / "raw")
    manifest = RealIADD3Adapter().build_manifest(root, SplitSpec(seed=13))
    train_record = next(r for r in manifest.records if "train/good" in r.record_id)
    assert train_record.split == "train"
