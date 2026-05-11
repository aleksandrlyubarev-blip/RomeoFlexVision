from __future__ import annotations

from enum import Enum
from typing import Any

try:
    from pydantic import BaseModel, ConfigDict
except Exception:  # pragma: no cover
    class BaseModel:  # type: ignore
        def __init__(self, **data: Any) -> None:
            for key, value in data.items():
                setattr(self, key, value)

    def ConfigDict(**_: Any) -> dict[str, Any]:  # type: ignore
        return {}

from .model_router import TaskCategory


class PolicyAction(str, Enum):
    ALLOW = "allow"
    REQUIRE_HUMAN = "require_human"


class PolicyCode(str, Enum):
    CRITICAL_CATEGORY = "CRITICAL_CATEGORY"
    HIGH_COST_PROD = "HIGH_COST_PROD"
    HIGH_RISK = "HIGH_RISK"
    POLICY_OK = "POLICY_OK"


class PolicyDecision(BaseModel):
    model_config = ConfigDict(strict=True)
    action: PolicyAction
    code: PolicyCode
    reason: str


class FrictionPolicyInput(BaseModel):
    model_config = ConfigDict(strict=True)
    category: TaskCategory
    estimated_cost_usd: float = 0.0
    environment: str = "dev"
    risk_level: str = "low"


class FrictionPolicyEngine:
    def evaluate(self, payload: FrictionPolicyInput) -> PolicyDecision:
        critical_categories = {TaskCategory.CRITICAL, TaskCategory.ARCHITECTURE, TaskCategory.CODING}
        if payload.category in critical_categories:
            return PolicyDecision(action=PolicyAction.REQUIRE_HUMAN, code=PolicyCode.CRITICAL_CATEGORY, reason="Critical category")
        if payload.environment == "prod" and payload.estimated_cost_usd >= 1.0:
            return PolicyDecision(action=PolicyAction.REQUIRE_HUMAN, code=PolicyCode.HIGH_COST_PROD, reason="High cost in production")
        if payload.risk_level in {"high", "critical"}:
            return PolicyDecision(action=PolicyAction.REQUIRE_HUMAN, code=PolicyCode.HIGH_RISK, reason="High risk operation")
        return PolicyDecision(action=PolicyAction.ALLOW, code=PolicyCode.POLICY_OK, reason="Policy check passed")
