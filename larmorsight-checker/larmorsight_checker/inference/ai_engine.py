"""Abstract VLM judge interface + canonical CaptureResult model."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

VerdictLabel = Literal["pass", "fail", "retake", "unknown"]


class CaptureResult(BaseModel):
    """Engine-agnostic verdict, written into per-capture JSON."""

    model_config = ConfigDict(strict=True, frozen=True)

    verdict: VerdictLabel
    confidence: float = Field(ge=0.0, le=1.0)
    surface_condition: str = ""
    framing_assessment: str = ""
    defects: list[str] = Field(default_factory=list)
    notes: str = ""
    raw_response: str = ""
    latency_ms: float = 0.0
    engine: str = ""


class AIEngine(ABC):
    """Synchronous engine; runs on a worker QThread, never on the GUI thread."""

    name: str = "abstract"

    @abstractmethod
    def analyze(self, jpeg_bytes: bytes, prompt: str) -> CaptureResult:
        """Run inference on a JPEG buffer and return a parsed verdict."""
