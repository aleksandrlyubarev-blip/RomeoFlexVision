# voice-gateway

Node/TypeScript service powering the Romeo voice assistant for RoboQC. Two
entrypoints share one tool layer:

| Entrypoint | Command | Port | Purpose |
|---|---|---|---|
| Browser gateway | `npm run dev` / `node dist/index.js` | 8765 | Bridges browser WebSocket audio to a voice provider |
| Remote MCP server | `npm run dev:mcp` / `node dist/mcp-server.js` | 8766 | Exposes the RoboQC tools to the xAI Voice Agent Builder (see [`../voice-agent`](../voice-agent)) |

## Voice providers

The browser gateway supports two providers, selected by `VOICE_PROVIDER`:

- `gemini` (default) — Gemini Live (`gemini-session.ts`), needs `GEMINI_API_KEY`
- `grok` — xAI realtime API (`grok-session.ts`), needs `XAI_API_KEY`;
  voice/model via `GROK_VOICE` / `GROK_VOICE_MODEL`

Both emit the same client-bound protocol (`types.ts`): JSON status/transcript/
tool events plus binary PCM16 24 kHz audio frames.

## Tool layer

`rfv-tools.ts` defines the four RoboQC tools once; `data-source.ts` decides
where their data comes from:

- **Mock** (default) — canned demo data, safe for the public repo
- **HTTP** — set `RFV_API_BASE` (+ optional `RFV_API_TOKEN`) to proxy to a
  real inspection API; the expected endpoint surface is documented in
  `data-source.ts`

## Develop

```bash
npm install
cp .env.example .env
npm run dev        # gateway
npm run dev:mcp    # MCP server
npm run typecheck  # src + tests
npm test           # node:test suite (protocol, MCP round trips, data sources)
```

The Grok session and MCP server are tested against scripted local fakes — no
API keys needed to run the suite.

## Docker

```bash
docker build -t rfv-voice-gateway .
docker run -p 8765:8765 --env-file .env rfv-voice-gateway                          # gateway
docker run -p 8766:8766 --env-file .env rfv-voice-gateway node dist/mcp-server.js  # MCP
```

Or from the repo root: `docker compose up voice-gateway roboqc-mcp`.
