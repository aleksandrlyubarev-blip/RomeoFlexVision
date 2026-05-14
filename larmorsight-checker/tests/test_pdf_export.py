"""PDF export sanity: file exists, has content, page count matches captures."""

from __future__ import annotations

import pytest

from larmorsight_checker.session import pdf_export


def test_export_writes_file(tmp_path, sample_session) -> None:
    out = tmp_path / "summary.pdf"
    pdf_export.export(sample_session, out)
    assert out.exists()
    assert out.stat().st_size > 4096
    assert out.read_bytes().startswith(b"%PDF-")


def test_export_page_count(tmp_path, sample_session) -> None:
    pypdf = pytest.importorskip("pypdf")
    out = tmp_path / "summary.pdf"
    pdf_export.export(sample_session, out)
    reader = pypdf.PdfReader(str(out))
    # cover page + at least one capture page (2 captures → 1 page block)
    assert len(reader.pages) >= 2


def test_export_handles_session_without_captures(tmp_path, sample_session) -> None:
    sample_session.captures.clear()
    out = tmp_path / "summary.pdf"
    pdf_export.export(sample_session, out)
    assert out.exists()
