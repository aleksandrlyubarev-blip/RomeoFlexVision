"""Synthesise a torque-marker-mismatch defect.

Production lines often paint a small witness mark across screw heads
and the surrounding chassis to detect rotation after torque. This
transform draws a screw with the witness mark broken (two segments
offset), the visual sign of a back-rotated screw. The mask covers
the offset region.
"""

from __future__ import annotations

import cv2
import numpy as np

from ...schema.taxonomy import DefectClass


class ScrewTorqueVisual:
    defect_class = DefectClass.SCREW_TORQUE_VISUAL

    def apply(
        self,
        image: np.ndarray,
        params: dict,
        rng: np.random.Generator,
    ) -> tuple[np.ndarray, np.ndarray]:
        if image.dtype != np.uint8:
            raise ValueError("ScrewTorqueVisual expects uint8 RGB input")
        h, w = image.shape[:2]
        head_colour = tuple(int(c) for c in params.get("head_colour", (170, 170, 170)))
        mark_colour = tuple(int(c) for c in params.get("mark_colour", (220, 30, 30)))
        radius_frac = float(params.get("radius_frac", 0.08))
        offset_px = int(params.get("offset_px", max(2, int(0.03 * min(h, w)))))

        radius = max(4, int(min(h, w) * radius_frac))
        cx = int(rng.integers(radius, max(radius + 1, w - radius)))
        cy = int(rng.integers(radius, max(radius + 1, h - radius)))

        rgb = image.copy()
        cv2.circle(rgb, (cx, cy), radius, head_colour, thickness=-1)
        # Witness mark on the screw head
        cv2.line(rgb, (cx - radius, cy), (cx, cy), mark_colour, thickness=2)
        # Witness mark on the chassis, offset (the misalignment).
        cv2.line(
            rgb,
            (cx, cy + offset_px),
            (cx + radius, cy + offset_px),
            mark_colour,
            thickness=2,
        )

        mask = np.zeros((h, w), dtype=np.uint8)
        cv2.line(mask, (cx - radius, cy), (cx + radius, cy + offset_px), 255, thickness=offset_px + 2)
        binary = (mask > 127).astype(np.uint8) * 255
        return rgb, binary
