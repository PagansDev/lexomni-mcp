import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { openDb } from '../../indexing/database.js';
import { getWorkspace } from '../workspaceResolver.js';
import { textContent } from './response.js';
import { ensureIndexUpToDate } from '../../indexing/ensureIndex.js';
import { READ_DOC_DEFAULT_MAX_CHARS, READ_DOC_MAX_CHARS } from '../../indexing/constants.js';
import { ChunkRow } from '../../types/document.js';

async function readChunk(ws: Awaited<ReturnType<typeof getWorkspace>>, docId: string, idx: number) {
  const db = await openDb(ws);
  return db
    .prepare(
      `SELECT docId, chunkIndex, lineStart, lineEnd, text FROM chunks WHERE docId = ? AND chunkIndex = ?`,
    )
    .get(docId, idx) as ChunkRow | undefined;
}

export function readDocTool(server: McpServer) {
  server.registerTool(
    'lexomni_readDoc',
    {
      description: 'Reads a chunk of an indexed document (by chunkIndex).',
      inputSchema: {
        docId: z.string().min(3),
        chunkIndex: z.number().int().min(0).optional(),
        maxChars: z.number().int().min(200).max(READ_DOC_MAX_CHARS).optional(),
      },
    },
    async ({ docId, chunkIndex, maxChars }) => {
      const ws = await getWorkspace(server);
      const idx = chunkIndex ?? 0;
      let row = await readChunk(ws, docId, idx);

      if (!row) {
        await ensureIndexUpToDate(ws);
        row = await readChunk(ws, docId, idx);
      }

      if (!row) {
        return textContent({ ok: false, error: 'Chunk not found.' });
      }

      const limit = maxChars ?? READ_DOC_DEFAULT_MAX_CHARS;
      const text = row.text.slice(0, limit);

      return textContent({
        ok: true,
        docId: row.docId,
        chunkIndex: row.chunkIndex,
        lineStart: row.lineStart ?? null,
        lineEnd: row.lineEnd ?? null,
        text,
      });
    },
  );
}
