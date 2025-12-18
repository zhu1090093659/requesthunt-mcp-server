#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerAllTools } from "./tools/index.js";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pkg = require("../package.json");

const server = new McpServer({
  name: "requesthunt",
  version: pkg.version,
});

registerAllTools(server);

const transport = new StdioServerTransport();
await server.connect(transport);
