import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRACTICE_CSV, PROPERTY_SCHEMA, audit, gradePractice, parseCsv, qualityScore, toCsv, validIsoDate, PLANTED, reportJson } from './csv.ts';

const table = (s: string) => { const t = parseCsv(s); assert.ok(!('error' in t)); return t as Exclude<ReturnType<typeof parseCsv>, { error: string }>; };

test('parser handles quotes, escaped quotes, commas and CRLF', () => {
  const t = table('a,b\r\n"x, y","he said ""hi"""\r\n1,2\r\n');
  assert.deepEqual(t.header, ['a', 'b']);
  assert.deepEqual(t.rows, [['x, y', 'he said "hi"'], ['1', '2']]);
  assert.deepEqual(t.lines, [2, 3]);
  assert.deepEqual(parseCsv('a\n"open'), { error: 'unclosedQuote' });
  assert.deepEqual(parseCsv('  \n'), { error: 'empty' });
});

test('round trip through toCsv keeps values', () => {
  const t = table('a,b\n"x, y","q""q"\n');
  assert.deepEqual(table(toCsv(t)).rows, t.rows);
});

test('calendar dates: 31 February and 14/06/2026 are rejected', () => {
  assert.equal(validIsoDate('2026-02-28'), true);
  assert.equal(validIsoDate('2024-02-29'), true);
  assert.equal(validIsoDate('2026-02-31'), false);
  assert.equal(validIsoDate('14/06/2026'), false);
});

test('practice file: every planted error is found, exactly once, with the right line', () => {
  const t = table(PRACTICE_CSV);
  const f = audit(t, PROPERTY_SCHEMA);
  assert.equal(f.length, PLANTED.length);
  for (const p of PLANTED) assert.equal(f.filter((x) => x.key === p.key && x.rule === p.rule).length, 1, p.id);
  const dup = f.find((x) => x.rule === 'duplicate')!;
  assert.equal(dup.line, 5);
  assert.equal(dup.other, 2);
  const conflict = f.find((x) => x.rule === 'conflict')!;
  assert.equal(conflict.column, 'price_gbp');
  assert.match(conflict.value, /land_registry: 455000 ≠ agent: 465000/);
  assert.equal(qualityScore(t, f), 33);
});

test('lab: deleting a broken record does not count as fixing it', () => {
  const lines = PRACTICE_CSV.trim().split('\n').filter((l) => !l.startsWith('P07'));
  const g = gradePractice(lines.join('\n'));
  assert.equal(g.checks.find((c) => c.id === 'not-number')!.ok, false);
  assert.equal(g.checks.find((c) => c.id === 'kept')!.ok, false);
});

test('lab: a correctly cleaned file passes every check', () => {
  const fixed = `id,address,postcode,sale_date,price_gbp,bedrooms,source
P01,12 Example Road,AB1 2CD,2026-03-14,325000,3,land_registry
P02,Flat 4 Sample Court,AB1 3EF,2026-04-02,198000,1,land_registry
P03,7 Demo Close,AB2 4GH,2026-02-27,410000,4,land_registry
P04,3 Test Lane,AB2 5XY,2026-05-09,287500,2,land_registry
P05,21 Mock Avenue,AB3 5JK,2026-02-28,352000,3,land_registry
P06,9 Pilot Street,AB3 6LM,2026-06-14,240000,2,land_registry
P07,15 Trial Gardens,AB4 7NP,2026-06-20,300000,3,land_registry
P08,2 Draft Mews,AB4 8QR,2026-07-01,615000,2,land_registry
P09,30 Proof Road,AB5 9ST,2026-07-18,299950,3,land_registry
P10,5 Check Way,AB5 1UV,2026-08-03,455000,4,land_registry
`;
  const g = gradePractice(fixed);
  assert.deepEqual(g.checks.filter((c) => !c.ok), []);
  assert.equal(g.findings.length, 0);
});

test('lab: the untouched file fails every check and grading is deterministic', () => {
  const a = gradePractice(PRACTICE_CSV);
  const b = gradePractice(PRACTICE_CSV);
  assert.deepEqual(a, b);
  assert.equal(a.checks.filter((c) => c.ok).length, 1); // only "kept": all ids are present
});

test('JSON report lists findings with line numbers and an honest note', () => {
  const t = table(PRACTICE_CSV);
  const r = JSON.parse(reportJson('practice.csv', t, audit(t, PROPERTY_SCHEMA), new Date('2026-11-23T00:00:00Z')));
  assert.equal(r.findings.length, 8);
  assert.equal(r.findings[0].line, 5);
  assert.match(r.note, /not that every value is true/);
});

test('missing required column is reported once for the whole file', () => {
  const t = table('id,address\nP1,x\n');
  const f = audit(t, PROPERTY_SCHEMA);
  assert.ok(f.filter((x) => x.rule === 'columns').length >= 4);
  assert.equal(qualityScore(t, f), 0);
});
