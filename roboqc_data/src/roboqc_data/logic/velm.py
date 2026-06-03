"""VELM-style hybrid pipeline: pixel anomaly detector + VLM classifier.

VELM (NotebookLM review refs [34–37]) builds on a simple observation:
a cheap visual expert (PatchCore / EfficientAD) catches *where*
something looks off, but a multimodal LLM is what tells operators
*what* it is and whether it matters. Running both together gives the
best of both worlds — anomaly recall of unsupervised CV plus the
nuanced "critical defect" / "cosmetic-only" / "acceptable variation"
verdict from a VLM, without sending every frame through a heavyweight
model.

Pipeline:

1. **Visual expert.** Anomalib (or any Protocol-compatible scorer)
   produces an anomaly score / heatmap for the test image and returns
   a list of candidate ROI crops above a configurable threshold.
2. **VLM classifier.** Each crop + the text taxonomy (defect class
   options) is routed through ``rhaef_v2.core.model_router.ModelRouter``.
   The model is asked to pick a :class:`DefectClass`, decide
   severity, and emit a short rework instruction. Empty / OK frames
   short-circuit without burning a router call.
3. **Result.** A :class:`VelmResult` carrying per-crop verdicts —
   feeds directly into the existing
   :class:`roboqc_data.schema.records.Annotation` model with
   ``provenance="velm"``.

Heuristic and router-backed variants mirror the pattern used by
``logic_qa.py`` so CI runs offline.
"""

from __future__ import annotations

import json
from typing import Any, Protocol

from pydantic import BaseModel, ConfigDict, Field

from ..schema.records import BBox
from ..schema.taxonomy import DefectClass

try:
    from rhaef_v2.core.model_router import ModelRouter, TaskCategory
except Exception:  # pragma: no cover - exercised without rhaef_v2 installed
    ModelRouter = None  # type: ignore[assignment]
    TaskCategory = None  # type: ignore[assignment]


CLASSIFY_PROMPT = (
    "You are VELM_CLASSIFIER. Given a crop URI suspected to contain a "
    "manufacturing defect, pick exactly one defect class from the provided "
    'list. Output JSON: {"defect_class": "<class>", "severity": '
    '"critical"|"major"|"minor"|"cosmetic"|"ok", "rework": "<short '
    'instruction>"}. Use "ok" only when the crop is clearly normal.'
)

Severity = str  # "critical" | "major" | "minor" | "cosmetic" | "ok"


class AnomalyCandidate(BaseModel):
    """One ROI flagged by the visual expert before VLM classification."""

    model_config = ConfigDict(strict=True, frozen=True)

    crop_uri: str
    bbox: BBox
    score: float = Field(ge=0.0, le=1.0)


class VelmVerdict(BaseModel):
    """Per-crop verdict from the VLM classifier."""

    model_config = ConfigDict(strict=True, frozen=True)

    candidate: AnomalyCandidate
    defect_class: DefectClass
    severity: Severity = "ok"
    rework: str = ""


class VelmResult(BaseModel):
    """Whole-image VELM run."""

    model_config = ConfigDict(strict=True, frozen=True)

    image_uri: str
    overall_pass: bool
    verdicts: tuple[VelmVerdict, ...] = ()


class VisualExpert(Protocol):
    """Anything that turns an image URI into anomaly candidates."""

    def candidates(self, image_uri: str) -> list[AnomalyCandidate]: ...


class HeuristicVisualExpert:
    """Deterministic stand-in: always returns one centred candidate."""

    score: float = 0.6

    def candidates(self, image_uri: str) -> list[AnomalyCandidate]:
        bbox = BBox(x=0.25, y=0.25, w=0.5, h=0.5, image_w=1, image_h=1)
        return [AnomalyCandidate(crop_uri=image_uri, bbox=bbox, score=self.score)]


class VlmClassifier(Protocol):
    async def classify(
        self,
        candidate: AnomalyCandidate,
        allowed_classes: list[DefectClass],
    ) -> VelmVerdict: ...


