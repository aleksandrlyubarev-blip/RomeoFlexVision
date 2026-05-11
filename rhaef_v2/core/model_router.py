from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional, Protocol

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
}

FALLBACK_MAPPING: Dict[str, str] = {
    "anthropic/claude-opus-4-7": "openai/gpt-5.5-pro",
    "openai/gpt-5.5-pro": "qwen/qwen3.6-plus",
    "xai/grok-4": "qwen/qwen3.6-plus",
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


class ModelRouter:
    def __init__(self, client: Optional[CompletionClient] = None, settings: Optional[RuntimeSettings] = None) -> None:
        self._client = client or completion
        self.settings = settings or RuntimeSettings.from_env()
        if litellm is not None:
            litellm.set_verbose = False
        self.cost_tracker: Dict[str, float | int] = {"total_usd": 0.0, "requests": 0}

    def _build_metadata(self, category: TaskCategory) -> dict[str, str]:
        return {"rhaef_category": category.value, "framework": "rhaef-v2"}

    async def route(
        self,
        category: TaskCategory,
        messages: list[dict[str, Any]],
        temperature: float = 0.7,
        max_tokens: int = 8192,
        friction: Optional[FrictionGate] = None,
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

        if friction and friction.enabled and friction.human_approval_required:
            print(f"⚠️ FRICTION GATE: {friction.reason}")
            input("✅ Подтверди (Enter) или Ctrl+C...")

        if self.settings.langsmith_tracing_v2:
            request_kwargs["tags"] = ["rhaef-v2", category.value]

        try:
            response = self._client(**request_kwargs)
        except Exception:
            fallback_model = FALLBACK_MAPPING.get(model, "qwen/qwen3.6-plus")
            request_kwargs["model"] = fallback_model
            response = self._client(**request_kwargs)

        cost = 0.0
        if litellm is not None:
            cost = float(litellm.completion_cost(completion_response=response))
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
