// Integration tests for the v1.0 academy: content integrity, real execution of every lab solution,
// negative tests (wrong answers must fail), anti-cheating, stale passes, translations and export.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import initSqlJs from 'sql.js';
import { COURSES, ALL_LESSONS, searchContent } from '../content/catalog.ts';
import { CONTENT_VERSION } from '../content/types.ts';
import { evaluateCode, gradeChoice, gradeClassify, gradeCodeRuns, gradeOrder, gradeSql, gradeManual, evidenceIssues, hashOf } from '../engine/grade.ts';
import { makeRunner } from '../runtime/sql.ts';
import { lintInstructions, lintPassed } from '../engine/lint.ts';
import { subjectTerms } from '../engine/project.ts';
import { initialState, lessonPassed, lessonStale, parseSaved, withHistory } from '../state.ts';
import { buildPortfolio } from '../engine/portfolio.ts';
import { missingTranslations } from '../i18n/index.ts';
import { en } from '../i18n/en.ts';
import { modulesFor } from './course.ru.ts';
import { MODULES } from './course.ts';

const lessonsOf = (kind: string) => ALL_LESSONS.filter((l) => l.exercise.kind === kind);

test('catalogue: 8 courses; each generic course has lessons, a warm-up, a lab and a final tool', () => {
  assert.equal(COURSES.length, 8);
  assert.deepEqual(COURSES.map((c) => c.n), [1, 2, 3, 4, 5, 6, 7, 8]);
  for (const c of COURSES.filter((x) => !x.legacy)) {
    const tools = c.lessons.filter((l) => l.exercise.kind === 'tool');
    const warm = c.lessons.filter((l) => l.exercise.kind === 'choice' && l.exercise.warmup);
    assert.equal(warm.length, 1, c.id + ' has one warm-up');
    const iw = c.lessons.indexOf(warm[0]);
    const firstLab = c.lessons.findIndex((l) => l.lab);
    assert.ok(iw >= 0 && iw < firstLab, c.id + ' warm-up comes before the lab');
    assert.equal(c.lessons.length, 6, c.id);
    assert.equal(tools.length, 1, c.id + ' has a final tool');
    assert.equal(c.lessons[c.lessons.length - 1].exercise.kind, 'tool', c.id + ' final tool is last');
  }
  assert.deepEqual(COURSES.filter((c) => !c.legacy).map((c) => { const e = c.lessons[c.lessons.length - 1].exercise; return e.kind === 'tool' ? e.tool : ''; }), ['safety', 'abtest', 'trace', 'csv', 'sqlreport', 'geojson', 'web']);
  assert.equal(ALL_LESSONS.length, 42);
  assert.equal(new Set(ALL_LESSONS.map((l) => l.id)).size, 42, 'lesson ids unique');
  assert.equal(CONTENT_VERSION, '1.1.0');
});

test('every course has a bilingual glossary for beginners', () => {
  for (const c of COURSES) {
    assert.ok((c.glossary?.length ?? 0) >= 4, c.id + ' glossary');
    for (const g of c.glossary!) assert.ok(g.term.en && g.term.ru && g.def.en && g.def.ru, c.id + ' ' + g.term.en);
  }
});

