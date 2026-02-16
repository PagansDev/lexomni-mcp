import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import { findWorkspace } from "../../lexomni/workspace.js";
import { openDb } from "../../indexing/sqlite.js";

export function readDocTool(server: McpServer) {
  server.registerTool(
    "lexomni_readDoc",
    {
      description: "Lê um trecho de um documento indexado (por chunkIndex).",
      inputSchema: {
        docId: z.string().min(3),
        chunkIndex: z.number().int().min(0).optional(),
        maxChars: z.number().int().min(200).max(20000).optional()
      }
    },
    async ({ docId, chunkIndex, maxChars }) => {
      const ws = findWorkspace();
      const db = openDb(ws);

      const idx = chunkIndex ?? 0;
      const row = db
        .prepare(`SELECT docId, chunkIndex, lineStart, lineEnd, text FROM chunks WHERE docId = ? AND chunkIndex = ?`)
        .get(docId, idx);

      if (!row) {
        return { content: [{ type: "text", text: JSON.stringify({ ok: false, error: "Chunk não encontrado." }) }] };
      }

      const limit = maxChars ?? 8000;
      const text = String((row as any).text).slice(0, limit);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                ok: true,
                docId: (row as any).docId,
                chunkIndex: (row as any).chunkIndex,
                lineStart: (row as any).lineStart ?? null,
                lineEnd: (row as any).lineEnd ?? null,
                text,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );
}
