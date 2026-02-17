import fs from "node:fs";
import path from "node:path";
import { LexomniWorkspace } from "../lexomni/workspace.js";

interface DatabaseStatement {
  run(...args: unknown[]): void;
  get(...args: unknown[]): unknown;
  all(...args: unknown[]): unknown[];
}

class SqlJsStatement implements DatabaseStatement {
  private sql: string;
  private db: any;

  constructor(db: any, sql: string) {
    this.db = db;
    this.sql = sql.replace(/@(\w+)/g, ":$1");
  }

  private convertArgsToParams(args: unknown[]): unknown[] | Record<string, unknown> {
    if (args.length === 1 && typeof args[0] === "object" && args[0] !== null && !Array.isArray(args[0])) {
      const obj = args[0] as Record<string, unknown>;
      const converted: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        converted[`:${key}`] = value;
      }
      return converted;
    }
    return args;
  }

  run(...args: unknown[]): void {
    const params = this.convertArgsToParams(args);
    this.db.run(this.sql, params);
  }

  get(...args: unknown[]): unknown {
    const stmt = this.db.prepare(this.sql);
    const params = Array.isArray(args) ? args : [args];
    
    try {
      stmt.bind(params);
      if (stmt.step()) {
        return stmt.getAsObject();
      }
      return undefined;
    } finally {
      stmt.free();
    }
  }

  all(...args: unknown[]): unknown[] {
    const stmt = this.db.prepare(this.sql);
    const params = Array.isArray(args) ? args : [args];
    const results: unknown[] = [];

    try {
      stmt.bind(params);
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      return results;
    } finally {
      stmt.free();
    }
  }
}

export interface Database {
  prepare(sql: string): DatabaseStatement;
  transaction<T>(fn: (items: T) => void): (items: T) => void;
}

class SqlJsDatabase implements Database {
  private db: any;
  private dbPath: string;

  private constructor(db: any, dbPath: string) {
    this.db = db;
    this.dbPath = dbPath;
  }

  static async create(ws: LexomniWorkspace): Promise<SqlJsDatabase> {
    const globalAny: any = globalThis as any;
    const originalFetch = globalAny.fetch;
    try {
      globalAny.fetch = undefined;
      const initSqlJs = (await import("sql.js-fts5")).default;
      const SQL = await initSqlJs();

      const dbPath = path.join(ws.indexDir, "lexomni.sqlite");
      let db: any;

      if (fs.existsSync(dbPath)) {
        const buffer = fs.readFileSync(dbPath);
        db = new SQL.Database(buffer);
      } else {
        db = new SQL.Database();
      }

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

      return new SqlJsDatabase(db, dbPath);
    } finally {
      globalAny.fetch = originalFetch;
    }
  }

  prepare(sql: string): DatabaseStatement {
    return new SqlJsStatement(this.db, sql);
  }

  transaction<T>(fn: (items: T) => void): (items: T) => void {
    return (items: T) => {
      try {
        this.db.run("BEGIN");
        fn(items);
        this.db.run("COMMIT");
        this.save();
      } catch (error) {
        this.db.run("ROLLBACK");
        throw error;
      }
    };
  }

  private save(): void {
    const data = this.db.export();
    fs.writeFileSync(this.dbPath, Buffer.from(data));
  }
}

export async function openDb(ws: LexomniWorkspace): Promise<Database> {
  return SqlJsDatabase.create(ws);
}
