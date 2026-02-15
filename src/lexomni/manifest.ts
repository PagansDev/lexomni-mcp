import fs from "node:fs";
import path from "node:path";
import { LexomniWorkspace } from "./workspace.js";
import { DocInfo, DocSource, DocType } from "../types/document.js";

function listFiles(dir: string): string[] {
  const out: string[] = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...listFiles(full));
    else out.push(full);
  }
  return out;
}

function toDocInfo(ws: LexomniWorkspace, source: DocSource, type: DocType, absPath: string): DocInfo {
  const st = fs.statSync(absPath);
  const relPath = path.relative(ws.root, absPath).replaceAll("\\", "/");
  const docId = `${source}:${relPath}`;
  return { docId, source, type, path: absPath, relPath, bytes: st.size, mtimeMs: st.mtimeMs };
}

export function buildManifest(ws: LexomniWorkspace): DocInfo[] {
  const docs: DocInfo[] = [];

  for (const p of listFiles(ws.userDir)) {
    if (p.toLowerCase().endsWith(".md")) docs.push(toDocInfo(ws, "user", "md", p));
  }
  for (const p of listFiles(ws.agentDir)) {
    if (p.toLowerCase().endsWith(".md")) docs.push(toDocInfo(ws, "agent", "md", p));
  }
  for (const p of listFiles(ws.booksDir)) {
    if (p.toLowerCase().endsWith(".pdf")) docs.push(toDocInfo(ws, "books", "pdf", p));
  }

  return docs;
}
