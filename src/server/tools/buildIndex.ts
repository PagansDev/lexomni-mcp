import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import { findWorkspace } from "../../lexomni/workspace.js";
import { buildManifest } from "../../lexomni/manifest.js";
import { buildIndex } from "../../indexing/indexer.js";

export function buildIndexTool(server: McpServer) {
  server.registerTool(
    "lexomni_buildIndex",
    {
      description: "Gera/atualiza o índice SQLite FTS5 a partir de MDs e PDFs no _lexomni.",
      inputSchema: {
        sources: z.array(z.enum(["user", "agent", "books"])).optional()
      }
    },
    async ({ sources }) => {
      const ws = findWorkspace();
      let docs = buildManifest(ws);
      if (sources?.length) docs = docs.filter((d) => sources.includes(d.source));
      const result = await buildIndex(ws, docs);
      return { content: [{ type: "text", text: JSON.stringify({ ok: true, ...result }, null, 2) }] };
    }
  );
}
