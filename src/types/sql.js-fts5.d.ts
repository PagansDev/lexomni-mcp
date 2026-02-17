declare module "sql.js-fts5" {
  const initSqlJs: (config?: unknown) => Promise<SqlJsStatic>;
  export default initSqlJs;
}

interface SqlJsStatic {
  Database: {
    new (data?: ArrayLike<number> | Buffer): SqlJsDatabase;
  };
}

interface SqlJsDatabase {
  run(sql: string, params?: unknown[] | Record<string, unknown>): void;
  exec(sql: string): void;
  prepare(sql: string): SqlJsStatement;
  export(): Uint8Array;
}

interface SqlJsStatement {
  bind(values: unknown[] | Record<string, unknown>): boolean;
  step(): boolean;
  getAsObject(): Record<string, unknown>;
  free(): void;
}
