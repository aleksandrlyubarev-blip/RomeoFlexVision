"""Lookup table from DefectClass to its DefectTransform implementation."""

from __future__ import annotations

from ...schema.taxonomy import DefectClass
from .base import DefectTransform
from .cable_crossed import CableCrossed
from .cable_not_seated import CableNotSeated
from .cable_wrong_port import CableWrongPort
from .connector_not_seated import ConnectorNotSeated
from .latch_broken import LatchBroken
from .latch_open import LatchOpen
from .leak import Leak
from .scratch_on_connector import ScratchOnConnector
from .screw_missing import ScrewMissing
from .screw_torque_visual import ScrewTorqueVisual
from .screw_wrong_type import ScrewWrongType

DEFECT_TRANSFORMS: dict[DefectClass, DefectTransform] = {
    DefectClass.CONNECTOR_DAMAGE: ScratchOnConnector(),
    DefectClass.SCREW_MISSING: ScrewMissing(),
    DefectClass.SCREW_WRONG_TYPE: ScrewWrongType(),
    DefectClass.SCREW_TORQUE_VISUAL: ScrewTorqueVisual(),
    DefectClass.CABLE_CROSSED: CableCrossed(),
    DefectClass.CABLE_NOT_SEATED: CableNotSeated(),
    DefectClass.CABLE_WRONG_PORT: CableWrongPort(),
    DefectClass.CONNECTOR_NOT_SEATED: ConnectorNotSeated(),
    DefectClass.LATCH_OPEN: LatchOpen(),
    DefectClass.LATCH_BROKEN: LatchBroken(),
    DefectClass.LEAK: Leak(),
}


def get_transform(defect: DefectClass) -> DefectTransform:
    """Return the registered transform for a defect class.

    Raises:
        KeyError: if no transform is registered yet. Add one in this
            module — transforms are introduced incrementally per the
            implementation plan.
    """
    return DEFECT_TRANSFORMS[defect]
