"""Deterministic CV layer for synthetic defect generation.

Every transform takes a clean image and a parameter dict, and returns
``(rgb, binary_mask)`` with mask values in {0, 255}. The mask is the
ground truth localisation of the synthesised defect.

The full multi-agent hierarchy described in
``RomeoFlexVision/docs/brigada-architecture.md`` plans *which*
transform to apply with *what* parameters — but the pixel-level
geometry happens here, deterministically.
"""

from __future__ import annotations

from typing import Protocol

import numpy as np

from ...schema.taxonomy import DefectClass


class DefectTransform(Protocol):
    """Structural type for every defect-rendering transform."""

    defect_class: DefectClass

    def apply(self, image: np.ndarray, params: dict, rng: np.random.Generator) -> tuple[np.ndarray, np.ndarray]:
        """Apply the defect and return ``(rgb_uint8, mask_uint8)``."""
