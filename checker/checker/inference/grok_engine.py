"""xAI Grok vision engine (v0.1 primary path)."""

from __future__ import annotations

import base64
import io
import json
import re
import time
from typing import Any

import requests
from PIL import Image

from .ai_engine import AIEngine, CaptureResult, VerdictLabel

_VERDICT_MAP: dict[str, VerdictLabel] = {
    "PASS": "pass",
    "FAIL": "fail",
    "RETAKE": "retake",
    "UNKNOWN": "unknown",
}


def _resize_jpeg(jpeg_bytes: bytes, max_side: int) -> bytes:
    img = Image.open(io.BytesIO(jpeg_bytes))
    img = img.convert("RGB")
    w, h = img.size
    long_side = max(w, h)
    if long_side > max_side:
        scale = max_side / long_side
        img = img.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    return buf.getvalue()


def _extract_json(text: str) -> dict[str, Any] | None:
    text = text.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.lower().startswith("json"):
            text = text[4:]
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if not match:
            return None
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            return None


def _parse_payload(payload: dict[str, Any], raw_text: str, latency_ms: float, engine: str) -> CaptureResult:
    verdict_raw = str(payload.get("verdict", "UNKNOWN")).upper()
    verdict: VerdictLabel = _VERDICT_MAP.get(verdict_raw, "unknown")
    confidence = payload.get("confidence", 0.0)
    try:
        confidence_val = max(0.0, min(1.0, float(confidence)))
    except (TypeError, ValueError):
        confidence_val = 0.0

    defects_raw = payload.get("visible_defects") or payload.get("defects") or []
    if isinstance(defects_raw, str):
        defects = [defects_raw]
    elif isinstance(defects_raw, list):
        defects = [str(d) for d in defects_raw]
    else:
        defects = []

    return CaptureResult(
        verdict=verdict,
        confidence=confidence_val,
        surface_condition=str(payload.get("surface_condition", "")),
        framing_assessment=str(payload.get("framing_assessment", "")),
        defects=defects,
        notes=str(payload.get("notes", "")),
        raw_response=raw_text,
        latency_ms=round(latency_ms, 2),
        engine=engine,
    )


class GrokEngine(AIEngine):
    """OpenAI-compatible POST to https://api.x.ai/v1/chat/completions."""

    name = "grok"

    def __init__(
        self,
        api_key: str,
        *,
        model: str = "grok-4.3",
        endpoint: str = "https://api.x.ai/v1/chat/completions",
        timeout_s: float = 15.0,
        max_side: int = 512,
        session: requests.Session | None = None,
    ) -> None:
        if not api_key:
            raise ValueError("Grok API key is required")
        self._api_key = api_key
        self._model = model
        self._endpoint = endpoint
        self._timeout = timeout_s
        self._max_side = max_side
        self._session = session or requests.Session()

    def _post(self, body: dict[str, Any]) -> requests.Response:
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }
        return self._session.post(self._endpoint, json=body, headers=headers, timeout=self._timeout)

    def analyze(self, jpeg_bytes: bytes, prompt: str) -> CaptureResult:
        small = _resize_jpeg(jpeg_bytes, self._max_side)
        b64 = base64.b64encode(small).decode("ascii")
        body = {
            "model": self._model,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}},
                    ],
                }
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.0,
        }

        engine_id = f"{self.name}:{self._model}"
        start = time.monotonic()
        try:
            response = self._post(body)
            if 500 <= response.status_code < 600:
                response = self._post(body)
            latency_ms = (time.monotonic() - start) * 1000.0

            if response.status_code == 401:
                return CaptureResult(
                    verdict="unknown",
                    confidence=0.0,
                    notes="Grok API rejected the key (401). Update GROK_API_KEY in secrets.env.",
                    raw_response="",
                    latency_ms=round(latency_ms, 2),
                    engine=engine_id,
                )
            if response.status_code >= 400:
                return CaptureResult(
                    verdict="unknown",
                    confidence=0.0,
                    notes=f"Grok API error {response.status_code}.",
                    raw_response=response.text[:1000],
                    latency_ms=round(latency_ms, 2),
                    engine=engine_id,
                )

            data = response.json()
            text = data["choices"][0]["message"]["content"]
        except requests.Timeout:
            latency_ms = (time.monotonic() - start) * 1000.0
            return CaptureResult(
                verdict="unknown",
                confidence=0.0,
                notes=f"Grok request timed out after {self._timeout:.0f}s.",
                latency_ms=round(latency_ms, 2),
                engine=engine_id,
            )
        except (requests.RequestException, KeyError, ValueError) as exc:
            latency_ms = (time.monotonic() - start) * 1000.0
            return CaptureResult(
                verdict="unknown",
                confidence=0.0,
                notes=f"Grok call failed: {exc!s}",
                latency_ms=round(latency_ms, 2),
                engine=engine_id,
            )

        parsed = _extract_json(text)
        if parsed is None:
            return CaptureResult(
                verdict="unknown",
                confidence=0.0,
                notes="Could not parse JSON from Grok response.",
                raw_response=text,
                latency_ms=round(latency_ms, 2),
                engine=engine_id,
            )
        return _parse_payload(parsed, text, latency_ms, engine_id)
