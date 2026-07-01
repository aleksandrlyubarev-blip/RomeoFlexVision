"""SQLite store. One writer lock; volumes here are tiny (events, not frames).

Idempotency: every incoming event lands in `events` keyed by event_id first;
a duplicate insert is a no-op and skips projection, so checker spool replays
are safe.
"""

from __future__ import annotations

import json
import sqlite3
import threading
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

HEARTBEAT_STALE_S = 90

_SCHEMA = """
CREATE TABLE IF NOT EXISTS events (
    event_id   TEXT PRIMARY KEY,
    stand_id   TEXT NOT NULL,
    type       TEXT NOT NULL,
    ts         TEXT NOT NULL,
    session_id TEXT,
    payload    TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS stands (
    stand_id       TEXT PRIMARY KEY,
    last_seen      TEXT,
    last_heartbeat TEXT
);
CREATE TABLE IF NOT EXISTS sessions (
    session_key   TEXT PRIMARY KEY,   -- stand_id:session_id
    stand_id      TEXT NOT NULL,
    session_id    TEXT NOT NULL,
    name          TEXT DEFAULT '',
    ai_engine     TEXT DEFAULT '',
    started_at    TEXT,
    ended_at      TEXT,
    capture_count INTEGER DEFAULT 0,
    pass_count    INTEGER DEFAULT 0,
    fail_count    INTEGER DEFAULT 0,
    retake_count  INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS captures (
    capture_key    TEXT PRIMARY KEY,  -- stand_id:session_id:capture_id
    stand_id       TEXT NOT NULL,
    session_key    TEXT NOT NULL,
    capture_id     TEXT NOT NULL,
    ts             TEXT NOT NULL,
    quality        TEXT DEFAULT '{}',
    quality_passed INTEGER,
    thumbnail_b64  TEXT,
    verdict        TEXT,
    confidence     REAL,
    rationale      TEXT
);
CREATE INDEX IF NOT EXISTS captures_ts ON captures (ts);
CREATE INDEX IF NOT EXISTS captures_verdict ON captures (verdict, ts);
"""


