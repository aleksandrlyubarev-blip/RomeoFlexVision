"""SGLang-бэкенд для :class:`rhaef_v2.core.model_router.ModelRouter`.

SGLang выставляет OpenAI-совместимый endpoint, поэтому это тонкий адаптер
litellm: фиксируем ``api_base``, ``api_key`` (без проверки) и ``custom_llm_provider="openai"``.
Результат подходит под ``CompletionClient``-протокол и передаётся в ModelRouter.
"""

from __future__ import annotations

import os
from typing import Any, Callable


def build_sglang_client(
    base_url: str | None = None,
    *,
    vision_base_url: str | None = None,
    api_key: str = "sglang-no-auth",
) -> Callable[..., Any]:
    """Собрать вызываемый клиент с предварительно вбитым SGLang base URL.

    Args:
        base_url: Явный ``http://host:port/v1``. Пусто => ``$SGLANG_BASE_URL``.
        vision_base_url: Отдельный endpoint vision-модели (опц.). Пусто => ``$SGLANG_VISION_BASE_URL``.
        api_key: Произвольный непустой ключ (SGLang игнорирует).

    Returns:
        Функция, совместимая с ``litellm.completion(**kwargs)``.
    """
    try:
        from litellm import completion
    except Exception as exc:
        raise RuntimeError("litellm не установлен. pip install -e .") from exc

    chat_base = base_url or os.environ.get("SGLANG_BASE_URL")
    vision_base = vision_base_url or os.environ.get("SGLANG_VISION_BASE_URL") or chat_base
    if not chat_base:
        raise RuntimeError(
            "SGLang base URL не задан. Укажите base_url явно либо выставьте SGLANG_BASE_URL."
        )

    def client(**kwargs: Any) -> Any:
        model = kwargs.get("model", "")
        is_vision = "vl" in model.lower() or "vision" in model.lower()
        kwargs.setdefault("api_base", vision_base if is_vision else chat_base)
        kwargs.setdefault("api_key", api_key)
        kwargs.setdefault("custom_llm_provider", "openai")
        return completion(**kwargs)

    return client


__all__ = ["build_sglang_client"]
