import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createMcpServer } from "./server.js";

const PORT = Number(process.env.MCP_PORT) || 3100;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(",") || ["*"];

const server = createMcpServer();
const sessions = new Map<string, WebStandardStreamableHTTPServerTransport>();

const app = new Hono();

app.use(
  "*",
  cors({
    origin:
      ALLOWED_ORIGINS.length === 1 && ALLOWED_ORIGINS[0] === "*"
        ? "*"
        : ALLOWED_ORIGINS,
    allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowHeaders: [
      "Content-Type",
      "mcp-session-id",
      "Last-Event-ID",
      "mcp-protocol-version",
    ],
    exposeHeaders: ["mcp-session-id", "mcp-protocol-version"],
  })
);

app.get("/health", (c) => c.json({ status: "ok" }));

app.all("/mcp", async (c) => {
  const sessionId = c.req.header("mcp-session-id");

  if (sessionId && sessions.has(sessionId)) {
    return sessions.get(sessionId)!.handleRequest(c.req.raw);
  }

  const transport = new WebStandardStreamableHTTPServerTransport();
  await server.connect(transport);

  const response = await transport.handleRequest(c.req.raw);

  const newSessionId = response.headers.get("mcp-session-id");
  if (newSessionId) {
    sessions.set(newSessionId, transport);
    transport.onclose = () => {
      sessions.delete(newSessionId);
    };
  }

  return response;
});

serve({ fetch: app.fetch, port: PORT });
console.log(`MCP server running on http://localhost:${PORT}/mcp`);
