"""ROI inspection primitives that run on an aligned reference-coordinate frame."""

from __future__ import annotations

import cv2
import numpy as np
from pydantic import BaseModel, ConfigDict, Field

from .product_profile import RoiSpec


class RoiInspectionResult(BaseModel):
    """Serializable per-ROI evidence for a capture."""

    model_config = ConfigDict(strict=True, frozen=True)

    roi_id: str
    label: str
    kind: str
    bbox_px: tuple[int, int, int, int]
    mean_luminance: float = Field(ge=0.0, le=1.0)
    sharpness: float = Field(ge=0.0)
    edge_density: float = Field(ge=0.0, le=1.0)


def roi_to_pixels(roi: RoiSpec, width: int, height: int) -> tuple[int, int, int, int]:
    x = max(0, min(width - 1, int(round(roi.x * width))))
    y = max(0, min(height - 1, int(round(roi.y * height))))
    w = max(1, int(round(roi.width * width)))
    h = max(1, int(round(roi.height * height)))
    return x, y, min(w, width - x), min(h, height - y)


def inspect_rois(frame_bgr: np.ndarray, rois: list[RoiSpec]) -> list[RoiInspectionResult]:
    if frame_bgr.ndim != 3 or frame_bgr.shape[2] != 3:
        raise ValueError("expected BGR frame with 3 channels")

    height, width = frame_bgr.shape[:2]
    results: list[RoiInspectionResult] = []
    for roi in rois:
        x, y, w, h = roi_to_pixels(roi, width, height)
        crop = frame_bgr[y : y + h, x : x + w]
        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 80, 160)
        results.append(
            RoiInspectionResult(
                roi_id=roi.roi_id,
                label=roi.label,
                kind=roi.kind,
                bbox_px=(x, y, w, h),
                mean_luminance=round(float(gray.mean()) / 255.0, 4),
                sharpness=round(float(cv2.Laplacian(gray, cv2.CV_64F).var()), 2),
                edge_density=round(float(edges.mean()) / 255.0, 4),
            )
        )
    return results


def draw_roi_overlay(frame_bgr: np.ndarray, results: list[RoiInspectionResult]) -> np.ndarray:
    annotated = frame_bgr.copy()
    for result in results:
        x, y, w, h = result.bbox_px
        cv2.rectangle(annotated, (x, y), (x + w, y + h), (44, 160, 44), 2)
        cv2.putText(
            annotated,
            result.roi_id,
            (x, max(16, y - 6)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            (44, 160, 44),
            1,
            cv2.LINE_AA,
        )
    return annotated
