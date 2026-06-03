"""LogicQA-style logical anomaly checker.

LogicQA (NotebookLM review refs [31–33]) addresses the gap that pixel
anomaly detectors miss: defects defined by what is *absent* or *in the
wrong place*, not by a local texture change. For RoboQC this maps
directly to :class:`DefectClass.WRONG_ROUTING` and to several
configurations where a screw / cable / connector is in itself fine but
the *layout* is wrong.

The recipe in two phases:

1. **Checklist synthesis.** Given 1–3 reference photos of a "correct"
   assembly, a VLM is prompted to emit a list of yes/no questions
   that capture what makes the assembly correct.
2. **Inspection.** At runtime the test image is sent to the same VLM
   together with the checklist; each "no" answer becomes a
   :class:`LogicQaFinding` with a natural-language explanation.

We route every VLM call through
:class:`rhaef_v2.core.model_router.ModelRouter` so LangSmith tagging,
fallback models, and cost tracking are inherited from the rest of
RoboQC. The deterministic ``HeuristicLogicQa`` is shipped for CI and
flat-mode fallbacks (per the brigada flat-mode requirement).
"""

from __future__ import annotations

import json
from typing import Any, Protocol

from pydantic import BaseModel, ConfigDict, Field

from ..schema.taxonomy import DefectClass

try:
    from rhaef_v2.core.model_router import ModelRouter, TaskCategory
except Exception:  # pragma: no cover - exercised without rhaef_v2 installed
    ModelRouter = None  # type: ignore[assignment]
    TaskCategory = None  # type: ignore[assignment]


CHECKLIST_PROMPT = (
    "You are LOGIC_QA_CHECKLIST_BUILDER. Given the reference image URIs of a "
    "correct industrial assembly, output a JSON array of short yes/no questions "
    "that, together, verify the assembly is correct. Keep each question under "
    "20 words. Output only JSON."
)

INSPECTION_PROMPT = (
    "You are LOGIC_QA_INSPECTOR. Given a test image URI and a checklist of "
    "yes/no questions, output a JSON array where each item is "
    '{"question": ..., "answer": "yes"|"no", "explanation": ...}. '
    "Answer 'no' only when the test image objectively violates the question. "
    "Output only JSON."
)


class LogicQaCheck(BaseModel):
    model_config = ConfigDict(strict=True, frozen=True)
    question: str = Field(min_length=3)


class LogicQaFinding(BaseModel):
    model_config = ConfigDict(strict=True, frozen=True)

    question: str
    answer: str  # "yes" | "no" — kept loose so future graded answers work
    explanation: str = ""


class LogicQaResult(BaseModel):
    model_config = ConfigDict(strict=True, frozen=True)

    overall_pass: bool
    defect_class: DefectClass = DefectClass.WRONG_ROUTING
    findings: tuple[LogicQaFinding, ...] = ()


class LogicQaChecker(Protocol):
    async def synthesise(self, reference_uris: list[str]) -> list[LogicQaCheck]: ...
    async def inspect(self, image_uri: str, checks: list[LogicQaCheck]) -> LogicQaResult: ...


class HeuristicLogicQa:
    """Deterministic stand-in for the LLM-driven LogicQA flow.

    ``synthesise`` returns a small fixed checklist. ``inspect`` always
    reports overall_pass=True with empty findings. CI uses this so the
    rest of the pipeline runs without a real VLM.
    """

    async def synthesise(self, reference_uris: list[str]) -> list[LogicQaCheck]:
        if not reference_uris:
            return []
        return [
            LogicQaCheck(question="Is every cable routed away from hot zones?"),
            LogicQaCheck(question="Are all connectors fully latched?"),
        ]

    async def inspect(self, image_uri: str, checks: list[LogicQaCheck]) -> LogicQaResult:
        return LogicQaResult(overall_pass=True, findings=())


class RouterBackedLogicQa:
    """LLM-backed LogicQA driven by rhaef_v2 ModelRouter."""

    def __init__(
        self,
        router: ModelRouter,
        fallback: LogicQaChecker | None = None,
        category: Any | None = None,
    ) -> None:
        if ModelRouter is None or TaskCategory is None:
            raise RuntimeError("rhaef_v2 is required for RouterBackedLogicQa")
        self.router = router
        self.fallback = fallback or HeuristicLogicQa()
        self.category = category or TaskCategory.VISION

    async def synthesise(self, reference_uris: list[str]) -> list[LogicQaCheck]:
        if not reference_uris:
            return []
        messages = [
            {"role": "system", "content": CHECKLIST_PROMPT},
            {"role": "user", "content": json.dumps({"reference_uris": reference_uris})},
        ]
        response = await self.router.route(category=self.category, messages=messages)
        payload = _extract_json_array(response)
        if payload is None:
            return await self.fallback.synthesise(reference_uris)
        try:
            return [LogicQaCheck(question=str(item)) for item in payload if str(item).strip()]
        except Exception:
            return await self.fallback.synthesise(reference_uris)

    async def inspect(self, image_uri: str, checks: list[LogicQaCheck]) -> LogicQaResult:
        if not checks:
            return LogicQaResult(overall_pass=True, findings=())
        messages = [
            {"role": "system", "content": INSPECTION_PROMPT},
            {
                "role": "user",
                "content": json.dumps(
                    {
                        "image_uri": image_uri,
                        "checks": [c.question for c in checks],
                    }
                ),
            },
        ]
        response = await self.router.route(category=self.category, messages=messages)
        payload = _extract_json_array(response)
        if payload is None:
            return await self.fallback.inspect(image_uri, checks)
        findings = []
        try:
            for item in payload:
                findings.append(
                    LogicQaFinding(
                        question=str(item["question"]),
                        answer=str(item["answer"]).strip().lower(),
                        explanation=str(item.get("explanation", "")),
                    )
                )
        except Exception:
            return await self.fallback.inspect(image_uri, checks)
        overall_pass = all(f.answer == "yes" for f in findings)
        return LogicQaResult(
            overall_pass=overall_pass,
            defect_class=DefectClass.WRONG_ROUTING,
            findings=tuple(findings),
        )


def _extract_json_array(response: Any) -> list | None:
    """Pull a JSON array out of a litellm-shaped response, tolerantly."""
    try:
        choice = response.choices[0]
        message = getattr(choice, "message", None) or choice["message"]
        if hasattr(message, "content"):
            content = str(message.content)
        elif isinstance(message, dict):
            content = str(message.get("content", ""))
        else:
            content = str(message)
        decoded = json.loads(content)
    except Exception:
        return None
    return decoded if isinstance(decoded, list) else None
