"""Triage sampled frames before labeling: drop blurry/mis-exposed and near-duplicate stills.

:mod:`rfv_pipeline.sample_frames` deliberately oversamples — one frame every
N seconds across a whole capture tree. Most of those frames are not worth a
human's time: adjacent samples of a static panel are near-identical, and
handheld capture produces motion-blurred and badly-exposed throwaways. This
module is the cleanup pass between sampling and review.

It scores every frame on three cheap, dependency-light signals and emits a
``triage.csv`` with a ``keep`` flag and a human-readable ``reason``:

* **Sharpness** — variance of the Laplacian. Motion blur and defocus collapse
  high-frequency energy, so a low variance means a soft frame. Crucially for
  this use case, the *defects we care about* (thin lines, scan-line ripple)
  ARE high-frequency, so a sharpness gate keeps the frames most likely to
  carry a visible defect.
* **Exposure** — mean brightness plus the fraction of crushed-black /
  blown-white pixels. A frame that is mostly clipped carries no detail to
  label.
* **Near-duplication** — a 64-bit difference hash (dHash) compared within each
  source video; a frame within ``dup_hamming`` bits of the last *kept* frame
  is dropped as a duplicate and back-references the frame it duplicates.

Only numpy + pillow are used (both already project deps), so there is no
OpenCV/scipy requirement. Reads the ``frames_map.csv`` written by the sampler
when present, to carry provenance through and to group dedup by source video;
falls back to the ``v{NN}_...`` filename prefix otherwise.

Example
-------
>>> from rfv_pipeline.triage_frames import TriageConfig, triage
>>> cfg = TriageConfig(frames="frames_out/frames", map_csv="frames_out/frames_map.csv")
>>> kept = [r for r in triage(cfg) if r.keep]              # doctest: +SKIP

CLI (run from ``scripts/`` or with it on ``PYTHONPATH``)::

    python -m rfv_pipeline.triage_frames frames_out/frames \\
        --map frames_out/frames_map.csv \\
        --out frames_out/triage.csv \\
        --copy-kept frames_out/kept
"""
from __future__ import annotations

import argparse
import csv
import logging
import shutil
import sys
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image

log = logging.getLogger("rfv.triage")

IMAGE_EXTS = frozenset({".png", ".jpg", ".jpeg", ".bmp", ".webp"})


@dataclass
class TriageConfig:
    """Inputs and thresholds for a triage run.

    Attributes
    ----------
    frames:
        Directory of sampled frames.
    map_csv:
        Optional ``frames_map.csv`` from the sampler. When given, provenance
        columns are carried through and dedup is grouped by ``source_video``.
    out_csv:
        Where the triage report is written (default ``<frames>/../triage.csv``).
    blur_min:
        Minimum variance-of-Laplacian to keep a frame. Lower = blurrier.
        Resolution/content dependent; tune on a sample. ``0`` disables.
    dark_max / bright_min:
        Drop frames whose mean brightness (0–255) is ``<= dark_max`` or
        ``>= bright_min`` (mostly black / mostly blown).
    clip_frac_max:
        Drop frames where more than this fraction of pixels are crushed-black
        or blown-white, even if the mean looks fine.
    dup_hamming:
        Max dHash Hamming distance to the last kept frame for a frame to count
        as a near-duplicate. ``-1`` disables dedup.
    copy_kept:
        If set, kept frames are copied into this directory.
    """

    frames: Path
    map_csv: Path | None = None
    out_csv: Path | None = None
    blur_min: float = 100.0
    dark_max: float = 16.0
    bright_min: float = 244.0
    clip_frac_max: float = 0.6
    dup_hamming: int = 5
    copy_kept: Path | None = None

    def __post_init__(self) -> None:
        self.frames = Path(self.frames).expanduser()
        self.map_csv = Path(self.map_csv).expanduser() if self.map_csv else None
        self.out_csv = (
            Path(self.out_csv).expanduser()
            if self.out_csv
            else self.frames.parent / "triage.csv"
        )
        self.copy_kept = Path(self.copy_kept).expanduser() if self.copy_kept else None


@dataclass
class TriageRecord:
    frame: str
    source_video: str
    source_folder: str
    keep: bool
    reason: str
    blur_var: float
    brightness: float
    clip_frac: float
    dhash: int
    dup_of: str        # filename this duplicates, or ""

    def as_row(self) -> list[str]:
        return [
            self.frame,
            self.source_video,
            self.source_folder,
            "1" if self.keep else "0",
            self.reason,
            f"{self.blur_var:.2f}",
            f"{self.brightness:.2f}",
            f"{self.clip_frac:.4f}",
            f"{self.dhash:016x}",
            self.dup_of,
        ]


