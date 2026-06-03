"""Synthesise a wrong-screw-type defect.

Paints a screw-head-shaped region in the image with a colour that
differs from the local background, simulating a clearly wrong screw
(e.g. brass head where chrome was expected). The mask covers the
patched region.
"""

from __future__ import annotations

import cv2
import numpy as np

from ...schema.taxonomy import DefectClass


class ScrewWrongType:
    defect_class = DefectClass.SCREW_WRONG_TYPE

    def apply(
        self,
        image: np.ndarray,
        params: dict,
        rng: np.random.Generator,
    ) -> tuple[np.ndarray, np.ndarray]:
        if image.dtype != np.uint8:
            raise ValueError("ScrewWrongType expects uint8 RGB input")
        h, w = image.shape[:2]
        radius_frac = float(params.get("radius_frac", 0.08))
        # Default: brass-ish vs chrome-ish — easy to tell apart visually.
        head_colour = tuple(int(c) for c in params.get("head_colour", (210, 170, 70)))

        radius = max(3, int(min(h, w) * radius_frac))
        cx = int(rng.integers(radius, max(radius + 1, w - radius)))
        cy = int(rng.integers(radius, max(radius + 1, h - radius)))

        rgb = image.copy()
        mask = np.zeros((h, w), dtype=np.uint8)
        cv2.circle(rgb, (cx, cy), radius, head_colour, thickness=-1)
        # Cross slot to make it read as a screw head.
        slot_len = int(radius * 0.7)
        cv2.line(rgb, (cx - slot_len, cy), (cx + slot_len, cy), (30, 30, 30), thickness=1)
        cv2.line(rgb, (cx, cy - slot_len), (cx, cy + slot_len), (30, 30, 30), thickness=1)
        cv2.circle(mask, (cx, cy), radius, 255, thickness=-1)
        return rgb, mask
