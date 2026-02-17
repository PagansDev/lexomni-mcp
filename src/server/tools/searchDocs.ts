import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { openDb } from '../../indexing/database.js';
import { getWorkspace } from '../workspaceResolver.js';
import { textContent } from './response.js';
import { ensureIndexUpToDate } from '../../indexing/ensureIndex.js';
import { SearchHitRow, DocumentRow, DocSource } from '../../types/document.js';
import {
  SNIPPET_CONTEXT,
  SEARCH_DEFAULT_LIMIT,
  SEARCH_MAX_LIMIT,
  SEARCH_CANDIDATE_MULTIPLIER,
} from '../../indexing/constants.js';

async function runSearch(
  ws: Awaited<ReturnType<typeof getWorkspace>>,
  query: string,
  lim: number,
  sources?: ('user' | 'agent' | 'books')[],
) {
  const db = await openDb(ws);
  const rows = db
    .prepare(
      `
      SELECT f.docId, f.chunkIndex, snippet(chunks_fts, 2, '[', ']', '…', ${SNIPPET_CONTEXT}) AS snippet
      FROM chunks_fts f
      WHERE chunks_fts MATCH ?
      LIMIT ?
    `,
    )
    .all(query, lim * SEARCH_CANDIDATE_MULTIPLIER) as SearchHitRow[];

  if (rows.length === 0) return [];

  const placeholders = rows.map(() => '?').join(',');
  const docRows = db
    .prepare(
      `SELECT docId, source, relPath FROM documents WHERE docId IN (${placeholders})`,
    )
    .all(...rows.map((r) => r.docId)) as Pick<DocumentRow, 'docId' | 'source' | 'relPath'>[];

  const docMap = new Map(docRows.map((d) => [d.docId, d]));

  return rows
    .map((r) => ({
      docId: r.docId,
      chunkIndex: r.chunkIndex,
      snippet: r.snippet,
      source: docMap.get(r.docId)?.source as DocSource | undefined,
      relPath: docMap.get(r.docId)?.relPath,
    }))
    .filter((h) => !sources?.length || (h.source && sources.includes(h.source)))
    .slice(0, lim);
}

export function searchDocsTool(server: McpServer) {
  server.registerTool(
    'lexomni_searchDocs',
    {
      description: 'Searches indexed documents by keyword (FTS).',
      inputSchema: {
        query: z.string().min(2),
        sources: z.array(z.enum(['user', 'agent', 'books'])).optional(),
        limit: z.number().int().min(1).max(SEARCH_MAX_LIMIT).optional(),
      },
    },
    async ({ query, sources, limit }) => {
      const ws = await getWorkspace(server);
      const lim = limit ?? SEARCH_DEFAULT_LIMIT;
      let hits = await runSearch(ws, query, lim, sources);

      if (hits.length === 0) {
        await ensureIndexUpToDate(ws, sources);
        hits = await runSearch(ws, query, lim, sources);
      }

      return textContent({ query, hits });
    },
  );
}
