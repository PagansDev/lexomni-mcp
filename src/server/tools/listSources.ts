import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { buildManifest } from '../../lexomni/manifest.js';
import { getWorkspace } from '../workspaceResolver.js';

export function listSourcesTool(server: McpServer) {
  server.registerTool(
    'lexomni_listSources',
    {
      description:
        'Lists available MDs (user/agent) and PDFs (books) in the _lexomni workspace.',
      inputSchema: {},
    },
    async () => {
      const ws = await getWorkspace(server);
      const docs = buildManifest(ws);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { workspace: ws.root, count: docs.length, docs },
              null,
              2,
            ),
          },
        ],
      };
    },
  );
}
