"""Synthesise a connector-not-fully-seated defect.

Draws a connector body partially overlapping its receptacle. The mask
covers the visible bright "underside" that would normally be hidden
when the connector is fully seated.
"""

from __future__ import annotations

import cv2
import numpy as np

from ...schema.taxonomy import DefectClass


class ConnectorNotSeated:
    defect_class = DefectClass.CONNECTOR_NOT_SEATED

    def apply(
        self,
        image: np.ndarray,
        params: dict,
        rng: np.random.Generator,
    ) -> tuple[np.ndarray, np.ndarray]:
        if image.dtype != np.uint8:
            raise ValueError("ConnectorNotSeated expects uint8 RGB input")
        h, w = image.shape[:2]
        body_colour = tuple(int(c) for c in params.get("body_colour", (60, 60, 80)))
        underside_colour = tuple(int(c) for c in params.get("underside_colour", (240, 220, 120)))
        offset_px = int(params.get("offset_px", max(3, int(0.06 * min(h, w)))))

        body_w = int(0.3 * w)
        body_h = int(0.18 * h)
        body_x = int(rng.integers(0, max(1, w - body_w)))
        body_y = int(rng.integers(0, max(1, h - body_h - offset_px)))

        rgb = image.copy()
        cv2.rectangle(rgb, (body_x, body_y), (body_x + body_w, body_y + body_h), body_colour, thickness=-1)
        # Bright underside strip — the tell-tale sign of an unseated connector.
        underside_pt1 = (body_x, body_y + body_h)
        underside_pt2 = (body_x + body_w, body_y + body_h + offset_px)
        cv2.rectangle(rgb, underside_pt1, underside_pt2, underside_colour, thickness=-1)

        mask = np.zeros((h, w), dtype=np.uint8)
        cv2.rectangle(mask, underside_pt1, underside_pt2, 255, thickness=-1)
        return rgb, mask