test('every lesson has an explanation, example, verified sources and both languages', () => {
  for (const l of ALL_LESSONS) {
    assert.ok(l.explain.length >= 2, l.id + ' explanation');
    for (const x of [l.title, l.example, ...l.explain]) {
      assert.ok(x.en.trim() && x.ru.trim(), l.id + ' missing translation');
    }
    assert.ok(l.sources.length >= 1, l.id + ' sources');
    for (const s of l.sources) {
      assert.match(s.url, /^https:\/\//);
      assert.equal(s.checked, '2026-11-16');
      assert.ok(s.license.length > 2);
    }
  }
});

test('exercise definitions are consistent', () => {
  for (const l of ALL_LESSONS) {
    const ex = l.exercise;
    if (ex.kind === 'choice') for (const q of ex.questions) assert.ok(q.correct >= 0 && q.correct < q.options.length, q.id);
    if (ex.kind === 'classify') {
      const ids = new Set(ex.labels.map((x) => x.id));
      for (const it of ex.items) assert.ok(ids.has(it.correct), l.id + ' ' + it.id);
      // a learner who picks the same label everywhere must not pass
      for (const lb of ex.labels) {
        const r = gradeClassify(ex.items, { labels: Object.fromEntries(ex.items.map((i) => [i.id, lb.id])), evidence: {} });
        assert.equal(r.outcome, 'failed', `${l.id}: all "${lb.id}" must fail`);
      }
    }
    if (ex.kind === 'order') {
      assert.deepEqual([...ex.correct].sort(), ex.steps.map((s) => s.id).sort());
      assert.equal(gradeOrder(ex.correct, ex.steps.map((s) => s.id)).outcome, 'failed', 'the shown order must not already be correct');
    }
  }
});

test('choice: all correct passes, any wrong fails, missing fails', () => {
  for (const l of lessonsOf('choice')) {
    const ex = l.exercise as Extract<typeof l.exercise, { kind: 'choice' }>;
    const right = Object.fromEntries(ex.questions.map((q) => [q.id, q.correct]));
    assert.equal(gradeChoice(ex.questions, right).outcome, 'passed');
    const wrong = { ...right, [ex.questions[0].id]: (ex.questions[0].correct + 1) % ex.questions[0].options.length };
    assert.equal(gradeChoice(ex.questions, wrong).outcome, 'failed');
    const { [ex.questions[0].id]: _drop, ...missing } = right;
    assert.equal(gradeChoice(ex.questions, missing).items[0].reasons[0], 'g.missing');
  }
});

test('code labs: every reference solution passes all tests when really executed', () => {
  for (const l of lessonsOf('code')) {
    const ex = l.exercise as Extract<typeof l.exercise, { kind: 'code' }>;
    const out = evaluateCode(ex.reference, ex.fnName, ex.tests);
    assert.equal(out.compileError, undefined, l.id);
    const r = gradeCodeRuns(ex.reference, ex.fnName, ex.tests, out);
    assert.equal(r.outcome, 'passed', l.id + ' ' + JSON.stringify(out.runs.filter((x) => !x.ok)));
    assert.ok(ex.tests.some((t) => t.hidden), l.id + ' has hidden tests');
  }
});

test('code labs: starter code fails (nothing passes for free)', () => {
  for (const l of lessonsOf('code')) {
    const ex = l.exercise as Extract<typeof l.exercise, { kind: 'code' }>;
    const r = gradeCodeRuns(ex.starter, ex.fnName, ex.tests, evaluateCode(ex.starter, ex.fnName, ex.tests));
    assert.equal(r.outcome, 'failed', l.id);
  }
});

test('code labs: plausible but wrong solutions are caught by hidden tests', () => {
  const run = (id: string, src: string) => {
    const ex = ALL_LESSONS.find((l) => l.id === id)!.exercise as Extract<(typeof ALL_LESSONS)[number]['exercise'], { kind: 'code' }>;
    const r = gradeCodeRuns(src, ex.fnName, ex.tests, evaluateCode(src, ex.fnName, ex.tests));
    return { outcome: r.outcome, failed: r.items.filter((i) => !i.ok).map((i) => i.id) };
  };
  // guard that forgets lower-casing
  const g = run('agents-4', "function guard(a){const t=a.tool; if(['search_docs','read_calendar','read_file'].includes(t))return 'allow'; if(t==='make_payment')return a.amount>0&&a.amount<=50?'approve':'deny'; if(['send_email','create_booking','update_record'].includes(t))return 'approve'; return 'deny';}");
  assert.equal(g.outcome, 'failed');
  assert.ok(g.failed.includes('h1') && g.failed.includes('h5'));
  // haversine without converting to radians
  assert.equal(run('gis-2', 'function distanceKm(a,b,c,d){const R=6371;const s=Math.sin((c-a)/2)**2+Math.cos(a)*Math.cos(c)*Math.sin((d-b)/2)**2;return 2*R*Math.asin(Math.sqrt(s));}').outcome, 'failed');
  // escapeHtml that replaces & last (double escaping)
  const e = run('web-3', "function escapeHtml(s){return String(s).replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#39;').replace(/&/g,'&amp;');}");
  assert.equal(e.outcome, 'failed');
  // hard-coded answers for visible tests only
  assert.equal(run('web-1', "function formatPrice(p){return {1250:'£12.50',5:'£0.05',35000000:'£350,000.00'}[p] ?? null;}").outcome, 'failed');
  // endless loop is stopped (the browser uses a 2 s Worker timeout; here we grade the timeout result)
  assert.equal(gradeCodeRuns('function guard(a){while(true){}}', 'guard', [], 'timeout').items[0].reasons[0], 'g.codeTimeout');
  // network access is refused before running
  assert.equal(gradeCodeRuns('function guard(a){fetch("https://x");return "allow"}', 'guard', [], { runs: [] }).items[0].reasons[0], 'g.codeBanned');
  assert.match(gradeCodeRuns('const x = 1;', 'guard', [], { runs: [] }).items[0].reasons[0], /^g\.codeNoFn/);
  assert.equal(gradeCodeRuns('function guard( {', 'guard', [], evaluateCode('function guard( {', 'guard', [])).items[0].reasons[0], 'g.codeCompile');
});

test('SQL labs: reference passes on visible and hidden data; cheating and writes fail', async () => {
  const SQL = await initSqlJs();
  const run = makeRunner(SQL);
  for (const l of lessonsOf('sql')) {
    const ex = l.exercise as Extract<typeof l.exercise, { kind: 'sql' }>;
    const r = gradeSql(run, ex.datasets, ex.reference, ex.reference, ex.orderMatters);
    assert.equal(r.outcome, 'passed', l.id);
    assert.equal(r.total, 2, 'graded on two datasets');
    // answer typed in by hand from the visible result
    const visible = run(ex.datasets[0].setup, ex.reference);
    assert.ok(!('error' in visible));
    const literal = 'SELECT * FROM (' + visible.rows.map((row) => 'SELECT ' + row.map((v) => (typeof v === 'string' ? `'${v}'` : v === null ? 'NULL' : v)).join(', ')).join(' UNION ALL ') + ')';
    const cheat = gradeSql(run, ex.datasets, ex.reference, literal, ex.orderMatters);
    assert.equal(cheat.items[0].ok, true, l.id + ' literal matches visible data');
    assert.equal(cheat.outcome, 'failed', l.id + ' literal must fail hidden data');
    // starter must not pass
    assert.equal(gradeSql(run, ex.datasets, ex.reference, ex.starter, ex.orderMatters).outcome, 'failed', l.id + ' starter');
  }
  const ex1 = lessonsOf('sql')[0].exercise as Extract<(typeof ALL_LESSONS)[number]['exercise'], { kind: 'sql' }>;
  assert.equal(gradeSql(run, ex1.datasets, ex1.reference, 'DELETE FROM listings', true).items[0].reasons[0], 'g.sqlReadOnly');
  assert.equal(gradeSql(run, ex1.datasets, ex1.reference, 'SELECT 1; DROP TABLE listings', true).items[0].reasons[0], 'g.sqlReadOnly');
  assert.equal(gradeSql(run, ex1.datasets, ex1.reference, 'SELEC id FROM listings', true).items[0].reasons[0], 'g.sqlReadOnly');
  assert.equal(gradeSql(run, ex1.datasets, ex1.reference, 'SELECT idd FROM listings', true).items[0].reasons[0], 'g.sqlError');
  // right rows, wrong order
  const desc = gradeSql(run, ex1.datasets, ex1.reference, "SELECT id, price FROM listings WHERE town = 'Mitcham' AND bedrooms >= 2 ORDER BY price DESC, id", true);
  assert.equal(desc.items[0].reasons[0], 'g.sqlOrder');
  // forgot a condition
  const loose = gradeSql(run, ex1.datasets, ex1.reference, "SELECT id, price FROM listings WHERE town = 'Mitcham' ORDER BY price, id", true);
  assert.match(loose.items[0].reasons[0], /^g\.sqlRows/);
});

test('evidence: junk is rejected, real sentences in English or Russian are accepted', () => {
  const rule = { minWords: 6, anyOf: ['uprn', 'postcode', 'address', 'адрес', 'индекс'] };
  assert.deepEqual(evidenceIssues('', rule), ['g.evidenceMissing']);
  assert.ok(evidenceIssues('x', rule).includes('g.evidenceShort'));
  assert.ok(evidenceIssues('a a a a a a a a a a', rule).includes('g.evidenceJunk'));
  assert.ok(evidenceIssues('same same same same same same uprn', rule).includes('g.evidenceJunk'));
  assert.ok(evidenceIssues('I think these look like the same thing', rule).includes('g.evidenceNoField'));
  assert.deepEqual(evidenceIssues('Both records share UPRN 100000000001 and the same postcode', rule), []);
  assert.deepEqual(evidenceIssues('У обеих записей один и тот же адрес и индекс AB1 2CD', rule), []);
});

test('data-quality lab: correct labels with junk evidence do not pass', () => {
  const l = ALL_LESSONS.find((x) => x.id === 'dq-4')!;
  const ex = l.exercise as Extract<typeof l.exercise, { kind: 'classify' }>;
  const labels = Object.fromEntries(ex.items.map((i) => [i.id, i.correct]));
  assert.equal(gradeClassify(ex.items, { labels, evidence: Object.fromEntries(ex.items.map((i) => [i.id, 'x'])) }).outcome, 'failed');
  const good = Object.fromEntries(ex.items.map((i) => [i.id, `Compared the UPRN and the postcode of record ${i.id} carefully`]));
  assert.equal(gradeClassify(ex.items, { labels, evidence: good }).outcome, 'passed');
  // Pair 2 marked "match" (Gemini lab bug) must fail
  assert.equal(gradeClassify(ex.items, { labels: { ...labels, r2: 'match' }, evidence: good }).outcome, 'failed');
});

test('prompt lab: a real prompt passes; stuffing and contradictions fail', () => {
  const terms = subjectTerms('Spoke & Chain Bike Repair');
  const good = 'You are a friendly helper for customers of Spoke & Chain Bike Repair. Answer only from the price list below. If the answer is not in the price list, say "I don\'t know" and never guess. Then suggest calling the shop on 020 0000 2222. Keep every answer short and simple, in two sentences or fewer. Do not answer questions about other topics.';
  assert.ok(lintPassed(lintInstructions(good, { placeTerms: terms })));
  const stuffed = 'You are a helper for Spoke & Chain Bike Repair. only facts only facts don\'t know never guess phone call short simple only facts don\'t know never guess phone call short simple only facts don\'t know never guess phone short simple only facts';
  assert.equal(lintPassed(lintInstructions(stuffed, { placeTerms: terms })), false);
  const contradiction = good + ' If you are not sure, use your own general knowledge and guess the most likely answer.';
  assert.equal(lintPassed(lintInstructions(contradiction, { placeTerms: terms })), false);
});

test('manual tasks are never auto-passed', () => {
  assert.equal(gradeManual('short', 30).outcome, 'failed');
  const long = 'I built a small page that lists properties from the sample data, added a filter by price and bedrooms, wrote five tests including empty input and wrong types, and checked the page on a phone screen and with the keyboard only before publishing it.';
  assert.equal(gradeManual(long, 30).outcome, 'manual');
});

test('a pass belongs to one exact answer and content version', () => {
  const answer = { q1: 0 };
  const p = { answer, attempts: 1, result: { outcome: 'passed' as const, score: 1, total: 1, hash: hashOf(answer), v: 1, at: '', items: [] } };
  assert.equal(lessonPassed(p, 1), true);
  assert.equal(lessonPassed({ ...p, answer: { q1: 1 } }, 1), false, 'edited answer');
  assert.equal(lessonStale({ ...p, answer: { q1: 1 } }, 1), true);
  assert.equal(lessonPassed(p, 2), false, 'content version bumped');
  assert.equal(lessonPassed({ ...p, result: { ...p.result, outcome: 'manual' } }, 1), false, 'manual never counts');
});

test('saved progress: v0.2 data is migrated; corrupted data does not crash', () => {
  const old = { ...initialState(), v: 2, modules: { ...initialState().modules, m1: { ...initialState().modules.m1, attempts: 3, practicePassed: true } } };
  const s = parseSaved(null, JSON.stringify(old));
  assert.equal(s.v, 3);
  assert.equal(s.modules.m1.attempts, 3);
  assert.deepEqual(s.lessons, {});
  assert.equal(parseSaved('{not json', null).v, 3);
  const saved = withHistory({ ...initialState(), lang: 'ru' }, { id: 'sql-1', outcome: 'passed', score: 2, total: 2 });
  const back = parseSaved(JSON.stringify(saved), null);
  assert.equal(back.lang, 'ru');
  assert.equal(back.history[0].id, 'sql-1');
});

test('history is capped at 300 entries', () => {
  let s = initialState();
  for (let i = 0; i < 320; i++) s = withHistory(s, { id: 'x' + i, outcome: 'failed', score: 0, total: 1 });
  assert.equal(s.history.length, 300);
  assert.equal(s.history[0].id, 'x319');
});

test('portfolio export states how results were checked and the limits; no certificate claims', () => {
  const s = initialState();
  const sol = (ALL_LESSONS.find((l) => l.id === 'web-4')!.exercise as { reference: string }).reference;
  s.lessons['web-4'] = { answer: sol, attempts: 2, result: { outcome: 'passed', score: 7, total: 7, hash: hashOf(sol), v: 1, at: '2026-11-16T10:00:00Z', items: [] } };
  for (const lang of ['en', 'ru'] as const) {
    const md = buildPortfolio(s, lang, { passed: 0, total: 5, knowledge: '0 / 17', project: '—' }, new Date('2026-11-16'));
    assert.match(md, lang === 'en' ? /Limitations/ : /Ограничения/);
    assert.match(md, /filterListings/);
    assert.match(md, lang === 'en' ? /It is not a certificate/ : /Это не сертификат/);
    assert.doesNotMatch(md, /certified|guaranteed/i);
  }
});

test('translations: every UI key exists in Russian; every t() key used in code exists', () => {
  assert.deepEqual(missingTranslations(), []);
  const files: string[] = [];
  const walk = (d: string) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (/\.tsx?$/.test(f) && !f.endsWith('.test.ts')) files.push(p); } };
  walk('src');
  const used = new Set<string>();
  for (const f of files) for (const m of readFileSync(f, 'utf8').matchAll(/\bt\('([a-z0-9_.]+)'/gi)) used.add(m[1]);
  const missing = [...used].filter((k) => !k.endsWith('.') && !(k in en));
  assert.deepEqual(missing, []);
  for (const m of ['g.wrongChoice', 'g.sqlRows', 'g.codeTimeout', 'g.evidenceJunk', 'sql.ds.main', 'sql.ds.hidden']) assert.ok(m in en, m);
});

test('course 3 in Russian keeps the same answer keys', () => {
  const ru = modulesFor('ru');
  assert.equal(ru.length, MODULES.length);
  ru.forEach((m, i) => {
    assert.notEqual(m.title, MODULES[i].title);
    m.quiz.forEach((q, j) => {
      assert.equal(q.correct, MODULES[i].quiz[j].correct);
      assert.equal(q.options.length, MODULES[i].quiz[j].options.length);
    });
  });
});

test('search finds lessons in both languages', () => {
  assert.ok(searchContent('JOIN', 'en', []).some((h) => h.id === 'sql-3'));
  assert.ok(searchContent('индекс', 'ru', []).some((h) => h.id === 'dq-2'));
  assert.ok(searchContent('injection', 'en', []).some((h) => h.id === 'prompt-3'));
  assert.deepEqual(searchContent('a', 'en', []), []);
});
