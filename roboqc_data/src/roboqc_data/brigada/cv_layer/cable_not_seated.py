"""Synthesise a cable-not-seated defect.

Draws a cable end (rounded rectangle) sticking out of a port (another
rectangle) with a visible gap between the two. The mask covers the
gap so detectors learn that gap as the discriminative signal.
"""

from __future__ import annotations

import cv2
import numpy as np

from ...schema.taxonomy import DefectClass


class CableNotSeated:
    defect_class = DefectClass.CABLE_NOT_SEATED

    def apply(
        self,
        image: np.ndarray,
        params: dict,
        rng: np.random.Generator,
    ) -> tuple[np.ndarray, np.ndarray]:
        if image.dtype != np.uint8:
            raise ValueError("CableNotSeated expects uint8 RGB input")
        h, w = image.shape[:2]
        port_colour = tuple(int(c) for c in params.get("port_colour", (40, 40, 40)))
        cable_colour = tuple(int(c) for c in params.get("cable_colour", (60, 30, 30)))
        gap_px = int(params.get("gap_px", max(3, int(0.05 * min(h, w)))))

        port_w = int(0.25 * w)
        port_h = int(0.25 * h)
        port_x = int(rng.integers(0, max(1, w - port_w)))
        port_y = int(rng.integers(0, max(1, h - port_h)))
        port_pt1 = (port_x, port_y)
        port_pt2 = (port_x + port_w, port_y + port_h)
        cable_pt1 = (port_x, port_y + port_h + gap_px)
        cable_pt2 = (port_x + port_w, port_y + 2 * port_h + gap_px)

        rgb = image.copy()
        cv2.rectangle(rgb, port_pt1, port_pt2, port_colour, thickness=-1)
        cv2.rectangle(rgb, cable_pt1, cable_pt2, cable_colour, thickness=-1)

        mask = np.zeros((h, w), dtype=np.uint8)
        gap_y1 = port_y + port_h
        gap_y2 = port_y + port_h + gap_px
        cv2.rectangle(mask, (port_x, gap_y1), (port_x + port_w, gap_y2), 255, thickness=-1)
        return rgb, mask
