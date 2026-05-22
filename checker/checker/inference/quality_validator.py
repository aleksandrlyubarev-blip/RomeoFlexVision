"""Real-time frame quality scoring (sharpness / exposure / framing).

Pure numpy + cv2; no Qt imports so it stays unit-testable in CI.
Budget per TZ §4.1: <=15ms on a 1080p frame on M5 Pro.
"""

from __future__ import annotations

import math
from typing import Literal

import cv2
import numpy as np
from pydantic import BaseModel, ConfigDict, Field

Verdict = Literal["good", "warn", "bad"]

# Thresholds picked for ~30-60 cm working distance with ring light, per TZ §3.4.2 calibration notes.
_SHARPNESS_NORM = 200.0
_EXPOSURE_TARGET_MEAN = 0.55
_EXPOSURE_SIGMA = 0.18
_FRAMING_TARGET_DENSITY = 0.08
_FRAMING_SIGMA = 0.05
_MAX_DIM_FOR_METRICS = 1280


class QualityReport(BaseModel):
    model_config = ConfigDict(strict=True, frozen=True)

    sharpness: float = Field(ge=0.0, le=1.0)
    exposure: float = Field(ge=0.0, le=1.0)
    framing: float = Field(ge=0.0, le=1.0)
    verdict: Verdict
    laplacian_var: float
    mean_luminance: float
    edge_density: float


def _bell(x: float, target: float, sigma: float) -> float:
    return math.exp(-(((x - target) / sigma) ** 2))


def _crop_center(frame: np.ndarray, ratio: float) -> np.ndarray:
    h, w = frame.shape[:2]
    side = int(min(h, w) * ratio)
    cy, cx = h // 2, w // 2
    half = side // 2
    return frame[cy - half : cy + half, cx - half : cx + half]


def _aggregate(sharpness: float, exposure: float, framing: float) -> Verdict:
    worst = min(sharpness, exposure, framing)
    if worst > 0.7:
        return "good"
    if worst > 0.4:
        return "warn"
    return "bad"


def evaluate(frame_bgr: np.ndarray, *, roi_ratio: float = 0.6) -> QualityReport:
    """Score the frame; safe to call at 30 Hz on the main grab thread."""
    if frame_bgr.ndim != 3 or frame_bgr.shape[2] != 3:
        raise ValueError("expected BGR frame with 3 channels")

    roi = _crop_center(frame_bgr, roi_ratio)
    h, w = roi.shape[:2]
    if max(h, w) > _MAX_DIM_FOR_METRICS:
        scale = _MAX_DIM_FOR_METRICS / max(h, w)
        roi = cv2.resize(roi, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)

    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)

    laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    sharpness = min(1.0, math.tanh(laplacian_var / _SHARPNESS_NORM) / math.tanh(1.0))

    mean_lum = float(gray.mean()) / 255.0
    exposure = _bell(mean_lum, _EXPOSURE_TARGET_MEAN, _EXPOSURE_SIGMA)

    edges = cv2.Canny(gray, 80, 160)
    edge_density = float(edges.mean()) / 255.0
    framing = _bell(edge_density, _FRAMING_TARGET_DENSITY, _FRAMING_SIGMA)
    if edge_density >= _FRAMING_TARGET_DENSITY:
        framing = max(framing, min(1.0, edge_density / _FRAMING_TARGET_DENSITY))

    return QualityReport(
        sharpness=round(sharpness, 4),
        exposure=round(exposure, 4),
        framing=round(framing, 4),
        verdict=_aggregate(sharpness, exposure, framing),
        laplacian_var=round(laplacian_var, 2),
        mean_luminance=round(mean_lum, 4),
        edge_density=round(edge_density, 4),
    )
