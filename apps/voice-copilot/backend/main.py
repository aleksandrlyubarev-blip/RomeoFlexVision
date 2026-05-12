from __future__ import annotations

import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib import request

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).parent
SOP_DIR = BASE_DIR / "sop"
DEFECT_LOG = BASE_DIR / "data" / "defect_drafts.jsonl"

app = FastAPI(title="RomeoFlex Voice Copilot V0.1")


class RealtimeTokenRequest(BaseModel):
    voice: str = "alloy"


class DefectDraftRequest(BaseModel):
    station: str
    defect_type: str
    description: str
    severity: str


def _load_sops() -> list[dict[str, str]]:
    docs = []
    for file in SOP_DIR.glob("*.md"):
        docs.append({"id": file.stem, "title": file.name, "content": file.read_text(encoding="utf-8")})
    return docs


def search_sop(query: str) -> dict[str, Any]:
    query_l = query.lower()
    results = [d for d in _load_sops() if query_l in d["content"].lower() or query_l in d["title"].lower()]
    return {"query": query, "count": len(results), "results": results[:3]}


def create_defect_draft(station: str, defect_type: str, description: str, severity: str) -> dict[str, Any]:
    draft = {
        "draft_id": f"draft_{uuid.uuid4().hex[:10]}",
        "station": station,
        "defect_type": defect_type,
        "description": description,
        "severity": severity,
        "status": "draft_pending_human_approval",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    DEFECT_LOG.parent.mkdir(parents=True, exist_ok=True)
    with DEFECT_LOG.open("a", encoding="utf-8") as f:
        f.write(json.dumps(draft, ensure_ascii=False) + "\n")
    return draft


def request_visual_check(target: str, reason: str) -> dict[str, Any]:
    return {
        "check_id": f"vis_{uuid.uuid4().hex[:10]}",
        "target": target,
        "reason": reason,
        "status": "draft_pending_human_approval",
    }


def submit_for_human_approval(draft_id: str) -> dict[str, Any]:
    return {"draft_id": draft_id, "status": "draft_pending_human_approval", "message": "Queued for Romeo Prime review"}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/realtime/token")
def mint_realtime_token(payload: RealtimeTokenRequest) -> dict[str, Any]:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY is not set")

    body = {
        "session": {
            "type": "realtime",
            "model": "gpt-realtime-2",
            "voice": payload.voice,
            "reasoning": {"effort": "low"},
            "instructions": (
                "You are RomeoFlex Voice Copilot. Support RoboQC operators with SOP guidance and draft-only actions. "
                "All external or write actions must remain draft_pending_human_approval. "
                "Never produce final QC pass/fail decisions. Escalate final decisions to human supervisor."
            ),
            "tools": [
                {"type": "function", "name": "search_sop", "description": "Search local SOP markdown docs", "parameters": {"type": "object", "properties": {"query": {"type": "string"}}, "required": ["query"]}},
                {"type": "function", "name": "create_defect_draft", "description": "Create local defect draft only", "parameters": {"type": "object", "properties": {"station": {"type": "string"}, "defect_type": {"type": "string"}, "description": {"type": "string"}, "severity": {"type": "string"}}, "required": ["station", "defect_type", "description", "severity"]}},
                {"type": "function", "name": "request_visual_check", "description": "Request visual check draft", "parameters": {"type": "object", "properties": {"target": {"type": "string"}, "reason": {"type": "string"}}, "required": ["target", "reason"]}},
                {"type": "function", "name": "submit_for_human_approval", "description": "Submit draft to human approval queue", "parameters": {"type": "object", "properties": {"draft_id": {"type": "string"}}, "required": ["draft_id"]}},
            ],
        }
    }

    req = request.Request(
        "https://api.openai.com/v1/realtime/sessions",
        data=json.dumps(body).encode("utf-8"),
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        method="POST",
    )
    with request.urlopen(req, timeout=20) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    return {"client_secret": data.get("client_secret"), "model": "gpt-realtime-2"}


@app.get("/api/sop/search")
def api_search_sop(query: str) -> dict[str, Any]:
    return search_sop(query)


@app.post("/api/defects/draft")
def api_create_defect_draft(payload: DefectDraftRequest) -> dict[str, Any]:
    return create_defect_draft(payload.station, payload.defect_type, payload.description, payload.severity)


class VisualCheckRequest(BaseModel):
    target: str
    reason: str


class SubmitApprovalRequest(BaseModel):
    draft_id: str


@app.post("/api/visual-check/draft")
def api_request_visual_check(payload: VisualCheckRequest) -> dict[str, Any]:
    return request_visual_check(payload.target, payload.reason)


@app.post("/api/defects/submit")
def api_submit_for_human_approval(payload: SubmitApprovalRequest) -> dict[str, Any]:
    return submit_for_human_approval(payload.draft_id)
