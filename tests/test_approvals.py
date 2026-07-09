import asyncio

import pytest

from rhaef_v2.api.routes import APIServices, execute_run, list_pending_approvals, resolve_approval
from rhaef_v2.core.approvals import (
    ApprovalBroker,
    ApprovalPendingError,
    ApprovalRejectedError,
    ApprovalStatus,
)
from rhaef_v2.core.model_router import FrictionGate, ModelRouter, TaskCategory
from rhaef_v2.core.policies import FrictionPolicyEngine
from rhaef_v2.core.settings import RuntimeSettings
from rhaef_v2.schemas.api import ApprovalResolveRequest, RunRequest


class FakeResponse:
    choices = [type("Choice", (), {"message": {"role": "assistant", "content": "ok"}})()]


def _fake_client(**_):
    return FakeResponse()


def _router(broker: ApprovalBroker, approver=None) -> ModelRouter:
    return ModelRouter(
        client=_fake_client,
        settings=RuntimeSettings(langsmith_tracing_v2=False, langsmith_api_key=None),
        approver=approver,
        approval_broker=broker,
    )


MESSAGES = [{"role": "user", "content": "ping"}]


def test_broker_request_resolve_roundtrip():
    broker = ApprovalBroker()
    record = broker.request("dangerous op")
    assert record.status is ApprovalStatus.PENDING
    assert [r.approval_id for r in broker.pending()] == [record.approval_id]

    resolved = broker.resolve(record.approval_id, approved=True, note="ok")
    assert resolved.status is ApprovalStatus.APPROVED
    assert broker.is_approved(record.approval_id)
    assert broker.pending() == []


def test_broker_wait_unblocks_on_resolve():
    broker = ApprovalBroker()

    async def scenario() -> bool:
        record = broker.request("op")
        loop = asyncio.get_running_loop()
        loop.call_soon(broker.resolve, record.approval_id, True)
        return await broker.wait(record.approval_id, timeout=1.0)

    assert asyncio.run(scenario()) is True


def test_route_with_friction_raises_pending_and_registers_approval():
    broker = ApprovalBroker()
    router = _router(broker)

    with pytest.raises(ApprovalPendingError) as exc_info:
        asyncio.run(router.route(TaskCategory.CRITICAL, MESSAGES, friction=FrictionGate.critical("X")))

    approval_id = exc_info.value.approval_id
    assert broker.get(approval_id).status is ApprovalStatus.PENDING


def test_route_resumes_after_approval():
    broker = ApprovalBroker()
    router = _router(broker)
    gate = FrictionGate.critical("X")

    with pytest.raises(ApprovalPendingError) as exc_info:
        asyncio.run(router.route(TaskCategory.CRITICAL, MESSAGES, friction=gate))

    approval_id = exc_info.value.approval_id
    broker.resolve(approval_id, approved=True)
    result = asyncio.run(router.route(TaskCategory.CRITICAL, MESSAGES, friction=gate, approval_id=approval_id))
    assert result.choices[0].message["content"] == "ok"


def test_route_rejected_approval_raises():
    broker = ApprovalBroker()
    router = _router(broker)
    gate = FrictionGate.critical("X")

    with pytest.raises(ApprovalPendingError) as exc_info:
        asyncio.run(router.route(TaskCategory.CRITICAL, MESSAGES, friction=gate))

    approval_id = exc_info.value.approval_id
    broker.resolve(approval_id, approved=False)
    with pytest.raises(ApprovalRejectedError):
        asyncio.run(router.route(TaskCategory.CRITICAL, MESSAGES, friction=gate, approval_id=approval_id))


def test_route_with_inline_approver():
    broker = ApprovalBroker()

    async def approve(_gate: FrictionGate) -> bool:
        return True

    async def deny(_gate: FrictionGate) -> bool:
        return False

    router = _router(broker, approver=approve)
    result = asyncio.run(router.route(TaskCategory.CRITICAL, MESSAGES, friction=FrictionGate.critical("X")))
    assert result.choices[0].message["content"] == "ok"

    router = _router(broker, approver=deny)
    with pytest.raises(ApprovalRejectedError):
        asyncio.run(router.route(TaskCategory.CRITICAL, MESSAGES, friction=FrictionGate.critical("X")))


def _services() -> APIServices:
    broker = ApprovalBroker()
    return APIServices(
        model_router=ModelRouter(
            client=_fake_client,
            settings=RuntimeSettings(langsmith_tracing_v2=False, langsmith_api_key=None),
            approval_broker=broker,
        ),
        policy_engine=FrictionPolicyEngine(),
        approval_broker=broker,
    )


def _critical_run_request() -> RunRequest:
    return RunRequest(request_id="req-1", messages=MESSAGES, category=TaskCategory.CRITICAL)


def test_api_blocked_run_returns_approval_id_and_resume_executes():
    services = _services()

    blocked = asyncio.run(execute_run(_critical_run_request(), services))
    assert blocked.status == "blocked"
    assert blocked.approval_id is not None

    pending = list_pending_approvals(services)
    assert [view.approval_id for view in pending.pending] == [blocked.approval_id]

    resumed = asyncio.run(
        resolve_approval(blocked.approval_id, ApprovalResolveRequest(approved=True, note="lgtm"), services)
    )
    assert resumed.status == "ok"
    assert resumed.decision == "human_approved"
    assert resumed.output == "ok"
    assert resumed.request_id == "req-1"
    assert list_pending_approvals(services).pending == []


def test_api_rejected_run_and_double_resolve_guard():
    services = _services()
    blocked = asyncio.run(execute_run(_critical_run_request(), services))

    rejected = asyncio.run(
        resolve_approval(blocked.approval_id, ApprovalResolveRequest(approved=False, note="no"), services)
    )
    assert rejected.status == "rejected"
    assert rejected.decision == "human_rejected"

    again = asyncio.run(resolve_approval(blocked.approval_id, ApprovalResolveRequest(approved=True), services))
    assert again.code == "APPROVAL_ALREADY_RESOLVED"


def test_api_resolve_unknown_approval_returns_error():
    services = _services()
    result = asyncio.run(resolve_approval("missing", ApprovalResolveRequest(approved=True), services))
    assert result.code == "APPROVAL_NOT_FOUND"
