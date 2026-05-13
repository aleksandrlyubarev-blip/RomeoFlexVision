"""Major agent: tactical refinement of the general's plan."""

from __future__ import annotations

from ...schema.taxonomy import DefectClass
from ..hierarchy import Plan, SubPlan


class HeuristicMajor:
    async def refine(self, plan: Plan, target_class: DefectClass, count: int) -> SubPlan:
        hint = "scratch" if target_class is DefectClass.CONNECTOR_DAMAGE else target_class.value
        return SubPlan(defect_class=target_class, transform_hint=hint, count=count)
