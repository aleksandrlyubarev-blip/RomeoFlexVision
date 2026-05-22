"""Local MLX Gemma engine — placeholder for v0.2."""

from __future__ import annotations

from .ai_engine import AIEngine, CaptureResult


class GemmaEngine(AIEngine):
    """Placeholder so the settings dialog can list it without crashing."""

    name = "gemma"
    available = False

    def analyze(self, jpeg_bytes: bytes, prompt: str) -> CaptureResult:  # pragma: no cover
        raise NotImplementedError("Local MLX Gemma engine ships in v0.2; use Grok for v0.1.")
