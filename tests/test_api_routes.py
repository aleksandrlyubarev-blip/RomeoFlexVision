import asyncio

from rhaef_v2.api.routes import APIServices, build_stats, execute_run
from rhaef_v2.core.model_router import ModelRouter, TaskCategory
from rhaef_v2.core.policies import FrictionPolicyEngine
from rhaef_v2.schemas.api import APIError, RunRequest
from rhaef_v2.storage.execution_store import InMemoryExecutionStore


class FakeResponse:
    choices = [type("Choice", (), {"message": {"role": "assistant", "content": "ok"}})()]


def fake_client(**kwargs):
    return FakeResponse()


def failing_client(**kwargs):
    raise RuntimeError("boom")


def build_services(client=fake_client) -> APIServices:
    return APIServices(model_router=ModelRouter(client=client), policy_engine=FrictionPolicyEngine(), idempotency_cache={}, execution_store=InMemoryExecutionStore())


def test_run_route_blocks_critical():
    req = RunRequest(request_id="r1", messages=[{"role": "user", "content": "x"}], category=TaskCategory.CODING)
    resp = asyncio.run(execute_run(req, build_services()))
    assert resp.status == "blocked"
    assert resp.policy_code == "CRITICAL_CATEGORY"


def test_run_route_allows_routine():
    req = RunRequest(request_id="r2", messages=[{"role": "user", "content": "x"}], category=TaskCategory.ROUTINE)
    resp = asyncio.run(execute_run(req, build_services()))
    assert resp.status == "ok"
    assert resp.output == "ok"


def test_run_route_rejects_empty_messages():
    req = RunRequest(request_id="r3", messages=[], category=TaskCategory.ROUTINE)
    resp = asyncio.run(execute_run(req, build_services()))
    assert isinstance(resp, APIError)
    assert resp.code == "EMPTY_MESSAGES"


def test_stats_has_request_id():
    resp = build_stats(build_services())
    assert len(resp.request_id) > 0


def test_idempotency_cache_returns_same_object():
    services = build_services()
    req = RunRequest(request_id="same", messages=[{"role": "user", "content": "x"}], category=TaskCategory.ROUTINE)
    first = asyncio.run(execute_run(req, services))
    second = asyncio.run(execute_run(req, services))
    assert first is second


def test_routing_failure_returns_api_error():
    services = build_services(client=failing_client)
    req = RunRequest(request_id="fail", messages=[{"role": "user", "content": "x"}], category=TaskCategory.ROUTINE)
    resp = asyncio.run(execute_run(req, services))
    assert isinstance(resp, APIError)
    assert resp.code == "MODEL_ROUTING_FAILED"


def test_timeline_endpoint_has_events():
    services = build_services()
    req = RunRequest(request_id='tl1', messages=[{'role':'user','content':'x'}], category=TaskCategory.ROUTINE)
    asyncio.run(execute_run(req, services))
    timeline = services.execution_store.get_timeline('tl1')
    assert len(timeline) >= 2
