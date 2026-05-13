import asyncio

import numpy as np
from PIL import Image

from roboqc_data.brigada.orchestrator import BrigadaSynthesizer, SynthRequest
from roboqc_data.schema.taxonomy import DefectClass


def _make_clean(path):
    img = np.full((48, 48, 3), 130, dtype=np.uint8)
    Image.fromarray(img).save(path)
    return path


def test_brigada_generates_records_and_artifacts(tmp_path):
    clean = _make_clean(tmp_path / "clean.png")
    out = tmp_path / "out"
    req = SynthRequest(
        clean_image_path=clean,
        target_class=DefectClass.CONNECTOR_DAMAGE,
        count=3,
        seed=7,
        output_dir=out,
    )
    result = asyncio.run(BrigadaSynthesizer().generate(req))
    assert len(result.artifacts) == 3
    assert len(result.manifest.records) == 3
    for art in result.artifacts:
        assert art.image_path.is_file()
        assert art.mask_path.is_file()
    for rec in result.manifest.records:
        assert rec.annotations[0].defect_class is DefectClass.CONNECTOR_DAMAGE
        assert rec.source.dataset == "brigada"
        assert rec.annotations[0].mask is not None


def test_brigada_high_risk_triggers_friction_callback(tmp_path):
    clean = _make_clean(tmp_path / "clean.png")
    req = SynthRequest(
        clean_image_path=clean,
        target_class=DefectClass.LEAK,
        count=1,
        seed=1,
        output_dir=tmp_path / "out",
    )
    seen: list[str] = []

    def gate(g):
        seen.append(g.reason)
        raise RuntimeError("blocked by friction in test")

    import pytest as _pytest

    with _pytest.raises(RuntimeError, match="blocked by friction"):
        asyncio.run(BrigadaSynthesizer(friction=gate).generate(req))
    assert seen and "leak" in seen[0].lower()


def test_brigada_low_risk_skips_friction(tmp_path):
    clean = _make_clean(tmp_path / "clean.png")
    req = SynthRequest(
        clean_image_path=clean,
        target_class=DefectClass.CONNECTOR_DAMAGE,
        count=2,
        seed=1,
        output_dir=tmp_path / "out",
    )
    seen: list[str] = []
    asyncio.run(BrigadaSynthesizer(friction=lambda gate: seen.append(gate.reason)).generate(req))
    assert seen == []
