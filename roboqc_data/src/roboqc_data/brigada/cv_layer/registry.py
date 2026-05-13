"""Lookup table from DefectClass to its DefectTransform implementation."""

from __future__ import annotations

from ...schema.taxonomy import DefectClass
from .base import DefectTransform
from .scratch_on_connector import ScratchOnConnector

DEFECT_TRANSFORMS: dict[DefectClass, DefectTransform] = {
    DefectClass.CONNECTOR_DAMAGE: ScratchOnConnector(),
}


def get_transform(defect: DefectClass) -> DefectTransform:
    """Return the registered transform for a defect class.

    Raises:
        KeyError: if no transform is registered yet. Add one in this
            module — transforms are introduced incrementally per the
            implementation plan.
    """
    return DEFECT_TRANSFORMS[defect]
