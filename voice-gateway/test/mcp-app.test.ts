import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createMcpApp } from '../src/mcp-app.js';

const AUTH = 'test-mcp-token';

const server = createServer(createMcpApp({ authToken: AUTH }));
await new Promise<void>((resolve) => server.listen(0, resolve));
const base = `http://localhost:${(server.address() as AddressInfo).port}`;

after(() => server.close());

/** POST a JSON-RPC request and parse the (possibly SSE-framed) response body. */
async function rpc(payload: unknown, token: string | null = AUTH): Promise<{ status: number; body?: any }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${base}/mcp`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  const text = await res.text();

  // Stateless Streamable HTTP answers either as plain JSON or as a single
  // SSE "data:" frame — normalize both.
  const dataLine = text
    .split('\n')
    .find((line) => line.startsWith('data:'));
  const body = dataLine ? JSON.parse(dataLine.slice(5)) : text ? JSON.parse(text) : undefined;
  return { status: res.status, body };
}

const initialize = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2025-03-26',
    capabilities: {},
    clientInfo: { name: 'test', version: '0' },
  },
};

test('healthz responds without auth', async () => {
  const res = await fetch(`${base}/healthz`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true, service: 'rfv-roboqc-mcp' });
});

test('rejects requests without a bearer token', async () => {
  const { status, body } = await rpc(initialize, null);
  assert.equal(status, 401);
  assert.equal(body.error.message, 'Unauthorized');
});

test('rejects requests with a wrong token', async () => {
  const { status } = await rpc(initialize, 'wrong-token');
  assert.equal(status, 401);
});

test('initialize handshake succeeds', async () => {
  const { status, body } = await rpc(initialize);
  assert.equal(status, 200);
  assert.equal(body.result.serverInfo.name, 'rfv-roboqc');
});

test('tools/list exposes exactly the four RoboQC tools', async () => {
  const { body } = await rpc({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
  const names = body.result.tools.map((t: { name: string }) => t.name).sort();
  assert.deepEqual(names, [
    'control_inspection',
    'get_active_alerts',
    'get_defect_breakdown',
    'get_inspection_stats',
  ]);
});

test('tools/call executes a tool and returns JSON text content', async () => {
  const { body } = await rpc({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: { name: 'get_inspection_stats', arguments: { line_id: 'line-1' } },
  });
  const content = body.result.content[0];
  assert.equal(content.type, 'text');
  const data = JSON.parse(content.text);
  assert.equal(data.line_id, 'line-1');
  assert.equal(data.pass_rate, 92.1);
});

test('tools/call validates enum arguments', async () => {
  const { body } = await rpc({
    jsonrpc: '2.0',
    id: 4,
    method: 'tools/call',
    params: { name: 'control_inspection', arguments: { line_id: 'line-1', action: 'explode' } },
  });
  // Schema violation surfaces as a tool-level error, not a crash
  assert.ok(body.result?.isError || body.error);
});

test('GET /mcp is rejected in stateless mode', async () => {
  const res = await fetch(`${base}/mcp`, { headers: { Authorization: `Bearer ${AUTH}` } });
  assert.equal(res.status, 405);
});

test('allows all requests when auth is disabled', async () => {
  const openServer = createServer(createMcpApp());
  await new Promise<void>((resolve) => openServer.listen(0, resolve));
  const openBase = `http://localhost:${(openServer.address() as AddressInfo).port}`;
  try {
    const res = await fetch(`${openBase}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
      body: JSON.stringify(initialize),
    });
    assert.equal(res.status, 200);
  } finally {
    openServer.close();
  }
});
