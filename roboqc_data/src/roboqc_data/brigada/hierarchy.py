"""Role Protocols for the brigada hierarchy.

Each role corresponds to a level in the General → Major → Sergeant →
Soldier hierarchy used by the experimental agent layer. The
implementations live in :mod:`roboqc_data.brigada.agents`.
"""

from __future__ import annotations

from typing import Any, Protocol

from pydantic import BaseModel, ConfigDict

from ..schema.taxonomy import DefectClass


class Plan(BaseModel):
    model_config = ConfigDict(strict=True, frozen=True)
    strategy: str
    risk: str


class SubPlan(BaseModel):
    model_config = ConfigDict(strict=True, frozen=True)
    defect_class: DefectClass
    transform_hint: str
    count: int


class ToolCall(BaseModel):
    model_config = ConfigDict(strict=True, frozen=True)
    defect_class: DefectClass
    params: dict[str, Any]


class ValidationOutcome(BaseModel):
    model_config = ConfigDict(strict=True, frozen=True)
    valid: bool
    notes: str = ""


class GeneralAgent(Protocol):
    async def plan(self, target_class: DefectClass, count: int) -> Plan: ...


class MajorAgent(Protocol):
    async def refine(self, plan: Plan, target_class: DefectClass, count: int) -> SubPlan: ...


class SergeantAgent(Protocol):
    async def parameterize(self, sub_plan: SubPlan) -> ToolCall: ...


class SoldierAgent(Protocol):
    async def validate(self, tool_call: ToolCall, mask_pixels: int) -> ValidationOutcome: ...
