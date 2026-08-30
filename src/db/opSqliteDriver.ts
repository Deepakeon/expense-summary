import { open, DB, Scalar } from '@op-engineering/op-sqlite';
import { IDatabaseDriver, QueryResult } from './driver';

export class OpSqliteDriver implements IDatabaseDriver {
  private db: DB;

  constructor(dbName: string = 'expenseSummary.sqlite') {
    this.db = open({ name: dbName });
    this.db.executeSync('PRAGMA foreign_keys = ON;');
  }

  execute<T = any>(sql: string, params: any[] = []): QueryResult<T> {
    const result = this.db.executeSync(sql, params as Scalar[]);
    const rows = (result.rows ?? []) as T[];
    return {
      rows,
      insertId: result.insertId,
      rowsAffected: result.rowsAffected,
    };
  }

  executeBatch(statements: Array<{ sql: string; params?: any[] }>): void {
    this.db.executeSync('BEGIN TRANSACTION;');
    try {
      for (const stmt of statements) {
        this.db.executeSync(stmt.sql, (stmt.params ?? []) as Scalar[]);
      }
      this.db.executeSync('COMMIT;');
    } catch (e) {
      this.db.executeSync('ROLLBACK;');
      throw e;
    }
  }

  transaction(fn: (tx: IDatabaseDriver) => void): void {
    this.db.executeSync('BEGIN TRANSACTION;');
    try {
      fn(this);
      this.db.executeSync('COMMIT;');
    } catch (e) {
      this.db.executeSync('ROLLBACK;');
      throw e;
    }
  }

  close(): void {
    this.db.close();
  }
}

export function createOpSqliteDriver(dbName: string = 'expenseSummary.sqlite'): IDatabaseDriver {
  return new OpSqliteDriver(dbName);
}
