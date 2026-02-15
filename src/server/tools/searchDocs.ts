import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import { findWorkspace } from "../../lexomni/workspace.js";
import { openDb } from "../../indexing/sqlite.js";

export function searchDocsTool(server: McpServer) {
  server.registerTool(
    "lexomni.searchDocs",
    {
      description: "Busca por palavra-chave (FTS) nos documentos indexados.",
      inputSchema: {
        query: z.string().min(2),
        sources: z.array(z.enum(["user", "agent", "books"])).optional(),
        limit: z.number().int().min(1).max(50).optional()
      }
    },
    async ({ query, sources, limit }) => {
      const ws = findWorkspace();
      const db = openDb(ws);
      const lim = limit ?? 10;

      const rows = db
        .prepare(
          `
          SELECT f.docId, f.chunkIndex, snippet(chunks_fts, 2, '[', ']', '…', 16) AS snippet
          FROM chunks_fts f
          WHERE chunks_fts MATCH ?
          LIMIT ?
        `
        )
        .all(query, lim * 3);

      let hits = rows.map((r: any) => ({
        docId: r.docId,
        chunkIndex: r.chunkIndex,
        snippet: r.snippet,
      }));

      if (hits.length > 0) {
        const placeholders = hits.map(() => "?").join(",");
        const docRows = db
          .prepare(`SELECT docId, source, relPath FROM documents WHERE docId IN (${placeholders})`)
          .all(...hits.map((h) => h.docId));

        const map = new Map(docRows.map((d: any) => [d.docId, d]));
        hits = hits
          .map((h) => ({ ...h, source: map.get(h.docId)?.source, relPath: map.get(h.docId)?.relPath }))
          .filter((h) => !sources?.length || sources.includes(h.source));
      }

      hits = hits.slice(0, lim);

      return { content: [{ type: "text", text: JSON.stringify({ query, hits }, null, 2) }] };
    }
  );
}
