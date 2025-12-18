import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerSearchTool } from "./search.js";
import { registerListTool } from "./list.js";
import { registerTrendingTool } from "./trending.js";
import { registerTopicsTool } from "./topics.js";

export function registerAllTools(server: McpServer) {
  registerSearchTool(server);
  registerListTool(server);
  registerTrendingTool(server);
  registerTopicsTool(server);
}
