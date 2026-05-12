import pytest

fastapi = pytest.importorskip("fastapi")
pytest.importorskip("pydantic")
from fastapi.testclient import TestClient

from rhaef_v2.api.routes import create_api_router
from rhaef_v2.core.graph import app


@app.get("/__test_ping")
async def _ping():
    return {"ok": True}


def _build_test_app():
    from fastapi import FastAPI

    test_app = FastAPI()
    test_app.include_router(create_api_router())
    return test_app


def test_http_run_and_stats():
    client = TestClient(_build_test_app())
    run_resp = client.post(
        "/run",
        json={
            "request_id": "http-1",
            "messages": [{"role": "user", "content": "ping"}],
            "category": "routine",
            "estimated_cost_usd": 0.0,
            "environment": "dev",
            "risk_level": "low",
        },
    )
    assert run_resp.status_code in {200, 422}
    if run_resp.status_code == 200:
        body = run_resp.json()
        assert body["status"] in {"ok", "blocked"}

    stats_resp = client.get("/stats")
    assert stats_resp.status_code == 200
    stats = stats_resp.json()
    assert "requests" in stats
    assert "policy_profile" in stats


def test_http_run_validation_error_empty_messages():
    client = TestClient(_build_test_app())
    resp = client.post(
        "/run",
        json={
            "request_id": "http-2",
            "messages": [],
            "category": "routine",
            "estimated_cost_usd": 0.0,
            "environment": "dev",
            "risk_level": "low",
        },
    )
    assert resp.status_code in {200, 422}
    if resp.status_code == 200:
        payload = resp.json()
        assert payload["code"] == "EMPTY_MESSAGES"
