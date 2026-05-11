from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class RuntimeSettings:
    langsmith_tracing_v2: bool = True
    langsmith_api_key: str | None = None

    @classmethod
    def from_env(cls) -> "RuntimeSettings":
        tracing_raw = os.getenv("LANGCHAIN_TRACING_V2", "true").lower().strip()
        tracing_enabled = tracing_raw in {"1", "true", "yes", "on"}
        return cls(
            langsmith_tracing_v2=tracing_enabled,
            langsmith_api_key=os.getenv("LANGCHAIN_API_KEY"),
        )
