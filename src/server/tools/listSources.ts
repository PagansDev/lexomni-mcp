import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { findWorkspace } from "../../lexomni/workspace.js";
import { buildManifest } from "../../lexomni/manifest.js";

export function listSourcesTool(server: McpServer) {
  server.registerTool(
    "lexomni_listSources",
    {
      description: "Lista MDs (user/agent) e PDFs (books) disponíveis no workspace _lexomni.",
      inputSchema: {}
    },
    async () => {
      const ws = findWorkspace();
      const docs = buildManifest(ws);

      return {
        content: [
          { type: "text", text: JSON.stringify({ workspace: ws.root, count: docs.length, docs }, null, 2) }
        ],
      };
    }
  );
}
