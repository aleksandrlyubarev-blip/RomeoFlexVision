"""Узлы LangGraph-графа RoboQC.

Каждый узел: (a) рендерит свой prompt-шаблон, (b) вызывает ModelRouter в нужной TaskCategory,
(c) парсит ответ в типизированный фрагмент состояния, (d) возвращает dict-патч для LangGraph.

Для тестов (без сети) ModelRouter принимает ``client``-stub, который возвращает заготовленный
JSON — формат совпадает с OpenAI ChatCompletion.
"""

from __future__ import annotations

import json
import logging
from typing import Any

from rhaef_v2.core.model_router import ModelRouter, TaskCategory

try:
    from pydantic import ValidationError
except Exception:  # pragma: no cover
    class ValidationError(Exception):  # type: ignore
        pass

from .state import (
    ActionCommand,
    CriticOutcome,
    Hypothesis,
    PlannerDecision,
    RoboQCState,
    SpecialistVerdict,
)

log = logging.getLogger(__name__)


DEFECT_CLASSES = ["SCREW_MISSING", "CABLE_PINCHED", "CONNECTOR_TILT", "LATCH_OPEN", "ROUTING_BAD", "LEAK"]


def _content(response: Any) -> str:
    """Достаёт текстовый ``content`` из OpenAI/litellm-ответа. Или уже строки (для тестового stub'а)."""
    if isinstance(response, str):
        return response
    try:
        return response["choices"][0]["message"]["content"]
    except Exception:
        pass
    try:
        return response.choices[0].message.content
    except Exception:
        return str(response)


def _parse_json(raw: str, fallback: dict[str, Any] | None = None) -> dict[str, Any]:
    """Надёжный JSON-парс с fallback'ом. Пропускает markdown-fence'ы ```."""
    text = raw.strip()
    if text.startswith("```"):
        text = text.strip("`")
        text = text.partition("\n")[2]
        if text.endswith("```"):
            text = text[: -3]
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        log.warning("failed to parse JSON, falling back: %s", raw[:200])
        return fallback or {}


def _attach_image(messages: list[dict[str, Any]], image_b64: str, mime: str) -> list[dict[str, Any]]:
    """Прикрепить инлайн-кадр к последнему user-сообщению (OpenAI multimodal формат).

    Текст промпта остаётся, но content становится списком частей:
    [{"type": "text", ...}, {"type": "image_url", ...}] — этот формат понимают
    litellm, OpenAI-совместимый SGLang и облачные vision-модели.
    """
    data_url = f"data:{mime};base64,{image_b64}"
    attached = [dict(m) for m in messages]
    for message in reversed(attached):
        if message.get("role") == "user":
            text = message.get("content") or ""
            message["content"] = [
                {"type": "text", "text": text},
                {"type": "image_url", "image_url": {"url": data_url}},
            ]
            return attached
    attached.append(
        {"role": "user", "content": [{"type": "image_url", "image_url": {"url": data_url}}]}
    )
    return attached


def _safe_model(cls: Any, payload: dict[str, Any] | None, fallback: Any) -> Any:
    """Типизировать ответ LLM с fallback'ом: валидный JSON с недопустимыми
    значениями (например command="self_destruct") не должен ронять пайплайн."""
    if not payload:
        return fallback
    try:
        return cls(**payload)
    except (ValidationError, TypeError) as exc:
        log.warning("invalid %s payload, falling back: %s (%s)", cls.__name__, payload, exc)
        return fallback


async def _call(
    router: ModelRouter,
    category: TaskCategory,
    name: str,
    image_b64: str | None = None,
    image_mime: str = "image/jpeg",
    **vars: Any,
) -> dict[str, Any]:
    """Общая обёртка: собираем messages из roboqc_data.prompts и роутим."""
    from roboqc_data.prompts import as_messages  # локальный import — mock-friendly

    messages = as_messages(name, **vars)
    if image_b64:
        messages = _attach_image(messages, image_b64, image_mime)
    response = await router.route(category=category, messages=messages, temperature=0.2, max_tokens=2048)
    return _parse_json(_content(response))


async def perception_node(state: RoboQCState, *, router: ModelRouter) -> dict[str, Any]:
    payload = await _call(
        router,
        TaskCategory.ROBOQC_VISION,
        "vision_perception",
        image_b64=state.image_b64,
        image_mime=state.image_mime,
        subject=state.subject,
        source=f"workcell {state.workcell_id}",
        frame_uri=state.image_uri or "(inline frame attached)",
        frames=state.extra_frames,
        extra_notes=None,
        schema_json='{"facts": ["string"], "objects": [], "lighting": "string"}',
    )
    return {"perception": payload, "trace": state.trace + [{"node": "perception", "payload": payload}]}


async def scene_node(state: RoboQCState, *, router: ModelRouter) -> dict[str, Any]:
    payload = await _call(
        router,
        TaskCategory.ROBOQC_REASONING,
        "scene_understanding",
        defect_classes=DEFECT_CLASSES,
        perception_json=json.dumps(state.perception, ensure_ascii=False),
        known_priors=[],
        schema_json='{"hypotheses": [{"defect_class": "...", "confidence": 0.0, "why": "..."}]}',
    )
    hypotheses = [
        hyp
        for h in payload.get("hypotheses", [])
        if isinstance(h, dict) and (hyp := _safe_model(Hypothesis, h, None)) is not None
    ]
    return {"hypotheses": hypotheses, "trace": state.trace + [{"node": "scene", "payload": payload}]}


