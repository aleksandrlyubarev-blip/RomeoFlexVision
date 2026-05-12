from __future__ import annotations

from typing import Protocol

from rhaef_v2.storage.execution_store import ExecutionEvent, ExecutionRecord


class ExecutionRepository(Protocol):
    def add_event(self, event: ExecutionEvent) -> None: ...

    def save_record(self, record: ExecutionRecord) -> None: ...

    def get_record(self, request_id: str) -> ExecutionRecord | None: ...

    def get_timeline(self, request_id: str) -> list[ExecutionEvent]: ...

    def metrics(self) -> dict[str, int]: ...
