"""End-to-end API tests over the checker→dashboard event contract."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pytest
from fastapi.testclient import TestClient

from display_backend.main import create_app

TOKEN = "test-token"
AUTH = {"X-API-Key": TOKEN}


@pytest.fixture()
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("DISPLAY_TOKEN", TOKEN)
    app = create_app(tmp_path / "test.db")
    with TestClient(app) as c:
        yield c


def _event(event_id: str, etype: str, payload: dict, *, session_id: str | None = "s1", ts: str | None = None) -> dict:
    return {
        "event_id": event_id,
        "stand_id": "stand-01",
        "type": etype,
        "ts": ts or datetime.now(UTC).isoformat(),
        "session_id": session_id,
        "payload": payload,
    }


def _seed_session(client: TestClient) -> None:
    events = [
        _event("e1", "session_started", {"name": "batch", "ai_engine": "grok"}),
        _event("e2", "capture", {"capture_id": "001", "quality": {"sharpness": 0.8}, "quality_passed": True,
                                 "thumbnail_b64": "abcd"}),
        _event("e3", "verdict", {"capture_id": "001", "verdict": "PASS", "confidence": 0.9, "rationale": "ok"}),
        _event("e4", "capture", {"capture_id": "002", "quality": {"sharpness": 0.4}, "quality_passed": False}),
        _event("e5", "verdict", {"capture_id": "002", "verdict": "FAIL", "confidence": 0.8, "rationale": "scratch"}),
        _event("e6", "session_ended", {"capture_count": 2, "pass": 1, "fail": 1, "retake": 0}),
    ]
    resp = client.post("/api/events", json=events, headers=AUTH)
    assert resp.status_code == 202
    assert resp.json() == {"accepted": 6, "received": 6}


def test_auth_required(client: TestClient) -> None:
    assert client.post("/api/events", json={}).status_code == 401
    assert client.get("/api/overview").status_code == 401
    assert client.get("/api/overview", headers={"X-API-Key": "wrong"}).status_code == 401
    assert client.get("/api/health").status_code == 200  # health is open


def test_ingest_is_idempotent(client: TestClient) -> None:
    _seed_session(client)
    resp = client.post(
        "/api/events",
        json=_event("e2", "capture", {"capture_id": "001", "quality_passed": True}),
        headers=AUTH,
    )
    assert resp.json() == {"accepted": 0, "received": 1}
    detail = client.get("/api/sessions/stand-01:s1", headers=AUTH).json()
    assert detail["capture_count"] == 2  # not double-counted


def test_session_projection(client: TestClient) -> None:
    _seed_session(client)
    detail = client.get("/api/sessions/stand-01:s1", headers=AUTH).json()
    assert detail["name"] == "batch"
    assert detail["pass_count"] == 1
    assert detail["fail_count"] == 1
    assert detail["ended_at"] is not None
    captures = {c["capture_id"]: c for c in detail["captures"]}
    assert captures["001"]["verdict"] == "PASS"
    assert captures["001"]["thumbnail_b64"] == "abcd"
    assert captures["002"]["rationale"] == "scratch"
    assert captures["002"]["quality"] == {"sharpness": 0.4}


def test_verdict_before_capture_is_tolerated(client: TestClient) -> None:
    client.post(
        "/api/events",
        json=[
            _event("v1", "verdict", {"capture_id": "001", "verdict": "FAIL", "rationale": "x"}),
            _event("c1", "capture", {"capture_id": "001", "quality_passed": True}),
        ],
        headers=AUTH,
    )
    detail = client.get("/api/sessions/stand-01:s1", headers=AUTH).json()
    (cap,) = detail["captures"]
    assert cap["verdict"] == "FAIL"
    assert cap["quality_passed"] is True


def test_overview_metrics_and_failures(client: TestClient) -> None:
    _seed_session(client)
    ov = client.get("/api/overview", headers=AUTH).json()
    assert ov["metrics"]["today"]["captures"] == 2
    assert ov["metrics"]["today"]["pass_rate"] == 0.5
    assert len(ov["metrics"]["hourly"]) == 24
    (failure,) = ov["recent_failures"]
    assert failure["capture_id"] == "002"
    assert ov["sessions"][0]["session_key"] == "stand-01:s1"


def test_stand_status_from_heartbeat(client: TestClient) -> None:
    now = datetime.now(UTC)
    client.post(
        "/api/events",
        json=_event("hb1", "heartbeat", {"camera_connected": True, "session_open": True},
                    session_id=None, ts=now.isoformat()),
        headers=AUTH,
    )
    stands = client.get("/api/overview", headers=AUTH).json()["stands"]
    assert stands[0]["status"] == "capturing"
    assert stands[0]["heartbeat"]["camera_connected"] is True

    stale = (now - timedelta(seconds=300)).isoformat()
    client.post(
        "/api/events",
        json=_event("hb2", "heartbeat", {"session_open": False}, session_id=None, ts=stale),
        headers=AUTH,
    )
    # hb2 is newer in insert order; status derives from its (stale) ts
    stands = client.get("/api/overview", headers=AUTH).json()["stands"]
    assert stands[0]["status"] == "offline"


def test_websocket_receives_slim_events(client: TestClient) -> None:
    with client.websocket_connect(f"/api/live?token={TOKEN}") as ws:
        client.post(
            "/api/events",
            json=_event("w1", "capture", {"capture_id": "001", "quality_passed": True,
                                          "thumbnail_b64": "HUGE"}),
            headers=AUTH,
        )
        msg = ws.receive_json()
        assert msg["event_id"] == "w1"
        assert "thumbnail_b64" not in msg["payload"]
        assert msg["payload"]["quality_passed"] is True


def test_websocket_rejects_bad_token(client: TestClient) -> None:
    from starlette.websockets import WebSocketDisconnect

    with pytest.raises(WebSocketDisconnect):
        with client.websocket_connect("/api/live?token=nope") as ws:
            ws.receive_text()
