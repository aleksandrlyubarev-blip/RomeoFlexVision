import numpy as np
import pytest

from roboqc_data.brigada.cv_layer.cable_crossed import CableCrossed
from roboqc_data.brigada.cv_layer.latch_open import LatchOpen
from roboqc_data.brigada.cv_layer.registry import DEFECT_TRANSFORMS, get_transform
from roboqc_data.brigada.cv_layer.screw_missing import ScrewMissing
from roboqc_data.schema.taxonomy import DefectClass


@pytest.mark.parametrize(
    "transform_cls, defect",
    [
        (ScrewMissing, DefectClass.SCREW_MISSING),
        (CableCrossed, DefectClass.CABLE_CROSSED),
        (LatchOpen, DefectClass.LATCH_OPEN),
    ],
)
def test_transform_produces_non_empty_mask_and_modifies_pixels(transform_cls, defect):
    img = np.full((96, 96, 3), 120, dtype=np.uint8)
    rgb, mask = transform_cls().apply(img, {}, np.random.default_rng(0))
    assert mask.shape == (96, 96)
    assert mask.max() == 255
    assert mask.sum() > 0
    assert not np.array_equal(rgb, img)
    assert transform_cls.defect_class is defect


def test_registry_covers_new_wedge_classes():
    for cls in (
        DefectClass.SCREW_MISSING,
        DefectClass.CABLE_CROSSED,
        DefectClass.LATCH_OPEN,
        DefectClass.CONNECTOR_DAMAGE,
    ):
        transform = get_transform(cls)
        assert transform.defect_class is cls
        assert cls in DEFECT_TRANSFORMS


@pytest.mark.parametrize(
    "transform_cls",
    [ScrewMissing, CableCrossed, LatchOpen],
)
def test_transforms_are_deterministic_under_same_seed(transform_cls):
    img = np.full((96, 96, 3), 80, dtype=np.uint8)
    a, ma = transform_cls().apply(img, {}, np.random.default_rng(11))
    b, mb = transform_cls().apply(img, {}, np.random.default_rng(11))
    assert np.array_equal(a, b)
    assert np.array_equal(ma, mb)
