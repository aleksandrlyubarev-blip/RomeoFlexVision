"""Session lifecycle: create dir, append captures, end + summary."""

from __future__ import annotations

import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Optional

import cv2
import numpy as np
from pydantic import BaseModel, ConfigDict, Field

from ..inference.ai_engine import CaptureResult
from ..inference.quality_validator import QualityReport
from ..utils.paths import new_session_dir, sessions_root
from ..vision.registration import AlignmentResult
from ..vision.roi import RoiInspectionResult

THUMBNAIL_MAX_SIDE = 256
JPEG_QUALITY = 92


class CameraInfo(BaseModel):
    model_config = ConfigDict(strict=True)

    name: str = "USB UVC Camera"
    resolution: str = "1920x1080"


class CaptureRecord(BaseModel):
    model_config = ConfigDict(strict=True)

    capture_id: str
    captured_at: datetime
    frame_path: str
    thumbnail_path: str
    quality: QualityReport
    quality_passed: bool
    ai_inference: CaptureResult | None = None
    alignment: AlignmentResult | None = None
    roi_results: list[RoiInspectionResult] = Field(default_factory=list)
    aligned_frame_path: str = ""
    roi_overlay_path: str = ""


class Session(BaseModel):
    model_config = ConfigDict(strict=True, arbitrary_types_allowed=True)

    session_id: str
    name: str
    product_code: str = ""
    started_at: datetime
    ended_at: Optional[datetime] = None
    operator: str = ""
    camera: CameraInfo = Field(default_factory=CameraInfo)
    ai_engine: str = "grok"
    captures: list[CaptureRecord] = Field(default_factory=list)
    dir: Path

    @property
    def capture_count(self) -> int:
        return len(self.captures)


def _passes(report: QualityReport, sharpness_min: float, exposure_min: float, framing_min: float) -> bool:
    return report.sharpness >= sharpness_min and report.exposure >= exposure_min and report.framing >= framing_min


def _write_thumbnail(frame_bgr: np.ndarray, path: Path) -> None:
    h, w = frame_bgr.shape[:2]
    long_side = max(h, w)
    if long_side > THUMBNAIL_MAX_SIDE:
        scale = THUMBNAIL_MAX_SIDE / long_side
        thumb = cv2.resize(frame_bgr, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
    else:
        thumb = frame_bgr
    cv2.imwrite(str(path), thumb, [cv2.IMWRITE_JPEG_QUALITY, 85])


class SessionManager:
    """Owns a single open session at a time. All file I/O is synchronous and fast."""

    def __init__(
        self,
        *,
        sessions_root_dir: Path | None = None,
        ai_engine_name: str = "grok",
        operator: str = "",
        sharpness_min: float = 0.5,
        exposure_min: float = 0.5,
        framing_min: float = 0.5,
    ) -> None:
        self._root = sessions_root_dir or sessions_root()
        self._engine = ai_engine_name
        self._operator = operator
        self._sharpness_min = sharpness_min
        self._exposure_min = exposure_min
        self._framing_min = framing_min
        self._session: Session | None = None

    @property
    def session(self) -> Session | None:
        return self._session

    def is_open(self) -> bool:
        return self._session is not None and self._session.ended_at is None

    def start(self, name: str | None = None, *, product_code: str = "", camera: CameraInfo | None = None) -> Session:
        if self.is_open():
            raise RuntimeError("a session is already open; call end() first")
        when = datetime.now(UTC)
        session_dir = new_session_dir(name, root=self._root, now=when)
        self._session = Session(
            session_id=session_dir.name,
            name=name or session_dir.name,
            product_code=product_code,
            started_at=when,
            operator=self._operator,
            camera=camera or CameraInfo(),
            ai_engine=self._engine,
            dir=session_dir,
        )
        self._write_session_json()
        return self._session

    def add_capture(
        self,
        frame_bgr: np.ndarray,
        quality: QualityReport,
        *,
        alignment: AlignmentResult | None = None,
        roi_results: list[RoiInspectionResult] | None = None,
        aligned_frame_bgr: np.ndarray | None = None,
        roi_overlay_bgr: np.ndarray | None = None,
    ) -> CaptureRecord:
        session = self._require_open()
        idx = session.capture_count + 1
        capture_id = f"{idx:03d}"
        when = datetime.now(UTC)
        frame_name = f"{capture_id}_capture.jpg"
        thumb_name = f"{capture_id}_thumbnail.jpg"
        aligned_name = f"{capture_id}_aligned.jpg" if aligned_frame_bgr is not None else ""
        overlay_name = f"{capture_id}_roi_overlay.jpg" if roi_overlay_bgr is not None else ""
        frame_path = session.dir / frame_name
        thumb_path = session.dir / thumb_name

        cv2.imwrite(str(frame_path), frame_bgr, [cv2.IMWRITE_JPEG_QUALITY, JPEG_QUALITY])
        _write_thumbnail(frame_bgr, thumb_path)
        if aligned_frame_bgr is not None:
            cv2.imwrite(str(session.dir / aligned_name), aligned_frame_bgr, [cv2.IMWRITE_JPEG_QUALITY, JPEG_QUALITY])
        if roi_overlay_bgr is not None:
            cv2.imwrite(str(session.dir / overlay_name), roi_overlay_bgr, [cv2.IMWRITE_JPEG_QUALITY, JPEG_QUALITY])

        record = CaptureRecord(
            capture_id=capture_id,
            captured_at=when,
            frame_path=frame_name,
            thumbnail_path=thumb_name,
            quality=quality,
            quality_passed=_passes(quality, self._sharpness_min, self._exposure_min, self._framing_min),
            alignment=alignment,
            roi_results=roi_results or [],
            aligned_frame_path=aligned_name,
            roi_overlay_path=overlay_name,
        )
        session.captures.append(record)
        self._write_capture_json(record)
        self._write_session_json()
        return record

    def attach_result(self, capture_id: str, result: CaptureResult) -> CaptureRecord:
        session = self._require_open()
        for i, rec in enumerate(session.captures):
            if rec.capture_id == capture_id:
                updated = rec.model_copy(update={"ai_inference": result})
                session.captures[i] = updated
                self._write_capture_json(updated)
                self._write_session_json()
                return updated
        raise KeyError(f"no capture with id {capture_id} in current session")

    def end(self) -> Session:
        session = self._require_open()
        session.ended_at = datetime.now(UTC)
        self._write_session_json()

        from . import pdf_export

        pdf_path = session.dir / "session_summary.pdf"
        pdf_export.export(session, pdf_path)

        finished = session
        self._session = None
        return finished

    def _require_open(self) -> Session:
        if not self.is_open() or self._session is None:
            raise RuntimeError("no open session; call start() first")
        return self._session

    def _write_session_json(self) -> None:
        assert self._session is not None
        path = self._session.dir / "session.json"
        path.write_text(self._session.model_dump_json(indent=2))

    def _write_capture_json(self, record: CaptureRecord) -> None:
        assert self._session is not None
        path = self._session.dir / f"{record.capture_id}_capture.json"
        path.write_text(json.dumps(record.model_dump(mode="json"), indent=2, default=str))
