"""Рендер-тесты для roboqc_data.prompts."""

from __future__ import annotations

import pytest

from roboqc_data.prompts import PROMPT_NAMES, as_messages, render


DEFECT_CLASSES = ["SCREW_MISSING", "CABLE_PINCHED", "CONNECTOR_TILT", "LATCH_OPEN", "ROUTING_BAD", "LEAK"]


VISION_VARS = dict(
    subject="PCB в OEM-корпусе",
    source="ячейка WC-12",
    frame_uri="gs://roboqc-models/fixtures/screw_01.png",
    frames=["frame_a.png", "frame_b.png"],
    extra_notes="боковое освещение отключено",
    schema_json='{"facts": ["string"], "objects": [], "lighting": "string"}',
)

SCENE_VARS = dict(
    defect_classes=DEFECT_CLASSES,
    perception_json='{"facts": ["винт в позиции A1 отсутствует"]}',
    known_priors=[{"class": "SCREW_MISSING", "note": "частый дефект этой сборки"}],
    schema_json='{"hypotheses": [{"class": "...", "confidence": 0.0, "why": "..."}]}',
)

PLANNER_VARS = dict(
    defect_classes=DEFECT_CLASSES,
    reject_threshold=0.6,
    perception_json="{}",
    hypotheses_json="[]",
    retries=0,
    max_retries=2,
    previous_critique=None,
    schema_json='{"next_step": "call_specialist|emit_action|request_reimage|accept", "args": {}, "rationale": "..."}',
)

SPECIALIST_VARS = dict(
    defect_class="SCREW_MISSING",
    perception_json="{}",
    hypothesis_json='{"class": "SCREW_MISSING", "confidence": 0.82}',
    acceptance_criteria="все 4 винта A1-A4 затянуты до упора",
    few_shot_examples=[
        {"perception": "винт в A2 отсутствует", "verdict": "defect", "evidence": "пустое крепёжное отверстие"},
    ],
    schema_json='{"verdict": "defect|suspect|ok", "confidence": 0.0, "evidence": [], "required_views": []}',
)

ACTION_VARS = dict(
    verdict="defect",
    defect_class="SCREW_MISSING",
    confidence=0.91,
    evidence_json='["пустое крепёжное отверстие в A1"]',
    required_views_json="[]",
    workcell_id="WC-12",
    schema_json='{"command": "pick|reject|re_image|hold_for_review", "args": {}, "defect_tag": "string|null"}',
)

CRITIC_VARS = dict(
    perception_json="{}",
    hypotheses_json="[]",
    planner_json="{}",
    specialist_json="null",
    action_json="{}",
    retries=0,
    max_retries=2,
    schema_json='{"decision": "accept|retry", "reason": "string?", "suggestion": "string?"}',
)

VARS = {
    "vision_perception": VISION_VARS,
    "scene_understanding": SCENE_VARS,
    "reasoning_planner": PLANNER_VARS,
    "roboqc_specialist": SPECIALIST_VARS,
    "action_command": ACTION_VARS,
    "critic_verifier": CRITIC_VARS,
}


def test_all_prompts_listed():
    assert set(PROMPT_NAMES) == set(VARS), "VARS test fixture and PROMPT_NAMES out of sync"


@pytest.mark.parametrize("name", PROMPT_NAMES)
def test_prompt_renders_nonempty(name: str):
    body = render(name, **VARS[name])
    assert isinstance(body, str)
    assert len(body) > 100, "prompt seems suspiciously short"
    assert "{{" not in body and "{%" not in body, "unrendered jinja tokens remain"


@pytest.mark.parametrize("name", PROMPT_NAMES)
def test_prompt_has_system_and_user_sections(name: str):
    body = render(name, **VARS[name])
    assert "# System" in body
    assert "# User" in body


@pytest.mark.parametrize("name", PROMPT_NAMES)
def test_schema_slot_rendered(name: str):
    body = render(name, **VARS[name])
    assert VARS[name]["schema_json"] in body, f"schema_json not rendered into {name}"


@pytest.mark.parametrize("name", PROMPT_NAMES)
def test_as_messages_returns_pair(name: str):
    messages = as_messages(name, **VARS[name])
    assert len(messages) == 2
    assert messages[0]["role"] == "system"
    assert messages[1]["role"] == "user"
    assert messages[0]["content"].strip()
    assert messages[1]["content"].strip()


def test_unknown_prompt_raises():
    with pytest.raises(KeyError):
        render("does_not_exist")
