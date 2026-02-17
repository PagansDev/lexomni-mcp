import { LexomniWorkspace } from '../lexomni/workspace.js';
import { DocInfo, DocSource } from '../types/document.js';
import { buildManifest } from '../lexomni/manifest.js';
import { buildIndex } from './indexer.js';

export async function ensureIndexUpToDate(
  ws: LexomniWorkspace,
  docsFilter?: DocSource[],
): Promise<DocInfo[]> {
  const allDocs = buildManifest(ws);
  const docs = docsFilter?.length ? allDocs.filter((d) => docsFilter.includes(d.source)) : allDocs;
  await buildIndex(ws, docs);
  return docs;
}
