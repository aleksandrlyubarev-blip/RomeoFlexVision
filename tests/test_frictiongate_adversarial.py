"""Adversarial QA for the async FrictionGate work (commit 82df76a).

Covers: real FastAPI HTTP surface for the blocked -> resume flow, broker
concurrency/ordering edge cases, cross-broker approval ids, fallback after
approval, and the langgraph module-level router behaviour.

Tests marked xfail(strict=True) expose real defects; see the reason strings.
"""

from __future__ import annotations

import asyncio

import pytest

fastapi = pytest.importorskip("fastapi")
from fastapi import FastAPI
from fastapi.testclient import TestClient

from rhaef_v2.api.routes import APIServices, create_api_router, execute_run
from rhaef_v2.core.approvals import (
    ApprovalBroker,
    ApprovalPendingError,
    ApprovalRejectedError,
    ApprovalStatus,
    get_default_broker,
)
from rhaef_v2.core.model_router import FrictionGate, ModelRouter, TaskCategory
from rhaef_v2.core.policies import FrictionPolicyEngine
from rhaef_v2.core.settings import RuntimeSettings
from rhaef_v2.schemas.api import RunRequest

MESSAGES = [{"role": "user", "content": "ping"}]


class _FakeResponse:
    choices = [type("Choice", (), {"message": {"role": "assistant", "content": "ok"}})()]


def _fake_client(**_):
    return _FakeResponse()


def _settings() -> RuntimeSettings:
    return RuntimeSettings(langsmith_tracing_v2=False, langsmith_api_key=None)


def _router(broker: ApprovalBroker, client=_fake_client) -> ModelRouter:
    return ModelRouter(client=client, settings=_settings(), approval_broker=broker)


def _make_app() -> tuple[TestClient, APIServices]:
    broker = ApprovalBroker()
    services = APIServices(
        model_router=_router(broker),
        policy_engine=FrictionPolicyEngine(),
        approval_broker=broker,
    )
    app = FastAPI()
    app.include_router(create_api_router(services))
    return TestClient(app, raise_server_exceptions=False), services


def _run_body(request_id: str = "req-e2e") -> dict:
    return {
        "request_id": request_id,
        "messages": MESSAGES,
        "category": "critical",
    }


# ---------------------------------------------------------------------------
# End-to-end HTTP flow
# ---------------------------------------------------------------------------


def test_http_e2e_blocked_then_resume_executes():
    client, _ = _make_app()

    blocked = client.post("/run", json=_run_body())
    assert blocked.status_code == 200, blocked.text
    body = blocked.json()
    assert body["status"] == "blocked"
    approval_id = body["approval_id"]
    assert approval_id

    listed = client.get("/approvals").json()
    assert [item["approval_id"] for item in listed["pending"]] == [approval_id]

    resolved = client.post(f"/approvals/{approval_id}/resolve", json={"approved": True, "note": "lgtm"})
    assert resolved.status_code == 200
    resolved_body = resolved.json()
    assert resolved_body["status"] == "ok"
    assert resolved_body["decision"] == "human_approved"
    assert resolved_body["output"] == "ok"
    assert client.get("/approvals").json()["pending"] == []


def test_http_run_empty_messages_returns_typed_error_not_500():
    """APIError responses (EMPTY_MESSAGES) must serialize over HTTP instead of
    failing response-model validation."""
    client, _ = _make_app()
    resp = client.post("/run", json={"request_id": "r-empty", "messages": [], "category": "routine"})
    assert resp.status_code == 200
    assert resp.json()["code"] == "EMPTY_MESSAGES"


