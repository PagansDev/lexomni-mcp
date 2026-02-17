import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import fs from 'node:fs';
import path from 'node:path';
import {
  assertSafeRelativePath,
  ensureInside,
} from '../../lexomni/security.js';
import { getWorkspace } from '../workspaceResolver.js';
import { textContent } from './response.js';

export function writeNoteTool(server: McpServer) {
  server.registerTool(
    'lexomni_writeNote',
    {
      description:
        'Creates/updates a markdown file in _lexomni/agent (agent memory).',
      inputSchema: {
        filename: z.string().min(1),
        content: z.string().min(1),
        mode: z.enum(['overwrite', 'append']).default('overwrite'),
      },
    },
    async ({ filename, content, mode }) => {
      const ws = await getWorkspace(server);
      assertSafeRelativePath(filename);

      const abs = path.join(ws.agentDir, filename);
      ensureInside(ws.agentDir, abs);

      if (mode === 'append') {
        fs.appendFileSync(
          abs,
          content.endsWith('\n') ? content : content + '\n',
          'utf-8',
        );
      } else {
        fs.writeFileSync(abs, content, 'utf-8');
      }

      const st = fs.statSync(abs);

      return textContent({ ok: true, path: abs, bytes: st.size, mtimeMs: st.mtimeMs });
    },
  );
}
