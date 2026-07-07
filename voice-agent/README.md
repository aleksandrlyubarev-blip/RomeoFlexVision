# voice-agent — xAI Voice Agent Builder setup for Romeo

Configuration-as-code for deploying **Romeo** (the RoboQC line assistant) on
the xAI [Voice Agent Builder](https://x.ai/news/grok-voice-agent-builder)
(beta, July 2026). The builder gives us the full speech-to-speech path on Grok
Voice — telephony, knowledge retrieval, tools, guardrails, and observability —
while our line tools plug in as a **remote MCP server** hosted from this repo.

This directory is the source of truth; the console agent is a deployment of it.

## What's here

| File | Purpose |
|---|---|
| `playbook.md` | Plain-language instructions to paste into the console Playbook field |
| `guardrails.md` | Guardrail rules to reproduce in the console Guardrails section |
| `knowledge/README.md` | Document-collection layout for `file_search` |
| `session-config.json` | Equivalent `session.update` payload for API-first use (`wss://api.x.ai/v1/realtime`) |

The MCP server itself lives in [`../voice-gateway`](../voice-gateway)
(`src/mcp-server.ts`) and reuses the same four RoboQC tools the Gemini Live
gateway already exposes — the tool layer is shared; only the voice frontend
differs.

## Relationship to `voice-gateway`

`voice-gateway` is the self-hosted path: browser ↔ our WebSocket ↔ Gemini
Live, with tools executed in-process. The Voice Agent Builder path inverts
this: xAI hosts the voice loop (including a phone number), and calls back into
our stack over MCP. Both paths share `voice-gateway/src/rfv-tools.ts`, so tool
behavior stays identical whichever frontend answers.

```
Phone / browser ──► xAI Voice Agent (Grok Voice)
                        │  playbook + guardrails + collections (console)
                        ▼
                POST https://<host>/mcp   (Streamable HTTP, Bearer auth)
                        │
                voice-gateway/src/mcp-server.ts
                        │
                voice-gateway/src/rfv-tools.ts  (mock handlers → real APIs later)
```

## Setup

### 1. Run the MCP server

```bash
cd ../voice-gateway
npm install
cp .env.example .env        # set MCP_AUTH_TOKEN to a long random value
npm run dev:mcp             # listens on :8766, POST /mcp
```

Expose it over HTTPS (reverse proxy or tunnel) — the builder only talks to
public Streamable HTTP/SSE endpoints. Verify with:

```bash
curl -s https://<host>/healthz
```

### 2. Create the agent in the console

At [console.x.ai](https://console.x.ai) → **Voice → Agents**:

1. **Playbook** — paste the body of `playbook.md` (from "You are Romeo" down).
2. **Voice** — pick a built-in voice (config assumes `rex`), or clone a custom
   voice (~2 min of audio). Romeo speaks English, Russian, and Hebrew per the
   playbook; no per-language setup needed.
3. **Tools → MCP** — add a connector:
   - Server URL: `https://<host>/mcp`
   - Label: `roboqc`
   - Authorization: `Bearer <MCP_AUTH_TOKEN>`
   - Allowed tools: the four names in `session-config.json`
4. **Knowledge** — create the collections in `knowledge/README.md` and attach them.
5. **Guardrails** — reproduce `guardrails.md`.
6. **Phone** — every account gets a free provisioned number; bring-your-own is
   SIP (see xAI [SIP docs](https://docs.x.ai/developers/model-capabilities/audio/voice-agent)).

Call the number and ask *"pass rate on line one?"* — the trace view should
show a `roboqc.get_inspection_stats` call returning the mock 92.1 % stats.

### 3. (Optional) API-first instead of console

For programmatic control, connect to
`wss://api.x.ai/v1/realtime?model=grok-voice-latest` and send
`session-config.json` (with placeholders filled) as the first event. Use
ephemeral client tokens in browsers, never the raw API key.

## Going to production

- Replace the mock handlers in `rfv-tools.ts` with real inspection-API calls —
  the MCP surface (names, schemas) shouldn't need to change.
- Keep `MCP_AUTH_TOKEN` set and rotate it; the server refuses unauthenticated
  calls with 401 when it is configured.
- Pricing is per-minute ($0.05/min at beta launch) — watch the console usage
  view during pilots.
- **Data boundary**: this repo is public research (root `README.md`). Demo
  deployments must use mock/synthetic data only.

References: [Voice Agent API](https://docs.x.ai/developers/model-capabilities/audio/voice-agent) ·
[Remote MCP tools](https://docs.x.ai/developers/tools/remote-mcp) ·
[Announcement](https://x.ai/news/grok-voice-agent-builder)
