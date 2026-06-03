from _fixtures import (
    make_isp_ad_tree,
    make_mvtec_loco_tree,
    make_pku_pcb_tree,
    make_visa_tree,
)

from roboqc_data.ingest.isp_ad import ISPADAdapter
from roboqc_data.ingest.mvtec_loco import MVTecLOCOAdapter
from roboqc_data.ingest.pku_pcb import PKUPCBAdapter
from roboqc_data.ingest.visa import VisAAdapter
from roboqc_data.schema.splits import SplitSpec
from roboqc_data.schema.taxonomy import DefectClass


def test_visa_adapter_separates_normal_and_anomaly(tmp_path):
    root = make_visa_tree(tmp_path / "raw")
    manifest = VisAAdapter().build_manifest(root, SplitSpec(seed=3))
    assert len(manifest.records) == 2
    anomaly = [r for r in manifest.records if r.annotations]
    normal = [r for r in manifest.records if not r.annotations]
    assert len(anomaly) == 1 and len(normal) == 1
    assert anomaly[0].annotations[0].mask is not None
    assert anomaly[0].source.dataset == "visa"


def test_mvtec_loco_maps_logical_and_structural_anomalies(tmp_path):
    root = make_mvtec_loco_tree(tmp_path / "raw")
    manifest = MVTecLOCOAdapter().build_manifest(root, SplitSpec(seed=4))
    classes = {a.defect_class for r in manifest.records for a in r.annotations}
    assert DefectClass.WRONG_ROUTING in classes
    assert DefectClass.CONNECTOR_DAMAGE in classes
    structural = next(
        r for r in manifest.records if any(a.defect_class is DefectClass.CONNECTOR_DAMAGE for a in r.annotations)
    )
    assert structural.annotations[0].mask is not None


def test_isp_ad_tags_real_and_synthetic_provenance(tmp_path):
    root = make_isp_ad_tree(tmp_path / "raw")
    manifest = ISPADAdapter().build_manifest(root, SplitSpec(seed=6))
    by_origin = {tag for r in manifest.records for tag in r.tags if tag.startswith("origin:")}
    assert by_origin == {"origin:good", "origin:real", "origin:synthetic"}
    provenances = {a.provenance for r in manifest.records for a in r.annotations}
    assert provenances == {"human", "brigada"}


def test_pku_pcb_normalises_bbox_coordinates(tmp_path):
    root = make_pku_pcb_tree(tmp_path / "raw")
    manifest = PKUPCBAdapter().build_manifest(root, SplitSpec(seed=8))
    assert len(manifest.records) == 1
    record = manifest.records[0]
    assert len(record.annotations) == 1
    bbox = record.annotations[0].bbox
    assert bbox is not None
    assert 0.0 <= bbox.x <= 1.0 and 0.0 <= bbox.y <= 1.0
    assert 0.0 < bbox.w <= 1.0 and 0.0 < bbox.h <= 1.0
    assert record.annotations[0].defect_class is DefectClass.CABLE_CROSSED
