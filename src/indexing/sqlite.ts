import Database from "better-sqlite3";
import path from "node:path";
import { LexomniWorkspace } from "../lexomni/workspace.js";

export function openDb(ws: LexomniWorkspace): Database.Database {
  const dbPath = path.join(ws.indexDir, "lexomni.sqlite");
  const db = new Database(dbPath);

  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      docId TEXT PRIMARY KEY,
      relPath TEXT NOT NULL,
      source TEXT NOT NULL,
      type TEXT NOT NULL,
      bytes INTEGER NOT NULL,
      mtimeMs INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chunks (
      docId TEXT NOT NULL,
      chunkIndex INTEGER NOT NULL,
      lineStart INTEGER,
      lineEnd INTEGER,
      text TEXT NOT NULL,
      PRIMARY KEY (docId, chunkIndex)
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
      docId,
      chunkIndex,
      text,
      tokenize = 'unicode61'
    );
  `);

  return db;
}
