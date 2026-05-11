from __future__ import annotations

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

from rhaef_v2.core.model_router import TaskCategory


class RunRequest(BaseModel):
    model_config = ConfigDict(strict=True)
    request_id: str
    messages: list[dict[str, Any]]
    category: TaskCategory
    estimated_cost_usd: float = 0.0
    environment: str = "dev"
    risk_level: str = "low"


class RunResponse(BaseModel):
    model_config = ConfigDict(strict=True)
    request_id: str
    status: str
    decision: str
    reason: str
    policy_code: str
    output: str | None = None


class APIError(BaseModel):
    model_config = ConfigDict(strict=True)
    code: str
    message: str
    request_id: str


class StatsResponse(BaseModel):
    model_config = ConfigDict(strict=True)
    request_id: str
    total_cost_usd: float
    requests: int
    langsmith_tracing_v2: bool
    timestamp: str
