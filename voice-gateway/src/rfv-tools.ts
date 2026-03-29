import type { FunctionDeclaration } from './types.js';

export const RFV_FUNCTION_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'get_inspection_stats',
    description:
      'Get current inspection statistics for a production line: pass rate, fail rate, defect count, and throughput per hour.',
    parameters: {
      type: 'OBJECT',
      properties: {
        line_id: {
          type: 'STRING',
          description: 'Production line ID (e.g. "line-1", "line-2") or "all" for aggregate.',
        },
        window_minutes: {
          type: 'INTEGER',
          description: 'Lookback window in minutes. Default: 60.',
        },
      },
      required: ['line_id'],
    },
  },
  {
    name: 'get_active_alerts',
    description:
      'Get all active alerts and critical defect clusters. Returns severity, defect type, affected board count, and age.',
    parameters: {
      type: 'OBJECT',
      properties: {
        line_id: {
          type: 'STRING',
          description: 'Production line ID or "all".',
        },
        severity: {
          type: 'STRING',
          description: 'Filter by severity level.',
          enum: ['critical', 'warning', 'info', 'all'],
        },
      },
      required: ['line_id'],
    },
  },
  {
    name: 'get_defect_breakdown',
    description:
      'Get a ranked breakdown of defect types by count and percentage for the given line and time window.',
    parameters: {
      type: 'OBJECT',
      properties: {
        line_id: {
          type: 'STRING',
          description: 'Production line ID or "all".',
        },
        window_minutes: {
          type: 'INTEGER',
          description: 'Lookback window in minutes. Default: 60.',
        },
      },
      required: ['line_id'],
    },
  },
  {
    name: 'control_inspection',
    description:
      'Send a control command to an inspection session: start, pause, resume, or stop.',
    parameters: {
      type: 'OBJECT',
      properties: {
        line_id: {
          type: 'STRING',
          description: 'Production line ID to control.',
        },
        action: {
          type: 'STRING',
          description: 'Control action to execute.',
          enum: ['start', 'pause', 'resume', 'stop'],
        },
      },
      required: ['line_id', 'action'],
    },
  },
];

// ---------------------------------------------------------------------------
// Mock tool handlers — replace with real API/DB calls in production
// ---------------------------------------------------------------------------

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  // Simulate minimal I/O latency
  await new Promise<void>((resolve) => setTimeout(resolve, 8));

  switch (name) {
    case 'get_inspection_stats': {
      const lineId = String(args.line_id ?? 'all');
      const windowMin = Number(args.window_minutes ?? 60);
      return {
        line_id: lineId,
        window_minutes: windowMin,
        total_inspected: 1842,
        passed: 1697,
        failed: 145,
        pass_rate: 92.1,
        fail_rate: 7.9,
        throughput_per_hour: 1842,
        timestamp: new Date().toISOString(),
      };
    }

    case 'get_active_alerts': {
      const lineId = String(args.line_id ?? 'all');
      const severity = String(args.severity ?? 'all');
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

    case 'get_defect_breakdown': {
      const lineId = String(args.line_id ?? 'all');
      const windowMin = Number(args.window_minutes ?? 60);
      return {
        line_id: lineId,
        window_minutes: windowMin,
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

    case 'control_inspection': {
      const lineId = String(args.line_id ?? 'unknown');
      const action = String(args.action ?? 'unknown');
      return {
        ok: true,
        line_id: lineId,
        action,
        message: `Inspection ${action} acknowledged for ${lineId}`,
        timestamp: new Date().toISOString(),
      };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}
