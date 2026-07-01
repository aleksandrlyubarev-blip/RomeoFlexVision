"""Fire-and-forget event emitter for the NeutronVision Display dashboard.

Contract: dashboard/EVENTS.md at the repo root. Events are appended to a
local JSONL spool synchronously (cheap, durable), and a daemon thread flushes
the spool to the dashboard over HTTPS. The UI thread never blocks on the
network; a dead dashboard costs disk space, not frames.
"""

from __future__ import annotations

import base64
import json
import threading
import uuid
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import requests

from .utils.logging import get_logger

_log = get_logger()

FLUSH_INTERVAL_S = 5.0
HEARTBEAT_INTERVAL_S = 30.0
MAX_BATCH = 200
SPOOL_MAX_BYTES = 20 * 1024 * 1024  # drop oldest events past this, dashboard is best-effort


def encode_thumbnail(thumbnail_path: Path) -> str | None:
    try:
        return base64.b64encode(thumbnail_path.read_bytes()).decode("ascii")
    except OSError:
        return None


class DashboardClient:
    """Spool-backed emitter. Safe to construct even when the dashboard is down."""

    def __init__(
        self,
        *,
        url: str,
        token: str,
        stand_id: str,
        spool_path: Path,
        timeout_s: float = 10.0,
    ) -> None:
        self._endpoint = url.rstrip("/") + "/api/events"
        self._token = token
        self._stand_id = stand_id
        self._spool = spool_path
        self._timeout = timeout_s
        self._lock = threading.Lock()
        self._stop = threading.Event()
        self._session_id: str | None = None
        self._heartbeat_extra: dict[str, Any] = {}
        self._flusher = threading.Thread(target=self._run, name="dashboard-flush", daemon=True)
        self._flusher.start()

    # -- producer side (any thread) ------------------------------------------

    def set_session(self, session_id: str | None) -> None:
        self._session_id = session_id

    def set_heartbeat_state(self, **fields: Any) -> None:
        """Merge fields (camera_connected, engine, …) into future heartbeats."""
        self._heartbeat_extra.update(fields)

    def emit(self, event_type: str, payload: dict[str, Any], *, session_id: str | None = None) -> None:
        event = {
            "event_id": uuid.uuid4().hex,
            "stand_id": self._stand_id,
            "type": event_type,
            "ts": datetime.now(UTC).isoformat(),
            "session_id": session_id if session_id is not None else self._session_id,
            "payload": payload,
        }
        line = json.dumps(event, default=str) + "\n"
        with self._lock:
            try:
                if self._spool.exists() and self._spool.stat().st_size > SPOOL_MAX_BYTES:
                    self._drop_oldest_locked()
                with self._spool.open("a") as fh:
                    fh.write(line)
            except OSError as exc:
                _log.warning("dashboard spool write failed: %s", exc)

    def close(self) -> None:
        self._stop.set()
        self._flusher.join(timeout=self._timeout + 1)

    # -- consumer side (flusher thread) ---------------------------------------

    def _run(self) -> None:
        next_heartbeat = 0.0
        while not self._stop.wait(FLUSH_INTERVAL_S):
            now = datetime.now(UTC).timestamp()
            if now >= next_heartbeat:
                self.emit(
                    "heartbeat",
                    {"session_open": self._session_id is not None, **self._heartbeat_extra},
                    session_id=None,
                )
                next_heartbeat = now + HEARTBEAT_INTERVAL_S
            self.flush_once()
        self.flush_once()  # final drain on shutdown

    def flush_once(self) -> bool:
        """POST up to MAX_BATCH spooled events; truncate what was accepted."""
        with self._lock:
            batch, consumed, remainder = self._read_spool_locked()
        if not batch:
            if consumed:  # only corrupt lines: drop them
                with self._lock:
                    self._rewrite_spool_locked(remainder, consumed=consumed)
            return True
        try:
            resp = requests.post(
                self._endpoint,
                json=batch,
                headers={"X-API-Key": self._token},
                timeout=self._timeout,
            )
        except requests.RequestException as exc:
            _log.debug("dashboard flush failed (will retry): %s", exc)
            return False
        if resp.status_code != 202:
            _log.warning("dashboard rejected events: HTTP %s", resp.status_code)
            return False
        with self._lock:
            self._rewrite_spool_locked(remainder, consumed=consumed)
        return True

    def _read_spool_locked(self) -> tuple[list[dict[str, Any]], int, list[str]]:
        """Return (parsed batch, raw lines consumed, remaining raw lines)."""
        if not self._spool.exists():
            return [], 0, []
        lines = self._spool.read_text().splitlines()
        head = lines[:MAX_BATCH]
        batch: list[dict[str, Any]] = []
        for raw in head:
            try:
                batch.append(json.loads(raw))
            except json.JSONDecodeError:
                continue  # corrupt line: consumed and dropped
        return batch, len(head), lines[MAX_BATCH:]

    def _rewrite_spool_locked(self, remainder: list[str], *, consumed: int) -> None:
        # New events may have been appended while we were POSTing; keep them.
        current = self._spool.read_text().splitlines() if self._spool.exists() else []
        appended_during_post = current[consumed + len(remainder):]
        keep = remainder + appended_during_post
        self._spool.write_text("\n".join(keep) + ("\n" if keep else ""))

    def _drop_oldest_locked(self) -> None:
        lines = self._spool.read_text().splitlines()
        keep = lines[len(lines) // 2:]
        self._spool.write_text("\n".join(keep) + ("\n" if keep else ""))
        _log.warning("dashboard spool exceeded %d bytes, dropped %d oldest events", SPOOL_MAX_BYTES, len(lines) - len(keep))
