"""Synthesise a cable-in-wrong-port defect.

Renders two adjacent ports and routes a cable into the *second* one
while a SOP says it should go into the first. The mask covers the
cable that should not be there.
"""

from __future__ import annotations

import cv2
import numpy as np

from ...schema.taxonomy import DefectClass


class CableWrongPort:
    defect_class = DefectClass.CABLE_WRONG_PORT

    def apply(
        self,
        image: np.ndarray,
        params: dict,
        rng: np.random.Generator,
    ) -> tuple[np.ndarray, np.ndarray]:
        if image.dtype != np.uint8:
            raise ValueError("CableWrongPort expects uint8 RGB input")
        h, w = image.shape[:2]
        port_colour = tuple(int(c) for c in params.get("port_colour", (30, 30, 30)))
        cable_colour = tuple(int(c) for c in params.get("cable_colour", (200, 60, 60)))
        thickness = int(params.get("thickness", max(2, int(0.04 * min(h, w)))))

        port_w = int(0.15 * w)
        port_h = int(0.15 * h)
        gap = int(0.05 * w)
        port_y = int(rng.integers(0, max(1, h - port_h)))
        port1_x = int(rng.integers(0, max(1, w - 2 * port_w - gap)))
        port2_x = port1_x + port_w + gap

        rgb = image.copy()
        cv2.rectangle(rgb, (port1_x, port_y), (port1_x + port_w, port_y + port_h), port_colour, thickness=-1)
        cv2.rectangle(rgb, (port2_x, port_y), (port2_x + port_w, port_y + port_h), port_colour, thickness=-1)

        # Cable enters port 2 from below — the "wrong" routing.
        start = (port2_x + port_w // 2, h - 1)
        end = (port2_x + port_w // 2, port_y + port_h)
        cv2.line(rgb, start, end, cable_colour, thickness=thickness, lineType=cv2.LINE_AA)

        mask = np.zeros((h, w), dtype=np.uint8)
        cv2.line(mask, start, end, 255, thickness=thickness, lineType=cv2.LINE_AA)
        binary = (mask > 127).astype(np.uint8) * 255
        return rgb, binary
