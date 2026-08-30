import Database from 'better-sqlite3';
import { IDatabaseDriver, QueryResult } from './driver';

export class NodeSqliteDriver implements IDatabaseDriver {
  private db: Database.Database;

  constructor(filePath: string = ':memory:') {
    this.db = new Database(filePath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
  }

  execute<T = any>(sql: string, params: any[] = []): QueryResult<T> {
    const trimmed = sql.trim();
    const isSelect = /^(SELECT|PRAGMA)/i.test(trimmed);

    if (isSelect) {
      const stmt = this.db.prepare(sql);
      const rows = stmt.all(...params) as T[];
      return { rows, rowsAffected: rows.length };
    } else {
      const stmt = this.db.prepare(sql);
      const info = stmt.run(...params);
      return {
        rows: [],
        insertId: Number(info.lastInsertRowid),
        rowsAffected: info.changes,
      };
    }
  }

  executeBatch(statements: Array<{ sql: string; params?: any[] }>): void {
    const tx = this.db.transaction(() => {
      for (const { sql, params = [] } of statements) {
        this.db.prepare(sql).run(...params);
      }
    });
    tx();
  }

  transaction(fn: (tx: IDatabaseDriver) => void): void {
    const tx = this.db.transaction(() => {
      fn(this);
    });
    tx();
  }

  close(): void {
    this.db.close();
  }
}

export function createNodeSqliteDriver(filePath: string = ':memory:'): IDatabaseDriver {
  return new NodeSqliteDriver(filePath);
}