class Store:
    def __init__(self, db_path: Path | str) -> None:
        self._conn = sqlite3.connect(str(db_path), check_same_thread=False)
        self._conn.row_factory = sqlite3.Row
        self._conn.executescript(_SCHEMA)
        self._lock = threading.Lock()

    def close(self) -> None:
        self._conn.close()

    # -- ingest ----------------------------------------------------------------

    def apply_event(self, event: dict[str, Any]) -> bool:
        """Store + project one event. Returns False for duplicates/invalid."""
        required = {"event_id", "stand_id", "type", "ts"}
        if not required.issubset(event):
            return False
        with self._lock, self._conn:
            cur = self._conn.execute(
                "INSERT OR IGNORE INTO events VALUES (?,?,?,?,?,?)",
                (
                    event["event_id"],
                    event["stand_id"],
                    event["type"],
                    event["ts"],
                    event.get("session_id"),
                    json.dumps(event.get("payload", {})),
                ),
            )
            if cur.rowcount == 0:
                return False  # duplicate
            self._project(event)
            return True

    def _project(self, event: dict[str, Any]) -> None:
        stand = event["stand_id"]
        etype = event["type"]
        ts = event["ts"]
        payload: dict[str, Any] = event.get("payload") or {}
        session_id = event.get("session_id")
        skey = f"{stand}:{session_id}" if session_id else None

        self._conn.execute(
            "INSERT INTO stands (stand_id, last_seen) VALUES (?, ?) "
            "ON CONFLICT(stand_id) DO UPDATE SET last_seen = excluded.last_seen",
            (stand, ts),
        )

        if etype == "heartbeat":
            self._conn.execute(
                "UPDATE stands SET last_heartbeat = ? WHERE stand_id = ?",
                (json.dumps({"ts": ts, **payload}), stand),
            )
        elif etype == "session_started" and skey:
            self._conn.execute(
                "INSERT INTO sessions (session_key, stand_id, session_id, name, ai_engine, started_at) "
                "VALUES (?,?,?,?,?,?) ON CONFLICT(session_key) DO UPDATE SET "
                "name = excluded.name, ai_engine = excluded.ai_engine, started_at = excluded.started_at",
                (skey, stand, session_id, payload.get("name", ""), payload.get("ai_engine", ""), ts),
            )
        elif etype == "capture" and skey:
            self._ensure_session(skey, stand, session_id)
            ckey = f"{skey}:{payload.get('capture_id', '?')}"
            self._conn.execute(
                "INSERT INTO captures (capture_key, stand_id, session_key, capture_id, ts, quality, "
                "quality_passed, thumbnail_b64) VALUES (?,?,?,?,?,?,?,?) "
                "ON CONFLICT(capture_key) DO UPDATE SET quality = excluded.quality, "
                "quality_passed = excluded.quality_passed, thumbnail_b64 = excluded.thumbnail_b64",
                (
                    ckey,
                    stand,
                    skey,
                    payload.get("capture_id", "?"),
                    ts,
                    json.dumps(payload.get("quality", {})),
                    1 if payload.get("quality_passed") else 0,
                    payload.get("thumbnail_b64"),
                ),
            )
            self._conn.execute(
                "UPDATE sessions SET capture_count = (SELECT COUNT(*) FROM captures WHERE session_key = ?) "
                "WHERE session_key = ?",
                (skey, skey),
            )
        elif etype == "verdict" and skey:
            self._ensure_session(skey, stand, session_id)
            ckey = f"{skey}:{payload.get('capture_id', '?')}"
            # Verdict may arrive before its capture event (spool reorder): keep a row either way.
            self._conn.execute(
                "INSERT INTO captures (capture_key, stand_id, session_key, capture_id, ts) VALUES (?,?,?,?,?) "
                "ON CONFLICT(capture_key) DO NOTHING",
                (ckey, stand, skey, payload.get("capture_id", "?"), ts),
            )
            self._conn.execute(
                "UPDATE captures SET verdict = ?, confidence = ?, rationale = ? WHERE capture_key = ?",
                (payload.get("verdict"), payload.get("confidence"), payload.get("rationale"), ckey),
            )
            self._refresh_session_counts(skey)
        elif etype == "session_ended" and skey:
            self._ensure_session(skey, stand, session_id)
            self._conn.execute(
                "UPDATE sessions SET ended_at = ? WHERE session_key = ?",
                (ts, skey),
            )
            self._refresh_session_counts(skey)

    def _ensure_session(self, skey: str, stand: str, session_id: str | None) -> None:
        self._conn.execute(
            "INSERT INTO sessions (session_key, stand_id, session_id) VALUES (?,?,?) "
            "ON CONFLICT(session_key) DO NOTHING",
            (skey, stand, session_id),
        )

    def _refresh_session_counts(self, skey: str) -> None:
        self._conn.execute(
            "UPDATE sessions SET "
            "pass_count   = (SELECT COUNT(*) FROM captures WHERE session_key = :k AND verdict = 'PASS'), "
            "fail_count   = (SELECT COUNT(*) FROM captures WHERE session_key = :k AND verdict = 'FAIL'), "
            "retake_count = (SELECT COUNT(*) FROM captures WHERE session_key = :k AND verdict = 'RETAKE'), "
            "capture_count = (SELECT COUNT(*) FROM captures WHERE session_key = :k) "
            "WHERE session_key = :k",
            {"k": skey},
        )

    # -- queries ---------------------------------------------------------------

    def stands(self, *, now: datetime | None = None) -> list[dict[str, Any]]:
        now = now or datetime.now(UTC)
        rows = self._conn.execute("SELECT * FROM stands ORDER BY stand_id").fetchall()
        out = []
        for row in rows:
            hb = json.loads(row["last_heartbeat"]) if row["last_heartbeat"] else {}
            status = "offline"
            hb_ts = hb.get("ts")
            if hb_ts:
                age = (now - datetime.fromisoformat(hb_ts)).total_seconds()
                if age <= HEARTBEAT_STALE_S:
                    status = "capturing" if hb.get("session_open") else "online"
            out.append(
                {
                    "stand_id": row["stand_id"],
                    "status": status,
                    "last_seen": row["last_seen"],
                    "heartbeat": hb,
                }
            )
        return out

    def sessions(self, *, limit: int = 20) -> list[dict[str, Any]]:
        rows = self._conn.execute(
            "SELECT * FROM sessions ORDER BY COALESCE(started_at, '') DESC LIMIT ?", (limit,)
        ).fetchall()
        return [dict(r) for r in rows]

    def session_detail(self, session_key: str) -> dict[str, Any] | None:
        row = self._conn.execute("SELECT * FROM sessions WHERE session_key = ?", (session_key,)).fetchone()
        if row is None:
            return None
        captures = self._conn.execute(
            "SELECT * FROM captures WHERE session_key = ? ORDER BY capture_id", (session_key,)
        ).fetchall()
        return {**dict(row), "captures": [self._capture_dict(c) for c in captures]}

    def recent_failures(self, *, limit: int = 10) -> list[dict[str, Any]]:
        rows = self._conn.execute(
            "SELECT * FROM captures WHERE verdict = 'FAIL' ORDER BY ts DESC LIMIT ?", (limit,)
        ).fetchall()
        return [self._capture_dict(r) for r in rows]

    def metrics(self, *, now: datetime | None = None) -> dict[str, Any]:
        """Today's totals + hourly PASS-rate buckets for the last 24h."""
        now = now or datetime.now(UTC)
        day_start = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
        row = self._conn.execute(
            "SELECT COUNT(*) AS total, "
            "SUM(CASE WHEN verdict = 'PASS' THEN 1 ELSE 0 END) AS pass, "
            "SUM(CASE WHEN verdict = 'FAIL' THEN 1 ELSE 0 END) AS fail, "
            "SUM(CASE WHEN verdict = 'RETAKE' THEN 1 ELSE 0 END) AS retake "
            "FROM captures WHERE ts >= ?",
            (day_start,),
        ).fetchone()
        total, passed = row["total"] or 0, row["pass"] or 0
        judged = passed + (row["fail"] or 0)

        buckets = []
        for i in range(23, -1, -1):
            b_start = (now - timedelta(hours=i + 1)).isoformat()
            b_end = (now - timedelta(hours=i)).isoformat()
            b = self._conn.execute(
                "SELECT COUNT(*) AS n, SUM(CASE WHEN verdict = 'PASS' THEN 1 ELSE 0 END) AS p, "
                "SUM(CASE WHEN verdict = 'FAIL' THEN 1 ELSE 0 END) AS f "
                "FROM captures WHERE ts >= ? AND ts < ?",
                (b_start, b_end),
            ).fetchone()
            n, p, f = b["n"] or 0, b["p"] or 0, b["f"] or 0
            buckets.append(
                {
                    "hour_utc": b_end[:13],
                    "captures": n,
                    "pass_rate": round(p / (p + f), 3) if (p + f) else None,
                }
            )
        return {
            "today": {
                "captures": total,
                "pass": passed,
                "fail": row["fail"] or 0,
                "retake": row["retake"] or 0,
                "pass_rate": round(passed / judged, 3) if judged else None,
            },
            "hourly": buckets,
        }

    @staticmethod
    def _capture_dict(row: sqlite3.Row) -> dict[str, Any]:
        d = dict(row)
        d["quality"] = json.loads(d.get("quality") or "{}")
        d["quality_passed"] = bool(d["quality_passed"]) if d.get("quality_passed") is not None else None
        return d