CSV_HEADER = [
    "frame", "source_video", "source_folder", "keep", "reason",
    "blur_var", "brightness", "clip_frac", "dhash", "dup_of",
]


# --------------------------------------------------------------------- metrics


def _to_gray(img: Image.Image) -> np.ndarray:
    """Luminance as float32 in [0, 255]."""
    return np.asarray(img.convert("L"), dtype=np.float32)


def laplacian_variance(gray: np.ndarray) -> float:
    """Variance of the 4-neighbour Laplacian — a focus/sharpness measure.

    Higher = sharper (more high-frequency energy). Computed on the interior
    via slicing so we don't pull in scipy/cv2.
    """
    if gray.shape[0] < 3 or gray.shape[1] < 3:
        return 0.0
    lap = (
        gray[:-2, 1:-1] + gray[2:, 1:-1] + gray[1:-1, :-2] + gray[1:-1, 2:]
        - 4.0 * gray[1:-1, 1:-1]
    )
    return float(lap.var())


def exposure_stats(gray: np.ndarray) -> tuple[float, float]:
    """Return (mean brightness, fraction of crushed-black/blown-white pixels)."""
    mean = float(gray.mean())
    clipped = np.count_nonzero((gray <= 4) | (gray >= 251))
    return mean, clipped / gray.size


def dhash(gray: np.ndarray, hash_size: int = 8) -> int:
    """64-bit difference hash: resize to (hash_size, hash_size+1), compare cols.

    Robust to small shifts, compression, and brightness changes — so two
    samples of the same static scene hash close together.
    """
    img = Image.fromarray(gray.astype(np.uint8)).resize(
        (hash_size + 1, hash_size), Image.BILINEAR
    )
    small = np.asarray(img, dtype=np.int16)
    diff = small[:, 1:] > small[:, :-1]
    bits = 0
    for b in diff.flatten():
        bits = (bits << 1) | int(b)
    return bits


def hamming_distance(a: int, b: int) -> int:
    """Number of differing bits between two hashes."""
    return int(bin(a ^ b).count("1"))


# ----------------------------------------------------------------- input/group


def _load_map(map_csv: Path) -> dict[str, tuple[str, str]]:
    """frame filename -> (source_video, source_folder) from the sampler CSV."""
    out: dict[str, tuple[str, str]] = {}
    with map_csv.open(newline="") as fh:
        for row in csv.DictReader(fh):
            out[row["frame"]] = (
                row.get("source_video", ""),
                row.get("source_folder", ""),
            )
    return out


def _group_key(frame_name: str, provenance: tuple[str, str] | None) -> str:
    """Dedup grouping key: source video if known, else the ``vNN`` prefix."""
    if provenance and provenance[0]:
        return provenance[0]
    return frame_name.split("_", 1)[0]


def iter_frames(frames_dir: Path) -> list[Path]:
    frames_dir = Path(frames_dir)
    if not frames_dir.is_dir():
        raise FileNotFoundError(f"frames dir not found: {frames_dir}")
    return sorted(
        p for p in frames_dir.iterdir()
        if p.is_file() and p.suffix.lower() in IMAGE_EXTS
    )


# ----------------------------------------------------------------------- triage


