"""Tests for rfv_pipeline.triage_frames.

Pure numpy/pillow — no ffmpeg needed, so these always run. Synthetic frames
are crafted to trip each gate (sharp keep, blur, dark, bright, duplicate).
"""
import csv
import sys
from pathlib import Path

import numpy as np
import pytest
from PIL import Image

SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

from rfv_pipeline.triage_frames import (  # noqa: E402
    TriageConfig,
    dhash,
    exposure_stats,
    hamming_distance,
    laplacian_variance,
    triage,
)


def _noise(seed: int, size=(120, 160)) -> np.ndarray:
    rng = np.random.default_rng(seed)
    return rng.integers(0, 256, size=size, dtype=np.uint8)


def _save(arr: np.ndarray, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(arr.astype(np.uint8)).save(path)


# ---------------------------------------------------------------- pure metrics


def test_laplacian_variance_sharp_beats_flat():
    flat = np.full((64, 64), 128.0, dtype=np.float32)
    sharp = _noise(1, (64, 64)).astype(np.float32)
    assert laplacian_variance(flat) == pytest.approx(0.0)
    assert laplacian_variance(sharp) > laplacian_variance(flat)


def test_exposure_stats_dark_and_clipping():
    dark = np.zeros((32, 32), dtype=np.float32)
    mean, clip = exposure_stats(dark)
    assert mean == pytest.approx(0.0)
    assert clip == pytest.approx(1.0)


def test_dhash_identical_is_zero_distance_and_shift_is_small():
    g = _noise(7).astype(np.float32)
    h1 = dhash(g)
    assert hamming_distance(h1, h1) == 0
    # a 1px horizontal shift should stay close, not random (~32)
    shifted = np.roll(g, 1, axis=1)
    assert hamming_distance(h1, dhash(shifted)) < 20


# ----------------------------------------------------------------- end-to-end


def test_triage_flags_each_category(tmp_path):
    frames = tmp_path / "frames"
    # v00: a sharp keeper, then a near-duplicate of it
    base = _noise(42)
    _save(base, frames / "v00_000001.png")
    _save(base.copy(), frames / "v00_000002.png")            # exact dup
    # v00: a blurry frame (flat -> ~0 variance)
    _save(np.full((120, 160), 128, np.uint8), frames / "v00_000003.png")
    # v01: too dark, and too bright
    _save(np.zeros((120, 160), np.uint8), frames / "v01_000001.png")
    _save(np.full((120, 160), 255, np.uint8), frames / "v01_000002.png")
    # v01: a distinct sharp keeper
    _save(_noise(99), frames / "v01_000003.png")

    cfg = TriageConfig(frames=frames, blur_min=50.0)
    recs = {r.frame: r for r in triage(cfg)}

    assert recs["v00_000001.png"].keep and recs["v00_000001.png"].reason == "kept"
    assert not recs["v00_000002.png"].keep
    assert recs["v00_000002.png"].reason == "duplicate"
    assert recs["v00_000002.png"].dup_of == "v00_000001.png"
    assert recs["v00_000003.png"].reason == "blurry"
    assert recs["v01_000001.png"].reason == "too_dark"
    assert recs["v01_000002.png"].reason == "too_bright"
    assert recs["v01_000003.png"].keep

    # report written with one row per frame
    rows = list(csv.DictReader((tmp_path / "triage.csv").open()))
    assert len(rows) == len(recs)


def test_triage_uses_map_for_grouping_and_copies_kept(tmp_path):
    frames = tmp_path / "frames"
    base = _noise(5)
    # Same filename-prefix but DIFFERENT source video per the map: the second
    # must NOT be deduped against the first because they're different clips.
    _save(base, frames / "v00_000001.png")
    _save(base.copy(), frames / "v00_000002.png")

    map_csv = tmp_path / "frames_map.csv"
    with map_csv.open("w", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(["frame", "source_video", "source_folder"])
        w.writerow(["v00_000001.png", "a/clip1.mp4", "a"])
        w.writerow(["v00_000002.png", "b/clip2.mp4", "b"])

    cfg = TriageConfig(
        frames=frames, map_csv=map_csv, blur_min=0.0,
        dup_hamming=5, copy_kept=tmp_path / "kept",
    )
    recs = {r.frame: r for r in triage(cfg)}

    assert recs["v00_000001.png"].keep
    assert recs["v00_000002.png"].keep, "different source videos must not dedup together"
    assert recs["v00_000001.png"].source_folder == "a"
    # copy-kept mirrors kept frames
    assert (tmp_path / "kept" / "v00_000001.png").exists()
    assert (tmp_path / "kept" / "v00_000002.png").exists()


def test_dup_hamming_negative_disables_dedup(tmp_path):
    frames = tmp_path / "frames"
    base = _noise(3)
    _save(base, frames / "v00_000001.png")
    _save(base.copy(), frames / "v00_000002.png")
    cfg = TriageConfig(frames=frames, blur_min=0.0, dup_hamming=-1)
    recs = {r.frame: r for r in triage(cfg)}
    assert all(r.keep for r in recs.values())
