export type DocType = "md" | "pdf";
export type DocSource = "user" | "agent" | "books";

export type DocInfo = {
  docId: string;
  source: DocSource;
  type: DocType;
  path: string;
  relPath: string;
  bytes: number;
  mtimeMs: number;
};

export type ChunkRow = {
  docId: string;
  chunkIndex: number;
  lineStart: number | null;
  lineEnd: number | null;
  text: string;
};

export type DocumentRow = {
  docId: string;
  relPath: string;
  source: DocSource;
  type: DocType;
  bytes: number;
  mtimeMs: number;
};

export type SearchHitRow = {
  docId: string;
  chunkIndex: number;
  snippet: string;
};
