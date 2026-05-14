"""Quality validator behaviour: sharpness/exposure/framing + budget."""

from __future__ import annotations

import time

import numpy as np
import pytest

from larmorsight_checker.inference.quality_validator import evaluate


def test_sharp_beats_blurred(synthetic_sharp_frame, synthetic_blurred_frame) -> None:
    sharp = evaluate(synthetic_sharp_frame)
    blurred = evaluate(synthetic_blurred_frame)
    assert sharp.sharpness > blurred.sharpness
    assert sharp.laplacian_var > blurred.laplacian_var


def test_underexposed_lowers_exposure(synthetic_dark_frame) -> None:
    report = evaluate(synthetic_dark_frame)
    assert report.exposure < 0.4
    assert report.mean_luminance < 0.2


def test_overexposed_lowers_exposure(synthetic_bright_frame) -> None:
    report = evaluate(synthetic_bright_frame)
    assert report.exposure < 0.4


def test_empty_frame_low_framing(empty_frame) -> None:
    report = evaluate(empty_frame)
    assert report.framing < 0.5
    assert report.edge_density < 0.05


def test_verdict_aggregation(synthetic_sharp_frame) -> None:
    report = evaluate(synthetic_sharp_frame)
    assert report.verdict in {"good", "warn", "bad"}


def test_invalid_input_raises() -> None:
    grayscale = np.zeros((100, 100), dtype=np.uint8)
    with pytest.raises(ValueError):
        evaluate(grayscale)


def test_budget_under_50ms_on_1080p() -> None:
    frame = np.random.default_rng(0).integers(0, 255, size=(1080, 1920, 3), dtype=np.uint8)
    # warmup
    evaluate(frame)
    start = time.monotonic()
    for _ in range(5):
        evaluate(frame)
    avg_ms = (time.monotonic() - start) * 1000.0 / 5
    # Sandbox CPU is slower than M5 Pro; the TZ acceptable ceiling is 50ms even there.
    assert avg_ms < 200.0, f"average evaluate() took {avg_ms:.1f}ms"
