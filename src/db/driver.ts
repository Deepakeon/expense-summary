export interface QueryResult<T = any> {
  rows: T[];
  insertId?: number;
  rowsAffected?: number;
}

export interface IDatabaseDriver {
  execute<T = any>(sql: string, params?: any[]): QueryResult<T>;
  executeBatch(statements: Array<{ sql: string; params?: any[] }>): void;
  transaction(fn: (tx: IDatabaseDriver) => void): void;
  close(): void;
}
