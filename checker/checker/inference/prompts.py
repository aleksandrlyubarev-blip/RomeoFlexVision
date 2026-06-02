"""Prompt templates for VLM judges (per TZ §3.5.2)."""

from __future__ import annotations

QC_INSPECTION_PROMPT = """\
You are an industrial quality control assistant. Inspect this photo of an assembly component. Report in JSON:

{
  "surface_condition": "clean|scratched|corroded|stained|other",
  "visible_defects": ["short description per defect"],
  "framing_assessment": "centered|off-center|too-close|too-far",
  "verdict": "PASS|FAIL|RETAKE",
  "confidence": 0.0-1.0,
  "notes": "one-line summary"
}

Output ONLY the JSON, no preamble."""


def qc_prompt(extra_context: str | None = None) -> str:
    """Optionally extend the base prompt with caller-supplied context (e.g. SAM/Florence in v0.2)."""
    if not extra_context:
        return QC_INSPECTION_PROMPT
    return f"{QC_INSPECTION_PROMPT}\n\nAdditional context: {extra_context}"