async def planner_node(state: RoboQCState, *, router: ModelRouter) -> dict[str, Any]:
    payload = await _call(
        router,
        TaskCategory.ROBOQC_REASONING,
        "reasoning_planner",
        defect_classes=DEFECT_CLASSES,
        reject_threshold=0.6,
        perception_json=json.dumps(state.perception, ensure_ascii=False),
        hypotheses_json=json.dumps([h.model_dump() for h in state.hypotheses], ensure_ascii=False),
        retries=state.retries,
        max_retries=state.max_retries,
        previous_critique=(state.critic.suggestion if state.critic else None),
        schema_json='{"next_step": "call_specialist|emit_action|request_reimage|accept", "args": {}, "rationale": "..."}',
    )
    planner = _safe_model(PlannerDecision, payload, PlannerDecision(next_step="emit_action"))
    return {"planner": planner, "trace": state.trace + [{"node": "planner", "payload": payload}]}


async def specialist_node(state: RoboQCState, *, router: ModelRouter) -> dict[str, Any]:
    if state.planner is None or state.planner.next_step != "call_specialist":
        return {}
    defect_class = state.planner.args.get("defect_class") or (state.hypotheses[0].defect_class if state.hypotheses else "SCREW_MISSING")
    hypothesis = next((h for h in state.hypotheses if h.defect_class == defect_class), None)
    payload = await _call(
        router,
        TaskCategory.ROBOQC_REASONING,
        "roboqc_specialist",
        defect_class=defect_class,
        perception_json=json.dumps(state.perception, ensure_ascii=False),
        hypothesis_json=json.dumps(hypothesis.model_dump() if hypothesis else {}, ensure_ascii=False),
        acceptance_criteria=state.acceptance_criteria,
        few_shot_examples=[],
        schema_json='{"verdict": "defect|suspect|ok", "confidence": 0.0, "evidence": [], "required_views": []}',
    )
    specialist = _safe_model(SpecialistVerdict, payload, SpecialistVerdict(verdict="suspect"))
    return {"specialist": specialist, "trace": state.trace + [{"node": "specialist", "payload": payload}]}


async def action_node(state: RoboQCState, *, router: ModelRouter) -> dict[str, Any]:
    verdict: str
    defect_class: str | None
    confidence: float
    evidence: list[str]
    required_views: list[str]

    if state.specialist is not None:
        verdict = state.specialist.verdict
        defect_class = (
            state.planner.args.get("defect_class") if state.planner else None
        ) or (state.hypotheses[0].defect_class if state.hypotheses else None)
        confidence = state.specialist.confidence
        evidence = state.specialist.evidence
        required_views = state.specialist.required_views
    elif state.planner and state.planner.next_step == "request_reimage":
        verdict, defect_class, confidence = "suspect", None, 0.0
        evidence = []
        required_views = state.planner.args.get("required_views", []) or ["top", "side"]
    elif state.planner and state.planner.next_step == "accept":
        verdict, defect_class, confidence = "ok", None, 1.0
        evidence = []
        required_views = []
    else:
        verdict, defect_class, confidence = "ok", None, 0.5
        evidence = []
        required_views = []

    payload = await _call(
        router,
        TaskCategory.ROBOQC_ACTION,
        "action_command",
        verdict=verdict,
        defect_class=defect_class,
        confidence=confidence,
        evidence_json=json.dumps(evidence, ensure_ascii=False),
        required_views_json=json.dumps(required_views, ensure_ascii=False),
        workcell_id=state.workcell_id,
        schema_json='{"command": "pick|reject|re_image|hold_for_review", "args": {}, "defect_tag": "string|null"}',
    )
    action = _safe_model(ActionCommand, payload, ActionCommand(command="hold_for_review"))
    return {"action": action, "trace": state.trace + [{"node": "action", "payload": payload}]}


async def critic_node(state: RoboQCState, *, router: ModelRouter) -> dict[str, Any]:
    payload = await _call(
        router,
        TaskCategory.ROBOQC_REASONING,
        "critic_verifier",
        perception_json=json.dumps(state.perception, ensure_ascii=False),
        hypotheses_json=json.dumps([h.model_dump() for h in state.hypotheses], ensure_ascii=False),
        planner_json=json.dumps(state.planner.model_dump() if state.planner else {}, ensure_ascii=False),
        specialist_json=json.dumps(state.specialist.model_dump() if state.specialist else None, ensure_ascii=False),
        action_json=json.dumps(state.action.model_dump() if state.action else {}, ensure_ascii=False),
        retries=state.retries,
        max_retries=state.max_retries,
        schema_json='{"decision": "accept|retry", "reason": "string?", "suggestion": "string?"}',
    )
    critic = _safe_model(CriticOutcome, payload, CriticOutcome(decision="accept"))
    bumped_retries = state.retries + (1 if critic.decision == "retry" else 0)
    return {
        "critic": critic,
        "retries": bumped_retries,
        "trace": state.trace + [{"node": "critic", "payload": payload}],
    }


def should_retry(state: RoboQCState) -> str:
    """Ребро решения в LangGraph: ``planner`` для retry, иначе ``END``."""
    if state.critic and state.critic.decision == "retry" and state.retries <= state.max_retries:
        return "planner"
    return "end"


__all__ = [
    "DEFECT_CLASSES",
    "perception_node",
    "scene_node",
    "planner_node",
    "specialist_node",
    "action_node",
    "critic_node",
    "should_retry",
]
