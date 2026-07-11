// ---------------------------------------------------------------------------
// Data source behind the RFV/RoboQC tools.
//
// Every voice frontend (Gemini Live, Grok realtime, remote MCP) calls
// executeTool() in rfv-tools.ts, which delegates here. Two implementations:
//
//   MockDataSource — canned demo data (default; safe for the public repo)
//   HttpDataSource — proxies to a real inspection API, enabled by setting
//                    RFV_API_BASE (and optionally RFV_API_TOKEN) in .env
//
// Expected HTTP API surface (adjust HttpDataSource when the real API lands):
//   GET  {base}/v1/lines/{lineId}/stats?window_minutes=N
//   GET  {base}/v1/lines/{lineId}/alerts?severity=S
//   GET  {base}/v1/lines/{lineId}/defects?window_minutes=N
//   POST {base}/v1/lines/{lineId}/inspection   body: {"action": "..."}
// ---------------------------------------------------------------------------

export interface RfvDataSource {
  getInspectionStats(lineId: string, windowMinutes: number): Promise<unknown>;
  getActiveAlerts(lineId: string, severity: string): Promise<unknown>;
  getDefectBreakdown(lineId: string, windowMinutes: number): Promise<unknown>;
  controlInspection(lineId: string, action: string): Promise<unknown>;
}

// ---------------------------------------------------------------------------
// Mock implementation — demo data only
// ---------------------------------------------------------------------------

export class MockDataSource implements RfvDataSource {
  async getInspectionStats(lineId: string, windowMinutes: number): Promise<unknown> {
    return {
      line_id: lineId,
      window_minutes: windowMinutes,
      total_inspected: 1842,
      passed: 1697,
      failed: 145,
      pass_rate: 92.1,
      fail_rate: 7.9,
      throughput_per_hour: 1842,
      timestamp: new Date().toISOString(),
    };
  }

  async getActiveAlerts(lineId: string, severity: string): Promise<unknown> {
    const allAlerts = [
      {
        id: 'ALT-001',
        severity: 'critical',
        type: 'solder_bridge_cluster',
        message: 'Solder bridge cluster on IC1 pads — 12 boards in last 20 min',
        line_id: lineId,
        age_minutes: 8,
      },
      {
        id: 'ALT-002',
        severity: 'warning',
        type: 'missing_component',
        message: 'Missing R47 resistor — 3 boards, intermittent feeder issue suspected',
        line_id: lineId,
        age_minutes: 22,
      },
    ];
    const filtered =
      severity === 'all' ? allAlerts : allAlerts.filter((a) => a.severity === severity);
    return { alerts: filtered, count: filtered.length };
  }

  async getDefectBreakdown(lineId: string, windowMinutes: number): Promise<unknown> {
    return {
      line_id: lineId,
      window_minutes: windowMinutes,
      total_defects: 145,
      breakdown: [
        { type: 'solder_bridge', count: 68, pct: 46.9 },
        { type: 'missing_component', count: 31, pct: 21.4 },
        { type: 'misaligned_component', count: 24, pct: 16.6 },
        { type: 'insufficient_solder', count: 15, pct: 10.3 },
        { type: 'other', count: 7, pct: 4.8 },
      ],
    };
  }

  async controlInspection(lineId: string, action: string): Promise<unknown> {
    return {
      ok: true,
      line_id: lineId,
      action,
      message: `Inspection ${action} acknowledged for ${lineId}`,
      timestamp: new Date().toISOString(),
    };
  }
}

// ---------------------------------------------------------------------------
// HTTP implementation — real inspection API
// ---------------------------------------------------------------------------

export class HttpDataSource implements RfvDataSource {
  private readonly base: string;
  private readonly token: string;

  constructor(base: string, token = '') {
    this.base = base.replace(/\/+$/, '');
    this.token = token;
  }

  private async request(method: 'GET' | 'POST', path: string, body?: unknown): Promise<unknown> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;
    if (body !== undefined) headers['Content-Type'] = 'application/json';

    const res = await fetch(`${this.base}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      throw new Error(`RFV API ${method} ${path} failed: ${res.status} ${res.statusText}`);
    }
    return res.json();
  }

  getInspectionStats(lineId: string, windowMinutes: number): Promise<unknown> {
    return this.request(
      'GET',
      `/v1/lines/${encodeURIComponent(lineId)}/stats?window_minutes=${windowMinutes}`,
    );
  }

  getActiveAlerts(lineId: string, severity: string): Promise<unknown> {
    return this.request(
      'GET',
      `/v1/lines/${encodeURIComponent(lineId)}/alerts?severity=${encodeURIComponent(severity)}`,
    );
  }

  getDefectBreakdown(lineId: string, windowMinutes: number): Promise<unknown> {
    return this.request(
      'GET',
      `/v1/lines/${encodeURIComponent(lineId)}/defects?window_minutes=${windowMinutes}`,
    );
  }

  controlInspection(lineId: string, action: string): Promise<unknown> {
    return this.request('POST', `/v1/lines/${encodeURIComponent(lineId)}/inspection`, { action });
  }
}

/** Pick the data source from the environment: HTTP when RFV_API_BASE is set, mock otherwise. */
export function createDataSource(env: NodeJS.ProcessEnv = process.env): RfvDataSource {
  const base = env.RFV_API_BASE?.trim();
  if (base) return new HttpDataSource(base, env.RFV_API_TOKEN?.trim() ?? '');
  return new MockDataSource();
}
