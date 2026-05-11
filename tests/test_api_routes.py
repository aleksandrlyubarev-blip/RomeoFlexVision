import asyncio

from rhaef_v2.api.routes import APIServices, build_stats, execute_run
from rhaef_v2.core.model_router import ModelRouter, TaskCategory
from rhaef_v2.core.policies import FrictionPolicyEngine
from rhaef_v2.schemas.api import APIError, RunRequest


class FakeResponse:
    choices = [type("Choice", (), {"message": {"role": "assistant", "content": "ok"}})()]


def fake_client(**kwargs):
    return FakeResponse()


def build_services() -> APIServices:
    return APIServices(model_router=ModelRouter(client=fake_client), policy_engine=FrictionPolicyEngine())


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
