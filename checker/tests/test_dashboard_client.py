"""DashboardClient: spool durability, batching, retry semantics."""

from __future__ import annotations

import json
import threading
from pathlib import Path
from unittest.mock import patch

import pytest
import requests

from checker.dashboard_client import MAX_BATCH, DashboardClient


@pytest.fixture()
def client(tmp_path: Path):
    c = DashboardClient(
        url="http://dash.example",
        token="tok",
        stand_id="stand-01",
        spool_path=tmp_path / "spool.jsonl",
        timeout_s=1.0,
    )
    yield c
    c.close()


def _spooled(c: DashboardClient) -> list[dict]:
    if not c._spool.exists():
        return []
    return [json.loads(line) for line in c._spool.read_text().splitlines()]


def test_emit_appends_envelope_to_spool(client: DashboardClient) -> None:
    client.set_session("2026-07-01_0001")
    client.emit("capture", {"capture_id": "001"})
    events = _spooled(client)
    assert len(events) >= 1
    ev = [e for e in events if e["type"] == "capture"][0]
    assert ev["stand_id"] == "stand-01"
    assert ev["session_id"] == "2026-07-01_0001"
    assert ev["payload"] == {"capture_id": "001"}
    assert len(ev["event_id"]) == 32


def test_flush_posts_batch_and_truncates(client: DashboardClient) -> None:
    for i in range(3):
        client.emit("capture", {"capture_id": f"{i:03d}"})
    with patch("checker.dashboard_client.requests.post") as post:
        post.return_value.status_code = 202
        assert client.flush_once() is True
    (call,) = post.call_args_list
    assert call.kwargs["headers"] == {"X-API-Key": "tok"}
    sent = call.kwargs["json"]
    assert isinstance(sent, list) and len(sent) >= 3
    assert _spooled(client) == []


def test_flush_keeps_spool_on_network_error(client: DashboardClient) -> None:
    client.emit("capture", {"capture_id": "001"})
    with patch(
        "checker.dashboard_client.requests.post",
        side_effect=requests.ConnectionError("down"),
    ):
        assert client.flush_once() is False
    assert len(_spooled(client)) == 1


def test_flush_keeps_spool_on_http_error(client: DashboardClient) -> None:
    client.emit("capture", {"capture_id": "001"})
    with patch("checker.dashboard_client.requests.post") as post:
        post.return_value.status_code = 401
        assert client.flush_once() is False
    assert len(_spooled(client)) == 1


def test_corrupt_spool_lines_are_dropped_not_looped(client: DashboardClient) -> None:
    client._spool.write_text("{not json}\n")
    client.emit("capture", {"capture_id": "001"})
    with patch("checker.dashboard_client.requests.post") as post:
        post.return_value.status_code = 202
        assert client.flush_once() is True
    assert _spooled(client) == []
    sent = post.call_args.kwargs["json"]
    assert [e["type"] for e in sent] == ["capture"]


def test_events_appended_mid_flush_survive(client: DashboardClient) -> None:
    client.emit("capture", {"capture_id": "001"})

    def post_and_append(*args, **kwargs):
        client.emit("capture", {"capture_id": "002"})  # arrives during POST
        resp = type("R", (), {"status_code": 202})()
        return resp

    with patch("checker.dashboard_client.requests.post", side_effect=post_and_append):
        client.flush_once()
    remaining = _spooled(client)
    assert [e["payload"]["capture_id"] for e in remaining] == ["002"]


def test_batch_is_capped(client: DashboardClient) -> None:
    for i in range(MAX_BATCH + 5):
        client.emit("capture", {"capture_id": str(i)})
    with patch("checker.dashboard_client.requests.post") as post:
        post.return_value.status_code = 202
        client.flush_once()
    assert len(post.call_args.kwargs["json"]) == MAX_BATCH
    assert len(_spooled(client)) == 5


def test_concurrent_emit_is_safe(client: DashboardClient) -> None:
    def worker(n: int) -> None:
        for i in range(50):
            client.emit("capture", {"capture_id": f"{n}-{i}"})

    threads = [threading.Thread(target=worker, args=(n,)) for n in range(4)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    assert len(_spooled(client)) >= 200  # 200 emits + possible heartbeat
