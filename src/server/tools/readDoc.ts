import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { openDb } from '../../indexing/database.js';
import { buildIndex } from '../../indexing/indexer.js';
import { buildManifest } from '../../lexomni/manifest.js';
import { getWorkspace } from '../workspaceResolver.js';

async function readChunk(ws: Awaited<ReturnType<typeof getWorkspace>>, docId: string, idx: number) {
  const db = await openDb(ws);
  return db
    .prepare(
      `SELECT docId, chunkIndex, lineStart, lineEnd, text FROM chunks WHERE docId = ? AND chunkIndex = ?`,
    )
    .get(docId, idx);
}

export function readDocTool(server: McpServer) {
  server.registerTool(
    'lexomni_readDoc',
    {
      description: 'Reads a chunk of an indexed document (by chunkIndex).',
      inputSchema: {
        docId: z.string().min(3),
        chunkIndex: z.number().int().min(0).optional(),
        maxChars: z.number().int().min(200).max(20000).optional(),
      },
    },
    async ({ docId, chunkIndex, maxChars }) => {
      const ws = await getWorkspace(server);
      const idx = chunkIndex ?? 0;
      let row = await readChunk(ws, docId, idx);

      if (!row) {
        await buildIndex(ws, buildManifest(ws));
        row = await readChunk(ws, docId, idx);
      }

      if (!row) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                ok: false,
                error: 'Chunk não encontrado.',
              }),
            },
          ],
        };
      }

      const limit = maxChars ?? 8000;
      const text = String((row as any).text).slice(0, limit);

      return {
        content: [
          {
            type: 'text',
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
              2,
            ),
          },
        ],
      };
    },
  );
}
