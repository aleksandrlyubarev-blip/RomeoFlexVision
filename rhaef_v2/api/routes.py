from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

try:
    from fastapi import APIRouter
except Exception:  # pragma: no cover
    class APIRouter:  # type: ignore
        def post(self, *_: object, **__: object):
            def decorator(func): return func
            return decorator
        def get(self, *_: object, **__: object):
            def decorator(func): return func
            return decorator

try:
    from pydantic import BaseModel, ConfigDict
except Exception:  # pragma: no cover
    class BaseModel:  # type: ignore
        def __init__(self, **data: Any) -> None:
            for key, value in data.items(): setattr(self, key, value)
    def ConfigDict(**_: Any) -> dict[str, Any]: return {}

from rhaef_v2.core.model_router import ModelRouter
from rhaef_v2.core.logging import log_event
from rhaef_v2.core.policies import FrictionPolicyEngine, FrictionPolicyInput, PolicyAction
from rhaef_v2.schemas.api import APIError, ExecutionRecordResponse, RunRequest, RunResponse, StatsResponse, TimelineEvent
from rhaef_v2.storage.execution_store import ExecutionEvent, ExecutionRecord, InMemoryExecutionStore

class _FakeResponse:
    choices = [type("Choice", (), {"message": {"role": "assistant", "content": "ok"}})()]

def _fake_completion_client(**_: Any) -> _FakeResponse:
    return _FakeResponse()

class APIServices(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    model_router: ModelRouter
    policy_engine: FrictionPolicyEngine
    idempotency_cache: dict[str, RunResponse | APIError]
    execution_store: InMemoryExecutionStore

async def execute_run(payload: RunRequest, services: APIServices) -> RunResponse | APIError:
    started_at = datetime.now(timezone.utc).isoformat()
    services.execution_store.add_event(ExecutionEvent(request_id=payload.request_id, event="run_started"))
    log_event("run_started", request_id=payload.request_id, category=payload.category.value)
    if payload.request_id in services.idempotency_cache:
        services.execution_store.add_event(ExecutionEvent(request_id=payload.request_id, event="idempotency_hit"))
        return services.idempotency_cache[payload.request_id]
    if not payload.messages:
        err = APIError(code="EMPTY_MESSAGES", message="messages must not be empty", request_id=payload.request_id)
        services.idempotency_cache[payload.request_id] = err
        services.execution_store.add_event(ExecutionEvent(request_id=payload.request_id, event="run_failed", payload={"code": err.code}))
        return err

    decision = services.policy_engine.evaluate(FrictionPolicyInput(category=payload.category, estimated_cost_usd=payload.estimated_cost_usd, environment=payload.environment, risk_level=payload.risk_level))
    services.execution_store.add_event(ExecutionEvent(request_id=payload.request_id, event="policy_evaluated", payload={"policy_code": decision.code.value}))
    log_event("policy_evaluated", request_id=payload.request_id, policy_code=decision.code.value, decision=decision.action.value)
    if decision.action == PolicyAction.REQUIRE_HUMAN:
        blocked = RunResponse(request_id=payload.request_id, status="blocked", decision=decision.action.value, reason=decision.reason, policy_code=decision.code.value)
        services.idempotency_cache[payload.request_id] = blocked
        services.execution_store.save_record(ExecutionRecord(request_id=payload.request_id, status="blocked", decision=decision.action.value, policy_code=decision.code.value, category=payload.category.value, fallback_used=False, retries_used=0, started_at=started_at, finished_at=datetime.now(timezone.utc).isoformat()))
        return blocked

    try:
        response = await services.model_router.route(category=payload.category, messages=payload.messages)
    except Exception:
        err = APIError(code="MODEL_ROUTING_FAILED", message="model routing failed", request_id=payload.request_id)
        services.idempotency_cache[payload.request_id] = err
        services.execution_store.add_event(ExecutionEvent(request_id=payload.request_id, event="run_failed", payload={"code": err.code}))
        return err

    stats = services.model_router.get_stats()
    ok = RunResponse(request_id=payload.request_id, status="ok", decision=decision.action.value, reason=decision.reason, policy_code=decision.code.value, output=response.choices[0].message["content"])
    services.idempotency_cache[payload.request_id] = ok
    services.execution_store.save_record(ExecutionRecord(request_id=payload.request_id, status="ok", decision=decision.action.value, policy_code=decision.code.value, category=payload.category.value, fallback_used=stats["fallbacks"] > 0, retries_used=0, started_at=started_at, finished_at=datetime.now(timezone.utc).isoformat()))
    services.execution_store.add_event(ExecutionEvent(request_id=payload.request_id, event="run_finished", payload={"status": "ok"}))
    log_event("run_finished", request_id=payload.request_id, status="ok", policy_code=decision.code.value)
    return ok

def build_stats(services: APIServices) -> StatsResponse:
    data = services.model_router.get_stats()
    data["policy_profile"] = services.policy_engine.settings.policy_profile
    data.update(services.execution_store.metrics())
    return StatsResponse(request_id=str(uuid4()), **data)

def create_api_router(services: APIServices | None = None) -> APIRouter:
    svc = services or APIServices(model_router=ModelRouter(client=_fake_completion_client), policy_engine=FrictionPolicyEngine(), idempotency_cache={}, execution_store=InMemoryExecutionStore())
    router = APIRouter()

    @router.post('/run', response_model=RunResponse)
    async def run_route(payload: RunRequest) -> RunResponse | APIError:
        return await execute_run(payload, svc)

    @router.get('/stats')
    async def stats() -> StatsResponse:
        return build_stats(svc)

    @router.get('/runs/{request_id}')
    async def get_run(request_id: str) -> ExecutionRecordResponse | APIError:
        record = svc.execution_store.get_record(request_id)
        if record is None:
            return APIError(code='RUN_NOT_FOUND', message='run not found', request_id=request_id)
        return ExecutionRecordResponse(**record.__dict__)

    @router.get('/runs/{request_id}/timeline')
    async def get_timeline(request_id: str) -> list[TimelineEvent]:
        return [TimelineEvent(**e.__dict__) for e in svc.execution_store.get_timeline(request_id)]

    return router

router = create_api_router()
