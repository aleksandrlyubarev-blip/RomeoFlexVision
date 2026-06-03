"""Cover every DefectTransform that is registered in the brigada registry.

The wedge taxonomy from ``RomeoFlexVision/docs/pitch-deck.md`` slide 6
covers screw / cable / connector / latch / routing / leak; we don't
ship a WRONG_ROUTING transform yet (it is a layout-level rather than
pixel-level defect — see brigada doc).
"""

from __future__ import annotations

import numpy as np
import pytest

from roboqc_data.brigada.cv_layer.registry import DEFECT_TRANSFORMS, get_transform
from roboqc_data.schema.taxonomy import DefectClass

PIXEL_LEVEL_CLASSES: tuple[DefectClass, ...] = (
    DefectClass.CONNECTOR_DAMAGE,
    DefectClass.SCREW_MISSING,
    DefectClass.SCREW_WRONG_TYPE,
    DefectClass.SCREW_TORQUE_VISUAL,
    DefectClass.CABLE_CROSSED,
    DefectClass.CABLE_NOT_SEATED,
    DefectClass.CABLE_WRONG_PORT,
    DefectClass.CONNECTOR_NOT_SEATED,
    DefectClass.LATCH_OPEN,
    DefectClass.LATCH_BROKEN,
    DefectClass.LEAK,
)


@pytest.mark.parametrize("defect", PIXEL_LEVEL_CLASSES)
def test_every_pixel_level_class_has_registered_transform(defect):
    transform = get_transform(defect)
    assert transform.defect_class is defect
    assert defect in DEFECT_TRANSFORMS


@pytest.mark.parametrize("defect", PIXEL_LEVEL_CLASSES)
def test_each_transform_produces_non_empty_mask(defect):
    img = np.full((128, 128, 3), 110, dtype=np.uint8)
    rng = np.random.default_rng(0)
    rgb, mask = get_transform(defect).apply(img, {}, rng)
    assert rgb.shape == img.shape
    assert mask.shape == (128, 128)
    assert mask.max() == 255, f"{defect}: mask should reach 255"
    assert mask.sum() > 0, f"{defect}: mask is empty"
    assert not np.array_equal(rgb, img), f"{defect}: image unchanged"


@pytest.mark.parametrize("defect", PIXEL_LEVEL_CLASSES)
def test_each_transform_is_deterministic_under_same_seed(defect):
    img = np.full((96, 96, 3), 130, dtype=np.uint8)
    a, ma = get_transform(defect).apply(img, {}, np.random.default_rng(17))
    b, mb = get_transform(defect).apply(img, {}, np.random.default_rng(17))
    assert np.array_equal(a, b), f"{defect}: RGB differs across seeded runs"
    assert np.array_equal(ma, mb), f"{defect}: mask differs across seeded runs"
