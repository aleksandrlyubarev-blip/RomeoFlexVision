from __future__ import annotations

import os
from datetime import datetime
from enum import Enum
from typing import Any, Awaitable, Callable, Dict, Optional, Protocol

from .approvals import (
    ApprovalBroker,
    ApprovalPendingError,
    ApprovalRejectedError,
    ApprovalStatus,
    get_default_broker,
)
from .settings import RuntimeSettings

try:
    from pydantic import BaseModel, ConfigDict
except Exception:  # pragma: no cover
    class BaseModel:  # type: ignore
        def __init__(self, **data: Any) -> None:
            for key, value in data.items():
                setattr(self, key, value)

    def ConfigDict(**_: Any) -> dict[str, Any]:  # type: ignore
        return {}

try:
    import litellm  # type: ignore
    from litellm import completion  # type: ignore
except Exception:  # pragma: no cover
    litellm = None
    completion = None


class TaskCategory(str, Enum):
    CRITICAL = "critical"
    ARCHITECTURE = "architecture"
    CODING = "coding"
    VISION = "vision"
    EXECUTION = "execution"
    ORCHESTRATION = "orchestration"
    DATA_TEST = "data_test"
    VIDEO_MEDIA = "video_media"
    ROUTINE = "routine"
    # RoboQC testbed (local SGLang)
    ROBOQC_VISION = "roboqc_vision"
    ROBOQC_REASONING = "roboqc_reasoning"
    ROBOQC_ACTION = "roboqc_action"


MODEL_MAPPING: Dict[TaskCategory, str] = {
    TaskCategory.CRITICAL: "anthropic/claude-opus-4-7",
    TaskCategory.ARCHITECTURE: "anthropic/claude-opus-4-7",
    TaskCategory.CODING: "anthropic/claude-opus-4-7",
    TaskCategory.VISION: "openai/gpt-5.5-pro",
    TaskCategory.EXECUTION: "openai/gpt-5.5-pro",
    TaskCategory.ORCHESTRATION: "xai/grok-4",
    TaskCategory.DATA_TEST: "qwen/qwen3.6-plus",
    TaskCategory.VIDEO_MEDIA: "xai/grok-4",
    TaskCategory.ROUTINE: "qwen/qwen3.6-plus",
    # RoboQC: openai/* имена заставляют litellm использовать OpenAI-совместимый путь.
    # Реальный endpoint — SGLang на GPU-полигоне (см. SGLANG_BASE_URL).
    TaskCategory.ROBOQC_VISION: "openai/qwen3-vl-local",
    TaskCategory.ROBOQC_REASONING: "openai/qwen3.6-35b-local",
    TaskCategory.ROBOQC_ACTION: "openai/qwen3.6-35b-local",
}

FALLBACK_MAPPING: Dict[str, str] = {
    "anthropic/claude-opus-4-7": "openai/gpt-5.5-pro",
    "openai/gpt-5.5-pro": "qwen/qwen3.6-plus",
    "xai/grok-4": "qwen/qwen3.6-plus",
    # RoboQC: если локальный SGLang недоступен, роутим на облачный qwen.
    "openai/qwen3-vl-local": "qwen/qwen3.6-plus",
    "openai/qwen3.6-35b-local": "qwen/qwen3.6-plus",
}


class CompletionClient(Protocol):
    def __call__(self, **kwargs: Any) -> Any: ...


class FrictionGate(BaseModel):
    model_config = ConfigDict(strict=True)

    enabled: bool = True
    human_approval_required: bool = False
    reason: str = ""

    @classmethod
    def critical(cls, reason: str = "Critical decision") -> "FrictionGate":
        return cls(enabled=True, human_approval_required=True, reason=reason)


Approver = Callable[["FrictionGate"], Awaitable[bool]]


