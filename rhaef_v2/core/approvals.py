"""Async-совместимый механизм одобрений для FrictionGate.

Блокирующий ``input()`` в критических узлах ломает async-пайплайн
(event loop зависает). Вместо него — брокер одобрений: запрос получает
статус ``blocked`` и ``approval_id``, человек подтверждает через
resume-эндпоинт API или CLI-approver, после чего выполнение продолжается.
"""

from __future__ import annotations

import asyncio
from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING, Any, Optional
from uuid import uuid4

try:
    from pydantic import BaseModel, ConfigDict, Field
except Exception:  # pragma: no cover
    class BaseModel:  # type: ignore
        def __init__(self, **data: Any) -> None:
            for key, value in data.items():
                setattr(self, key, value)

    def ConfigDict(**_: Any) -> dict[str, Any]:  # type: ignore
        return {}

    def Field(default: Any = None, **_: Any) -> Any:  # type: ignore
        return default

if TYPE_CHECKING:  # pragma: no cover
    from .model_router import FrictionGate


class ApprovalStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class ApprovalRecord(BaseModel):
    model_config = ConfigDict(strict=False)

    approval_id: str
    reason: str
    status: ApprovalStatus = ApprovalStatus.PENDING
    created_at: str
    resolved_at: Optional[str] = None
    note: str = ""
    # Снимок исходного запроса (RunRequest.model_dump()), чтобы resume-эндпоинт
    # мог выполнить его после одобрения. Наружу через API не отдаётся.
    payload: Optional[dict[str, Any]] = None


class ApprovalPendingError(RuntimeError):
    """Требуется одобрение человека; выполнение остановлено без блокировки loop."""

    def __init__(self, approval_id: str, reason: str) -> None:
        super().__init__(f"human approval required: {reason} (approval_id={approval_id})")
        self.approval_id = approval_id
        self.reason = reason


class ApprovalRejectedError(RuntimeError):
    def __init__(self, approval_id: str, reason: str) -> None:
        super().__init__(f"human approval rejected: {reason} (approval_id={approval_id})")
        self.approval_id = approval_id
        self.reason = reason


class ApprovalBroker:
    """In-memory брокер одобрений; один на процесс, инжектится в router и API."""

    def __init__(self) -> None:
        self._records: dict[str, ApprovalRecord] = {}
        self._events: dict[str, asyncio.Event] = {}

    def request(self, reason: str, payload: Optional[dict[str, Any]] = None) -> ApprovalRecord:
        record = ApprovalRecord(
            approval_id=uuid4().hex,
            reason=reason,
            created_at=datetime.now().isoformat(),
            payload=payload,
        )
        self._records[record.approval_id] = record
        self._events[record.approval_id] = asyncio.Event()
        return record

    def get(self, approval_id: str) -> Optional[ApprovalRecord]:
        return self._records.get(approval_id)

    def pending(self) -> list[ApprovalRecord]:
        return [r for r in self._records.values() if r.status is ApprovalStatus.PENDING]

    def resolve(self, approval_id: str, approved: bool, note: str = "") -> ApprovalRecord:
        record = self._records[approval_id]
        record.status = ApprovalStatus.APPROVED if approved else ApprovalStatus.REJECTED
        record.resolved_at = datetime.now().isoformat()
        record.note = note
        self._events[approval_id].set()
        return record

    def is_approved(self, approval_id: str) -> bool:
        record = self._records.get(approval_id)
        return record is not None and record.status is ApprovalStatus.APPROVED

    async def wait(self, approval_id: str, timeout: Optional[float] = None) -> bool:
        """Дождаться решения (для вызывающих, которые могут ждать в фоне)."""
        event = self._events[approval_id]
        if timeout is None:
            await event.wait()
        else:
            await asyncio.wait_for(event.wait(), timeout)
        return self.is_approved(approval_id)


_default_broker: Optional[ApprovalBroker] = None


def get_default_broker() -> ApprovalBroker:
    global _default_broker
    if _default_broker is None:
        _default_broker = ApprovalBroker()
    return _default_broker


async def console_approver(gate: "FrictionGate") -> bool:
    """Интерактивное подтверждение для CLI-запусков — старое поведение,
    но через ``asyncio.to_thread``, не блокируя event loop."""
    print(f"⚠️ FRICTION GATE: {gate.reason}")
    answer = await asyncio.to_thread(input, "✅ Подтверди (y/Enter — да, n — нет): ")
    return answer.strip().lower() in {"", "y", "yes", "да"}


__all__ = [
    "ApprovalStatus",
    "ApprovalRecord",
    "ApprovalPendingError",
    "ApprovalRejectedError",
    "ApprovalBroker",
    "get_default_broker",
    "console_approver",
]
