from __future__ import annotations

from typing import Any
from uuid import uuid4

try:
    from fastapi import APIRouter
except Exception:  # pragma: no cover
    class APIRouter:  # type: ignore
        def post(self, *_: object, **__: object):
            def decorator(func):
                return func
            return decorator

        def get(self, *_: object, **__: object):
            def decorator(func):
                return func
            return decorator

try:
    from pydantic import BaseModel, ConfigDict
except Exception:  # pragma: no cover
    class BaseModel:  # type: ignore
        def __init__(self, **data: Any) -> None:
            for key, value in data.items():
                setattr(self, key, value)

    def ConfigDict(**_: Any) -> dict[str, Any]:  # type: ignore
        return {}

from rhaef_v2.core.model_router import ModelRouter
from rhaef_v2.core.policies import FrictionPolicyEngine, FrictionPolicyInput, PolicyAction
from rhaef_v2.schemas.api import APIError, RunRequest, RunResponse, StatsResponse


class _FakeResponse:
    choices = [type("Choice", (), {"message": {"role": "assistant", "content": "ok"}})()]


def _fake_completion_client(**_: Any) -> _FakeResponse:
    return _FakeResponse()


class APIServices(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    model_router: ModelRouter
    policy_engine: FrictionPolicyEngine


async def execute_run(payload: RunRequest, services: APIServices) -> RunResponse | APIError:
    if not payload.messages:
        return APIError(code="EMPTY_MESSAGES", message="messages must not be empty", request_id=payload.request_id)

    decision = services.policy_engine.evaluate(
        FrictionPolicyInput(
            category=payload.category,
            estimated_cost_usd=payload.estimated_cost_usd,
            environment=payload.environment,
            risk_level=payload.risk_level,
        )
    )
    if decision.action == PolicyAction.REQUIRE_HUMAN:
        return RunResponse(
            request_id=payload.request_id,
            status="blocked",
            decision=decision.action.value,
            reason=decision.reason,
            policy_code=decision.code.value,
        )

    response = await services.model_router.route(category=payload.category, messages=payload.messages)
    output = response.choices[0].message["content"]
    return RunResponse(
        request_id=payload.request_id,
        status="ok",
        decision=decision.action.value,
        reason=decision.reason,
        policy_code=decision.code.value,
        output=output,
    )


def build_stats(services: APIServices) -> StatsResponse:
    data = services.model_router.get_stats()
    return StatsResponse(request_id=str(uuid4()), **data)


def create_api_router(services: APIServices | None = None) -> APIRouter:
    svc = services or APIServices(
        model_router=ModelRouter(client=_fake_completion_client),
        policy_engine=FrictionPolicyEngine(),
    )
    router = APIRouter()

    @router.post("/run", response_model=RunResponse)
    async def run_route(payload: RunRequest) -> RunResponse | APIError:
        return await execute_run(payload, svc)

    @router.get("/stats")
    async def stats() -> StatsResponse:
        return build_stats(svc)

    return router


router = create_api_router()
