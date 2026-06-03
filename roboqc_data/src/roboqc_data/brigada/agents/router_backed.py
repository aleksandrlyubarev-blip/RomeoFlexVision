"""Router-backed brigada agents.

Each role routes through :class:`rhaef_v2.core.model_router.ModelRouter`
with a different :class:`TaskCategory` per the hierarchy described in
``RomeoFlexVision/docs/brigada-architecture.md``:

- General  → ``TaskCategory.CRITICAL``      (high-level strategy)
- Major    → ``TaskCategory.ARCHITECTURE``  (subplan refinement)
- Sergeant → ``TaskCategory.CODING``        (numeric parameterisation)
- Soldier  → ``TaskCategory.ROUTINE``       (cheap validation)

The router already attaches LangSmith tags, fallback models, and
cost tracking. We keep the agent code thin: build messages, route,
parse JSON, validate against the role's Pydantic model.

If the model output cannot be parsed we fall back to the deterministic
heuristic implementations from this package so the pipeline never
crashes on a flaky LLM response — matching the brigada doc's
recommendation that the system always supports a flat fallback mode.
"""

from __future__ import annotations

import json
from typing import Any

from pydantic import ValidationError

from ...schema.taxonomy import DefectClass
from ..hierarchy import Plan, SubPlan, ToolCall, ValidationOutcome
from ..prompts import (
    GENERAL_PROMPT,
    MAJOR_PROMPT,
    SERGEANT_PROMPT,
    SOLDIER_PROMPT,
)
from .general import HeuristicGeneral
from .major import HeuristicMajor
from .sergeant import HeuristicSergeant
from .soldier import HeuristicSoldier

try:  # rhaef_v2 lives in the parent package; treat as optional from here.
    from rhaef_v2.core.model_router import FrictionGate, ModelRouter, TaskCategory
except Exception:  # pragma: no cover - exercised in environments without rhaef_v2
    FrictionGate = None  # type: ignore[assignment]
    ModelRouter = None  # type: ignore[assignment]
    TaskCategory = None  # type: ignore[assignment]


def _extract_content(response: Any) -> str:
    """Pull the message body out of a litellm/openai-shaped response."""
    choice = response.choices[0]
    message = getattr(choice, "message", None)
    if message is None:
        message = choice["message"]
    if hasattr(message, "content"):
        return str(message.content)
    if isinstance(message, dict):
        return str(message.get("content", ""))
    return str(message)


def _parse_json(content: str) -> dict | None:
    try:
        return json.loads(content)
    except (json.JSONDecodeError, TypeError):
        return None


class RouterBackedGeneral:
    """LLM-backed strategy planner; falls back to heuristic on parse failure."""

    def __init__(self, router: ModelRouter, fallback: HeuristicGeneral | None = None) -> None:
        if ModelRouter is None or TaskCategory is None:
            raise RuntimeError("rhaef_v2 is required for RouterBackedGeneral")
        self.router = router
        self.fallback = fallback or HeuristicGeneral()

    async def plan(self, target_class: DefectClass, count: int) -> Plan:
        messages = [
            {"role": "system", "content": GENERAL_PROMPT},
            {
                "role": "user",
                "content": json.dumps({"target_class": target_class.value, "count": count}),
            },
        ]
        response = await self.router.route(category=TaskCategory.CRITICAL, messages=messages)
        payload = _parse_json(_extract_content(response))
        if payload is None:
            return await self.fallback.plan(target_class, count)
        try:
            return Plan(**payload)
        except ValidationError:
            return await self.fallback.plan(target_class, count)


class RouterBackedMajor:
    def __init__(self, router: ModelRouter, fallback: HeuristicMajor | None = None) -> None:
        if ModelRouter is None or TaskCategory is None:
            raise RuntimeError("rhaef_v2 is required for RouterBackedMajor")
        self.router = router
        self.fallback = fallback or HeuristicMajor()

    async def refine(self, plan: Plan, target_class: DefectClass, count: int) -> SubPlan:
        messages = [
            {"role": "system", "content": MAJOR_PROMPT},
            {
                "role": "user",
                "content": json.dumps(
                    {
                        "plan": plan.model_dump(),
                        "target_class": target_class.value,
                        "count": count,
                    }
                ),
            },
        ]
        response = await self.router.route(category=TaskCategory.ARCHITECTURE, messages=messages)
        payload = _parse_json(_extract_content(response))
        if payload is None:
            return await self.fallback.refine(plan, target_class, count)
        # The router is allowed to leave defect_class out — we know it from the request.
        payload.setdefault("defect_class", target_class.value)
        payload.setdefault("count", count)
        try:
            return SubPlan(**payload)
        except ValidationError:
            return await self.fallback.refine(plan, target_class, count)


class RouterBackedSergeant:
    def __init__(self, router: ModelRouter, fallback: HeuristicSergeant | None = None) -> None:
        if ModelRouter is None or TaskCategory is None:
            raise RuntimeError("rhaef_v2 is required for RouterBackedSergeant")
        self.router = router
        self.fallback = fallback or HeuristicSergeant()

    async def parameterize(self, sub_plan: SubPlan) -> ToolCall:
        messages = [
            {"role": "system", "content": SERGEANT_PROMPT},
            {"role": "user", "content": json.dumps(sub_plan.model_dump())},
        ]
        response = await self.router.route(category=TaskCategory.CODING, messages=messages)
        payload = _parse_json(_extract_content(response))
        if payload is None or "params" not in payload:
            return await self.fallback.parameterize(sub_plan)
        try:
            return ToolCall(defect_class=sub_plan.defect_class, params=payload["params"])
        except ValidationError:
            return await self.fallback.parameterize(sub_plan)


class RouterBackedSoldier:
    def __init__(self, router: ModelRouter, fallback: HeuristicSoldier | None = None) -> None:
        if ModelRouter is None or TaskCategory is None:
            raise RuntimeError("rhaef_v2 is required for RouterBackedSoldier")
        self.router = router
        self.fallback = fallback or HeuristicSoldier()

    async def validate(self, tool_call: ToolCall, mask_pixels: int) -> ValidationOutcome:
        # Empty masks are an objective failure; don't burn a router call on them.
        if mask_pixels <= 0:
            return ValidationOutcome(valid=False, notes="empty mask")
        messages = [
            {"role": "system", "content": SOLDIER_PROMPT},
            {
                "role": "user",
                "content": json.dumps({"tool_call": tool_call.model_dump(), "mask_pixels": mask_pixels}),
            },
        ]
        response = await self.router.route(category=TaskCategory.ROUTINE, messages=messages)
        payload = _parse_json(_extract_content(response))
        if payload is None:
            return await self.fallback.validate(tool_call, mask_pixels)
        try:
            return ValidationOutcome(**payload)
        except ValidationError:
            return await self.fallback.validate(tool_call, mask_pixels)
