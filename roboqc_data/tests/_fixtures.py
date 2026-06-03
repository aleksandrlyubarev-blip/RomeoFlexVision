"""Helpers for generating tiny synthetic dataset fixtures on the fly."""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image


def make_real_iad_d3_tree(root: Path, category: str = "pcb") -> Path:
    """Create a minimal Real-IAD D3 shaped tree (RGB + photometric + point cloud)."""
    base = root / category
    for native_split in ("train", "test"):
        for defect in ("good",) if native_split == "train" else ("good", "scratch"):
            for modality in ("rgb", "photometric"):
                (base / native_split / defect / modality).mkdir(parents=True, exist_ok=True)
            (base / native_split / defect / "pointcloud").mkdir(parents=True, exist_ok=True)
    (base / "ground_truth" / "scratch").mkdir(parents=True, exist_ok=True)

    rng = np.random.default_rng(23)
    for path in (
        base / "train" / "good" / "rgb" / "000.png",
        base / "test" / "good" / "rgb" / "000.png",
        base / "test" / "scratch" / "rgb" / "000.png",
        base / "test" / "scratch" / "photometric" / "000.png",
    ):
        _write_png(path, rng.integers(0, 255, (32, 32, 3), dtype=np.uint8))
    (base / "test" / "scratch" / "pointcloud" / "000.ply").write_bytes(b"ply\nformat ascii 1.0\nend_header\n")
    mask = np.zeros((32, 32), dtype=np.uint8)
    mask[10:14, 10:20] = 255
    _write_png(base / "ground_truth" / "scratch" / "000_mask.png", mask)
    return root


def make_mvtec_ad_2_tree(root: Path, scenario: str = "transparent_object") -> Path:
    """Create a minimal MVTec AD 2 shaped tree.

    Structure produced (matches the 2026 release layout)::

        <root>/<scenario>/train/good/000.png
        <root>/<scenario>/validation/good/000.png
        <root>/<scenario>/test_public/good/000.png
        <root>/<scenario>/test_public/bad/000.png
        <root>/<scenario>/ground_truth/test_public/bad/000_mask.png
    """
    base = root / scenario
    (base / "train" / "good").mkdir(parents=True, exist_ok=True)
    (base / "validation" / "good").mkdir(parents=True, exist_ok=True)
    (base / "test_public" / "good").mkdir(parents=True, exist_ok=True)
    (base / "test_public" / "bad").mkdir(parents=True, exist_ok=True)
    (base / "ground_truth" / "test_public" / "bad").mkdir(parents=True, exist_ok=True)

    rng = np.random.default_rng(17)
    _write_png(base / "train" / "good" / "000.png", rng.integers(0, 255, (32, 32, 3), dtype=np.uint8))
    _write_png(base / "validation" / "good" / "000.png", rng.integers(0, 255, (32, 32, 3), dtype=np.uint8))
    _write_png(base / "test_public" / "good" / "000.png", rng.integers(0, 255, (32, 32, 3), dtype=np.uint8))
    bad = rng.integers(0, 255, (32, 32, 3), dtype=np.uint8)
    bad[12:18, 12:22] = 0
    _write_png(base / "test_public" / "bad" / "000.png", bad)
    mask = np.zeros((32, 32), dtype=np.uint8)
    mask[12:18, 12:22] = 255
    _write_png(base / "ground_truth" / "test_public" / "bad" / "000_mask.png", mask)
    return root


def make_visa_tree(root: Path, category: str = "pcb1") -> Path:
    """Create a minimal VisA-shaped tree.

    Structure::

        <root>/<category>/Data/Images/Normal/000.JPG
        <root>/<category>/Data/Images/Anomaly/000.JPG
        <root>/<category>/Data/Masks/Anomaly/000.png
    """
    base = root / category
    normal = base / "Data" / "Images" / "Normal"
    anomaly = base / "Data" / "Images" / "Anomaly"
    masks = base / "Data" / "Masks" / "Anomaly"
    for d in (normal, anomaly, masks):
        d.mkdir(parents=True, exist_ok=True)
    rng = np.random.default_rng(7)
    _write_png(normal / "000.JPG", rng.integers(0, 255, (32, 32, 3), dtype=np.uint8))
    _write_png(anomaly / "000.JPG", rng.integers(0, 255, (32, 32, 3), dtype=np.uint8))
    mask = np.zeros((32, 32), dtype=np.uint8)
    mask[8:14, 8:14] = 255
    _write_png(masks / "000.png", mask)
    return root


def make_mvtec_loco_tree(root: Path, category: str = "screw_bag") -> Path:
    base = root / category
    (base / "train" / "good").mkdir(parents=True, exist_ok=True)
    (base / "test" / "good").mkdir(parents=True, exist_ok=True)
    (base / "test" / "logical_anomalies").mkdir(parents=True, exist_ok=True)
    (base / "test" / "structural_anomalies").mkdir(parents=True, exist_ok=True)
    (base / "ground_truth" / "structural_anomalies" / "000").mkdir(parents=True, exist_ok=True)

    rng = np.random.default_rng(3)
    _write_png(base / "train" / "good" / "000.png", rng.integers(0, 255, (32, 32, 3), dtype=np.uint8))
    _write_png(base / "test" / "good" / "000.png", rng.integers(0, 255, (32, 32, 3), dtype=np.uint8))
    _write_png(base / "test" / "logical_anomalies" / "000.png", rng.integers(0, 255, (32, 32, 3), dtype=np.uint8))
    _write_png(base / "test" / "structural_anomalies" / "000.png", rng.integers(0, 255, (32, 32, 3), dtype=np.uint8))
    mask = np.zeros((32, 32), dtype=np.uint8)
    mask[5:10, 5:15] = 255
    _write_png(base / "ground_truth" / "structural_anomalies" / "000" / "000.png", mask)
    return root


def make_isp_ad_tree(root: Path, category: str = "connector") -> Path:
    base = root / category
    (base / "good").mkdir(parents=True, exist_ok=True)
    (base / "defect" / "real").mkdir(parents=True, exist_ok=True)
    (base / "defect" / "synthetic").mkdir(parents=True, exist_ok=True)
    (base / "masks" / "real").mkdir(parents=True, exist_ok=True)
    rng = np.random.default_rng(5)
    _write_png(base / "good" / "000.png", rng.integers(0, 255, (32, 32, 3), dtype=np.uint8))
    _write_png(base / "defect" / "real" / "000.png", rng.integers(0, 255, (32, 32, 3), dtype=np.uint8))
    _write_png(base / "defect" / "synthetic" / "000.png", rng.integers(0, 255, (32, 32, 3), dtype=np.uint8))
    mask = np.zeros((32, 32), dtype=np.uint8)
    mask[10:18, 10:24] = 255
    _write_png(base / "masks" / "real" / "000.png", mask)
    return root


def make_pku_pcb_tree(root: Path, defect: str = "short") -> Path:
    images = root / "images" / defect
    annotations = root / "Annotations" / defect
    images.mkdir(parents=True, exist_ok=True)
    annotations.mkdir(parents=True, exist_ok=True)
    rng = np.random.default_rng(11)
    _write_png(images / "01.jpg", rng.integers(0, 255, (64, 64, 3), dtype=np.uint8))
    # One bbox: cls x1 y1 x2 y2 (absolute pixels).
    (annotations / "01.txt").write_text("short 10 12 30 40\n", encoding="utf-8")
    return root


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
