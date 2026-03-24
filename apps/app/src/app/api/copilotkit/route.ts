import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { LangGraphAgent } from "@copilotkit/runtime/langgraph";
import { NextRequest } from "next/server";

// Normalize Render's fromService hostport (bare host:port) into a full URL
const raw = process.env.LANGGRAPH_DEPLOYMENT_URL;
const deploymentUrl = !raw
  ? "http://localhost:8123"
  : raw.startsWith("http")
    ? raw
    : `http://${raw}`;

// 1. Define the agent connection to LangGraph
const defaultAgent = new LangGraphAgent({
  deploymentUrl,
  graphId: "sample_agent",
  langsmithApiKey: process.env.LANGSMITH_API_KEY || "",
});

// 3. Define the route and CopilotRuntime for the agent
export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    endpoint: "/api/copilotkit",
    serviceAdapter: new ExperimentalEmptyAdapter(),
    runtime: new CopilotRuntime({
      agents: { default: defaultAgent, },
      a2ui: { injectA2UITool: true },
      ...(process.env.MCP_SERVER_URL && {
        mcpApps: {
          servers: [{
            type: "http",
            url: process.env.MCP_SERVER_URL,
            serverId: "mcp_app",
          }],
        },
      }),
    }),
  });

  return handleRequest(req);
};
