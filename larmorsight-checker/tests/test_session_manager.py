"""Session lifecycle: start → add_capture → attach_result → end."""

from __future__ import annotations

import json

import pytest

from larmorsight_checker.inference.ai_engine import CaptureResult
from larmorsight_checker.session.session_manager import SessionManager


def _make_manager(tmp_sessions_dir):
    return SessionManager(sessions_root_dir=tmp_sessions_dir, ai_engine_name="grok")


def test_start_creates_directory(tmp_sessions_dir) -> None:
    mgr = _make_manager(tmp_sessions_dir)
    session = mgr.start("zutacore-demo")
    assert session.dir.exists()
    assert (session.dir / "session.json").exists()
    payload = json.loads((session.dir / "session.json").read_text())
    assert payload["name"] == "zutacore-demo"
    assert payload["captures"] == []


def test_start_auto_names_when_blank(tmp_sessions_dir) -> None:
    mgr = _make_manager(tmp_sessions_dir)
    session = mgr.start(None)
    assert session.name.endswith("session")


def test_double_start_blocks(tmp_sessions_dir) -> None:
    mgr = _make_manager(tmp_sessions_dir)
    mgr.start("a")
    with pytest.raises(RuntimeError):
        mgr.start("b")


def test_add_capture_writes_files(tmp_sessions_dir, synthetic_sharp_frame, sample_quality) -> None:
    mgr = _make_manager(tmp_sessions_dir)
    session = mgr.start("demo")
    record = mgr.add_capture(synthetic_sharp_frame, sample_quality)
    assert record.capture_id == "001"
    assert (session.dir / record.frame_path).exists()
    assert (session.dir / record.thumbnail_path).exists()
    cap_json = session.dir / f"{record.capture_id}_capture.json"
    assert cap_json.exists()
    assert json.loads(cap_json.read_text())["capture_id"] == "001"


def test_attach_result_updates_json(tmp_sessions_dir, synthetic_sharp_frame, sample_quality) -> None:
    mgr = _make_manager(tmp_sessions_dir)
    session = mgr.start("demo")
    record = mgr.add_capture(synthetic_sharp_frame, sample_quality)
    result = CaptureResult(verdict="pass", confidence=0.9, notes="ok", engine="canned")
    updated = mgr.attach_result(record.capture_id, result)
    assert updated.ai_inference is not None
    assert updated.ai_inference.verdict == "pass"
    on_disk = json.loads((session.dir / f"{record.capture_id}_capture.json").read_text())
    assert on_disk["ai_inference"]["verdict"] == "pass"


def test_attach_result_unknown_id_raises(tmp_sessions_dir) -> None:
    mgr = _make_manager(tmp_sessions_dir)
    mgr.start("demo")
    with pytest.raises(KeyError):
        mgr.attach_result("999", CaptureResult(verdict="pass", confidence=0.5, engine="canned"))


def test_end_writes_pdf(tmp_sessions_dir, synthetic_sharp_frame, sample_quality) -> None:
    mgr = _make_manager(tmp_sessions_dir)
    session = mgr.start("demo")
    mgr.add_capture(synthetic_sharp_frame, sample_quality)
    finished = mgr.end()
    assert finished.ended_at is not None
    pdf = session.dir / "session_summary.pdf"
    assert pdf.exists()
    assert pdf.stat().st_size > 1024
    assert mgr.is_open() is False
