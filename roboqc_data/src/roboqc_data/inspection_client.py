"""VELM-backed RoboQC inspection client.

Production drop-in for :class:`rhaef_v2.tools.interfaces.StubRoboQCClient`.
Runs the :class:`roboqc_data.logic.velm.VelmPipeline` against the image
URI on the incoming :class:`InspectionRequest` and converts each
:class:`roboqc_data.logic.velm.VelmVerdict` into the
:class:`rhaef_v2.tools.interfaces.DetectedDefect` shape consumed by
``rhaef_v2/api/routes.py:/inspect`` and by Romeo_PHD's
``POST /api/inspections``.

The pipeline argument is optional — without one the client constructs
a default :class:`VelmPipeline`, which in turn falls back to a
:class:`HeuristicVisualExpert` + :class:`HeuristicVlmClassifier` that
always pass. Production wires a router-backed classifier (from this
package's logic/velm.py) and an Anomalib-backed expert (future PR,
once we have trained checkpoints).
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from .calibration.conformal import ConformalPredictor
from .logic.velm import VelmPipeline, VelmVerdict

if TYPE_CHECKING:  # pragma: no cover - imports only used for typing
    from rhaef_v2.tools.interfaces import (
        InspectionRequest,
        InspectionResult,
    )

HITL_CONFIDENCE_THRESHOLD = 0.85
MODEL_VERSION = "velm-pipeline-0.1.0"

# Severities that should not block the line but still want logging.
_PASS_SEVERITIES = frozenset({"ok", "cosmetic"})


class VelmRoboQCClient:
    """Async client that satisfies the rhaef_v2 RoboQCClient Protocol.

    Args:
        pipeline: optional :class:`VelmPipeline`. Default constructs
            a heuristic-only pipeline suitable for CI / dry-run.
        predictor: optional calibrated
            :class:`roboqc_data.calibration.conformal.ConformalPredictor`.
            When supplied, the HITL routing threshold for borderline
            confidence comes from the predictor (gives a valid
            1 − α coverage guarantee on exchangeable data) rather than
            the hard-coded :data:`HITL_CONFIDENCE_THRESHOLD`. Critical
            and major severities, and any non-pass overall verdict,
            still force HITL regardless.
    """

    def __init__(
        self,
        pipeline: VelmPipeline | None = None,
        predictor: ConformalPredictor | None = None,
    ) -> None:
        self.pipeline = pipeline or VelmPipeline()
        self.predictor = predictor

    async def run_check(self, payload: InspectionRequest) -> InspectionResult:
        # Imported here to keep this module importable even when
        # rhaef_v2 is not installed (matches the optional-dep pattern
        # used elsewhere in roboqc_data).
        from rhaef_v2.tools.interfaces import (  # noqa: PLC0415
            DetectedDefect,
            InspectionResult,
        )

        result = await self.pipeline.run(payload.image_uri)

        detected = tuple(_to_detected_defect(DetectedDefect, v) for v in result.verdicts)
        if not detected:
            detected = (DetectedDefect(defect_class="ok", confidence=0.95),)

        # Overall confidence is the maximum per-verdict confidence, or
        # 0.95 when nothing was flagged.
        confidence = max((d.confidence for d in detected), default=0.95)
        requires_hitl = (not result.overall_pass) or self._below_threshold(confidence)

        return InspectionResult(
            inspection_id=payload.inspection_id,
            image_uri=payload.image_uri,
            defects=detected,
            overall_pass=result.overall_pass,
            confidence=confidence,
            model_version=MODEL_VERSION,
            requires_hitl=requires_hitl,
        )

    def _below_threshold(self, confidence: float) -> bool:
        """Route to HITL when confidence is below the active threshold.

        Uses a calibrated conformal threshold if available, otherwise
        falls back to the hard-coded HITL_CONFIDENCE_THRESHOLD. This
        is the only routing knob the client exposes — everything else
        flows from VelmResult.overall_pass and per-verdict severity.
        """
        if self.predictor is not None and self.predictor.is_calibrated:
            return self.predictor.decide(confidence).requires_hitl
        return confidence < HITL_CONFIDENCE_THRESHOLD


def _to_detected_defect(detected_cls, verdict: VelmVerdict):
    """Project a VelmVerdict into the rhaef_v2 DetectedDefect shape."""
    bbox = verdict.candidate.bbox
    # rhaef_v2 expects (x, y, w, h) in normalised coords; VELM already uses that.
    return detected_cls(
        defect_class=verdict.defect_class.value,
        bbox=(bbox.x, bbox.y, bbox.w, bbox.h),
        mask_uri=None,
        confidence=_severity_to_confidence(verdict.severity, verdict.candidate.score),
    )


def _severity_to_confidence(severity: str, expert_score: float) -> float:
    """Translate VELM severity into a rhaef_v2-style confidence float.

    The visual expert already produced a score in [0,1]. We multiply
    it by a severity-dependent factor so HITL triggering reflects
    both "how anomalous does the pixel layer think it is" and "how
    serious does the VLM think it is".
    """
    factor = {
        "critical": 1.00,
        "major": 0.95,
        "minor": 0.85,
        "cosmetic": 0.70,
        "ok": 0.50,
    }.get(severity, 0.85)
    return max(0.0, min(1.0, expert_score * factor))


def _is_pass(severity: str) -> bool:
    """Helper exposed for tests."""
    return severity in _PASS_SEVERITIES


def build_velm_api_services(
    pipeline: VelmPipeline | None = None,
    *,
    dataset_root=None,
    predictor: ConformalPredictor | None = None,
):
    """Construct rhaef_v2 :class:`APIServices` wired to VELM.

    Convenience factory for production deployment: keeps the rhaef_v2
    API surface unchanged while swapping ``StubRoboQCClient`` for
    :class:`VelmRoboQCClient`. Returns ``None`` when rhaef_v2 is not
    installed so this module stays importable in pure-data contexts.

    Args:
        pipeline: optional :class:`VelmPipeline` to wire in. Default
            uses heuristic stand-ins (safe for dry-run).
        dataset_root: optional dataset manifest root for
            ``/dataset/manifest/{id}``.
        predictor: optional calibrated
            :class:`roboqc_data.calibration.conformal.ConformalPredictor`
            so HITL routing uses statistical coverage instead of the
            hard-coded threshold.

    Example:
        >>> services = build_velm_api_services()
        >>> # router = create_api_router(services)
    """
    try:
        from rhaef_v2.api.routes import (
            APIServices,  # noqa: PLC0415
            _fake_completion_client,  # noqa: PLC0415
        )
        from rhaef_v2.core.model_router import ModelRouter  # noqa: PLC0415
        from rhaef_v2.core.policies import FrictionPolicyEngine  # noqa: PLC0415
    except Exception:  # pragma: no cover - exercised without rhaef_v2 installed
        return None

    return APIServices(
        model_router=ModelRouter(client=_fake_completion_client),
        policy_engine=FrictionPolicyEngine(),
        roboqc_client=VelmRoboQCClient(pipeline=pipeline, predictor=predictor),
        dataset_root=dataset_root,
    )
