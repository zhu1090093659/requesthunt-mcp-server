import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { listRequests } from "../api.js";

export function registerListTool(server: McpServer) {
  server.tool(
    "list_requests",
    "List feature requests with optional filters. Use source='realtime' to trigger live scraping.",
    {
      topic: z.string().optional().describe("Filter by topic (e.g., 'Notion', 'VS Code', 'kanban')"),
      category: z.string().optional().describe("Filter by category slug (e.g., 'productivity', 'developer-tools')"),
      platform: z.enum(["x", "reddit", "github", "requesthunt"]).optional().describe("Filter by source platform"),
      limit: z.number().min(1).max(100).optional().default(20).describe("Maximum results (1-100)"),
      source: z.enum(["cached", "realtime"]).optional().default("cached").describe("Data source - 'realtime' triggers live scraping"),
      sortBy: z.enum(["new", "top"]).optional().default("new").describe("Sort order"),
    },
    async ({ topic, category, platform, limit, source, sortBy }) => {
      try {
        const result = await listRequests({
          topic,
          category,
          platform,
          limit,
          source,
          sortBy,
        });

        const requests = result.data;
        
        if (requests.length === 0) {
          let msg = "No feature requests found";
          if (topic) msg += ` for topic "${topic}"`;
          if (category) msg += ` in category "${category}"`;
          if (platform) msg += ` from ${platform}`;
          return {
            content: [{ type: "text", text: msg }],
          };
        }

        const formatted = requests.map((r, i) => 
          `${i + 1}. **${r.title}** (${r.votes} votes)\n` +
          `   Platform: ${r.sourcePlatform}${r.topic ? ` | Topic: ${r.topic}` : ""}\n` +
          `   ${r.description.slice(0, 200)}${r.description.length > 200 ? "..." : ""}\n` +
          (r.sourceUrl ? `   Source: ${r.sourceUrl}` : "")
        ).join("\n\n");

        let summary = `Found ${requests.length} feature request${requests.length === 1 ? "" : "s"}`;
        if (topic) summary += ` for "${topic}"`;
        if (result.meta.hasMore) summary += " (more available)";

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
            text: `Error listing requests: ${error instanceof Error ? error.message : "Unknown error"}`,
          }],
          isError: true,
        };
      }
    }
  );
}
