import json

from _fixtures import make_mvtec_ad_tree

from roboqc_data.export.anomalib_folder import manifest_to_anomalib_folder
from roboqc_data.export.coco import manifest_to_coco, write_coco
from roboqc_data.export.yolo_seg import CLASS_INDEX, CLASSES, manifest_to_yolo_seg
from roboqc_data.ingest.mvtec_ad import MVTecADAdapter
from roboqc_data.schema.splits import SplitSpec


def _build(tmp_path):
    root = make_mvtec_ad_tree(tmp_path / "raw")
    return MVTecADAdapter().build_manifest(root, SplitSpec(seed=11))


def test_coco_export_has_categories_and_images(tmp_path):
    manifest = _build(tmp_path)
    coco = manifest_to_coco(manifest)
    assert coco["info"]["manifest_sha256"] == manifest.manifest_sha256
    assert len(coco["images"]) == 3
    assert any(cat["name"] == "connector_damage" for cat in coco["categories"])
    assert any(ann["category_id"] for ann in coco["annotations"])


def test_coco_round_trips_to_disk(tmp_path):
    manifest = _build(tmp_path)
    path = write_coco(manifest, tmp_path / "out" / "coco.json")
    loaded = json.loads(path.read_text())
    assert loaded["info"]["manifest_sha256"] == manifest.manifest_sha256


def test_yolo_seg_export_writes_labels(tmp_path):
    manifest = _build(tmp_path)
    out = tmp_path / "yolo"
    data_yaml = manifest_to_yolo_seg(manifest, out)
    assert data_yaml.is_file()
    label_files = list((out).rglob("labels/*.txt"))
    assert len(label_files) == 3
    defect_files = [p for p in label_files if p.read_text().strip()]
    assert len(defect_files) == 1
    head = defect_files[0].read_text().split()
    assert head[0] == str(CLASS_INDEX["connector_damage"])
    assert "connector_damage" in CLASSES


def test_anomalib_folder_layout(tmp_path):
    manifest = _build(tmp_path)
    out = tmp_path / "anomalib"
    manifest_to_anomalib_folder(manifest, out)
    assert (out / "normal").is_dir()
    assert (out / "abnormal").is_dir()
    assert (out / "ground_truth").is_dir()
    assert len(list((out / "normal").iterdir())) == 2
    assert len(list((out / "abnormal").iterdir())) == 1
    assert (out / "summary.txt").read_text().splitlines()[0].startswith("normal=")
