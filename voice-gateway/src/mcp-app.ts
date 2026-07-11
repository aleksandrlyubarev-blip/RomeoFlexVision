import express from 'express';
import type { Express, Request, Response } from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { executeTool } from './rfv-tools.js';

// ---------------------------------------------------------------------------
// Remote MCP app exposing the RFV/RoboQC tools over Streamable HTTP.
//
// Built for the xAI Voice Agent Builder "mcp" tool type: point the agent at
//   { "type": "mcp", "server_url": "https://<host>/mcp", "server_label": "roboqc" }
// and the four inspection tools become server-side tools — no client-side
// function-call plumbing needed. Any other MCP-capable client works too.
//
// Exported as a factory so tests can mount it on an ephemeral port;
// mcp-server.ts is the production entrypoint.
// ---------------------------------------------------------------------------

const LINE_ID = z
  .string()
  .describe('Production line ID (e.g. "line-1", "line-2") or "all" for aggregate.');
const WINDOW_MINUTES = z
  .number()
  .int()
  .positive()
  .optional()
  .describe('Lookback window in minutes. Default: 60.');

function buildServer(): McpServer {
  const server = new McpServer({ name: 'rfv-roboqc', version: '0.1.0' });

  const asText = (result: unknown) => ({
    content: [{ type: 'text' as const, text: JSON.stringify(result) }],
  });

  server.registerTool(
    'get_inspection_stats',
    {
      description:
        'Get current inspection statistics for a production line: pass rate, fail rate, defect count, and throughput per hour.',
      inputSchema: { line_id: LINE_ID, window_minutes: WINDOW_MINUTES },
    },
    async (args) => asText(await executeTool('get_inspection_stats', args)),
  );

  server.registerTool(
    'get_active_alerts',
    {
      description:
        'Get all active alerts and critical defect clusters. Returns severity, defect type, affected board count, and age.',
      inputSchema: {
        line_id: LINE_ID,
        severity: z
          .enum(['critical', 'warning', 'info', 'all'])
          .optional()
          .describe('Filter by severity level.'),
      },
    },
    async (args) => asText(await executeTool('get_active_alerts', args)),
  );

  server.registerTool(
    'get_defect_breakdown',
    {
      description:
        'Get a ranked breakdown of defect types by count and percentage for the given line and time window.',
      inputSchema: { line_id: LINE_ID, window_minutes: WINDOW_MINUTES },
    },
    async (args) => asText(await executeTool('get_defect_breakdown', args)),
  );

  server.registerTool(
    'control_inspection',
    {
      description:
        'Send a control command to an inspection session: start, pause, resume, or stop.',
      inputSchema: {
        line_id: LINE_ID,
        action: z
          .enum(['start', 'pause', 'resume', 'stop'])
          .describe('Control action to execute.'),
      },
    },
    async (args) => asText(await executeTool('control_inspection', args)),
  );

  return server;
}

// ---------------------------------------------------------------------------
// HTTP layer — stateless Streamable HTTP (one server+transport per request)
// ---------------------------------------------------------------------------

export interface McpAppOptions {
  /** Bearer token callers must present. Empty string disables auth (local dev). */
  authToken?: string;
}

export function createMcpApp(options: McpAppOptions = {}): Express {
  const authToken = options.authToken ?? '';

  const app = express();
  app.disable('x-powered-by');
  app.use(express.json());

  const isAuthorized = (req: Request): boolean => {
    if (!authToken) return true;
    return req.headers.authorization === `Bearer ${authToken}`;
  };

  app.get('/healthz', (_req: Request, res: Response) => {
    res.json({ ok: true, service: 'rfv-roboqc-mcp' });
  });

  app.post('/mcp', async (req: Request, res: Response) => {
    if (!isAuthorized(req)) {
      res.status(401).json({
        jsonrpc: '2.0',
        error: { code: -32001, message: 'Unauthorized' },
        id: null,
      });
      return;
    }

    const server = buildServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // stateless — no session tracking
    });
    res.on('close', () => {
      void transport.close();
      void server.close();
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (err) {
      console.error('[mcp-server] Request failed:', err instanceof Error ? err.message : err);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal server error' },
          id: null,
        });
      }
    }
  });

  // Stateless server: no SSE stream to resume, no session to delete
  const methodNotAllowed = (_req: Request, res: Response) => {
    res.status(405).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Method not allowed in stateless mode' },
      id: null,
    });
  };
  app.get('/mcp', methodNotAllowed);
  app.delete('/mcp', methodNotAllowed);

  return app;
}
