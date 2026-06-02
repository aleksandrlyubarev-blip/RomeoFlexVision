"""State for the experimental inspection LangGraph."""

from __future__ import annotations

from typing import Any, Literal

try:
    from pydantic import BaseModel, ConfigDict, Field
except Exception:  # pragma: no cover
    class BaseModel:  # type: ignore
        def __init__(self, **data: Any) -> None:
            for key, value in data.items():
                setattr(self, key, value)

        def model_dump(self) -> dict[str, Any]:
            return self.__dict__.copy()

    def ConfigDict(**_: Any) -> dict[str, Any]:  # type: ignore
        return {}

    def Field(default: Any = None, **_: Any) -> Any:  # type: ignore
        return default


Decision = Literal["accept", "retry"]
Verdict = Literal["defect", "suspect", "ok"]
Command = Literal["pick", "reject", "re_image", "hold_for_review"]
NextStep = Literal["call_specialist", "emit_action", "request_reimage", "accept"]


class Hypothesis(BaseModel):
    model_config = ConfigDict(strict=False)
    defect_class: str
    confidence: float = 0.0
    why: str = ""


class PlannerDecision(BaseModel):
    model_config = ConfigDict(strict=False)
    next_step: NextStep
    args: dict[str, Any] = Field(default_factory=dict)
    rationale: str = ""


class SpecialistVerdict(BaseModel):
    model_config = ConfigDict(strict=False)
    verdict: Verdict
    confidence: float = 0.0
    evidence: list[str] = Field(default_factory=list)
    required_views: list[str] = Field(default_factory=list)


class ActionCommand(BaseModel):
    model_config = ConfigDict(strict=False)
    command: Command
    args: dict[str, Any] = Field(default_factory=dict)
    defect_tag: str | None = None


class CriticOutcome(BaseModel):
    model_config = ConfigDict(strict=False)
    decision: Decision
    reason: str | None = None
    suggestion: str | None = None


class RoboQCState(BaseModel):
    """Полное состояние LangGraph-пайплайна."""

    model_config = ConfigDict(strict=False)

    # Вход
    image_uri: str
    extra_frames: list[str] = Field(default_factory=list)
    subject: str = "unknown"
    workcell_id: str = "WC-00"
    acceptance_criteria: str = "стандартные для этого SKU"

    # Промежуточные результаты
    perception: dict[str, Any] | None = None
    hypotheses: list[Hypothesis] = Field(default_factory=list)
    planner: PlannerDecision | None = None
    specialist: SpecialistVerdict | None = None
    action: ActionCommand | None = None
    critic: CriticOutcome | None = None

    # Счётчик ретраев + трейс
    retries: int = 0
    max_retries: int = 2
    trace: list[dict[str, Any]] = Field(default_factory=list)


__all__ = [
    "RoboQCState",
    "Hypothesis",
    "PlannerDecision",
    "SpecialistVerdict",
    "ActionCommand",
    "CriticOutcome",
]
