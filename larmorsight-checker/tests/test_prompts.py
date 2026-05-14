"""Prompt template invariants."""

from __future__ import annotations

from larmorsight_checker.inference.prompts import QC_INSPECTION_PROMPT, qc_prompt


def test_prompt_contains_expected_keys() -> None:
    for key in ("surface_condition", "visible_defects", "framing_assessment", "verdict", "confidence", "notes"):
        assert key in QC_INSPECTION_PROMPT


def test_prompt_demands_json_only() -> None:
    assert "Output ONLY the JSON" in QC_INSPECTION_PROMPT


def test_qc_prompt_appends_context() -> None:
    extended = qc_prompt("object: copper cold plate")
    assert extended.startswith(QC_INSPECTION_PROMPT)
    assert "copper cold plate" in extended


def test_qc_prompt_returns_base_when_no_context() -> None:
    assert qc_prompt() == QC_INSPECTION_PROMPT
    assert qc_prompt("") == QC_INSPECTION_PROMPT
