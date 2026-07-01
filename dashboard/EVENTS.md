# Checker → Dashboard event contract

Every message the checker emits to the dashboard is one JSON object POSTed to
`POST /api/events` with header `X-API-Key: <shared token>`.

```json
{
  "event_id": "c2f1a2b4...",        // uuid4, idempotency key — ingest is upsert-by-event_id
  "stand_id": "stand-01",           // from checker settings
  "type": "session_started",        // see below
  "ts": "2026-07-01T12:34:56.789Z", // event time at the stand, UTC ISO-8601
  "session_id": "2026-07-01_1234",  // checker session dir name; null for heartbeat
  "payload": { }                    // type-specific, see below
}
```

The ingest endpoint accepts either a single object or a JSON array (the
offline spool is flushed as a batch). Response `202` means durably stored;
anything else and the checker keeps the event spooled and retries.

## Event types

### `session_started`
```json
{ "name": "morning batch", "operator": "", "product_code": "", "ai_engine": "grok",
  "camera": { "name": "USB UVC Camera", "resolution": "1920x1080" } }
```

### `capture`
```json
{ "capture_id": "003",
  "quality": { "sharpness": 0.81, "exposure": 0.77, "framing": 0.62 },
  "quality_passed": true,
  "thumbnail_b64": "<jpeg base64, ≤256px long side, optional>" }
```

### `verdict`
```json
{ "capture_id": "003", "verdict": "PASS",   // PASS | FAIL | RETAKE
  "confidence": 0.93, "rationale": "…", "latency_s": 4.2, "engine": "grok" }
```

### `session_ended`
```json
{ "capture_count": 6, "pass": 5, "fail": 1, "retake": 0 }
```

### `heartbeat` (every 30 s, `session_id: null`)
```json
{ "camera_connected": true, "engine": "grok", "engine_key_present": true,
  "app_version": "0.1.0", "session_open": false }
```

## Stand status derivation (server side)

- `online` — heartbeat within the last 90 s
- `capturing` — online and last heartbeat has `session_open: true`
- `offline` — no heartbeat for 90 s

## Delivery guarantees

At-least-once. The checker appends every event to a local spool file
(`~/NeutronVision/dashboard_spool.jsonl`) and a background thread POSTs and
truncates it. Duplicate `event_id`s are ignored by the server, so replays are
safe. Order within a session is restored server-side by `ts`.
