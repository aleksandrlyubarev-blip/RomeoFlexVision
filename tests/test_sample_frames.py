"""Tests for rfv_pipeline.sample_frames.

The sampler shells out to ffmpeg/ffprobe, so the integration tests are
skipped when those binaries aren't on PATH. The pure-logic tests
(config validation, filter chain, video discovery) always run.
"""
import csv
import shutil
import subprocess
import sys
from pathlib import Path

import pytest

# rfv_pipeline lives under scripts/ (run as `python -m rfv_pipeline`), so put
# that directory on the path rather than importing it as scripts.rfv_pipeline.
SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

from rfv_pipeline.sample_frames import (  # noqa: E402
    SampleConfig,
    _filter_chain,
    iter_videos,
    sample_tree,
)

HAVE_FFMPEG = bool(shutil.which("ffmpeg") and shutil.which("ffprobe"))
needs_ffmpeg = pytest.mark.skipif(not HAVE_FFMPEG, reason="ffmpeg/ffprobe not on PATH")


def _make_video(path: Path, seconds: int = 4, fps: int = 10, size: str = "320x240") -> None:
    """Render a short synthetic clip with ffmpeg's test pattern."""
    path.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
            "-f", "lavfi", "-i", f"testsrc=duration={seconds}:size={size}:rate={fps}",
            "-pix_fmt", "yuv420p", str(path),
        ],
        check=True,
    )


# ---------------------------------------------------------------- pure logic


def test_config_rejects_bad_format():
    with pytest.raises(ValueError):
        SampleConfig(src="x", out="y", fmt="bmp")


def test_config_rejects_nonpositive_rates():
    with pytest.raises(ValueError):
        SampleConfig(src="x", out="y", every=0)
    with pytest.raises(ValueError):
        SampleConfig(src="x", out="y", fps=-1)


def test_sample_fps_from_every_and_fps():
    assert SampleConfig(src="x", out="y", every=2.0).sample_fps == pytest.approx(0.5)
    # fps takes precedence over every
    assert SampleConfig(src="x", out="y", every=2.0, fps=4.0).sample_fps == pytest.approx(4.0)


def test_filter_chain_with_and_without_scale():
    assert _filter_chain(SampleConfig(src="x", out="y", every=1.0)) == "fps=1"
    chain = _filter_chain(SampleConfig(src="x", out="y", fps=0.5, max_width=640))
    assert chain.startswith("fps=0.5")
    assert "scale='min(iw,640)':-2" in chain


def test_iter_videos_filters_and_sorts(tmp_path):
    (tmp_path / "a.mp4").write_bytes(b"")
    (tmp_path / "sub").mkdir()
    (tmp_path / "sub" / "b.MOV").write_bytes(b"")
    (tmp_path / "notes.txt").write_bytes(b"")
    found = iter_videos(tmp_path)
    names = [p.name for p in found]
    assert names == ["a.mp4", "b.MOV"]
    # non-recursive skips the subdir
    assert [p.name for p in iter_videos(tmp_path, recursive=False)] == ["a.mp4"]


# --------------------------------------------------------------- integration


@needs_ffmpeg
def test_sample_tree_emits_frames_and_map(tmp_path):
    # Two clips in different folders -> exercises the weak-label folder column.
    _make_video(tmp_path / "captures" / "station_1" / "clip_a.mp4", seconds=4)
    _make_video(tmp_path / "captures" / "station_2" / "clip_b.mp4", seconds=4)

    cfg = SampleConfig(src=tmp_path / "captures", out=tmp_path / "out", every=1.0)
    records = sample_tree(cfg)

    # ~1 frame/sec over 4s, two clips -> roughly 8 frames (allow boundary slack).
    assert 6 <= len(records) <= 10
    frames_dir = tmp_path / "out" / "frames"
    assert len(list(frames_dir.glob("*.png"))) == len(records)

    folders = {r.source_folder for r in records}
    assert folders == {"station_1", "station_2"}

    # Frame files from the two videos use distinct index prefixes.
    prefixes = {r.frame.split("_")[0] for r in records}
    assert prefixes == {"v00", "v01"}

    # CSV round-trips with the documented header and one row per frame.
    rows = list(csv.DictReader((tmp_path / "out" / "frames_map.csv").open()))
    assert len(rows) == len(records)
    assert rows[0]["source_folder"] in folders
    assert int(rows[0]["src_width"]) == 320


@needs_ffmpeg
def test_sample_single_file_and_max_width(tmp_path):
    _make_video(tmp_path / "solo.mp4", seconds=3, size="640x480")
    cfg = SampleConfig(src=tmp_path / "solo.mp4", out=tmp_path / "out", fps=2.0, max_width=320)
    records = sample_tree(cfg)

    assert records, "expected frames from single-file input"
    assert all(r.source_video == "solo.mp4" for r in records)
    # Downscaled output: probe still reports source width, image is narrower.
    from PIL import Image  # pillow is a project optional dep

    img = Image.open(tmp_path / "out" / "frames" / records[0].frame)
    assert img.width == 320
