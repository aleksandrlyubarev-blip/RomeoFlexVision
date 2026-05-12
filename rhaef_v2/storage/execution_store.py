from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any


@dataclass
class ExecutionEvent:
    request_id: str
    event: str
    payload: dict[str, Any] = field(default_factory=dict)
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


@dataclass
class ExecutionRecord:
    request_id: str
    status: str
    decision: str
    policy_code: str
    category: str
    fallback_used: bool
    retries_used: int
    started_at: str
    finished_at: str


class InMemoryExecutionStore:
    def __init__(self) -> None:
        self.records: dict[str, ExecutionRecord] = {}
        self.events: dict[str, list[ExecutionEvent]] = {}

    def add_event(self, event: ExecutionEvent) -> None:
        self.events.setdefault(event.request_id, []).append(event)

    def save_record(self, record: ExecutionRecord) -> None:
        self.records[record.request_id] = record

    def get_record(self, request_id: str) -> ExecutionRecord | None:
        return self.records.get(request_id)

    def get_timeline(self, request_id: str) -> list[ExecutionEvent]:
        return self.events.get(request_id, [])

    def metrics(self) -> dict[str, int]:
        blocked_runs = sum(1 for r in self.records.values() if r.status == "blocked")
        failed_runs = sum(1 for e in self.events.values() for ev in e if ev.event == "run_failed")
        idempotency_hits = sum(1 for e in self.events.values() for ev in e if ev.event == "idempotency_hit")
        timeline_events_total = sum(len(v) for v in self.events.values())
        return {
            "blocked_runs": blocked_runs,
            "failed_runs": failed_runs,
            "idempotency_hits": idempotency_hits,
            "timeline_events_total": timeline_events_total,
        }
