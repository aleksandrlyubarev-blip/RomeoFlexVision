"""Reference defect transform: thin scratch on a connector surface.

This is the canonical example showing how a deterministic CV
transform plugs into the brigada pipeline. It uses only OpenCV
primitives so it is reproducible across machines given a seeded RNG.
"""

from __future__ import annotations

import cv2
import numpy as np

from ...schema.taxonomy import DefectClass


class ScratchOnConnector:
    defect_class = DefectClass.CONNECTOR_DAMAGE

    def apply(
        self,
        image: np.ndarray,
        params: dict,
        rng: np.random.Generator,
    ) -> tuple[np.ndarray, np.ndarray]:
        """Render a single scratch.

        Recognised params (all optional):
            length_frac: float in (0,1], scratch length relative to min(h,w). Default 0.4.
            thickness: int, line thickness in pixels. Default 2.
            intensity: int in [0,255], pixel darkening. Default 40.

        Example:
            >>> img = np.full((64, 64, 3), 128, dtype=np.uint8)
            >>> rgb, mask = ScratchOnConnector().apply(img, {}, np.random.default_rng(0))
            >>> rgb.shape, mask.shape
            ((64, 64, 3), (64, 64))
        """
        if image.dtype != np.uint8:
            raise ValueError("ScratchOnConnector expects uint8 RGB input")
        h, w = image.shape[:2]
        length_frac = float(params.get("length_frac", 0.4))
        thickness = int(params.get("thickness", 2))
        intensity = int(params.get("intensity", 40))

        length = max(2, int(min(h, w) * length_frac))
        cx = int(rng.integers(length, max(length + 1, w - length)))
        cy = int(rng.integers(length, max(length + 1, h - length)))
        angle = float(rng.uniform(0.0, np.pi))
        dx = int(np.cos(angle) * length / 2)
        dy = int(np.sin(angle) * length / 2)
        p1 = (cx - dx, cy - dy)
        p2 = (cx + dx, cy + dy)

        mask = np.zeros((h, w), dtype=np.uint8)
        cv2.line(mask, p1, p2, color=255, thickness=thickness, lineType=cv2.LINE_AA)

        rgb = image.copy()
        scratch = (mask.astype(np.int32) * intensity) // 255
        for ch in range(3):
            rgb[..., ch] = np.clip(rgb[..., ch].astype(np.int32) - scratch, 0, 255).astype(np.uint8)
        # Binarize the AA mask to {0,255}.
        binary_mask = (mask > 127).astype(np.uint8) * 255
        return rgb, binary_mask
