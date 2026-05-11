from asyncio import run

from rhaef_v2.core.model_router import FrictionGate, MODEL_MAPPING, ModelRouter, TaskCategory
from rhaef_v2.core.settings import RuntimeSettings


class FakeResponse:
    choices = [type("Choice", (), {"message": {"role": "assistant", "content": "ok"}})()]


def test_model_mapping_has_coding():
    assert MODEL_MAPPING[TaskCategory.CODING] == "anthropic/claude-opus-4-7"


def test_critical_gate_requires_approval():
    gate = FrictionGate.critical("X")
    assert gate.human_approval_required is True


def test_route_uses_injected_client_and_tags():
    called = {}

    def fake_client(**kwargs):
        called.update(kwargs)
        return FakeResponse()

    router = ModelRouter(
        client=fake_client,
        settings=RuntimeSettings(langsmith_tracing_v2=True, langsmith_api_key=None),
    )
    result = run(router.route(TaskCategory.ROUTINE, [{"role": "user", "content": "ping"}]))

    assert result.choices[0].message["content"] == "ok"
    assert called["model"] == "qwen/qwen3.6-plus"
    assert called["metadata"]["rhaef_category"] == "routine"
    assert called["tags"] == ["rhaef-v2", "routine"]
