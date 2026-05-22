"""GrokEngine behaviour with monkeypatched requests.post."""

from __future__ import annotations

import io
import json
from typing import Any

import pytest
from PIL import Image

from checker.inference.grok_engine import GrokEngine, _extract_json


def _jpeg(width: int = 1920, height: int = 1080) -> bytes:
    img = Image.new("RGB", (width, height), (140, 140, 140))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    return buf.getvalue()


class FakeResponse:
    def __init__(self, status_code: int, payload: dict | None = None, text: str = "") -> None:
        self.status_code = status_code
        self._payload = payload
        self.text = text or (json.dumps(payload) if payload else "")

    def json(self) -> dict:
        if self._payload is None:
            raise ValueError("not json")
        return self._payload


class FakeSession:
    def __init__(self, responses: list[FakeResponse]) -> None:
        self._responses = list(responses)
        self.calls: list[dict[str, Any]] = []

    def post(self, url: str, json: dict, headers: dict, timeout: float) -> FakeResponse:
        self.calls.append({"url": url, "json": json, "headers": headers, "timeout": timeout})
        if not self._responses:
            raise AssertionError("no canned responses left")
        return self._responses.pop(0)


def _verdict_payload(verdict: str = "PASS") -> dict:
    return {
        "choices": [
            {
                "message": {
                    "content": json.dumps(
                        {
                            "surface_condition": "clean",
                            "visible_defects": [],
                            "framing_assessment": "centered",
                            "verdict": verdict,
                            "confidence": 0.83,
                            "notes": "looks fine",
                        }
                    )
                }
            }
        ]
    }


def test_happy_path_parses_verdict() -> None:
    session = FakeSession([FakeResponse(200, _verdict_payload("PASS"))])
    engine = GrokEngine("xai-test", session=session)
    result = engine.analyze(_jpeg(), "prompt")
    assert result.verdict == "pass"
    assert 0.8 <= result.confidence <= 0.9
    assert result.surface_condition == "clean"
    assert result.engine.startswith("grok:")
    assert session.calls[0]["headers"]["Authorization"] == "Bearer xai-test"


def test_unknown_verdict_falls_through() -> None:
    payload = _verdict_payload("MAYBE")
    session = FakeSession([FakeResponse(200, payload)])
    engine = GrokEngine("xai-test", session=session)
    result = engine.analyze(_jpeg(), "prompt")
    assert result.verdict == "unknown"


def test_5xx_retries_once_then_succeeds() -> None:
    session = FakeSession([FakeResponse(503), FakeResponse(200, _verdict_payload("FAIL"))])
    engine = GrokEngine("xai-test", session=session)
    result = engine.analyze(_jpeg(), "prompt")
    assert result.verdict == "fail"
    assert len(session.calls) == 2


def test_401_returns_unknown_with_helpful_note() -> None:
    session = FakeSession([FakeResponse(401, text="unauthorized")])
    engine = GrokEngine("bad-key", session=session)
    result = engine.analyze(_jpeg(), "prompt")
    assert result.verdict == "unknown"
    assert "401" in result.notes


def test_malformed_json_extracted_via_regex() -> None:
    payload = {
        "choices": [
            {
                "message": {
                    "content": "Sure! Here is the JSON: {\"verdict\":\"FAIL\",\"confidence\":0.4,\"notes\":\"scratch\"} hope it helps"
                }
            }
        ]
    }
    session = FakeSession([FakeResponse(200, payload)])
    engine = GrokEngine("xai-test", session=session)
    result = engine.analyze(_jpeg(), "prompt")
    assert result.verdict == "fail"
    assert "scratch" in result.notes


def test_unparseable_response_is_unknown() -> None:
    payload = {"choices": [{"message": {"content": "I'm just going to refuse"}}]}
    session = FakeSession([FakeResponse(200, payload)])
    engine = GrokEngine("xai-test", session=session)
    result = engine.analyze(_jpeg(), "prompt")
    assert result.verdict == "unknown"


def test_resize_keeps_payload_small() -> None:
    captured: dict[str, Any] = {}

    class Inspector(FakeSession):
        def post(self, url, json, headers, timeout):
            captured["body_size"] = len(str(json))
            return super().post(url, json, headers, timeout)

    session = Inspector([FakeResponse(200, _verdict_payload("PASS"))])
    engine = GrokEngine("xai-test", session=session, max_side=256)
    engine.analyze(_jpeg(4096, 3072), "prompt")
    # 256-side JPEG body should comfortably fit; raw 4K base64 would be megabytes.
    assert captured["body_size"] < 200_000


def test_engine_requires_api_key() -> None:
    with pytest.raises(ValueError):
        GrokEngine("")


def test_extract_json_handles_code_fences() -> None:
    fenced = '```json\n{"verdict":"PASS","confidence":0.9}\n```'
    parsed = _extract_json(fenced)
    assert parsed is not None
    assert parsed["verdict"] == "PASS"
