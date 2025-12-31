#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { registerAllTools } from "./tools/index.js";
import { registerAllPrompts } from "./prompts/index.js";
import { registerAllResources } from "./resources/index.js";
import { createRequire } from "module";
import http from "http";

const require = createRequire(import.meta.url);
const pkg = require("../package.json");

const PORT = process.env.PORT || 8080;

// Store active transports for message routing
const transports = new Map<string, SSEServerTransport>();

const httpServer = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check endpoint
  if (req.url === "/" || req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", name: "requesthunt-mcp-server", version: pkg.version }));
    return;
  }

  // SSE endpoint for establishing connection
  if (req.url === "/sse" && req.method === "GET") {
    const server = new McpServer({
      name: "requesthunt",
      version: pkg.version,
    });

    registerAllTools(server);
    registerAllPrompts(server);
    registerAllResources(server);

    const transport = new SSEServerTransport("/message", res);
    transports.set(transport.sessionId, transport);

    res.on("close", () => {
      transports.delete(transport.sessionId);
    });

    await server.connect(transport);
    return;
  }

  // Message endpoint for client requests
  if (req.url?.startsWith("/message") && req.method === "POST") {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const sessionId = url.searchParams.get("sessionId");

    if (!sessionId || !transports.has(sessionId)) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid or missing sessionId" }));
      return;
    }

    const transport = transports.get(sessionId)!;

    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      try {
        await transport.handlePostMessage(req, res, body);
      } catch (error) {
        console.error("Error handling message:", error);
        if (!res.headersSent) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Internal server error" }));
        }
      }
    });
    return;
  }

  // 404 for unknown routes
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

httpServer.listen(PORT, () => {
  console.log(`RequestHunt MCP Server running on port ${PORT}`);
  console.log(`SSE endpoint: http://localhost:${PORT}/sse`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
