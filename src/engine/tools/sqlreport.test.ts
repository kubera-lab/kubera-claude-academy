import { test } from 'node:test';
import assert from 'node:assert/strict';
import initSqlJs from 'sql.js';
import { makeRunner } from '../../runtime/sql.ts';
import { REPORT_TASKS, buildSqlFile, buildSqlMarkdown, explainSqlError, gradeReportTask } from './sqlreport.ts';

const SQL = await initSqlJs();
const run = makeRunner(SQL);

test('every reference query passes on both datasets', () => {
  for (const t of REPORT_TASKS) {
    const r = gradeReportTask(run, t, t.reference);
    assert.equal(r.outcome, 'passed', t.id);
    assert.ok(r.preview && r.preview.rows.length > 0, t.id);
  }
});

test('hard-coded answers fail on the hidden dataset', () => {
  const t = REPORT_TASKS.find((x) => x.id === 'r4')!;
  const typed = "SELECT 'Northfield' AS name, 3 AS homes UNION ALL SELECT 'Riverside', 2 UNION ALL SELECT 'Hillcrest', 1";
  const r = gradeReportTask(run, t, typed);
  assert.equal(r.items.find((i) => i.id === 'main')!.ok, true);
  assert.equal(r.items.find((i) => i.id === 'hidden')!.ok, false);
  assert.equal(r.outcome, 'failed');
});

test('the database is protected: writes and several statements are refused', () => {
  const t = REPORT_TASKS[0];
  for (const q of ['DELETE FROM homes', 'SELECT 1; DROP TABLE homes', 'UPDATE sales SET price = 0', 'PRAGMA table_info(homes)']) {
    const r = gradeReportTask(run, t, q);
    assert.deepEqual(r.items[0].reasons, ['g.sqlReadOnly'], q);
  }
});

test('ordered task: correct rows in the wrong order fail with an order message', () => {
  const t = REPORT_TASKS.find((x) => x.id === 'r5')!;
  const asc = t.reference.replace('DESC', 'ASC');
  const r = gradeReportTask(run, t, asc);
  assert.deepEqual(r.items[0].reasons, ['g.sqlOrder']);
});

test('SQL errors are explained in plain language', () => {
  const bad = gradeReportTask(run, REPORT_TASKS[0], 'SELECT adress FROM homes');
  assert.equal(explainSqlError(bad.error!).code, 'column');
  assert.match(explainSqlError(bad.error!).text.en, /no column called "adress"/);
  const amb = gradeReportTask(run, REPORT_TASKS[2], 'SELECT area_id FROM homes JOIN areas ON homes.area_id = areas.area_id');
  assert.equal(explainSqlError(amb.error!).code, 'ambiguous');
  assert.equal(explainSqlError('near "FORM": syntax error').code, 'syntax');
  assert.equal(explainSqlError('no such table: house').code, 'table');
  assert.equal(explainSqlError('something new').code, 'other');
});

test('exports contain the queries and the real results', () => {
  const when = new Date('2026-11-23T00:00:00Z');
  const entries = REPORT_TASKS.map((t) => {
    const g = gradeReportTask(run, t, t.reference);
    return { task: t, query: t.reference, passed: g.outcome === 'passed', result: g.preview };
  });
  const sql = buildSqlFile(entries, 'Area price report', when);
  assert.match(sql, /-- r5 · AGGREGATE · Average sale price by area · checked: passed/);
  assert.equal((sql.match(/;$/gm) ?? []).length, 5);
  const md = buildSqlMarkdown(entries, 'Area price report', 'Hillcrest is the most expensive area in this sample.', when);
  assert.match(md, /Checked: 5 of 5 queries passed/);
  assert.match(md, /\| Hillcrest \| 1 \| 560000 \|/);
  assert.match(md, /## Analyst note/);
});
