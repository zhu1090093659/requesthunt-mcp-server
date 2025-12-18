import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getTrending } from "../api.js";

export function registerTrendingTool(server: McpServer) {
  server.tool(
    "get_trending",
    "Get trending tags/topics based on recent feature request activity and vote counts.",
    {},
    async () => {
      try {
        const tags = await getTrending();

        if (tags.length === 0) {
          return {
            content: [{ type: "text", text: "No trending tags found." }],
          };
        }

        const formatted = tags.map((t, i) => 
          `${i + 1}. **${t.name}** - ${t.count} requests, ${t.totalVotes} total votes`
        ).join("\n");

        return {
          content: [{
            type: "text",
            text: `## Trending Tags\n\n${formatted}`,
          }],
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error fetching trending tags: ${error instanceof Error ? error.message : "Unknown error"}`,
          }],
          isError: true,
        };
      }
    }
  );
}
