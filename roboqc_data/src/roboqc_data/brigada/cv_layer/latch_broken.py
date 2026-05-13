"""Synthesise a broken-latch defect.

Draws a latch as two angled segments with a visible gap and a small
"chip" missing from one end — a stylised broken hook.
"""

from __future__ import annotations

import cv2
import numpy as np

from ...schema.taxonomy import DefectClass


class LatchBroken:
    defect_class = DefectClass.LATCH_BROKEN

    def apply(
        self,
        image: np.ndarray,
        params: dict,
        rng: np.random.Generator,
    ) -> tuple[np.ndarray, np.ndarray]:
        if image.dtype != np.uint8:
            raise ValueError("LatchBroken expects uint8 RGB input")
        h, w = image.shape[:2]
        colour = tuple(int(c) for c in params.get("colour", (180, 180, 180)))
        thickness = int(params.get("thickness", max(2, int(0.05 * min(h, w)))))

        margin = max(thickness * 2, int(0.1 * min(h, w)))
        cx = int(rng.integers(margin, max(margin + 1, w - margin)))
        cy = int(rng.integers(margin, max(margin + 1, h - margin)))
        arm = int(0.18 * min(h, w))

        rgb = image.copy()
        # First arm — intact.
        cv2.line(rgb, (cx - arm, cy), (cx, cy - arm), colour, thickness=thickness, lineType=cv2.LINE_AA)
        # Second arm — broken: short stub then a gap.
        stub_end = (cx + arm // 3, cy - arm // 3)
        cv2.line(rgb, (cx, cy - arm), stub_end, colour, thickness=thickness, lineType=cv2.LINE_AA)

        mask = np.zeros((h, w), dtype=np.uint8)
        # Mark the missing segment (where the intact arm should continue).
        cv2.line(
            mask,
            stub_end,
            (cx + arm, cy - arm),
            255,
            thickness=thickness + 2,
            lineType=cv2.LINE_AA,
        )
        binary = (mask > 127).astype(np.uint8) * 255
        return rgb, binary
