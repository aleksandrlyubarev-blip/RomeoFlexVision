"""Shared fixtures. Pure synthetic frames + tmp dirs; no Qt or camera here."""

from __future__ import annotations

import sys
from datetime import UTC, datetime
from pathlib import Path

import cv2
import numpy as np
import pytest

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from checker.inference.ai_engine import AIEngine, CaptureResult  # noqa: E402
from checker.inference.quality_validator import QualityReport  # noqa: E402
from checker.session.session_manager import (  # noqa: E402
    CameraInfo,
    CaptureRecord,
    Session,
)


def _checkerboard(size: int = 720, square: int = 60) -> np.ndarray:
    img = np.zeros((size, size, 3), dtype=np.uint8)
    for y in range(0, size, square):
        for x in range(0, size, square):
            if ((x // square) + (y // square)) % 2 == 0:
                img[y : y + square, x : x + square] = 200
            else:
                img[y : y + square, x : x + square] = 60
    return img


@pytest.fixture
def synthetic_sharp_frame() -> np.ndarray:
    return _checkerboard()


@pytest.fixture
def synthetic_blurred_frame() -> np.ndarray:
    sharp = _checkerboard()
    return cv2.GaussianBlur(sharp, (31, 31), 0)


@pytest.fixture
def synthetic_dark_frame() -> np.ndarray:
    img = _checkerboard()
    return (img * 0.1).astype(np.uint8)


@pytest.fixture
def synthetic_bright_frame() -> np.ndarray:
    img = _checkerboard()
    return np.clip(img.astype(np.int32) + 200, 0, 255).astype(np.uint8)


@pytest.fixture
def empty_frame() -> np.ndarray:
    return np.full((720, 720, 3), 140, dtype=np.uint8)


@pytest.fixture
def tmp_sessions_dir(tmp_path) -> Path:
    d = tmp_path / "sessions"
    d.mkdir()
    return d


def _make_quality(score: float = 0.8, verdict: str = "good") -> QualityReport:
    return QualityReport(
        sharpness=score,
        exposure=score,
        framing=score,
        verdict=verdict,
        laplacian_var=300.0,
        mean_luminance=0.55,
        edge_density=0.08,
    )


@pytest.fixture
def sample_quality() -> QualityReport:
    return _make_quality()


@pytest.fixture
def sample_session(tmp_sessions_dir) -> Session:
    session_dir = tmp_sessions_dir / "2026-05-19_1430_demo"
    session_dir.mkdir()
    session = Session(
        session_id=session_dir.name,
        name="demo",
        product_code="ZC-001",
        started_at=datetime.now(UTC),
        operator="alex",
        camera=CameraInfo(),
        ai_engine="grok",
        dir=session_dir,
    )
    for i in range(2):
        thumb = session_dir / f"{i + 1:03d}_thumbnail.jpg"
        cv2.imwrite(str(thumb), _checkerboard(120, 20))
        session.captures.append(
            CaptureRecord(
                capture_id=f"{i + 1:03d}",
                captured_at=datetime.now(UTC),
                frame_path=f"{i + 1:03d}_capture.jpg",
                thumbnail_path=thumb.name,
                quality=_make_quality(),
                quality_passed=True,
                ai_inference=CaptureResult(
                    verdict="pass" if i == 0 else "fail",
                    confidence=0.81,
                    surface_condition="clean",
                    framing_assessment="centered",
                    defects=[] if i == 0 else ["scratch on edge"],
                    notes="metallic surface, no concerns",
                    raw_response="{}",
                    latency_ms=4200.0,
                    engine="grok:grok-4.3",
                ),
            )
        )
    return session


class CannedEngine(AIEngine):
    name = "canned"

    def __init__(self, result: CaptureResult) -> None:
        self._result = result
        self.calls: list[bytes] = []

    def analyze(self, jpeg_bytes: bytes, prompt: str) -> CaptureResult:
        self.calls.append(jpeg_bytes)
        return self._result


@pytest.fixture
def canned_engine() -> CannedEngine:
    return CannedEngine(
        CaptureResult(
            verdict="pass",
            confidence=0.9,
            surface_condition="clean",
            framing_assessment="centered",
            defects=[],
            notes="OK",
            raw_response="{}",
            latency_ms=1234.0,
            engine="canned",
        )
    )
