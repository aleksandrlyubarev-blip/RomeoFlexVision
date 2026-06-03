"""Sample candidate frames from inspection video for review/labeling.

The restoration pipeline (:mod:`rfv_pipeline.pipeline`) extracts *every*
frame losslessly because it has to rebuild the clip. This module solves the
opposite problem: given a tree of handheld inspection videos, pull a small,
evenly-spaced set of still frames that a human (or a downstream classifier)
can label.

Why a separate path instead of the full pipeline:

* **Sampling, not reconstruction.** We want one frame every *N* seconds, not
  the whole stream. The ``fps`` video filter does this in one ffmpeg pass.
* **Provenance is the product.** Every emitted frame is written next to a
  row in ``frames_map.csv`` recording which video and which parent folder it
  came from, plus the source geometry/fps/duration from
  :func:`rfv_pipeline.probe.probe`. That parent-folder column is a *weak
  label*: if the capture tree is organized by station, fixture, or pass/fail,
  the folder name is a free first-pass annotation.
* **Lossless by default.** Defects like thin vertical lines, scan-line
  ripple, or flicker live in high-frequency detail that JPEG happily
  smears into something that looks like a defect (or hides a real one). The
  default output is PNG; opt into JPEG only when disk size matters more than
  fidelity.

Reuses the existing ffmpeg plumbing (:func:`rfv_pipeline.ffmpeg_runner.run`,
:func:`rfv_pipeline.probe.probe`) rather than shelling out by hand, so colour
handling and error reporting match the rest of the package.

Example
-------
>>> from rfv_pipeline.sample_frames import SampleConfig, sample_tree
>>> cfg = SampleConfig(src="captures/", out="frames_out/", every=1.0, max_width=1280)
>>> records = sample_tree(cfg)
>>> records[0].frame, records[0].source_folder      # doctest: +SKIP
('v00_000001.png', 'station_3')

CLI (run from the ``scripts/`` directory, or with it on ``PYTHONPATH``)::

    python -m rfv_pipeline.sample_frames captures/ --out frames_out --every 1.0 --max-width 1280
"""
from __future__ import annotations

import argparse
import csv
import logging
import sys
from dataclasses import dataclass
from pathlib import Path

from .ffmpeg_runner import FFmpegError, ffmpeg_bin, run
from .probe import ProbeError, probe

log = logging.getLogger("rfv.sample")

#: Container extensions we treat as video, matched case-insensitively.
VIDEO_EXTS = frozenset({".mp4", ".mov", ".m4v", ".avi", ".mkv", ".webm", ".mpg", ".mpeg"})


@dataclass
class SampleConfig:
    """Inputs for a sampling run.

    Attributes
    ----------
    src:
        A single video file, or a directory searched (recursively by default)
        for files whose extension is in :data:`VIDEO_EXTS`.
    out:
        Output directory. Frames go in ``out/frames`` and the mapping lands at
        ``out/frames_map.csv``.
    every:
        Seconds between sampled frames. ``2.0`` → one frame every two seconds.
        Mutually exclusive with :attr:`fps`.
    fps:
        Sampled frames per second. ``0.5`` → one frame every two seconds.
        Takes precedence over :attr:`every` when set.
    max_width:
        If the source is wider than this, downscale to it (height auto, kept
        even). ``None`` keeps native resolution.
    fmt:
        ``"png"`` (lossless, default) or ``"jpg"``.
    jpeg_quality:
        ffmpeg ``-q:v`` for JPEG (2 = best, 31 = worst). Ignored for PNG.
    recursive:
        Recurse into subdirectories when :attr:`src` is a directory.
    """

    src: Path
    out: Path
    every: float = 1.0
    fps: float | None = None
    max_width: int | None = None
    fmt: str = "png"
    jpeg_quality: int = 2
    recursive: bool = True

    def __post_init__(self) -> None:
        self.src = Path(self.src).expanduser()
        self.out = Path(self.out).expanduser()
        if self.fmt not in ("png", "jpg"):
            raise ValueError(f"fmt must be 'png' or 'jpg', got {self.fmt!r}")
        if self.fps is not None and self.fps <= 0:
            raise ValueError(f"fps must be > 0, got {self.fps}")
        if self.fps is None and self.every <= 0:
            raise ValueError(f"every must be > 0, got {self.every}")

    @property
    def sample_fps(self) -> float:
        """Sampling rate as frames-per-second for ffmpeg's ``fps`` filter."""
        return self.fps if self.fps is not None else 1.0 / self.every


@dataclass
class FrameRecord:
    """One emitted frame and where it came from."""

    frame: str            # filename relative to out/frames
    source_video: str     # path relative to the sampled root
    source_folder: str    # parent folder relative to root — the weak label
    approx_time_s: float  # estimated source timestamp of this frame
    src_width: int
    src_height: int
    src_fps: float
    src_duration: float | None

    def as_row(self) -> list[str]:
        return [
            self.frame,
            self.source_video,
            self.source_folder,
            f"{self.approx_time_s:.3f}",
            str(self.src_width),
            str(self.src_height),
            f"{self.src_fps:.4f}",
            "" if self.src_duration is None else f"{self.src_duration:.3f}",
        ]


CSV_HEADER = [
    "frame",
    "source_video",
    "source_folder",
    "approx_time_s",
    "src_width",
    "src_height",
    "src_fps",
    "src_duration_s",
]


def iter_videos(root: Path, recursive: bool = True) -> list[Path]:
    """Return sorted video paths under ``root`` (or ``[root]`` if it's a file)."""
    root = Path(root)
    if root.is_file():
        return [root]
    if not root.is_dir():
        raise FileNotFoundError(f"src not found: {root}")
    walker = root.rglob("*") if recursive else root.glob("*")
    return sorted(p for p in walker if p.is_file() and p.suffix.lower() in VIDEO_EXTS)


