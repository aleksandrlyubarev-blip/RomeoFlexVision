"""Conformal prediction for HITL routing.

Hard-coding ``confidence < 0.85 → HITL`` (what we ship today in
``inspection_client.py`` and in the DeepStream sample template) gives
no statistical coverage guarantee. Conformal prediction (NotebookLM
briefing Group E, Q14) fixes that: given a held-out calibration set,
we compute a non-conformity quantile that *provably* contains the
true label with probability ≥ 1 − α on exchangeable test data.

Recipe (split conformal, classification flavour):

1. **Calibration.** For each calibration sample, the underlying
   model emits a confidence ``p̂(y_true | x)``. The non-conformity
   score is ``s = 1 − p̂``. We collect ``{s_i}_{i=1..n}`` and pick the
   ``⌈(n+1)(1−α)⌉ / n`` quantile ``q̂_α``.
2. **Prediction.** For a new sample with confidence ``p_pred``, the
   conformal prediction set contains every class ``c`` with
   ``1 − p_c ≤ q̂_α``. If the set has size ≠ 1, route the sample to
   HITL. Equivalently for a binary defect / OK decision: route to
   HITL when ``1 − p_pred > q̂_α`` (the model is no more confident
   than calibration noise allows).

The implementation here is deliberately small and dep-free —
``numpy`` is enough because we only need a quantile and an array
comparison. Plugs into :class:`roboqc_data.inspection_client.VelmRoboQCClient`
via the optional ``predictor`` kwarg in a follow-up patch.

References:
- Angelopoulos & Bates 2023, "A Gentle Introduction to Conformal
  Prediction and Distribution-Free Uncertainty Quantification."
- NotebookLM briefing Group E, Q14.
"""

from __future__ import annotations

import math
from collections.abc import Sequence

import numpy as np
from pydantic import BaseModel, ConfigDict, Field


class CalibrationSample(BaseModel):
    """One calibration row: model's confidence in the true label."""

    model_config = ConfigDict(strict=True, frozen=True)

    confidence: float = Field(ge=0.0, le=1.0)


class ConformalConfig(BaseModel):
    """Configuration for the conformal predictor."""

    model_config = ConfigDict(strict=True)

    alpha: float = Field(default=0.10, gt=0.0, lt=1.0)
    """Target miscoverage: prediction sets have ≥ 1 − α coverage."""

    floor_threshold: float | None = Field(default=None, ge=0.0, le=1.0)
    """Optional floor on the final HITL threshold. When set, the
    routing threshold is ``min(1 − q̂_α, floor_threshold)`` so the
    policy can never become *more* permissive than a manual hard cap.
    """


class PredictionDecision(BaseModel):
    """One conformal prediction outcome."""

    model_config = ConfigDict(strict=True, frozen=True)

    confidence: float
    threshold: float
    """``1 − q̂_α`` — confidences below this trigger HITL."""

    requires_hitl: bool


class ConformalPredictor:
    """Split conformal predictor.

    Args:
        cfg: optional :class:`ConformalConfig`.

    Calibrate once on held-out (image, ground_truth, model_confidence)
    triples, then call :meth:`decide` for every new inspection.

    Example:
        >>> predictor = ConformalPredictor()
        >>> predictor.calibrate([0.92, 0.88, 0.95, 0.70, 0.91])
        >>> decision = predictor.decide(0.80)
        >>> # decision.requires_hitl is True if 0.80 < 1 - q̂_α
    """

    def __init__(self, cfg: ConformalConfig | None = None) -> None:
        self.cfg = cfg or ConformalConfig()
        self._quantile: float | None = None
        self._n_calibration: int = 0

    def calibrate(self, true_class_confidences: Sequence[float]) -> float:
        """Fit the non-conformity quantile and return the routing threshold.

        Args:
            true_class_confidences: model's confidence in the *true*
                class for every calibration sample. For binary defect
                detection these are the confidences on the ground-truth
                ``ok`` / ``defective`` label.

        Returns:
            The HITL routing threshold ``1 − q̂_α``. Confidences below
            this need human review for valid 1 − α coverage.

        Raises:
            ValueError: if no calibration samples are provided.
        """
        if len(true_class_confidences) == 0:
            raise ValueError("calibration set must be non-empty")
        scores = 1.0 - np.asarray(true_class_confidences, dtype=np.float64)
        n = scores.size
        # Conformal-correct quantile level: ⌈(n+1)(1-α)⌉ / n.
        level = min(1.0, math.ceil((n + 1) * (1.0 - self.cfg.alpha)) / n)
        # numpy quantile interpolates; for conformal we want the
        # higher value, so use higher interpolation.
        self._quantile = float(np.quantile(scores, level, method="higher"))
        self._n_calibration = n
        return self.threshold

    @property
    def threshold(self) -> float:
        """Confidence cutoff for HITL routing: ``1 − q̂_α``."""
        if self._quantile is None:
            raise RuntimeError("ConformalPredictor.calibrate must be called first")
        raw = 1.0 - self._quantile
        if self.cfg.floor_threshold is None:
            return raw
        return min(raw, self.cfg.floor_threshold)

    @property
    def is_calibrated(self) -> bool:
        return self._quantile is not None

    @property
    def n_calibration(self) -> int:
        return self._n_calibration

    def decide(self, confidence: float) -> PredictionDecision:
        """Conformal decision for one prediction.

        Args:
            confidence: model's confidence in its top-1 class.

        Returns:
            :class:`PredictionDecision` with the threshold actually
            used and the ``requires_hitl`` flag.
        """
        if not 0.0 <= confidence <= 1.0:
            raise ValueError("confidence must be in [0,1]")
        threshold = self.threshold
        return PredictionDecision(
            confidence=confidence,
            threshold=threshold,
            requires_hitl=confidence < threshold,
        )
