import 'dotenv/config';
import { createMcpApp } from './mcp-app.js';

// Production entrypoint for the remote MCP server; the app itself lives in
// mcp-app.ts so tests can mount it on an ephemeral port.

const PORT = parseInt(process.env.MCP_PORT ?? '8766', 10);
const AUTH_TOKEN = process.env.MCP_AUTH_TOKEN?.trim() ?? '';

const app = createMcpApp({ authToken: AUTH_TOKEN });

app.listen(PORT, () => {
  console.log(`[mcp-server] RFV RoboQC MCP listening on port ${PORT} (POST /mcp)`);
  console.log(`[mcp-server] Auth: ${AUTH_TOKEN ? 'bearer token required' : 'disabled'}`);
});