def _filter_chain(cfg: SampleConfig) -> str:
    """Build the ``-vf`` chain: resample to the target rate, then downscale."""
    chain = [f"fps={cfg.sample_fps:.6g}"]
    if cfg.max_width is not None:
        # Only shrink (never upscale); keep height even for codec-friendliness.
        chain.append(f"scale='min(iw,{cfg.max_width})':-2")
    return ",".join(chain)


def sample_video(
    video: Path,
    out_frames: Path,
    cfg: SampleConfig,
    index: int,
    *,
    root: Path | None = None,
) -> list[FrameRecord]:
    """Sample one ``video`` into ``out_frames``; return one record per frame.

    Frames are named ``v{index:02d}_{n:06d}.<ext>`` so files from different
    videos never collide and sort in capture order.

    Example
    -------
    >>> from rfv_pipeline.sample_frames import SampleConfig, sample_video
    >>> cfg = SampleConfig(src="clip.mp4", out="out", every=2.0)   # doctest: +SKIP
    >>> recs = sample_video(Path("clip.mp4"), Path("out/frames"), cfg, 0)  # doctest: +SKIP
    """
    video = Path(video)
    root = Path(root) if root is not None else video.parent
    out_frames.mkdir(parents=True, exist_ok=True)

    try:
        info = probe(video)
    except ProbeError as exc:
        log.warning("skipping %s: probe failed (%s)", video, exc)
        return []

    pattern = out_frames / f"v{index:02d}_%06d.{cfg.fmt}"
    cmd = [
        ffmpeg_bin(),
        "-hide_banner",
        "-nostdin",
        "-y",
        "-i", str(video),
        "-vf", _filter_chain(cfg),
        "-vsync", "vfr",          # one image per filtered frame, no dup padding
    ]
    if cfg.fmt == "jpg":
        cmd += ["-q:v", str(cfg.jpeg_quality)]
    cmd += [str(pattern)]

    try:
        run(cmd)
    except FFmpegError as exc:
        log.warning("skipping %s: ffmpeg failed (%s)", video, exc)
        return []

    written = sorted(out_frames.glob(f"v{index:02d}_*.{cfg.fmt}"))
    try:
        rel_video = str(video.relative_to(root))
        rel_folder = str(video.parent.relative_to(root)) or "."
    except ValueError:               # video not under root (single-file mode)
        rel_video = video.name
        rel_folder = video.parent.name or "."

    src_fps = float(info.video.avg_fps) or float(info.video.r_fps)
    records = [
        FrameRecord(
            frame=p.name,
            source_video=rel_video,
            source_folder=rel_folder,
            approx_time_s=n / cfg.sample_fps,
            src_width=info.video.width,
            src_height=info.video.height,
            src_fps=src_fps,
            src_duration=info.video.duration or info.duration,
        )
        for n, p in enumerate(written)
    ]
    log.info("%s -> %d frames", rel_video, len(records))
    return records


def sample_tree(cfg: SampleConfig) -> list[FrameRecord]:
    """Sample every video under ``cfg.src`` and write ``frames_map.csv``.

    Returns the flat list of :class:`FrameRecord` (also persisted to CSV).
    """
    videos = iter_videos(cfg.src, cfg.recursive)
    if not videos:
        log.warning("no videos found under %s", cfg.src)
    out_frames = cfg.out / "frames"
    root = cfg.src if cfg.src.is_dir() else cfg.src.parent

    records: list[FrameRecord] = []
    for i, video in enumerate(videos):
        records.extend(sample_video(video, out_frames, cfg, i, root=root))

    cfg.out.mkdir(parents=True, exist_ok=True)
    csv_path = cfg.out / "frames_map.csv"
    with csv_path.open("w", newline="") as fh:
        writer = csv.writer(fh)
        writer.writerow(CSV_HEADER)
        writer.writerows(r.as_row() for r in records)

    log.info("wrote %d frames from %d videos -> %s", len(records), len(videos), out_frames)
    log.info("map: %s", csv_path)
    return records


def _build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="python -m rfv_pipeline.sample_frames",
        description="Sample evenly-spaced still frames from inspection video for review/labeling.",
    )
    p.add_argument("src", help="video file or directory of videos")
    p.add_argument("--out", default="sampled_frames", help="output directory (default: ./sampled_frames)")
    rate = p.add_mutually_exclusive_group()
    rate.add_argument("--every", type=float, default=1.0, help="seconds between frames (default: 1.0)")
    rate.add_argument("--fps", type=float, default=None, help="sampled frames per second (overrides --every)")
    p.add_argument("--max-width", type=int, default=None, help="downscale wider sources to this width")
    p.add_argument("--format", dest="fmt", choices=("png", "jpg"), default="png", help="output format (default: png)")
    p.add_argument("--jpeg-quality", type=int, default=2, help="ffmpeg -q:v for jpg (2=best..31=worst)")
    p.add_argument("--no-recursive", action="store_true", help="do not recurse into subdirectories")
    p.add_argument("-v", "--verbose", action="store_true", help="debug logging")
    return p


def main(argv: list[str] | None = None) -> int:
    args = _build_parser().parse_args(argv)
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(message)s",
    )
    cfg = SampleConfig(
        src=args.src,
        out=args.out,
        every=args.every,
        fps=args.fps,
        max_width=args.max_width,
        fmt=args.fmt,
        jpeg_quality=args.jpeg_quality,
        recursive=not args.no_recursive,
    )
    records = sample_tree(cfg)
    print(f"{len(records)} frames -> {cfg.out / 'frames'}")
    print(f"map -> {cfg.out / 'frames_map.csv'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
