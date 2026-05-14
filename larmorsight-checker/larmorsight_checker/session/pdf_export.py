"""Render a session-summary PDF via reportlab. Pure function."""

from __future__ import annotations

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Image,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from .session_manager import CaptureRecord, Session

_VERDICT_COLORS: dict[str, colors.Color] = {
    "pass": colors.HexColor("#1e8e3e"),
    "fail": colors.HexColor("#d93025"),
    "retake": colors.HexColor("#f9a825"),
    "unknown": colors.HexColor("#5f6368"),
}


def _summary_counts(session: Session) -> dict[str, int]:
    counts = {"pass": 0, "fail": 0, "retake": 0, "unknown": 0, "no_inference": 0}
    for cap in session.captures:
        if cap.ai_inference is None:
            counts["no_inference"] += 1
        else:
            counts[cap.ai_inference.verdict] += 1
    return counts


def _cover(session: Session, styles) -> list:
    counts = _summary_counts(session)
    title = Paragraph(f"<b>LarmorSight session summary</b><br/>{session.name}", styles["Title"])
    rows = [
        ["Session ID", session.session_id],
        ["Operator", session.operator or "-"],
        ["Product code", session.product_code or "-"],
        ["AI engine", session.ai_engine],
        ["Started", session.started_at.isoformat(timespec="seconds")],
        ["Ended", session.ended_at.isoformat(timespec="seconds") if session.ended_at else "-"],
        ["Captures", str(session.capture_count)],
        [
            "Verdicts",
            f"PASS {counts['pass']}  /  FAIL {counts['fail']}  /  RETAKE {counts['retake']}  /  UNKNOWN {counts['unknown']}  /  no inference {counts['no_inference']}",
        ],
    ]
    table = Table(rows, colWidths=[40 * mm, 130 * mm])
    table.setStyle(
        TableStyle(
            [
                ("FONT", (0, 0), (-1, -1), "Helvetica", 10),
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f1f3f4")),
                ("BOX", (0, 0), (-1, -1), 0.4, colors.grey),
                ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.lightgrey),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    return [title, Spacer(1, 8 * mm), table]


def _verdict_label(record: CaptureRecord) -> Paragraph:
    style = ParagraphStyle(
        "verdict",
        fontName="Helvetica-Bold",
        fontSize=11,
        textColor=colors.white,
        alignment=1,
        leading=14,
    )
    verdict = record.ai_inference.verdict if record.ai_inference else "no inference"
    color = _VERDICT_COLORS.get(verdict, colors.HexColor("#5f6368"))
    return Paragraph(f'<para backColor="#{color.hexval()[2:]}">&nbsp;{verdict.upper()}&nbsp;</para>', style)


def _capture_block(record: CaptureRecord, session: Session, styles) -> list:
    body_style = ParagraphStyle("body", parent=styles["BodyText"], fontSize=9, leading=12)
    quality = record.quality
    notes = record.ai_inference.notes if record.ai_inference else "(no AI inference attached)"
    defects = ", ".join(record.ai_inference.defects) if record.ai_inference and record.ai_inference.defects else "-"
    surface = record.ai_inference.surface_condition if record.ai_inference else "-"
    framing = record.ai_inference.framing_assessment if record.ai_inference else "-"
    confidence = f"{record.ai_inference.confidence:.2f}" if record.ai_inference else "-"
    latency = f"{record.ai_inference.latency_ms:.0f} ms" if record.ai_inference else "-"

    image_path = session.dir / record.thumbnail_path
    if image_path.exists():
        thumb_flowable = Image(str(image_path), width=50 * mm, height=50 * mm, kind="proportional")
    else:
        thumb_flowable = Paragraph("(thumbnail missing)", body_style)

    info = [
        [Paragraph(f"<b>Capture {record.capture_id}</b>", body_style), _verdict_label(record)],
        [
            Paragraph(
                f"Captured {record.captured_at.isoformat(timespec='seconds')}<br/>"
                f"Sharpness {quality.sharpness:.2f} / Exposure {quality.exposure:.2f} / Framing {quality.framing:.2f}<br/>"
                f"Quality gate: {'PASS' if record.quality_passed else 'WARN'}",
                body_style,
            ),
            "",
        ],
        [
            Paragraph(
                f"<b>Surface:</b> {surface}<br/>"
                f"<b>Framing:</b> {framing}<br/>"
                f"<b>Defects:</b> {defects}<br/>"
                f"<b>Confidence:</b> {confidence}  <b>Latency:</b> {latency}",
                body_style,
            ),
            "",
        ],
        [Paragraph(f"<b>Notes:</b> {notes}", body_style), ""],
    ]
    info_table = Table(info, colWidths=[100 * mm, 30 * mm])
    info_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
                ("SPAN", (1, 1), (1, 3)),
            ]
        )
    )
    layout = Table([[thumb_flowable, info_table]], colWidths=[55 * mm, 130 * mm])
    layout.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("BOX", (0, 0), (-1, -1), 0.3, colors.lightgrey),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    return [layout, Spacer(1, 4 * mm)]


def export(session: Session, out_path: Path) -> Path:
    """Write a one-or-more-page session summary PDF; returns out_path."""
    out_path.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(out_path),
        pagesize=A4,
        leftMargin=15 * mm,
        rightMargin=15 * mm,
        topMargin=15 * mm,
        bottomMargin=15 * mm,
    )
    styles = getSampleStyleSheet()
    story = list(_cover(session, styles))
    if session.captures:
        story.append(PageBreak())
        per_page = 4
        for i, record in enumerate(session.captures):
            story.extend(_capture_block(record, session, styles))
            if (i + 1) % per_page == 0 and i + 1 < len(session.captures):
                story.append(PageBreak())
    doc.build(story)
    return out_path
