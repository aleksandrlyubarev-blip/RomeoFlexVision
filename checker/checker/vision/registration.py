"""Feature-based image registration against a product reference frame."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

import cv2
import numpy as np
from pydantic import BaseModel, ConfigDict, Field

AlignmentStatus = Literal["aligned", "insufficient_features", "failed"]


class AlignmentResult(BaseModel):
    """Serializable alignment evidence saved with each capture."""

    model_config = ConfigDict(strict=True, frozen=True)

    status: AlignmentStatus
    score: float = Field(ge=0.0, le=1.0)
    match_count: int = Field(ge=0)
    inlier_count: int = Field(ge=0)
    homography: list[list[float]] | None = None
    message: str = ""


@dataclass(frozen=True)
class RegistrationOutput:
    result: AlignmentResult
    aligned_frame_bgr: np.ndarray | None


def _gray(frame_bgr: np.ndarray) -> np.ndarray:
    if frame_bgr.ndim != 3 or frame_bgr.shape[2] != 3:
        raise ValueError("expected BGR frame with 3 channels")
    return cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)


def align_to_reference(
    reference_bgr: np.ndarray,
    frame_bgr: np.ndarray,
    *,
    min_matches: int = 12,
    ratio: float = 0.75,
    reproj_threshold: float = 5.0,
) -> RegistrationOutput:
    """Warp the captured frame into reference-image coordinates using ORB features."""
    reference_gray = _gray(reference_bgr)
    frame_gray = _gray(frame_bgr)

    orb = cv2.ORB_create(nfeatures=2500)
    ref_keypoints, ref_desc = orb.detectAndCompute(reference_gray, None)
    frame_keypoints, frame_desc = orb.detectAndCompute(frame_gray, None)
    if ref_desc is None or frame_desc is None or len(ref_keypoints) < min_matches or len(frame_keypoints) < min_matches:
        return RegistrationOutput(
            result=AlignmentResult(
                status="insufficient_features",
                score=0.0,
                match_count=0,
                inlier_count=0,
                message="Not enough ORB features to estimate homography.",
            ),
            aligned_frame_bgr=None,
        )

    matcher = cv2.BFMatcher(cv2.NORM_HAMMING)
    pairs = matcher.knnMatch(frame_desc, ref_desc, k=2)
    good = [
        first
        for pair in pairs
        if len(pair) == 2
        for first, second in [pair]
        if first.distance < ratio * second.distance
    ]
    if len(good) < min_matches:
        return RegistrationOutput(
            result=AlignmentResult(
                status="insufficient_features",
                score=0.0,
                match_count=len(good),
                inlier_count=0,
                message="Not enough high-confidence feature matches.",
            ),
            aligned_frame_bgr=None,
        )

    src = np.float32([frame_keypoints[m.queryIdx].pt for m in good]).reshape(-1, 1, 2)
    dst = np.float32([ref_keypoints[m.trainIdx].pt for m in good]).reshape(-1, 1, 2)
    homography, mask = cv2.findHomography(src, dst, cv2.RANSAC, reproj_threshold)
    if homography is None or mask is None:
        return RegistrationOutput(
            result=AlignmentResult(
                status="failed",
                score=0.0,
                match_count=len(good),
                inlier_count=0,
                message="Homography estimation failed.",
            ),
            aligned_frame_bgr=None,
        )

    inliers = int(mask.ravel().sum())
    score = min(1.0, inliers / max(float(min_matches), float(len(good))))
    ref_h, ref_w = reference_bgr.shape[:2]
    aligned = cv2.warpPerspective(frame_bgr, homography, (ref_w, ref_h))
    return RegistrationOutput(
        result=AlignmentResult(
            status="aligned",
            score=round(float(score), 4),
            match_count=len(good),
            inlier_count=inliers,
            homography=[[round(float(v), 6) for v in row] for row in homography.tolist()],
        ),
        aligned_frame_bgr=aligned,
    )
