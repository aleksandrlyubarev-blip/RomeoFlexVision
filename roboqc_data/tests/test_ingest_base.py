import json

from _fixtures import make_mvtec_ad_tree

from roboqc_data.ingest.base import write_manifest_jsonl
from roboqc_data.ingest.mvtec_ad import MVTecADAdapter
from roboqc_data.schema.records import Manifest
from roboqc_data.schema.splits import SplitSpec
from roboqc_data.schema.taxonomy import DefectClass


def test_mvtec_ad_adapter_builds_manifest(tmp_path):
    root = make_mvtec_ad_tree(tmp_path / "raw")
    adapter = MVTecADAdapter()
    manifest = adapter.build_manifest(root, SplitSpec(seed=11))

    assert len(manifest.records) == 3
    classes = {ann.defect_class for r in manifest.records for ann in r.annotations}
    assert DefectClass.CONNECTOR_DAMAGE in classes
    ok_records = [r for r in manifest.records if not r.annotations]
    assert len(ok_records) == 2
    # mask was discovered for the scratch sample
    defect_record = next(r for r in manifest.records if r.annotations)
    assert defect_record.annotations[0].mask is not None


def test_manifest_round_trip_to_disk(tmp_path):
    root = make_mvtec_ad_tree(tmp_path / "raw")
    adapter = MVTecADAdapter()
    manifest = adapter.build_manifest(root, SplitSpec(seed=11))

    out_dir = tmp_path / "out"
    manifest_path, records_path = write_manifest_jsonl(manifest, out_dir)
    header = json.loads(manifest_path.read_text())
    assert header["manifest_sha256"] == manifest.manifest_sha256
    assert header["records"] == []

    lines = records_path.read_text().strip().splitlines()
    assert len(lines) == len(manifest.records)
    rehydrated = Manifest.model_validate_json(json.dumps({**header, "records": [json.loads(line) for line in lines]}))
    assert rehydrated == manifest


def test_ingest_reproducibility_same_root_same_digest(tmp_path):
    root = make_mvtec_ad_tree(tmp_path / "raw")
    adapter = MVTecADAdapter()
    a = adapter.build_manifest(root, SplitSpec(seed=11))
    b = adapter.build_manifest(root, SplitSpec(seed=11))
    assert a.manifest_sha256 == b.manifest_sha256
