"""Tests for router-backed brigada agents.

We use the same fake-completion-client pattern as
``tests/test_api_routes.py`` in rhaef_v2 so we exercise the routing
plumbing without hitting any real LLM provider.

The router calls ``litellm.completion_cost`` after every successful
route. Newer litellm versions require a fully populated response,
which our fake client cannot produce, so the fixture below
monkey-patches the cost function to return 0.0 for all tests in this
module.
"""

from __future__ import annotations

import asyncio
import json

import pytest
from rhaef_v2.core.model_router import ModelRouter

from roboqc_data.brigada.agents.router_backed import (
    RouterBackedGeneral,
    RouterBackedMajor,
    RouterBackedSergeant,
    RouterBackedSoldier,
)
from roboqc_data.brigada.hierarchy import Plan, SubPlan, ToolCall, ValidationOutcome
from roboqc_data.schema.taxonomy import DefectClass


@pytest.fixture(autouse=True)
def _stub_litellm_cost(monkeypatch):
    import litellm

    monkeypatch.setattr(litellm, "completion_cost", lambda **_: 0.0)


class FakeResponse:
    def __init__(self, content: str) -> None:
        choice = type("Choice", (), {"message": {"role": "assistant", "content": content}})()
        self.choices = [choice]
        self.model = "fake/test-model"


def _client(content: str):
    return lambda **_: FakeResponse(content)


def _router(content: str) -> ModelRouter:
    return ModelRouter(client=_client(content))


def test_router_backed_general_parses_valid_json():
    router = _router(json.dumps({"strategy": "synthetic batch", "risk": "low"}))
    plan = asyncio.run(RouterBackedGeneral(router).plan(DefectClass.SCREW_MISSING, count=4))
    assert isinstance(plan, Plan)
    assert plan.strategy == "synthetic batch"
    assert plan.risk == "low"


def test_router_backed_general_falls_back_on_garbage():
    router = _router("not-json")
    plan = asyncio.run(RouterBackedGeneral(router).plan(DefectClass.LEAK, count=1))
    assert isinstance(plan, Plan)
    # The heuristic fallback marks LEAK as high risk.
    assert plan.risk == "high"


def test_router_backed_major_fills_missing_fields():
    # The router is allowed to omit defect_class — agent fills it in.
    router = _router(json.dumps({"transform_hint": "scratch"}))
    sub = asyncio.run(
        RouterBackedMajor(router).refine(
            Plan(strategy="x", risk="low"),
            DefectClass.CONNECTOR_DAMAGE,
            count=2,
        )
    )
    assert isinstance(sub, SubPlan)
    assert sub.defect_class is DefectClass.CONNECTOR_DAMAGE
    assert sub.transform_hint == "scratch"
    assert sub.count == 2


def test_router_backed_sergeant_parses_params_block():
    router = _router(json.dumps({"params": {"length_frac": 0.5, "thickness": 3}}))
    tool_call = asyncio.run(
        RouterBackedSergeant(router).parameterize(
            SubPlan(defect_class=DefectClass.CONNECTOR_DAMAGE, transform_hint="scratch", count=1)
        )
    )
    assert isinstance(tool_call, ToolCall)
    assert tool_call.params == {"length_frac": 0.5, "thickness": 3}


def test_router_backed_sergeant_falls_back_when_params_missing():
    router = _router(json.dumps({"other": "stuff"}))
    tool_call = asyncio.run(
        RouterBackedSergeant(router).parameterize(
            SubPlan(defect_class=DefectClass.CONNECTOR_DAMAGE, transform_hint="scratch", count=1)
        )
    )
    # HeuristicSergeant always sets at least length_frac/thickness/intensity.
    assert "length_frac" in tool_call.params


def test_router_backed_soldier_short_circuits_on_empty_mask():
    router = _router("does-not-matter")
    outcome = asyncio.run(
        RouterBackedSoldier(router).validate(
            ToolCall(defect_class=DefectClass.SCREW_MISSING, params={}),
            mask_pixels=0,
        )
    )
    assert isinstance(outcome, ValidationOutcome)
    assert outcome.valid is False
    assert "empty" in outcome.notes


def test_router_backed_soldier_parses_validation_response():
    router = _router(json.dumps({"valid": True, "notes": "looks fine"}))
    outcome = asyncio.run(
        RouterBackedSoldier(router).validate(
            ToolCall(defect_class=DefectClass.SCREW_MISSING, params={}),
            mask_pixels=42,
        )
    )
    assert outcome.valid is True
    assert outcome.notes == "looks fine"


def test_router_backed_agents_compose_in_full_pipeline():
    """All four router-backed agents in series produce a valid pipeline trace."""
    # One router shared across roles — different categories, same fake client.
    router = _router(
        json.dumps(
            {
                # The fake client returns the same body for every call;
                # each agent is tolerant to missing role-specific fields.
                "strategy": "batch",
                "risk": "low",
                "transform_hint": "scratch",
                "params": {"length_frac": 0.3, "thickness": 2},
                "valid": True,
                "notes": "ok",
            }
        )
    )
    plan = asyncio.run(RouterBackedGeneral(router).plan(DefectClass.CONNECTOR_DAMAGE, count=1))
    sub = asyncio.run(RouterBackedMajor(router).refine(plan, DefectClass.CONNECTOR_DAMAGE, count=1))
    tool_call = asyncio.run(RouterBackedSergeant(router).parameterize(sub))
    outcome = asyncio.run(RouterBackedSoldier(router).validate(tool_call, mask_pixels=99))
    assert outcome.valid is True
    assert tool_call.params["length_frac"] == 0.3
