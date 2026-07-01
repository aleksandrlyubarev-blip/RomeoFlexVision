// API client: shared-token auth, REST + live WebSocket. The token lives in
// localStorage; the API base comes from NEXT_PUBLIC_API_BASE at build time and
// falls back to same-origin (backend reverse-proxied under /api).

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '';

const TOKEN_KEY = 'nv_display_token';

export function getToken(): string {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(TOKEN_KEY) ?? '';
}

export function setToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
}

export interface Quality {
  sharpness?: number;
  exposure?: number;
  framing?: number;
}

export interface Capture {
  capture_key: string;
  stand_id: string;
  session_key: string;
  capture_id: string;
  ts: string;
  quality: Quality;
  quality_passed: boolean | null;
  thumbnail_b64: string | null;
  verdict: string | null;
  confidence: number | null;
  rationale: string | null;
}

export interface Stand {
  stand_id: string;
  status: 'online' | 'capturing' | 'offline';
  last_seen: string | null;
  heartbeat: Record<string, unknown>;
}

export interface HourBucket {
  hour_utc: string;
  captures: number;
  pass_rate: number | null;
}

export interface SessionRow {
  session_key: string;
  stand_id: string;
  session_id: string;
  name: string;
  started_at: string | null;
  ended_at: string | null;
  capture_count: number;
  pass_count: number;
  fail_count: number;
  retake_count: number;
}

export interface Overview {
  stands: Stand[];
  metrics: {
    today: { captures: number; pass: number; fail: number; retake: number; pass_rate: number | null };
    hourly: HourBucket[];
  };
  recent_failures: Capture[];
  sessions: SessionRow[];
}

export async function fetchOverview(): Promise<Overview> {
  const resp = await fetch(`${API_BASE}/api/overview`, {
    headers: { 'X-API-Key': getToken() },
    cache: 'no-store',
  });
  if (resp.status === 401) throw new Error('unauthorized');
  if (!resp.ok) throw new Error(`overview failed: HTTP ${resp.status}`);
  return resp.json();
}

/** Open the live socket; calls onEvent per message. Returns a cleanup fn. */
export function connectLive(onEvent: () => void, onStateChange: (up: boolean) => void): () => void {
  let ws: WebSocket | null = null;
  let closed = false;
  let retryMs = 1000;
  let keepalive: ReturnType<typeof setInterval> | null = null;

  const open = () => {
    if (closed) return;
    const base = API_BASE || window.location.origin;
    const url = new URL('/api/live', base);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    url.searchParams.set('token', getToken());
    ws = new WebSocket(url);
    ws.onopen = () => {
      retryMs = 1000;
      onStateChange(true);
      keepalive = setInterval(() => ws?.send('ping'), 25000);
    };
    ws.onmessage = () => onEvent();
    ws.onclose = () => {
      onStateChange(false);
      if (keepalive) clearInterval(keepalive);
      if (!closed) {
        setTimeout(open, retryMs);
        retryMs = Math.min(retryMs * 2, 30000);
      }
    };
    ws.onerror = () => ws?.close();
  };

  open();
  return () => {
    closed = true;
    if (keepalive) clearInterval(keepalive);
    ws?.close();
  };
}
