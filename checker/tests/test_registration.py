"""Feature registration tests use synthetic, asymmetric board-like imagery."""

from __future__ import annotations

import cv2
import numpy as np

from checker.vision.registration import align_to_reference


def _board() -> np.ndarray:
    img = np.full((420, 520, 3), 35, dtype=np.uint8)
    cv2.rectangle(img, (50, 60), (470, 350), (95, 95, 95), -1)
    cv2.rectangle(img, (85, 95), (170, 165), (210, 210, 210), 3)
    cv2.circle(img, (390, 125), 34, (230, 230, 230), 3)
    cv2.line(img, (120, 285), (420, 250), (180, 180, 180), 5)
    cv2.putText(img, "DEMO-001", (185, 220), cv2.FONT_HERSHEY_SIMPLEX, 1.1, (240, 240, 240), 3, cv2.LINE_AA)
    for x, y in [(80, 80), (450, 80), (90, 330), (445, 325)]:
        cv2.circle(img, (x, y), 12, (245, 245, 245), -1)
        cv2.circle(img, (x, y), 6, (45, 45, 45), 2)
    return img


def test_align_to_reference_recovers_shifted_frame() -> None:
    reference = _board()
    matrix = np.float32([[1, 0, 18], [0, 1, -11]])
    shifted = cv2.warpAffine(reference, matrix, (reference.shape[1], reference.shape[0]))

    output = align_to_reference(reference, shifted, min_matches=8)

    assert output.result.status == "aligned"
    assert output.result.inlier_count >= 8
    assert output.result.score > 0.25
    assert output.aligned_frame_bgr is not None
