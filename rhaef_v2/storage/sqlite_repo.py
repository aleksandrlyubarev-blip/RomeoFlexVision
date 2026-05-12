from __future__ import annotations

import sqlite3
from pathlib import Path

from rhaef_v2.storage.execution_store import ExecutionEvent, ExecutionRecord


class SQLiteExecutionRepository:
    def __init__(self, db_path: str = ":memory:") -> None:
        self.db_path = db_path
        if db_path != ":memory:":
            Path(db_path).parent.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(db_path)
        self._init_schema()

    def _init_schema(self) -> None:
        self.conn.execute(
            """
            CREATE TABLE IF NOT EXISTS runs (
                request_id TEXT PRIMARY KEY,
                status TEXT,
                decision TEXT,
                policy_code TEXT,
                category TEXT,
                fallback_used INTEGER,
                retries_used INTEGER,
                started_at TEXT,
                finished_at TEXT
            )
            """
        )
        self.conn.execute(
            """
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                request_id TEXT,
                event TEXT,
                payload TEXT,
                timestamp TEXT
            )
            """
        )
        self.conn.commit()

    def add_event(self, event: ExecutionEvent) -> None:
        self.conn.execute(
            "INSERT INTO events (request_id, event, payload, timestamp) VALUES (?, ?, ?, ?)",
            (event.request_id, event.event, str(event.payload), event.timestamp),
        )
        self.conn.commit()

    def save_record(self, record: ExecutionRecord) -> None:
        self.conn.execute(
            """
            INSERT OR REPLACE INTO runs
            (request_id, status, decision, policy_code, category, fallback_used, retries_used, started_at, finished_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                record.request_id,
                record.status,
                record.decision,
                record.policy_code,
                record.category,
                int(record.fallback_used),
                record.retries_used,
                record.started_at,
                record.finished_at,
            ),
        )
        self.conn.commit()

    def get_record(self, request_id: str) -> ExecutionRecord | None:
        row = self.conn.execute(
            "SELECT request_id,status,decision,policy_code,category,fallback_used,retries_used,started_at,finished_at FROM runs WHERE request_id=?",
            (request_id,),
        ).fetchone()
        if not row:
            return None
        return ExecutionRecord(
            request_id=row[0],
            status=row[1],
            decision=row[2],
            policy_code=row[3],
            category=row[4],
            fallback_used=bool(row[5]),
            retries_used=row[6],
            started_at=row[7],
            finished_at=row[8],
        )

    def get_timeline(self, request_id: str) -> list[ExecutionEvent]:
        rows = self.conn.execute(
            "SELECT request_id,event,payload,timestamp FROM events WHERE request_id=? ORDER BY id ASC", (request_id,)
        ).fetchall()
        return [ExecutionEvent(request_id=r[0], event=r[1], payload={"raw": r[2]}, timestamp=r[3]) for r in rows]

    def metrics(self) -> dict[str, int]:
        blocked = self.conn.execute("SELECT COUNT(*) FROM runs WHERE status='blocked'").fetchone()[0]
        failed = self.conn.execute("SELECT COUNT(*) FROM events WHERE event='run_failed'").fetchone()[0]
        idem = self.conn.execute("SELECT COUNT(*) FROM events WHERE event='idempotency_hit'").fetchone()[0]
        total = self.conn.execute("SELECT COUNT(*) FROM events").fetchone()[0]
        return {
            "blocked_runs": int(blocked),
            "failed_runs": int(failed),
            "idempotency_hits": int(idem),
            "timeline_events_total": int(total),
        }