def test_http_approvals_list_and_resolve_endpoints_work_for_stored_payloads():
    """Resume endpoints themselves work over real HTTP once a record exists
    (created in-process because POST /run is 422-broken, see xfail above)."""
    client, services = _make_app()

    blocked = asyncio.run(
        execute_run(
            RunRequest(request_id="req-http", messages=MESSAGES, category=TaskCategory.CRITICAL),
            services,
        )
    )
    assert blocked.status == "blocked"

    listed = client.get("/approvals")
    assert listed.status_code == 200
    pending = listed.json()["pending"]
    assert [item["approval_id"] for item in pending] == [blocked.approval_id]
    # docstring promise: the stored RunRequest payload must not leak via the API
    assert "payload" not in pending[0]

    resolved = client.post(
        f"/approvals/{blocked.approval_id}/resolve", json={"approved": True, "note": "lgtm"}
    )
    assert resolved.status_code == 200
    body = resolved.json()
    assert body["status"] == "ok"
    assert body["output"] == "ok"
    assert body["request_id"] == "req-http"

    # double resolve over HTTP is guarded
    again = client.post(f"/approvals/{blocked.approval_id}/resolve", json={"approved": True})
    assert again.status_code == 200
    assert again.json()["code"] == "APPROVAL_ALREADY_RESOLVED"


def test_http_reject_flow_and_unknown_id():
    client, services = _make_app()
    blocked = asyncio.run(
        execute_run(
            RunRequest(request_id="req-rej", messages=MESSAGES, category=TaskCategory.CRITICAL),
            services,
        )
    )
    rejected = client.post(
        f"/approvals/{blocked.approval_id}/resolve", json={"approved": False, "note": "nope"}
    )
    assert rejected.status_code == 200
    assert rejected.json()["status"] == "rejected"
    assert rejected.json()["decision"] == "human_rejected"

    missing = client.post("/approvals/does-not-exist/resolve", json={"approved": True})
    assert missing.status_code == 200
    assert missing.json()["code"] == "APPROVAL_NOT_FOUND"


def test_http_resolve_of_router_registered_approval_does_not_500():
    client, services = _make_app()

    async def trigger() -> str:
        try:
            await services.model_router.route(
                TaskCategory.CRITICAL, MESSAGES, friction=FrictionGate.critical("router gate")
            )
        except ApprovalPendingError as exc:
            return exc.approval_id
        raise AssertionError("expected ApprovalPendingError")

    approval_id = asyncio.run(trigger())
    # it is listed via the API, so a human WILL try to resolve it there
    assert approval_id in [i["approval_id"] for i in client.get("/approvals").json()["pending"]]

    resp = client.post(f"/approvals/{approval_id}/resolve", json={"approved": True})
    assert resp.status_code != 500, "resolve endpoint must not crash on payload-less approvals"


