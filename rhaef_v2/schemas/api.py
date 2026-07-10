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
    # Не strict: тело приходит из JSON, и FastAPI валидирует его в python-режиме —
    # strict отверг бы category="critical" (str vs TaskCategory) с 422 на любом запросе.
    model_config = ConfigDict(strict=False)
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
    # Заполняется при status="blocked": идентификатор для resume-эндпоинта
    # POST /approvals/{approval_id}/resolve.
    approval_id: str | None = None


class ApprovalResolveRequest(BaseModel):
    model_config = ConfigDict(strict=True)
    approved: bool
    note: str = ""


class ApprovalView(BaseModel):
    model_config = ConfigDict(strict=True)
    approval_id: str
    reason: str
    status: str
    created_at: str
    resolved_at: str | None = None
    note: str = ""


class ApprovalListResponse(BaseModel):
    model_config = ConfigDict(strict=True)
    pending: list[ApprovalView]


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
