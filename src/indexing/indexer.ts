import { DocInfo } from "../types/document.js";
import { LexomniWorkspace } from "../lexomni/workspace.js";
import { openDb } from "./sqlite.js";
import { readMarkdownText } from "../parsers/md.js";
import { readPdfText } from "../parsers/pdf.js";
import { chunkMarkdownByLines, chunkTextByChars } from "./chunking.js";

export async function buildIndex(ws: LexomniWorkspace, docs: DocInfo[]) {
  const db = openDb(ws);

  const upsertDoc = db.prepare(`
    INSERT INTO documents (docId, relPath, source, type, bytes, mtimeMs)
    VALUES (@docId, @relPath, @source, @type, @bytes, @mtimeMs)
    ON CONFLICT(docId) DO UPDATE SET
      relPath=excluded.relPath,
      source=excluded.source,
      type=excluded.type,
      bytes=excluded.bytes,
      mtimeMs=excluded.mtimeMs
  `);

  const deleteChunks = db.prepare(`DELETE FROM chunks WHERE docId = ?`);
  const deleteFts = db.prepare(`DELETE FROM chunks_fts WHERE docId = ?`);

  const insertChunk = db.prepare(`
    INSERT INTO chunks (docId, chunkIndex, lineStart, lineEnd, text)
    VALUES (@docId, @chunkIndex, @lineStart, @lineEnd, @text)
  `);

  const insertFts = db.prepare(`
    INSERT INTO chunks_fts (docId, chunkIndex, text)
    VALUES (@docId, @chunkIndex, @text)
  `);

  const tx = db.transaction((items: { doc: DocInfo; chunks: any[] }[]) => {
    for (const it of items) {
      upsertDoc.run(it.doc);
      deleteChunks.run(it.doc.docId);
      deleteFts.run(it.doc.docId);

      for (const ch of it.chunks) {
        insertChunk.run({
          ...ch,
          lineStart: ch.lineStart ?? null,
          lineEnd: ch.lineEnd ?? null,
        });
        insertFts.run({ docId: it.doc.docId, chunkIndex: ch.chunkIndex, text: ch.text });
      }
    }
  });

  const prepared: { doc: DocInfo; chunks: any[] }[] = [];

  for (const doc of docs) {
    if (doc.type === "md") {
      const text = readMarkdownText(doc.path);
      const chunks = chunkMarkdownByLines(text, 200).map((c) => ({ docId: doc.docId, ...c }));
      prepared.push({ doc, chunks });
    } else {
      const text = await readPdfText(doc.path);
      const chunks = chunkTextByChars(text, 6000).map((c) => ({ docId: doc.docId, ...c }));
      prepared.push({ doc, chunks });
    }
  }

  tx(prepared);

  return { docsIndexed: docs.length };
}
