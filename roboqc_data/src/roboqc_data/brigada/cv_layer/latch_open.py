"""Synthesise a latch-open defect by rotating a rectangular fixture.

The transform draws a closed-latch rectangle then overlays a rotated
copy (the "open" position). The mask covers the rotated rectangle —
i.e. the region that should not exist when the latch is closed.
"""

from __future__ import annotations

import cv2
import numpy as np

from ...schema.taxonomy import DefectClass


class LatchOpen:
    defect_class = DefectClass.LATCH_OPEN

    def apply(
        self,
        image: np.ndarray,
        params: dict,
        rng: np.random.Generator,
    ) -> tuple[np.ndarray, np.ndarray]:
        if image.dtype != np.uint8:
            raise ValueError("LatchOpen expects uint8 RGB input")
        h, w = image.shape[:2]
        size = int(params.get("size", max(6, int(0.2 * min(h, w)))))
        angle_deg = float(params.get("angle_deg", 45.0))
        colour = tuple(int(c) for c in params.get("colour", (220, 220, 30)))

        cx = int(rng.integers(size, max(size + 1, w - size)))
        cy = int(rng.integers(size, max(size + 1, h - size)))
        rect = ((cx, cy), (size, size // 3), angle_deg)
        box = cv2.boxPoints(rect).astype(np.int32)

        rgb = image.copy()
        cv2.fillPoly(rgb, [box], colour)
        mask = np.zeros((h, w), dtype=np.uint8)
        cv2.fillPoly(mask, [box], 255)
        return rgb, mask
