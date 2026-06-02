"""Generic defect taxonomy for public and synthetic examples.

Adding a new class
requires bumping :data:`TAXONOMY_VERSION` so manifests built against
the old taxonomy can be detected by consumers.
"""

from __future__ import annotations

from enum import Enum

TAXONOMY_VERSION = "1.0.0"


class DefectCategory(str, Enum):
    """High-level grouping used for routing and reporting."""

    OK = "ok"
    FASTENER = "fastener"
    CABLE = "cable"
    CONNECTOR = "connector"
    LATCH = "latch"
    ROUTING = "routing"
    FLUID = "fluid"


class DefectClass(str, Enum):
    """Fine-grained defect labels.

    OK is included as a first-class label so a single ImageRecord can
    represent both clean and defective samples in unified manifests
    (Anomalib in particular relies on this).
    """

    OK = "ok"
    SCREW_MISSING = "screw_missing"
    SCREW_WRONG_TYPE = "screw_wrong_type"
    SCREW_TORQUE_VISUAL = "screw_torque_visual"
    CABLE_WRONG_PORT = "cable_wrong_port"
    CABLE_NOT_SEATED = "cable_not_seated"
    CABLE_CROSSED = "cable_crossed"
    CONNECTOR_DAMAGE = "connector_damage"
    CONNECTOR_NOT_SEATED = "connector_not_seated"
    LATCH_OPEN = "latch_open"
    LATCH_BROKEN = "latch_broken"
    WRONG_ROUTING = "wrong_routing"
    LEAK = "leak"


TAXONOMY: dict[DefectClass, DefectCategory] = {
    DefectClass.OK: DefectCategory.OK,
    DefectClass.SCREW_MISSING: DefectCategory.FASTENER,
    DefectClass.SCREW_WRONG_TYPE: DefectCategory.FASTENER,
    DefectClass.SCREW_TORQUE_VISUAL: DefectCategory.FASTENER,
    DefectClass.CABLE_WRONG_PORT: DefectCategory.CABLE,
    DefectClass.CABLE_NOT_SEATED: DefectCategory.CABLE,
    DefectClass.CABLE_CROSSED: DefectCategory.CABLE,
    DefectClass.CONNECTOR_DAMAGE: DefectCategory.CONNECTOR,
    DefectClass.CONNECTOR_NOT_SEATED: DefectCategory.CONNECTOR,
    DefectClass.LATCH_OPEN: DefectCategory.LATCH,
    DefectClass.LATCH_BROKEN: DefectCategory.LATCH,
    DefectClass.WRONG_ROUTING: DefectCategory.ROUTING,
    DefectClass.LEAK: DefectCategory.FLUID,
}


def category_of(defect: DefectClass) -> DefectCategory:
    """Return the category for a defect class.

    Example:
        >>> category_of(DefectClass.SCREW_MISSING)
        <DefectCategory.FASTENER: 'fastener'>
    """
    return TAXONOMY[defect]
