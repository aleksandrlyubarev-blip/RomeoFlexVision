"""RoboQCClient, выполняющий инспекцию через 6-агентный LangGraph-пайплайн.

Замена StubRoboQCClient для /inspect: запрос (URI или инлайн-байты кадра)
конвертируется в RoboQCState, прогоняется через perception → scene →
planner → specialist → action → critic и сворачивается в InspectionResult.
"""

from __future__ import annotations

from typing import Optional

from rhaef_v2.core.model_router import ModelRouter
from rhaef_v2.tools.interfaces import DetectedDefect, InspectionRequest, InspectionResult

from . import graph
from .state import RoboQCState

_PASS_COMMANDS = {"pick"}
_HITL_COMMANDS = {"hold_for_review", "re_image"}


class PipelineRoboQCClient:
    """Реальный клиент инспекции поверх LangGraph-пайплайна RoboQC."""

    model_version: str = "rhaef-v2-roboqc-r1"

    def __init__(self, router: Optional[ModelRouter] = None) -> None:
        self._router = router

    async def run_check(self, payload: InspectionRequest) -> InspectionResult:
        state = RoboQCState(
            image_uri=payload.image_uri or "",
            image_b64=payload.image_b64,
            image_mime=payload.image_mime,
            workcell_id=payload.station_id or "WC-00",
        )
        final = await graph.run(state, router=self._router)

        command = final.action.command if final.action else "hold_for_review"
        confidence = final.specialist.confidence if final.specialist else 0.5
        defects: tuple[DetectedDefect, ...] = ()
        defect_tag = final.action.defect_tag if final.action else None
        if defect_tag:
            defects = (DetectedDefect(defect_class=defect_tag, confidence=confidence),)

        return InspectionResult(
            inspection_id=payload.inspection_id,
            image_uri=payload.image_uri,
            defects=defects,
            overall_pass=command in _PASS_COMMANDS,
            confidence=confidence,
            model_version=self.model_version,
            requires_hitl=command in _HITL_COMMANDS,
        )


__all__ = ["PipelineRoboQCClient"]
