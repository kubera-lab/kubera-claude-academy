import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MODULES, SPOT_ITEMS, TEMPLATES, RIVERSIDE, RIVERSIDE_TESTS } from './course.ts';
import { buildExport } from '../engine/export.ts';
import { en } from '../i18n/en.ts';
import { lintInstructions } from '../engine/lint.ts';

test('five modules, each with objectives, lesson, quiz and practice', () => {
  assert.equal(MODULES.length, 5);
  for (const m of MODULES) {
    assert.ok(m.objectives.length >= 3, m.id);
    assert.ok(m.lesson.length >= 3, m.id);
    assert.ok(m.quiz.length >= 3, m.id);
    for (const q of m.quiz) assert.ok(q.correct >= 0 && q.correct < q.options.length, q.id);
  }
});

test('quiz ids are unique', () => {
  const ids = MODULES.flatMap((m) => m.quiz.map((q) => q.id));
  assert.equal(new Set(ids).size, ids.length);
});

test('spot items cover all three labels', () => {
  assert.deepEqual([...new Set(SPOT_ITEMS.map((s) => s.correct))].sort(), ['correct', 'invented', 'refusal']);
});

test('templates parse', () => {
  assert.equal(TEMPLATES.filter((t) => t.facts).every((t) => t.facts.split('\n').length >= 4), true);
});

test('every engine i18n key used by the linter exists', () => {
  const checks = lintInstructions('x', { placeTerms: ['x'] });
  for (const c of checks) {
    assert.ok(en[c.label], c.label);
    assert.ok(en[c.fix], c.fix);
  }
  for (const k of ['lint.fix.contradictGuess', 'lint.fix.contradictOutside', 'lint.fix.contradictUnknown', 'lint.fix.contradictLength']) assert.ok(en[k], k);
});

test('export contains four files and honest evidence', () => {
  const files = buildExport({ config: RIVERSIDE, subject: 'Riverside Community Centre', tests: RIVERSIDE_TESTS, pasted: {}, modelName: '' }, { score: 17, total: 17 }, new Date('2026-11-16T12:00:00Z'));
  assert.deepEqual(files.map((f) => f.name), ['README.md', 'assistant.json', 'tests.json', 'TEST_REPORT.md']);
  const readme = files[0].content;
  assert.match(readme, /7 of 7 passed/);
  assert.match(readme, /Control tests \(fixed by the course, not editable\): 11 of 11 passed/);
  assert.match(readme, /Not tested with a real AI model/);
  assert.match(readme, /not\*\* a language model/);
  assert.doesNotMatch(readme, /certified|guarantee/i);
  JSON.parse(files[1].content);
  JSON.parse(files[2].content);
});
