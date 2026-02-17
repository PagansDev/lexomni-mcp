import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { openDb } from '../../indexing/database.js';
import { buildIndex } from '../../indexing/indexer.js';
import { buildManifest } from '../../lexomni/manifest.js';
import { getWorkspace } from '../workspaceResolver.js';

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
      SELECT f.docId, f.chunkIndex, snippet(chunks_fts, 2, '[', ']', '…', 16) AS snippet
      FROM chunks_fts f
      WHERE chunks_fts MATCH ?
      LIMIT ?
    `,
    )
    .all(query, lim * 3);

  let hits = rows.map((r: any) => ({
    docId: r.docId,
    chunkIndex: r.chunkIndex,
    snippet: r.snippet,
  }));

  if (hits.length > 0) {
    const placeholders = hits.map(() => '?').join(',');
    const docRows = db
      .prepare(
        `SELECT docId, source, relPath FROM documents WHERE docId IN (${placeholders})`,
      )
      .all(...hits.map((h: { docId: string }) => h.docId));

    const map = new Map(docRows.map((d: any) => [d.docId, d]));
    hits = hits
      .map((h) => ({
        ...h,
        source: map.get(h.docId)?.source,
        relPath: map.get(h.docId)?.relPath,
      }))
      .filter((h) => !sources?.length || sources.includes(h.source));
  }

  return hits.slice(0, lim);
}

export function searchDocsTool(server: McpServer) {
  server.registerTool(
    'lexomni_searchDocs',
    {
      description: 'Searches indexed documents by keyword (FTS).',
      inputSchema: {
        query: z.string().min(2),
        sources: z.array(z.enum(['user', 'agent', 'books'])).optional(),
        limit: z.number().int().min(1).max(50).optional(),
      },
    },
    async ({ query, sources, limit }) => {
      const ws = await getWorkspace(server);
      const lim = limit ?? 10;
      let hits = await runSearch(ws, query, lim, sources);

      if (hits.length === 0) {
        const docs = sources?.length
          ? buildManifest(ws).filter((d) => sources.includes(d.source))
          : buildManifest(ws);
        await buildIndex(ws, docs);
        hits = await runSearch(ws, query, lim, sources);
      }

      return {
        content: [
          { type: 'text', text: JSON.stringify({ query, hits }, null, 2) },
        ],
      };
    },
  );
}
