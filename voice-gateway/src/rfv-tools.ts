import { createDataSource } from './data-source.js';
import type { RfvDataSource } from './data-source.js';
import type { FunctionDeclaration, GrokFunctionTool, ParameterSchema } from './types.js';

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
// Grok realtime API uses standard JSON Schema (lowercase types) for function
// tools; convert the Gemini-style declarations so both providers share one
// tool definition.
// ---------------------------------------------------------------------------

const GEMINI_TO_JSON_SCHEMA_TYPE: Record<ParameterSchema['type'], string> = {
  STRING: 'string',
  INTEGER: 'integer',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  ARRAY: 'array',
  OBJECT: 'object',
};

function toJsonSchemaProperty(schema: ParameterSchema): Record<string, unknown> {
  const out: Record<string, unknown> = { type: GEMINI_TO_JSON_SCHEMA_TYPE[schema.type] };
  if (schema.description) out.description = schema.description;
  if (schema.enum) out.enum = schema.enum;
  if (schema.items) out.items = toJsonSchemaProperty(schema.items);
  return out;
}

export function toGrokFunctionTools(
  declarations: FunctionDeclaration[] = RFV_FUNCTION_DECLARATIONS,
): GrokFunctionTool[] {
  return declarations.map((decl) => ({
    type: 'function',
    name: decl.name,
    description: decl.description,
    parameters: {
      type: 'object',
      properties: Object.fromEntries(
        Object.entries(decl.parameters.properties).map(([key, value]) => [
          key,
          toJsonSchemaProperty(value),
        ]),
      ),
      required: decl.parameters.required ?? [],
    },
  }));
}

// ---------------------------------------------------------------------------
// Tool dispatch — delegates to the configured data source (mock by default,
// real inspection API when RFV_API_BASE is set; see data-source.ts)
// ---------------------------------------------------------------------------

const defaultSource = createDataSource();

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  source: RfvDataSource = defaultSource,
): Promise<unknown> {
  switch (name) {
    case 'get_inspection_stats':
      return source.getInspectionStats(String(args.line_id ?? 'all'), Number(args.window_minutes ?? 60));

    case 'get_active_alerts':
      return source.getActiveAlerts(String(args.line_id ?? 'all'), String(args.severity ?? 'all'));

    case 'get_defect_breakdown':
      return source.getDefectBreakdown(String(args.line_id ?? 'all'), Number(args.window_minutes ?? 60));

    case 'control_inspection':
      return source.controlInspection(String(args.line_id ?? 'unknown'), String(args.action ?? 'unknown'));

    default:
      return { error: `Unknown tool: ${name}` };
  }
}
