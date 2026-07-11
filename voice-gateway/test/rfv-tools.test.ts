import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RFV_FUNCTION_DECLARATIONS, executeTool, toGrokFunctionTools } from '../src/rfv-tools.js';

test('toGrokFunctionTools converts all declarations to JSON Schema function tools', () => {
  const tools = toGrokFunctionTools();
  assert.equal(tools.length, RFV_FUNCTION_DECLARATIONS.length);

  for (const tool of tools) {
    assert.equal(tool.type, 'function');
    assert.equal(tool.parameters.type, 'object');
    assert.ok(Array.isArray(tool.parameters.required));
  }

  const alerts = tools.find((t) => t.name === 'get_active_alerts');
  assert.ok(alerts);
  const severity = alerts.parameters.properties.severity as Record<string, unknown>;
  assert.equal(severity.type, 'string'); // STRING → string
  assert.deepEqual(severity.enum, ['critical', 'warning', 'info', 'all']);
  assert.deepEqual(alerts.parameters.required, ['line_id']);

  const stats = tools.find((t) => t.name === 'get_inspection_stats');
  assert.ok(stats);
  const windowMinutes = stats.parameters.properties.window_minutes as Record<string, unknown>;
  assert.equal(windowMinutes.type, 'integer'); // INTEGER → integer
});

test('executeTool returns inspection stats with defaults applied', async () => {
  const result = (await executeTool('get_inspection_stats', { line_id: 'line-1' })) as Record<
    string,
    unknown
  >;
  assert.equal(result.line_id, 'line-1');
  assert.equal(result.window_minutes, 60);
  assert.equal(result.pass_rate, 92.1);
});

test('executeTool filters alerts by severity', async () => {
  const all = (await executeTool('get_active_alerts', { line_id: 'all' })) as {
    alerts: Array<{ severity: string }>;
    count: number;
  };
  assert.equal(all.count, 2);

  const critical = (await executeTool('get_active_alerts', {
    line_id: 'all',
    severity: 'critical',
  })) as { alerts: Array<{ severity: string }>; count: number };
  assert.equal(critical.count, 1);
  assert.equal(critical.alerts[0]?.severity, 'critical');
});

test('executeTool returns defect breakdown summing to total', async () => {
  const result = (await executeTool('get_defect_breakdown', { line_id: 'line-2' })) as {
    total_defects: number;
    breakdown: Array<{ count: number }>;
  };
  const sum = result.breakdown.reduce((acc, d) => acc + d.count, 0);
  assert.equal(sum, result.total_defects);
});

test('executeTool acknowledges control actions', async () => {
  const result = (await executeTool('control_inspection', {
    line_id: 'line-1',
    action: 'pause',
  })) as Record<string, unknown>;
  assert.equal(result.ok, true);
  assert.equal(result.action, 'pause');
});

test('executeTool reports unknown tools instead of throwing', async () => {
  const result = (await executeTool('does_not_exist', {})) as Record<string, unknown>;
  assert.match(String(result.error), /Unknown tool/);
});
