import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { searchRequests } from "../api.js";

export function registerSearchTool(server: McpServer) {
  server.tool(
    "search_requests",
    "Search feature requests from Reddit, X, and GitHub. Use expand=true to enable AI topic expansion and realtime scraping for better results.",
    {
      query: z.string().describe("Search query (e.g., 'dark mode', 'offline support')"),
      limit: z.number().min(1).max(100).optional().default(20).describe("Maximum results to return (1-100)"),
      expand: z.boolean().optional().default(false).describe("Enable AI topic expansion + realtime scraping when cached results are insufficient"),
      platforms: z.array(z.enum(["reddit", "x", "github"])).optional().describe("Platforms to search (only used when expand=true)"),
    },
    async ({ query, limit, expand, platforms }) => {
      try {
        const result = await searchRequests({
          query,
          limit,
          expand,
          platforms,
        });

        const requests = result.data.results;
        
        if (requests.length === 0) {
          return {
            content: [{
              type: "text",
              text: `No feature requests found for "${query}".${expand ? "" : " Try setting expand=true to search in realtime."}`,
            }],
          };
        }

        const formatted = requests.map((r, i) => 
          `${i + 1}. **${r.title}** (${r.votes} votes)\n` +
          `   Platform: ${r.sourcePlatform}${r.topic ? ` | Topic: ${r.topic}` : ""}\n` +
          `   ${r.description.slice(0, 200)}${r.description.length > 200 ? "..." : ""}\n` +
          (r.sourceUrl ? `   Source: ${r.sourceUrl}` : "")
        ).join("\n\n");

        let summary = `Found ${requests.length} feature request${requests.length === 1 ? "" : "s"} for "${query}"`;
        
        if (result.meta.expanded) {
          summary += `\n\nAI expanded to topics: ${result.meta.expandedTopics?.join(", ")}`;
          if (result.meta.newResultsFound) {
            summary += `\nNew results found via realtime scraping: ${result.meta.newResultsFound}`;
          }
        }

        return {
          content: [{
            type: "text",
            text: `${summary}\n\n${formatted}`,
          }],
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error searching requests: ${error instanceof Error ? error.message : "Unknown error"}`,
          }],
          isError: true,
        };
      }
    }
  );
}
