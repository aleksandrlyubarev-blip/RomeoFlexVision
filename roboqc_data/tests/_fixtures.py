"""Helpers for generating tiny synthetic dataset fixtures on the fly."""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image


def make_mvtec_ad_tree(root: Path, category: str = "connector") -> Path:
    """Create a minimal MVTec-AD-shaped tree under ``root``.

    Structure produced::

        <root>/<category>/train/good/000.png
        <root>/<category>/test/good/000.png
        <root>/<category>/test/scratch/000.png
        <root>/<category>/ground_truth/scratch/000_mask.png
    """
    base = root / category
    (base / "train" / "good").mkdir(parents=True, exist_ok=True)
    (base / "test" / "good").mkdir(parents=True, exist_ok=True)
    (base / "test" / "scratch").mkdir(parents=True, exist_ok=True)
    (base / "ground_truth" / "scratch").mkdir(parents=True, exist_ok=True)

    rng = np.random.default_rng(42)
    _write_png(base / "train" / "good" / "000.png", rng.integers(0, 255, (32, 32, 3), dtype=np.uint8))
    _write_png(base / "test" / "good" / "000.png", rng.integers(0, 255, (32, 32, 3), dtype=np.uint8))
    defect = rng.integers(0, 255, (32, 32, 3), dtype=np.uint8)
    defect[10:14, 10:20] = 0
    _write_png(base / "test" / "scratch" / "000.png", defect)
    mask = np.zeros((32, 32), dtype=np.uint8)
    mask[10:14, 10:20] = 255
    _write_png(base / "ground_truth" / "scratch" / "000_mask.png", mask)
    return root


def _write_png(path: Path, array: np.ndarray) -> None:
    Image.fromarray(array).save(path)
