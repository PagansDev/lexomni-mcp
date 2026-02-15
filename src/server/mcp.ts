import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { listSourcesTool } from "./tools/listSources.js";
import { buildIndexTool } from "./tools/buildIndex.js";
import { searchDocsTool } from "./tools/searchDocs.js";
import { readDocTool } from "./tools/readDoc.js";
import { writeNoteTool } from "./tools/writeNote.js";

export async function startMcp() {
  const server = new McpServer({ name: "lexomni-mcp", version: "0.1.0" });

  listSourcesTool(server);
  buildIndexTool(server);
  searchDocsTool(server);
  readDocTool(server);
  writeNoteTool(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
