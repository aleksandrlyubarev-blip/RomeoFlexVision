"""Sergeant agent: chooses numeric parameters for a defect transform."""

from __future__ import annotations

from ..hierarchy import SubPlan, ToolCall


class HeuristicSergeant:
    async def parameterize(self, sub_plan: SubPlan) -> ToolCall:
        params = {"length_frac": 0.35, "thickness": 2, "intensity": 50}
        return ToolCall(defect_class=sub_plan.defect_class, params=params)
