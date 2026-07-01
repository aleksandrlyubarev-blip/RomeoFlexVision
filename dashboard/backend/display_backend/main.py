"""FastAPI app: token-gated ingest + read API + live WebSocket fanout.

Auth model (single shared secret, cloud-hosted MVP):
- REST: header `X-API-Key: $DISPLAY_TOKEN`
- WS:   query   `/api/live?token=$DISPLAY_TOKEN` (browsers cannot set WS headers)
"""

from __future__ import annotations

import asyncio
import json
import os
from pathlib import Path
from typing import Any

from fastapi import Depends, FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security.api_key import APIKeyHeader

from .store import Store

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


def expected_token() -> str:
    token = os.environ.get("DISPLAY_TOKEN", "")
    if not token:
        raise RuntimeError("DISPLAY_TOKEN env var is required")
    return token


def require_token(key: str | None = Depends(api_key_header)) -> None:
    if key != expected_token():
        raise HTTPException(status_code=401, detail="bad or missing X-API-Key")


class LiveHub:
    """Fan out ingested events to connected dashboard browsers."""

    def __init__(self) -> None:
        self._clients: set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def add(self, ws: WebSocket) -> None:
        async with self._lock:
            self._clients.add(ws)

    async def remove(self, ws: WebSocket) -> None:
        async with self._lock:
            self._clients.discard(ws)

    async def broadcast(self, message: dict[str, Any]) -> None:
        data = json.dumps(message)
        async with self._lock:
            clients = list(self._clients)
        for ws in clients:
            try:
                await ws.send_text(data)
            except Exception:
                await self.remove(ws)


def create_app(db_path: str | Path | None = None) -> FastAPI:
    app = FastAPI(title="NeutronVision Display", version="0.1.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=os.environ.get("DISPLAY_CORS_ORIGINS", "*").split(","),
        allow_methods=["*"],
        allow_headers=["*"],
    )
    store = Store(db_path or os.environ.get("DISPLAY_DB", "display.db"))
    hub = LiveHub()
    app.state.store = store
    app.state.hub = hub

    @app.post("/api/events", status_code=202, dependencies=[Depends(require_token)])
    async def ingest(body: dict[str, Any] | list[dict[str, Any]]) -> dict[str, int]:
        events = body if isinstance(body, list) else [body]
        accepted = 0
        for event in events:
            if not isinstance(event, dict):
                continue
            if store.apply_event(event):
                accepted += 1
                # thumbnails are heavy; live tiles refetch via REST instead
                slim = {k: v for k, v in event.items() if k != "payload"}
                slim["payload"] = {
                    k: v for k, v in (event.get("payload") or {}).items() if k != "thumbnail_b64"
                }
                await hub.broadcast(slim)
        return {"accepted": accepted, "received": len(events)}

    @app.get("/api/overview", dependencies=[Depends(require_token)])
    async def overview() -> dict[str, Any]:
        return {
            "stands": store.stands(),
            "metrics": store.metrics(),
            "recent_failures": store.recent_failures(),
            "sessions": store.sessions(limit=10),
        }

    @app.get("/api/sessions", dependencies=[Depends(require_token)])
    async def sessions(limit: int = Query(default=20, le=200)) -> list[dict[str, Any]]:
        return store.sessions(limit=limit)

    @app.get("/api/sessions/{session_key}", dependencies=[Depends(require_token)])
    async def session_detail(session_key: str) -> dict[str, Any]:
        detail = store.session_detail(session_key)
        if detail is None:
            raise HTTPException(status_code=404, detail="unknown session")
        return detail

    @app.get("/api/health")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.websocket("/api/live")
    async def live(ws: WebSocket, token: str = Query(default="")) -> None:
        if token != expected_token():
            await ws.close(code=4401)
            return
        await ws.accept()
        await hub.add(ws)
        try:
            while True:
                await ws.receive_text()  # keepalive pings from the client
        except WebSocketDisconnect:
            pass
        finally:
            await hub.remove(ws)

    return app


app = None
if os.environ.get("DISPLAY_TOKEN"):  # uvicorn display_backend.main:app
    app = create_app()
