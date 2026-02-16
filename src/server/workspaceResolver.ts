import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { fileURLToPath } from 'node:url';
import { findWorkspace } from '../lexomni/workspace.js';
import type { LexomniWorkspace } from '../lexomni/workspace.js';

let cachedRoot: string | null = null;

function fileUriToPath(uri: string): string {
  if (!uri.startsWith('file://')) return uri;
  return fileURLToPath(uri);
}

export async function getWorkspace(
  server: McpServer,
): Promise<LexomniWorkspace> {
  if (cachedRoot) return findWorkspace(cachedRoot);

  try {
    const result = await server.server.listRoots();
    if (result?.roots?.length) {
      cachedRoot = fileUriToPath(result.roots[0].uri);
      return findWorkspace(cachedRoot);
    }
  } catch {
    // client may not support roots
  }

  cachedRoot = process.cwd();
  return findWorkspace(cachedRoot);
}

export function clearWorkspaceCache(): void {
  cachedRoot = null;
}
