"""Synthesise a liquid-cooling leak defect.

Renders a small puddle-like blob beneath a fitting region using
multiple translucent ellipses. The combined ellipses form the mask.
This is a stylised stand-in — the real LEAK class is high-risk and
should be FrictionGate-gated in the brigada orchestrator (see
:mod:`roboqc_data.brigada.orchestrator`).
"""

from __future__ import annotations

import cv2
import numpy as np

from ...schema.taxonomy import DefectClass


class Leak:
    defect_class = DefectClass.LEAK

    def apply(
        self,
        image: np.ndarray,
        params: dict,
        rng: np.random.Generator,
    ) -> tuple[np.ndarray, np.ndarray]:
        if image.dtype != np.uint8:
            raise ValueError("Leak expects uint8 RGB input")
        h, w = image.shape[:2]
        liquid_colour = tuple(int(c) for c in params.get("liquid_colour", (50, 60, 220)))
        opacity = float(params.get("opacity", 0.6))
        blobs = int(params.get("blobs", 3))

        cx = int(rng.integers(int(0.2 * w), max(int(0.2 * w) + 1, int(0.8 * w))))
        cy = int(rng.integers(int(0.5 * h), max(int(0.5 * h) + 1, h - 1)))

        overlay = image.copy()
        mask = np.zeros((h, w), dtype=np.uint8)
        for _ in range(blobs):
            dx = int(rng.integers(-int(0.1 * w), int(0.1 * w) + 1))
            dy = int(rng.integers(-int(0.05 * h), int(0.05 * h) + 1))
            axes = (
                max(3, int(0.07 * w) + int(rng.integers(-3, 4))),
                max(3, int(0.04 * h) + int(rng.integers(-2, 3))),
            )
            cv2.ellipse(overlay, (cx + dx, cy + dy), axes, 0, 0, 360, liquid_colour, thickness=-1)
            cv2.ellipse(mask, (cx + dx, cy + dy), axes, 0, 0, 360, 255, thickness=-1)

        rgb = cv2.addWeighted(overlay, opacity, image, 1.0 - opacity, 0)
        return rgb, mask