def triage(cfg: TriageConfig) -> list[TriageRecord]:
    """Score, dedup, and flag every frame under ``cfg.frames``.

    Quality gates (blur/exposure) are applied first; a frame that fails them
    is never used as the dedup reference, so we always keep a *good* exemplar
    of each near-duplicate cluster. Returns one :class:`TriageRecord` per
    frame and writes ``cfg.out_csv``.
    """
    frames = iter_frames(cfg.frames)
    prov = _load_map(cfg.map_csv) if cfg.map_csv and cfg.map_csv.exists() else {}

    # last kept (hash, filename) per dedup group
    last_kept: dict[str, tuple[int, str]] = {}
    records: list[TriageRecord] = []

    for path in frames:
        name = path.name
        source_video, source_folder = prov.get(name, ("", ""))
        try:
            with Image.open(path) as im:
                gray = _to_gray(im)
        except Exception as exc:                       # unreadable/corrupt
            log.warning("skipping unreadable frame %s: %s", name, exc)
            records.append(TriageRecord(
                name, source_video, source_folder, False, "unreadable",
                0.0, 0.0, 1.0, 0, "",
            ))
            continue

        blur = laplacian_variance(gray)
        brightness, clip_frac = exposure_stats(gray)
        h = dhash(gray)

        keep, reason, dup_of = True, "kept", ""
        # Exposure first: a crushed/blown frame is the *cause* of its low
        # detail, so report that rather than the downstream "blurry".
        if brightness <= cfg.dark_max:
            keep, reason = False, "too_dark"
        elif brightness >= cfg.bright_min:
            keep, reason = False, "too_bright"
        elif clip_frac > cfg.clip_frac_max:
            keep, reason = False, "clipped"
        elif cfg.blur_min > 0 and blur < cfg.blur_min:
            keep, reason = False, "blurry"
        elif cfg.dup_hamming >= 0:
            group = _group_key(name, (source_video, source_folder))
            prev = last_kept.get(group)
            if prev is not None and hamming_distance(h, prev[0]) <= cfg.dup_hamming:
                keep, reason, dup_of = False, "duplicate", prev[1]

        if keep:
            group = _group_key(name, (source_video, source_folder))
            last_kept[group] = (h, name)

        records.append(TriageRecord(
            name, source_video, source_folder, keep, reason,
            blur, brightness, clip_frac, h, dup_of,
        ))

    _write_report(cfg, records)
    if cfg.copy_kept is not None:
        _copy_kept(cfg, records)

    kept = sum(1 for r in records if r.keep)
    log.info("triaged %d frames: kept %d, dropped %d", len(records), kept, len(records) - kept)
    return records


def _write_report(cfg: TriageConfig, records: list[TriageRecord]) -> None:
    assert cfg.out_csv is not None
    cfg.out_csv.parent.mkdir(parents=True, exist_ok=True)
    with cfg.out_csv.open("w", newline="") as fh:
        writer = csv.writer(fh)
        writer.writerow(CSV_HEADER)
        writer.writerows(r.as_row() for r in records)
    log.info("report: %s", cfg.out_csv)


def _copy_kept(cfg: TriageConfig, records: list[TriageRecord]) -> None:
    assert cfg.copy_kept is not None
    cfg.copy_kept.mkdir(parents=True, exist_ok=True)
    n = 0
    for r in records:
        if r.keep:
            shutil.copyfile(cfg.frames / r.frame, cfg.copy_kept / r.frame)
            n += 1
    log.info("copied %d kept frames -> %s", n, cfg.copy_kept)


def _build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="python -m rfv_pipeline.triage_frames",
        description="Drop blurry / mis-exposed / near-duplicate sampled frames before labeling.",
    )
    p.add_argument("frames", help="directory of sampled frames")
    p.add_argument("--map", dest="map_csv", default=None, help="frames_map.csv from the sampler")
    p.add_argument("--out", dest="out_csv", default=None, help="triage report CSV (default: <frames>/../triage.csv)")
    p.add_argument("--blur-min", type=float, default=100.0, help="min Laplacian variance (0 disables; default 100)")
    p.add_argument("--dark-max", type=float, default=16.0, help="drop if mean brightness <= this (default 16)")
    p.add_argument("--bright-min", type=float, default=244.0, help="drop if mean brightness >= this (default 244)")
    p.add_argument("--clip-frac-max", type=float, default=0.6, help="drop if clipped-pixel fraction > this (default 0.6)")
    p.add_argument("--dup-hamming", type=int, default=5, help="dHash distance for near-dup (-1 disables; default 5)")
    p.add_argument("--copy-kept", default=None, help="copy kept frames into this directory")
    p.add_argument("-v", "--verbose", action="store_true", help="debug logging")
    return p


def main(argv: list[str] | None = None) -> int:
    args = _build_parser().parse_args(argv)
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(message)s",
    )
    cfg = TriageConfig(
        frames=args.frames,
        map_csv=args.map_csv,
        out_csv=args.out_csv,
        blur_min=args.blur_min,
        dark_max=args.dark_max,
        bright_min=args.bright_min,
        clip_frac_max=args.clip_frac_max,
        dup_hamming=args.dup_hamming,
        copy_kept=args.copy_kept,
    )
    records = triage(cfg)
    kept = sum(1 for r in records if r.keep)
    print(f"kept {kept}/{len(records)} frames -> report {cfg.out_csv}")
    if cfg.copy_kept is not None:
        print(f"kept frames -> {cfg.copy_kept}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