class HeuristicVlmClassifier:
    """Returns every crop as ``DefectClass.OK`` for CI flat-mode."""

    async def classify(
        self,
        candidate: AnomalyCandidate,
        allowed_classes: list[DefectClass],
    ) -> VelmVerdict:
        return VelmVerdict(candidate=candidate, defect_class=DefectClass.OK, severity="ok")


class RouterBackedVlmClassifier:
    """LLM-backed classifier driven by rhaef_v2 ModelRouter."""

    def __init__(
        self,
        router: ModelRouter,
        fallback: VlmClassifier | None = None,
        category: Any | None = None,
    ) -> None:
        if ModelRouter is None or TaskCategory is None:
            raise RuntimeError("rhaef_v2 is required for RouterBackedVlmClassifier")
        self.router = router
        self.fallback = fallback or HeuristicVlmClassifier()
        self.category = category or TaskCategory.VISION

    async def classify(
        self,
        candidate: AnomalyCandidate,
        allowed_classes: list[DefectClass],
    ) -> VelmVerdict:
        messages = [
            {"role": "system", "content": CLASSIFY_PROMPT},
            {
                "role": "user",
                "content": json.dumps(
                    {
                        "crop_uri": candidate.crop_uri,
                        "score": candidate.score,
                        "allowed_classes": [c.value for c in allowed_classes],
                    }
                ),
            },
        ]
        response = await self.router.route(category=self.category, messages=messages)
        payload = _extract_json_object(response)
        if payload is None:
            return await self.fallback.classify(candidate, allowed_classes)
        try:
            cls = DefectClass(str(payload["defect_class"]))
        except (KeyError, ValueError):
            return await self.fallback.classify(candidate, allowed_classes)
        return VelmVerdict(
            candidate=candidate,
            defect_class=cls,
            severity=str(payload.get("severity", "ok")),
            rework=str(payload.get("rework", "")),
        )


class VelmPipeline:
    """Full pixel-expert → VLM-classifier flow.

    Args:
        expert: any :class:`VisualExpert`. Production uses an
            Anomalib-backed expert; CI passes :class:`HeuristicVisualExpert`.
        classifier: any :class:`VlmClassifier`. Production uses
            :class:`RouterBackedVlmClassifier`; CI passes
            :class:`HeuristicVlmClassifier`.
        score_threshold: candidates below this score are discarded
            before reaching the classifier — saves router calls.
        allowed_classes: subset of :class:`DefectClass` the classifier
            is allowed to emit. Defaults to the full wedge taxonomy
            (no OK; OK is the absence of any verdict).

    Example:
        >>> pipeline = VelmPipeline()
        >>> result = asyncio.run(pipeline.run("file:///station/cap.png"))
    """

    def __init__(
        self,
        expert: VisualExpert | None = None,
        classifier: VlmClassifier | None = None,
        score_threshold: float = 0.5,
        allowed_classes: list[DefectClass] | None = None,
    ) -> None:
        self.expert = expert or HeuristicVisualExpert()
        self.classifier = classifier or HeuristicVlmClassifier()
        self.score_threshold = score_threshold
        self.allowed_classes = allowed_classes or [c for c in DefectClass if c is not DefectClass.OK]

    async def run(self, image_uri: str) -> VelmResult:
        candidates = [c for c in self.expert.candidates(image_uri) if c.score >= self.score_threshold]
        verdicts: list[VelmVerdict] = []
        for candidate in candidates:
            verdict = await self.classifier.classify(candidate, self.allowed_classes)
            verdicts.append(verdict)
        overall_pass = all(v.defect_class is DefectClass.OK or v.severity in {"cosmetic", "ok"} for v in verdicts)
        return VelmResult(image_uri=image_uri, overall_pass=overall_pass, verdicts=tuple(verdicts))


def _extract_json_object(response: Any) -> dict | None:
    """Pull a JSON object out of a litellm-shaped response, tolerantly."""
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
    return decoded if isinstance(decoded, dict) else None
