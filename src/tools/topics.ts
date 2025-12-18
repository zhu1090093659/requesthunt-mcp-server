import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getTopics } from "../api.js";

export function registerTopicsTool(server: McpServer) {
  server.tool(
    "get_topics",
    "List available topics organized by category. Use these topics to filter feature requests.",
    {},
    async () => {
      try {
        const categories = await getTopics();

        if (categories.length === 0) {
          return {
            content: [{ type: "text", text: "No topics found." }],
          };
        }

        const formatted = categories.map(cat => 
          `### ${cat.name}\n` +
          cat.topics.map(t => `- ${t}`).join("\n")
        ).join("\n\n");

        return {
          content: [{
            type: "text",
            text: `## Available Topics\n\nUse these with list_requests or search_requests.\n\n${formatted}`,
          }],
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error fetching topics: ${error instanceof Error ? error.message : "Unknown error"}`,
          }],
          isError: true,
        };
      }
    }
  );
}
