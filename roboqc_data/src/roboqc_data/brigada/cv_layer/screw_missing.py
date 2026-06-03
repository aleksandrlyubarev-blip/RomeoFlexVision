"""Synthesise a missing-screw defect by inpainting a circular patch.

The transform paints over a circular region with the dominant local
colour, simulating a hole where a screw used to be. The binary mask
marks the painted region.

Parameters:
    radius_frac: float in (0,0.5], radius relative to min(h,w). Default 0.07.
    contrast: int in [0,255], how much to darken the patched region
        relative to its surrounding. Default 25.
"""

from __future__ import annotations

import cv2
import numpy as np

from ...schema.taxonomy import DefectClass


class ScrewMissing:
    defect_class = DefectClass.SCREW_MISSING

    def apply(
        self,
        image: np.ndarray,
        params: dict,
        rng: np.random.Generator,
    ) -> tuple[np.ndarray, np.ndarray]:
        if image.dtype != np.uint8:
            raise ValueError("ScrewMissing expects uint8 RGB input")
        h, w = image.shape[:2]
        radius_frac = float(params.get("radius_frac", 0.07))
        contrast = int(params.get("contrast", 25))

        radius = max(2, int(min(h, w) * radius_frac))
        cx = int(rng.integers(radius, max(radius + 1, w - radius)))
        cy = int(rng.integers(radius, max(radius + 1, h - radius)))

        mask = np.zeros((h, w), dtype=np.uint8)
        cv2.circle(mask, (cx, cy), radius, color=255, thickness=-1)

        # Mean colour around the patch — a fast stand-in for proper inpaint
        # that keeps things deterministic without a heavy dep.
        ring = np.zeros_like(mask)
        cv2.circle(ring, (cx, cy), int(radius * 1.6), 255, thickness=-1)
        cv2.circle(ring, (cx, cy), radius, 0, thickness=-1)
        local_mean = image[ring > 0].mean(axis=0) if (ring > 0).any() else image.mean(axis=(0, 1))
        patch_colour = np.clip(local_mean - contrast, 0, 255).astype(np.uint8)

        rgb = image.copy()
        rgb[mask > 0] = patch_colour
        return rgb, mask
