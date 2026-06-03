"""Synthesise a crossed-cable defect.

Two anti-aliased polylines crossing near the centre of the image. The
mask captures both lines so downstream detectors learn the X pattern.
"""

from __future__ import annotations

import cv2
import numpy as np

from ...schema.taxonomy import DefectClass


class CableCrossed:
    defect_class = DefectClass.CABLE_CROSSED

    def apply(
        self,
        image: np.ndarray,
        params: dict,
        rng: np.random.Generator,
    ) -> tuple[np.ndarray, np.ndarray]:
        if image.dtype != np.uint8:
            raise ValueError("CableCrossed expects uint8 RGB input")
        h, w = image.shape[:2]
        thickness = int(params.get("thickness", 3))
        colour = tuple(int(c) for c in params.get("colour", (40, 40, 200)))

        margin = max(2, int(0.1 * min(h, w)))
        cx = int(rng.integers(margin, max(margin + 1, w - margin)))
        cy = int(rng.integers(margin, max(margin + 1, h - margin)))
        span = max(2, int(0.3 * min(h, w)))

        p1 = (cx - span, cy - span)
        p2 = (cx + span, cy + span)
        p3 = (cx - span, cy + span)
        p4 = (cx + span, cy - span)

        rgb = image.copy()
        mask = np.zeros((h, w), dtype=np.uint8)
        for a, b in ((p1, p2), (p3, p4)):
            cv2.line(rgb, a, b, colour, thickness=thickness, lineType=cv2.LINE_AA)
            cv2.line(mask, a, b, 255, thickness=thickness, lineType=cv2.LINE_AA)

        binary_mask = (mask > 127).astype(np.uint8) * 255
        return rgb, binary_mask