class ModelRouter:
    def __init__(
        self,
        client: Optional[CompletionClient] = None,
        settings: Optional[RuntimeSettings] = None,
        approver: Optional[Approver] = None,
        approval_broker: Optional[ApprovalBroker] = None,
    ) -> None:
        self._client = client or completion
        self.settings = settings or RuntimeSettings.from_env()
        # approver — интерактивный путь (CLI); broker — неблокирующий
        # blocked/resume-путь (API). Если approver не задан, используем broker.
        self._approver = approver
        self.approval_broker = approval_broker or get_default_broker()
        if litellm is not None:
            litellm.set_verbose = False
        self.cost_tracker: Dict[str, float | int] = {"total_usd": 0.0, "requests": 0}

    def _build_metadata(self, category: TaskCategory) -> dict[str, str]:
        return {"rhaef_category": category.value, "framework": "rhaef-v2"}

    def _enrich_for_local(self, model: str, kwargs: dict[str, Any]) -> None:
        """Для локальных ROBOQC_*-моделей вбиваем api_base/api_key/custom_llm_provider."""
        if not model.endswith("-local"):
            return
        if "vl" in model.lower() or "vision" in model.lower():
            base = os.environ.get("SGLANG_VISION_BASE_URL") or os.environ.get("SGLANG_BASE_URL")
        else:
            base = os.environ.get("SGLANG_BASE_URL")
        if not base:
            return
        kwargs.setdefault("api_base", base)
        kwargs.setdefault("api_key", "sglang-no-auth")
        kwargs.setdefault("custom_llm_provider", "openai")

    async def _pass_friction_gate(self, friction: FrictionGate, approval_id: Optional[str]) -> None:
        """Async-совместимая замена блокирующего ``input()``.

        Порядок: resume по approval_id → интерактивный approver → брокер
        (регистрирует pending и поднимает ApprovalPendingError со статусом blocked).
        """
        broker = self.approval_broker
        if approval_id:
            record = broker.get(approval_id)
            if record is None:
                # Чужой/опечатанный id: регистрируем свежую запись и отдаём её id,
                # иначе вызывающий будет вечно ретраить нерезолвируемый идентификатор.
                record = broker.request(friction.reason)
                raise ApprovalPendingError(record.approval_id, friction.reason)
            if record.status is ApprovalStatus.APPROVED:
                return
            if record.status is ApprovalStatus.REJECTED:
                raise ApprovalRejectedError(approval_id, friction.reason)
            raise ApprovalPendingError(approval_id, friction.reason)
        if self._approver is not None:
            if await self._approver(friction):
                return
            record = broker.request(friction.reason)
            broker.resolve(record.approval_id, approved=False, note="rejected interactively")
            raise ApprovalRejectedError(record.approval_id, friction.reason)
        record = broker.request(friction.reason)
        raise ApprovalPendingError(record.approval_id, friction.reason)

    async def route(
        self,
        category: TaskCategory,
        messages: list[dict[str, Any]],
        temperature: float = 0.7,
        max_tokens: int = 8192,
        friction: Optional[FrictionGate] = None,
        approval_id: Optional[str] = None,
        **kwargs: Any,
    ) -> Any:
        if self._client is None:
            raise RuntimeError("litellm is not installed. Install project dependencies to run model routing.")

        model = MODEL_MAPPING.get(category, MODEL_MAPPING[TaskCategory.ROUTINE])
        request_kwargs = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "metadata": self._build_metadata(category),
            **kwargs,
        }
        self._enrich_for_local(model, request_kwargs)

        if friction and friction.enabled and friction.human_approval_required:
            await self._pass_friction_gate(friction, approval_id)

        if self.settings.langsmith_tracing_v2:
            request_kwargs["tags"] = ["rhaef-v2", category.value]

        try:
            response = self._client(**request_kwargs)
        except Exception:
            fallback_model = FALLBACK_MAPPING.get(model, "qwen/qwen3.6-plus")
            request_kwargs["model"] = fallback_model
            self._enrich_for_local(fallback_model, request_kwargs)
            response = self._client(**request_kwargs)

        cost = 0.0
        if litellm is not None:
            try:
                cost = float(litellm.completion_cost(completion_response=response))
            except Exception:
                cost = 0.0  # local SGLang — без стоимости по price-list, считаем отдельно в bench.
        self.cost_tracker["total_usd"] = float(self.cost_tracker["total_usd"]) + cost
        self.cost_tracker["requests"] = int(self.cost_tracker["requests"]) + 1
        return response

    def get_stats(self) -> dict[str, Any]:
        return {
            "total_cost_usd": round(float(self.cost_tracker["total_usd"]), 4),
            "requests": int(self.cost_tracker["requests"]),
            "langsmith_tracing_v2": self.settings.langsmith_tracing_v2,
            "timestamp": datetime.now().isoformat(),
        }
