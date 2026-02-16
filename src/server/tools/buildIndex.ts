import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { buildManifest } from '../../lexomni/manifest.js';
import { buildIndex } from '../../indexing/indexer.js';
import { getWorkspace } from '../workspaceResolver.js';

export function buildIndexTool(server: McpServer) {
  server.registerTool(
    'lexomni_buildIndex',
    {
      description:
        'Generates/updates the SQLite FTS5 index from MDs and PDFs in _lexomni.',
      inputSchema: {
        sources: z.array(z.enum(['user', 'agent', 'books'])).optional(),
      },
    },
    async ({ sources }) => {
      const ws = await getWorkspace(server);
      let docs = buildManifest(ws);
      if (sources?.length)
        docs = docs.filter((d) => sources.includes(d.source));
      const result = await buildIndex(ws, docs);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ ok: true, ...result }, null, 2),
          },
        ],
      };
    },
  );
}
