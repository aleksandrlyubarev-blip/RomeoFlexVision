import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import express from 'express';
import {
  createDataSource,
  HttpDataSource,
  MockDataSource,
} from '../src/data-source.js';

// ---------------------------------------------------------------------------
// Stub inspection API the HttpDataSource is exercised against
// ---------------------------------------------------------------------------

const seen: Array<{ method: string; url: string; auth?: string; body?: unknown }> = [];

const stub = express();
stub.use(express.json());
stub.use((req, _res, next) => {
  seen.push({ method: req.method, url: req.originalUrl, auth: req.headers.authorization, body: req.body });
  next();
});
stub.get('/v1/lines/broken/stats', (_req, res) => {
  res.status(503).json({ error: 'down' });
});
stub.get('/v1/lines/:lineId/stats', (req, res) => {
  res.json({ line_id: req.params.lineId, pass_rate: 88.8, source: 'http' });
});
stub.get('/v1/lines/:lineId/alerts', (req, res) => {
  res.json({ alerts: [], severity: req.query.severity });
});
stub.get('/v1/lines/:lineId/defects', (_req, res) => {
  res.json({ breakdown: [] });
});
stub.post('/v1/lines/:lineId/inspection', (req, res) => {
  res.json({ ok: true, action: req.body.action });
});

const server = createServer(stub);
await new Promise<void>((resolve) => server.listen(0, resolve));
const base = `http://localhost:${(server.address() as AddressInfo).port}`;

after(() => server.close());

// ---------------------------------------------------------------------------
// createDataSource env switch
// ---------------------------------------------------------------------------

test('createDataSource returns mock without RFV_API_BASE', () => {
  assert.ok(createDataSource({}) instanceof MockDataSource);
  assert.ok(createDataSource({ RFV_API_BASE: '  ' }) instanceof MockDataSource);
});

test('createDataSource returns HTTP source when RFV_API_BASE is set', () => {
  assert.ok(createDataSource({ RFV_API_BASE: base }) instanceof HttpDataSource);
});

// ---------------------------------------------------------------------------
// HttpDataSource behavior
// ---------------------------------------------------------------------------

test('HttpDataSource hits the stats endpoint with window and bearer token', async () => {
  const source = new HttpDataSource(`${base}/`, 'secret-token'); // trailing slash normalized
  const result = (await source.getInspectionStats('line-1', 30)) as Record<string, unknown>;

  assert.equal(result.source, 'http');
  const req = seen.at(-1);
  assert.equal(req?.url, '/v1/lines/line-1/stats?window_minutes=30');
  assert.equal(req?.auth, 'Bearer secret-token');
});

test('HttpDataSource omits Authorization header without a token', async () => {
  const source = new HttpDataSource(base);
  await source.getActiveAlerts('all', 'critical');

  const req = seen.at(-1);
  assert.equal(req?.url, '/v1/lines/all/alerts?severity=critical');
  assert.equal(req?.auth, undefined);
});

test('HttpDataSource posts control actions as JSON', async () => {
  const source = new HttpDataSource(base);
  const result = (await source.controlInspection('line-2', 'stop')) as Record<string, unknown>;

  assert.equal(result.action, 'stop');
  const req = seen.at(-1);
  assert.equal(req?.method, 'POST');
  assert.deepEqual(req?.body, { action: 'stop' });
});

test('HttpDataSource throws a descriptive error on non-2xx responses', async () => {
  const source = new HttpDataSource(base);
  await assert.rejects(
    () => source.getInspectionStats('broken', 60),
    /RFV API GET .*broken.* failed: 503/,
  );
});

test('executeTool routes through an injected data source', async () => {
  const { executeTool } = await import('../src/rfv-tools.js');
  const source = new HttpDataSource(base);
  const result = (await executeTool('get_inspection_stats', { line_id: 'line-1' }, source)) as Record<
    string,
    unknown
  >;
  assert.equal(result.source, 'http');
});
