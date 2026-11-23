// Real SQLite in the browser via sql.js (WebAssembly). Each run starts from a fresh in-memory database,
// so a learner's query can never change the practice data for the next run.
import type { SqlJsStatic } from 'sql.js';
import type { SqlResult, SqlRunner } from '../engine/grade.ts';

let ready: Promise<SqlJsStatic> | null = null;

export function loadSql(wasmUrl: string): Promise<SqlJsStatic> {
  ready ??= import('sql.js').then((m) => m.default({ locateFile: () => wasmUrl }));
  return ready;
}

export function makeRunner(SQL: SqlJsStatic): SqlRunner {
  return (setup: string, query: string): SqlResult | { error: string } => {
    const db = new SQL.Database();
    try {
      db.run(setup);
      const res = db.exec(query);
      if (!res.length) return { columns: [], rows: [] };
      const last = res[res.length - 1];
      return { columns: last.columns, rows: last.values as (string | number | null)[][] };
    } catch (e) {
      return { error: String((e as Error).message || e) };
    } finally {
      db.close();
    }
  };
}
