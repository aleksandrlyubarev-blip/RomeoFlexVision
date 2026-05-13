import numpy as np

from roboqc_data.brigada.cv_layer.registry import DEFECT_TRANSFORMS, get_transform
from roboqc_data.brigada.cv_layer.scratch_on_connector import ScratchOnConnector
from roboqc_data.schema.taxonomy import DefectClass


def test_scratch_changes_pixels_and_produces_mask():
    img = np.full((64, 64, 3), 128, dtype=np.uint8)
    rng = np.random.default_rng(0)
    rgb, mask = ScratchOnConnector().apply(img, {}, rng)
    assert rgb.shape == img.shape
    assert mask.shape == (64, 64)
    assert mask.max() == 255
    assert mask.sum() > 0
    assert not np.array_equal(rgb, img)


def test_scratch_is_deterministic_given_seed():
    img = np.full((64, 64, 3), 100, dtype=np.uint8)
    a, ma = ScratchOnConnector().apply(img, {}, np.random.default_rng(42))
    b, mb = ScratchOnConnector().apply(img, {}, np.random.default_rng(42))
    assert np.array_equal(a, b)
    assert np.array_equal(ma, mb)


def test_registry_resolves_connector_damage():
    transform = get_transform(DefectClass.CONNECTOR_DAMAGE)
    assert transform.defect_class is DefectClass.CONNECTOR_DAMAGE
    assert DefectClass.CONNECTOR_DAMAGE in DEFECT_TRANSFORMS
