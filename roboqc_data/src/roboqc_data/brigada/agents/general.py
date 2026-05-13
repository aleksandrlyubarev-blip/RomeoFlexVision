"""General agent: top-level strategy planner.

The real implementation routes through ``rhaef_v2.core.model_router.ModelRouter``
to a 70B-class model with ``TaskCategory.CRITICAL`` (per
``docs/brigada-architecture.md``). For the initial PR we ship a
deterministic stub that the orchestrator and tests can rely on.
"""

from __future__ import annotations

from ...schema.taxonomy import DefectClass, category_of
from ..hierarchy import Plan


class HeuristicGeneral:
    """Deterministic stand-in for the LLM general.

    Strategy text is templated from the target class so downstream
    layers can still operate. Replace with a router-backed agent once
    network access and budget are in place.
    """

    async def plan(self, target_class: DefectClass, count: int) -> Plan:
        risk = "high" if target_class in {DefectClass.LEAK, DefectClass.WRONG_ROUTING} else "low"
        return Plan(
            strategy=f"Generate {count} synthetic {category_of(target_class).value} defects",
            risk=risk,
        )
