from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class RuntimeSettings:
    langsmith_tracing_v2: bool = True
    langsmith_api_key: str | None = None
    policy_profile: str = "dev"
    prod_high_cost_threshold: float = 1.0
    stage_high_cost_threshold: float = 2.0
    storage_backend: str = "memory"
    sqlite_path: str = ":memory:"

    @classmethod
    def from_env(cls) -> "RuntimeSettings":
        tracing_raw = os.getenv("LANGCHAIN_TRACING_V2", "true").lower().strip()
        tracing_enabled = tracing_raw in {"1", "true", "yes", "on"}
        return cls(
            langsmith_tracing_v2=tracing_enabled,
            langsmith_api_key=os.getenv("LANGCHAIN_API_KEY"),
            policy_profile=os.getenv("RHAEF_POLICY_PROFILE", "dev"),
            prod_high_cost_threshold=float(os.getenv("RHAEF_PROD_HIGH_COST_THRESHOLD", "1.0")),
            stage_high_cost_threshold=float(os.getenv("RHAEF_STAGE_HIGH_COST_THRESHOLD", "2.0")),
            storage_backend=os.getenv("RHAEF_STORAGE_BACKEND", "memory"),
            sqlite_path=os.getenv("RHAEF_SQLITE_PATH", ":memory:"),
        )
