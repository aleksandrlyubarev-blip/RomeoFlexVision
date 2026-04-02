import 'dotenv/config';
import { createServer } from 'node:http';
import type { IncomingMessage } from 'node:http';
import express from 'express';
import type { Request, Response } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { GeminiSession } from './gemini-session.js';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const PORT = parseInt(process.env.PORT ?? '8765', 10);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim() ?? '';
const GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() ?? 'gemini-2.0-flash-live-001';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

if (!GEMINI_API_KEY) {
  console.error('Fatal: GEMINI_API_KEY environment variable is required');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// HTTP layer (health checks)
// ---------------------------------------------------------------------------

const app = express();
app.disable('x-powered-by');

app.get('/', (_req: Request, res: Response) => {
  res.json({ ok: true, service: 'rfv-voice-gateway', model: GEMINI_MODEL });
});

app.get('/healthz', (_req: Request, res: Response) => {
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// WebSocket layer (/voice endpoint)
// ---------------------------------------------------------------------------

const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/voice' });

function isOriginAllowed(req: IncomingMessage): boolean {
  const origin = req.headers.origin;
  if (!origin) return true; // Allow non-browser clients (monitoring, curl)
  return ALLOWED_ORIGINS.some((allowed) => origin === allowed || origin.startsWith(allowed));
}

wss.on('connection', (clientWs: WebSocket, req: IncomingMessage) => {
  if (!isOriginAllowed(req)) {
    clientWs.close(1008, 'Origin not allowed');
    return;
  }

  const remote = req.socket.remoteAddress ?? 'unknown';
  console.log(`[voice-gateway] Client connected: ${remote}`);

  const session = new GeminiSession(GEMINI_API_KEY, GEMINI_MODEL);

  // ---- Bridge: session events → client ----

  session.on('message', (msg: unknown) => {
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify(msg));
    }
  });

  session.on('audio', (audioChunk: Buffer) => {
    if (clientWs.readyState === WebSocket.OPEN) {
      // Send as binary frame — browser receives ArrayBuffer
      clientWs.send(audioChunk, { binary: true });
    }
  });

  session.on('error', (err: Error) => {
    console.error(`[voice-gateway] Gemini error for ${remote}:`, err.message);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ type: 'error', message: 'AI service error' }));
    }
  });

  session.on('close', () => {
    if (clientWs.readyState === WebSocket.OPEN) clientWs.close();
  });

  // ---- Bridge: client audio → session ----

  clientWs.on('message', (data: WebSocket.RawData, isBinary: boolean) => {
    if (!isBinary) return; // Only accept binary PCM16 frames from browser
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data as ArrayBuffer);
    session.sendAudio(buf);
  });

  clientWs.on('close', () => {
    console.log(`[voice-gateway] Client disconnected: ${remote}`);
    session.close();
  });

  clientWs.on('error', (err: Error) => {
    console.error(`[voice-gateway] Client WS error ${remote}:`, err.message);
    session.close();
  });

  // ---- Start Gemini Live session ----

  session.connect().catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[voice-gateway] Failed to connect to Gemini for ${remote}:`, msg);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ type: 'error', message: 'Failed to connect to AI service' }));
      clientWs.close(1011, 'AI service unavailable');
    }
  });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

server.listen(PORT, () => {
  console.log(`[voice-gateway] Listening on port ${PORT}`);
  console.log(`[voice-gateway] Model: ${GEMINI_MODEL}`);
  console.log(`[voice-gateway] Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
});

const shutdown = (signal: string) => {
  console.log(`[voice-gateway] Shutting down (${signal})`);
  server.close(() => process.exit(0));
};

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
