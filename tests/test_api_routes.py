import asyncio
import os
import tempfile

from rhaef_v2.api.routes import APIServices, build_stats, create_execution_store, execute_run
from rhaef_v2.core.model_router import ModelRouter, TaskCategory
from rhaef_v2.core.policies import FrictionPolicyEngine
from rhaef_v2.core.settings import RuntimeSettings
from rhaef_v2.schemas.api import APIError, RunRequest
from rhaef_v2.storage.execution_store import InMemoryExecutionStore


class FakeResponse:
    choices = [type("Choice", (), {"message": {"role": "assistant", "content": "ok"}})()]


def fake_client(**kwargs):
    return FakeResponse()


def failing_client(**kwargs):
    raise RuntimeError("boom")


def build_services(client=fake_client, policy_profile: str = "dev", storage_backend: str = "memory") -> APIServices:
    settings = RuntimeSettings(policy_profile=policy_profile, storage_backend=storage_backend)
    return APIServices(
        model_router=ModelRouter(client=client, settings=settings),
        policy_engine=FrictionPolicyEngine(settings=settings),
        idempotency_cache={},
        execution_store=InMemoryExecutionStore(),
    )


def test_run_route_blocks_critical():
    req = RunRequest(request_id="r1", messages=[{"role": "user", "content": "x"}], category=TaskCategory.CODING)
    resp = asyncio.run(execute_run(req, build_services()))
    assert resp.status == "blocked"


def test_stats_has_request_id_and_profile():
    services = build_services(policy_profile="stage")
    req = RunRequest(request_id="metrics", messages=[{"role": "user", "content": "x"}], category=TaskCategory.ROUTINE)
    asyncio.run(execute_run(req, services))
    resp = build_stats(services)
    assert resp.policy_profile == "stage"
    assert resp.storage_backend == "memory"


def test_create_execution_store_sqlite():
    with tempfile.NamedTemporaryFile(suffix=".db") as tmp:
        settings = RuntimeSettings(storage_backend="sqlite", sqlite_path=tmp.name)
        store = create_execution_store(settings)
        assert store is not None


def test_sqlite_persistence_across_instances():
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    try:
        settings = RuntimeSettings(storage_backend="sqlite", sqlite_path=path)
        store1 = create_execution_store(settings)
        services1 = APIServices(model_router=ModelRouter(client=fake_client, settings=settings), policy_engine=FrictionPolicyEngine(settings=settings), idempotency_cache={}, execution_store=store1)
        req = RunRequest(request_id="persist", messages=[{"role": "user", "content": "x"}], category=TaskCategory.ROUTINE)
        asyncio.run(execute_run(req, services1))

        store2 = create_execution_store(settings)
        rec = store2.get_record("persist")
        assert rec is not None
    finally:
        os.remove(path)


def test_routing_failure_returns_api_error():
    services = build_services(client=failing_client)
    req = RunRequest(request_id="fail", messages=[{"role": "user", "content": "x"}], category=TaskCategory.ROUTINE)
    resp = asyncio.run(execute_run(req, services))
    assert isinstance(resp, APIError)
