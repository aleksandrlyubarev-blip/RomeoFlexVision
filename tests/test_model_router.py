from asyncio import run

from rhaef_v2.core.model_router import FrictionGate, MODEL_MAPPING, ModelRouter, TaskCategory
from rhaef_v2.core.settings import RuntimeSettings


class FakeResponse:
    choices = [type("Choice", (), {"message": {"role": "assistant", "content": "ok"}})()]


def test_model_mapping_has_coding():
    assert MODEL_MAPPING[TaskCategory.CODING] == "anthropic/claude-opus-4-7"


def test_model_mapping_routes_routine_through_gemini():
    assert MODEL_MAPPING[TaskCategory.ROUTINE] == "vertex_ai/gemini-2.5-flash"


def test_model_mapping_has_explicit_gemini_category():
    assert MODEL_MAPPING[TaskCategory.GEMINI] == "vertex_ai/gemini-2.5-flash"


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
    assert called["model"] == "vertex_ai/gemini-2.5-flash"
    assert called["metadata"]["rhaef_category"] == "routine"
    assert called["tags"] == ["rhaef-v2", "routine"]


def test_gemini_model_can_be_overridden_for_ai_studio(monkeypatch):
    called = {}

    def fake_client(**kwargs):
        called.update(kwargs)
        return FakeResponse()

    monkeypatch.setenv("RHAEF_GEMINI_MODEL", "gemini/gemini-2.5-flash")
    router = ModelRouter(client=fake_client, settings=RuntimeSettings(langsmith_tracing_v2=False))
    result = run(router.route(TaskCategory.GEMINI, [{"role": "user", "content": "ping"}]))

    assert result.choices[0].message["content"] == "ok"
    assert called["model"] == "gemini/gemini-2.5-flash"
    assert called["metadata"]["rhaef_category"] == "gemini"
    assert "vertex_project" not in called


def test_vertex_gemini_enriches_project_and_location(monkeypatch):
    called = {}

    def fake_client(**kwargs):
        called.update(kwargs)
        return FakeResponse()

    monkeypatch.setenv("VERTEXAI_PROJECT", "demo-project")
    monkeypatch.setenv("VERTEXAI_LOCATION", "us-central1")
    router = ModelRouter(client=fake_client, settings=RuntimeSettings(langsmith_tracing_v2=False))
    run(router.route(TaskCategory.GEMINI, [{"role": "user", "content": "ping"}]))

    assert called["model"] == "vertex_ai/gemini-2.5-flash"
    assert called["vertex_project"] == "demo-project"
    assert called["vertex_location"] == "us-central1"


def test_vertex_params_are_removed_on_non_vertex_fallback(monkeypatch):
    calls = []

    def flaky_client(**kwargs):
        calls.append(dict(kwargs))
        if len(calls) == 1:
            raise RuntimeError("vertex unavailable")
        return FakeResponse()

    monkeypatch.setenv("VERTEXAI_PROJECT", "demo-project")
    monkeypatch.setenv("VERTEXAI_LOCATION", "us-central1")
    router = ModelRouter(client=flaky_client, settings=RuntimeSettings(langsmith_tracing_v2=False))
    result = run(router.route(TaskCategory.GEMINI, [{"role": "user", "content": "ping"}]))

    assert result.choices[0].message["content"] == "ok"
    assert calls[0]["model"] == "vertex_ai/gemini-2.5-flash"
    assert calls[0]["vertex_project"] == "demo-project"
    assert calls[1]["model"] == "qwen/qwen3.6-plus"
    assert "vertex_project" not in calls[1]
    assert "vertex_location" not in calls[1]
