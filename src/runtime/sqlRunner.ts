// One shared, lazily loaded SQLite runner for every SQL exercise and tool.
import type { SqlRunner } from '../engine/grade.ts';
import { loadSql, makeRunner } from './sql.ts';

let runnerPromise: Promise<SqlRunner> | null = null;
export const getRunner = () => (runnerPromise ??= loadSql(new URL('sql-wasm.wasm', document.baseURI).href).then(makeRunner));
