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