def test_resolve_of_router_registered_approval_records_decision_and_resumes():
    """Payload-less (router-registered) approvals resolve without re-execution;
    the caller then resumes via route(..., approval_id=...)."""
    client, services = _make_app()

    async def trigger() -> str:
        try:
            await services.model_router.route(
                TaskCategory.CRITICAL, MESSAGES, friction=FrictionGate.critical("router gate")
            )
        except ApprovalPendingError as exc:
            return exc.approval_id

    approval_id = asyncio.run(trigger())
    resp = client.post(f"/approvals/{approval_id}/resolve", json={"approved": True, "note": "go"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "approved"
    assert body["decision"] == "human_approved"
    assert body["output"] is None, "nothing to re-execute for router-registered approvals"
    assert services.broker().get(approval_id).status is ApprovalStatus.APPROVED

    # the original caller can now resume through the router
    result = asyncio.run(
        services.model_router.route(
            TaskCategory.CRITICAL, MESSAGES, friction=FrictionGate.critical("router gate"), approval_id=approval_id
        )
    )
    assert result.choices[0].message["content"] == "ok"

    again = client.post(f"/approvals/{approval_id}/resolve", json={"approved": True})
    assert again.json()["code"] == "APPROVAL_ALREADY_RESOLVED"


# ---------------------------------------------------------------------------
# Broker-level adversarial cases
# ---------------------------------------------------------------------------


def test_concurrent_friction_gates_yield_distinct_resumable_approvals():
    broker = ApprovalBroker()
    router = _router(broker)
    gate = FrictionGate.critical("X")

    async def scenario() -> list:
        first = await asyncio.gather(
            *(router.route(TaskCategory.CRITICAL, MESSAGES, friction=gate) for _ in range(8)),
            return_exceptions=True,
        )
        assert all(isinstance(e, ApprovalPendingError) for e in first)
        ids = [e.approval_id for e in first]
        assert len(set(ids)) == 8, "concurrent gates must not share approval ids"
        assert {r.approval_id for r in broker.pending()} == set(ids)
        for approval_id in ids:
            broker.resolve(approval_id, approved=True)
        return await asyncio.gather(
            *(
                router.route(TaskCategory.CRITICAL, MESSAGES, friction=gate, approval_id=i)
                for i in ids
            )
        )

    results = asyncio.run(scenario())
    assert all(r.choices[0].message["content"] == "ok" for r in results)
    assert broker.pending() == []


def test_resolve_before_wait_does_not_deadlock():
    broker = ApprovalBroker()
    record = broker.request("op")
    broker.resolve(record.approval_id, approved=True)  # resolved before anyone waits

    async def waiter() -> bool:
        return await broker.wait(record.approval_id, timeout=0.5)

    assert asyncio.run(waiter()) is True


def test_broker_unknown_id_raises_keyerror():
    """Documents the broker's contract: unknown ids are a hard KeyError.
    Acceptable only because the API layer checks get() first."""
    broker = ApprovalBroker()
    with pytest.raises(KeyError):
        broker.resolve("missing", approved=True)
    with pytest.raises(KeyError):
        asyncio.run(broker.wait("missing", timeout=0.01))


def test_broker_double_resolve_silently_flips_status():
    """Documents (hardening gap, reported): broker.resolve is not idempotent and
    not guarded — a second resolve flips APPROVED -> REJECTED silently, which also
    flips is_approved() and would make a later route(approval_id=...) raise
    ApprovalRejectedError for work that may already have executed. The API layer
    guards this, the broker does not."""
    broker = ApprovalBroker()
    record = broker.request("op")
    broker.resolve(record.approval_id, approved=True)
    assert broker.is_approved(record.approval_id)
    broker.resolve(record.approval_id, approved=False, note="flip")
    assert broker.get(record.approval_id).status is ApprovalStatus.REJECTED
    assert not broker.is_approved(record.approval_id)


def test_approved_id_is_replayable_indefinitely():
    """Documents (hardening gap, reported): an approved approval_id is not
    single-use — the same id passes the friction gate any number of times."""
    broker = ApprovalBroker()
    router = _router(broker)
    gate = FrictionGate.critical("X")

    with pytest.raises(ApprovalPendingError) as exc_info:
        asyncio.run(router.route(TaskCategory.CRITICAL, MESSAGES, friction=gate))
    approval_id = exc_info.value.approval_id
    broker.resolve(approval_id, approved=True)

    for _ in range(3):
        result = asyncio.run(
            router.route(TaskCategory.CRITICAL, MESSAGES, friction=gate, approval_id=approval_id)
        )
        assert result.choices[0].message["content"] == "ok"


def test_unknown_approval_id_surfaces_a_resolvable_id():
    broker_a = ApprovalBroker()
    broker_b = ApprovalBroker()
    foreign = broker_a.request("op in A")
    broker_a.resolve(foreign.approval_id, approved=True)

    router_b = _router(broker_b)
    with pytest.raises(ApprovalPendingError) as exc_info:
        asyncio.run(
            router_b.route(
                TaskCategory.CRITICAL,
                MESSAGES,
                friction=FrictionGate.critical("X"),
                approval_id=foreign.approval_id,
            )
        )
    surfaced = exc_info.value.approval_id
    assert broker_b.get(surfaced) is not None, (
        "the id surfaced in ApprovalPendingError must exist in the router's broker, "
        "otherwise it can never be resolved"
    )


def test_fallback_client_path_still_runs_after_approval():
    """Primary model raises after the gate passes -> fallback executes; the
    approval must not be re-demanded or invalidated by the failure."""
    broker = ApprovalBroker()
    calls: list[str] = []

    def flaky_client(**kwargs):
        calls.append(kwargs["model"])
        if len(calls) == 1:
            raise RuntimeError("primary provider down")
        return _FakeResponse()

    router = _router(broker, client=flaky_client)
    gate = FrictionGate.critical("X")

    with pytest.raises(ApprovalPendingError) as exc_info:
        asyncio.run(router.route(TaskCategory.CRITICAL, MESSAGES, friction=gate))
    approval_id = exc_info.value.approval_id
    broker.resolve(approval_id, approved=True)

    result = asyncio.run(
        router.route(TaskCategory.CRITICAL, MESSAGES, friction=gate, approval_id=approval_id)
    )
    assert result.choices[0].message["content"] == "ok"
    assert calls == ["anthropic/claude-opus-4-7", "openai/gpt-5.5-pro"]
    assert broker.is_approved(approval_id), "approval must survive the fallback"


def test_concurrent_resolves_execute_stored_request_exactly_once():
    from rhaef_v2.api.routes import resolve_approval
    from rhaef_v2.schemas.api import ApprovalResolveRequest

    executions: list[str] = []

    def counting_client(**kwargs):
        executions.append(kwargs["model"])
        return _FakeResponse()

    broker = ApprovalBroker()
    services = APIServices(
        model_router=ModelRouter(client=counting_client, settings=_settings(), approval_broker=broker),
        policy_engine=FrictionPolicyEngine(),
        approval_broker=broker,
    )

    async def scenario():
        blocked = await execute_run(
            RunRequest(request_id="req-c", messages=MESSAGES, category=TaskCategory.CRITICAL),
            services,
        )
        return await asyncio.gather(
            resolve_approval(blocked.approval_id, ApprovalResolveRequest(approved=True), services),
            resolve_approval(blocked.approval_id, ApprovalResolveRequest(approved=True), services),
        )

    first, second = asyncio.run(scenario())
    outcomes = sorted(getattr(r, "status", None) or getattr(r, "code", None) for r in (first, second))
    assert outcomes == ["APPROVAL_ALREADY_RESOLVED", "ok"]
    assert len(executions) == 1, "stored request must execute exactly once"


# ---------------------------------------------------------------------------
# Module-level langgraph router (rhaef_v2/core/graph.py)
# ---------------------------------------------------------------------------


def test_core_graph_module_imports_and_exposes_approval_routes():
    from rhaef_v2.core import graph as coregraph

    client = TestClient(coregraph.app, raise_server_exceptions=False)
    assert client.get("/health").json() == {"status": "ok"}
    resp = client.get("/approvals")
    assert resp.status_code == 200
    assert "pending" in resp.json()


def test_graph_critical_node_raises_pending_instead_of_hanging():
    """The old code blocked the event loop on input(); the new code raises
    ApprovalPendingError from inside the langgraph node. NOTE (reported, not
    xfailed because the exception itself is the intended replacement for the
    hang): nothing in core/graph.py catches it, the node cannot pass an
    approval_id back in, and every retry leaks a fresh pending record into the
    process-global default broker — the compiled rhaef_graph is unresumable."""
    from rhaef_v2.core import graph as coregraph

    state = {"messages": MESSAGES}
    with pytest.raises(ApprovalPendingError) as exc_info:
        asyncio.run(coregraph.claude_coder_node(state))
    first_id = exc_info.value.approval_id
    assert get_default_broker().get(first_id) is not None

    # a retry does not resume: it registers ANOTHER pending approval
    with pytest.raises(ApprovalPendingError) as exc_info2:
        asyncio.run(coregraph.claude_coder_node(state))
    assert exc_info2.value.approval_id != first_id

    # keep the global broker tidy for other tests
    get_default_broker().resolve(first_id, approved=False, note="qa cleanup")
    get_default_broker().resolve(exc_info2.value.approval_id, approved=False, note="qa cleanup")
