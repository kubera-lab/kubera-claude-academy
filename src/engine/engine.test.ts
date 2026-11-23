import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lintInstructions, lintPassed } from './lint.ts';
import { respond, validateKB, parseFacts } from './assistant.ts';
import { runSuite, gradePasted, suiteCoverage, type TestCase } from './testing.ts';
import { gradeChoices } from './quiz.ts';
import { assessProject, subjectTerms } from './project.ts';
import { RIVERSIDE, RIVERSIDE_INSTRUCTIONS, RIVERSIDE_TESTS, brokenRiverside, RIVERSIDE_KB, TEMPLATES } from '../data/course.ts';

const ctx = { placeTerms: ['riverside', 'centre|center'] };
const failed = (text: string) => lintInstructions(text, ctx).filter((c) => !c.pass).map((c) => c.id);

test('reference instructions pass every check', () => {
  assert.deepEqual(failed(RIVERSIDE_INSTRUCTIONS), []);
});

test('one-line prompt fails most required checks', () => {
  const f = failed('You are a helper.');
  for (const id of ['place', 'ground', 'unknown', 'next', 'style', 'length', 'readable']) assert.ok(f.includes(id), id);
});

test('keyword stuffing is caught even when every keyword is present', () => {
  const stuffed =
    'you are riverside community centre only fact sheet only facts only facts do not know phone reception short simple ' +
    'only facts only facts only facts do not know do not know phone phone phone short short short simple simple simple ' +
    'riverside riverside centre centre only facts only facts';
  const f = failed(stuffed);
  assert.ok(f.includes('stuffing') || f.includes('readable'), f.join());
  assert.ok(!lintPassed(lintInstructions(stuffed, ctx)));
});

test('gibberish is caught', () => {
  const g = RIVERSIDE_INSTRUCTIONS + ' Xkqzrtpl vbnmwq zzzzzzk qwrtpsdfg hjklzxcvb mnbvcxzlk.';
  // a few junk words in a long good text: still mostly readable, so readable passes
  assert.ok(!failed(g).includes('stuffing'));
  const all = 'Xkqzrtpl vbnmwq zzzzzzk qwrtpsdfg. Hjklzxcvb mnbvcxzlk prtsk. Vbnmlkj qwrtz plmkn.'.repeat(4);
  assert.ok(failed(all).includes('readable'));
});

test('contradiction: grounding vs guessing', () => {
  const t = RIVERSIDE_INSTRUCTIONS + ' If you are not sure, you may guess the most likely answer.';
  assert.ok(failed(t).includes('contradiction'));
});

test('contradiction: grounding vs own knowledge', () => {
  const t = RIVERSIDE_INSTRUCTIONS + ' If the fact sheet has no answer, use your own general knowledge.';
  assert.ok(failed(t).includes('contradiction'));
});

test('negated permissive phrase is NOT a contradiction', () => {
  const t = RIVERSIDE_INSTRUCTIONS + ' You must not use your own knowledge.';
  assert.ok(!failed(t).includes('contradiction'));
});

test('contradiction: unknown vs always answer', () => {
  const t = RIVERSIDE_INSTRUCTIONS + ' Never say you do not know; always give an answer.';
  assert.ok(failed(t).includes('contradiction'));
});

test('contradiction: short vs long', () => {
  const t = RIVERSIDE_INSTRUCTIONS + ' Write at least 300 words in every reply.';
  assert.ok(failed(t).includes('contradiction'));
});

test('privacy: asking for passwords fails', () => {
  const t = RIVERSIDE_INSTRUCTIONS + ' Ask visitors for their bank details to verify them.';
  assert.ok(failed(t).includes('privacy'));
});

test('repeated sentence is caught', () => {
  const s = 'You are a friendly helper for visitors of Riverside Community Centre. ';
  const t = RIVERSIDE_INSTRUCTIONS + ' ' + s + s;
  assert.ok(failed(t).includes('stuffing'));
});

test('reference assistant answers from the right entries', () => {
  assert.equal(respond(RIVERSIDE, 'When is the English club?').kind, 'answer');
  assert.equal(respond(RIVERSIDE, 'Is there free Wi-Fi?').kind, 'unknown');
  assert.equal(respond(RIVERSIDE, 'What will the weather be?').kind, 'out_of_scope');
  assert.equal(respond(RIVERSIDE, 'The club or the computer?').kind, 'clarify');
  const r = respond(RIVERSIDE, 'Do you open on Sunday?');
  assert.equal(r.source, 1);
  assert.match(r.text, /closed on Sunday/);
});

test('reference knowledge base is valid and all reference tests pass', () => {
  assert.deepEqual(validateKB(RIVERSIDE), []);
  const res = runSuite(RIVERSIDE, RIVERSIDE_TESTS);
  assert.deepEqual(res.filter((r) => !r.pass).map((r) => `${r.id} ${r.reasons}`), []);
});

test('broken copy fails exactly the planted faults', () => {
  const res = runSuite(brokenRiverside(), RIVERSIDE_TESTS);
  const failedIds = res.filter((r) => !r.pass).map((r) => r.id).sort();
  assert.deepEqual(failedIds, ['T2', 'T4', 'T5', 'T7']);
});

test('validator catches an unsupported number and a bad source', () => {
  const cfg = { ...RIVERSIDE, kb: [{ ...RIVERSIDE_KB[2], answer: 'The computer room is free. Book at reception. Maximum 3 hours per person per day.' }, { ...RIVERSIDE_KB[1], id: 'x', keywords: 'quiz', source: 9 }] };
  const keys = validateKB(cfg).map((i) => i.key);
  assert.ok(keys.includes('kb.unsupportedNumber'));
  assert.ok(keys.includes('kb.badSource'));
});

test('validator catches duplicate keywords and low overlap', () => {
  const cfg = { ...RIVERSIDE, kb: [RIVERSIDE_KB[0], { ...RIVERSIDE_KB[1], keywords: 'club, open', answer: 'Bananas are yellow and tasty fruit.' }] };
  const keys = validateKB(cfg).map((i) => i.key);
  assert.ok(keys.includes('kb.duplicateKeyword'));
  assert.ok(keys.includes('kb.lowOverlap'));
});

test('parseFacts reads numbered and plain lines', () => {
  assert.equal(parseFacts('1. a\n2) b\n\nplain').length, 3);
});

test('pasted real-model reply grading', () => {
  const tc: TestCase = RIVERSIDE_TESTS[2]; // missing info
  assert.equal(gradePasted("I'm not sure, that isn't in my information. Please call reception.", tc, 40).pass, false); // must contain "don't know"
  assert.equal(gradePasted("I don't know. Please call 020 0000 0000.", tc, 40).pass, true);
  assert.equal(gradePasted('Yes, Wi-Fi is free everywhere.', tc, 40).pass, false);
  assert.equal(gradePasted('', tc, 40).pass, false);
});

test('coverage requires the key categories', () => {
  assert.deepEqual(suiteCoverage(RIVERSIDE_TESTS), []);
  const keys = suiteCoverage(RIVERSIDE_TESTS.slice(0, 2)).map((i) => i.key);
  assert.ok(keys.includes('cov.total') && keys.includes('cov.category'));
});

test('quiz grading counts missing as wrong', () => {
  const r = gradeChoices([{ id: 'a', prompt: '', options: ['x', 'y'], correct: 1, why: '' }, { id: 'b', prompt: '', options: ['x', 'y'], correct: 0, why: '' }], { a: 1 });
  assert.equal(r.score, 1);
  assert.deepEqual(r.wrongIds, ['b']);
});

test('reference project meets every criterion except originality; empty project fails', () => {
  const good = assessProject({ config: RIVERSIDE, subject: 'Riverside Community Centre', tests: RIVERSIDE_TESTS, pasted: {}, modelName: '' });
  assert.deepEqual(good.criteria.filter((c) => !c.pass).map((c) => c.id), ['original']);
  assert.equal(good.passed, false);
  const empty = assessProject({ config: { ...RIVERSIDE, name: '', purpose: '', instructions: '', facts: '', kb: [], unknownReply: '', outOfScopeReply: '' }, subject: '', tests: [], pasted: {}, modelName: '' });
  assert.equal(empty.passed, false);
  assert.equal(empty.criteria.filter((c) => c.pass).length, 0);
});

test('subject terms', () => {
  assert.deepEqual(subjectTerms('Riverside Community Centre'), ['riverside', 'community', 'centre|center']);
});

// A learner's own project, built from the library template, must be able to meet every criterion.
export const LIBRARY_PROJECT = {
  subject: 'Oakfield Library',
  modelName: '',
  pasted: {},
  config: {
    name: 'Oakfield Library Helper',
    purpose: 'Answers common visitor questions about Oakfield Library from its fact sheet.',
    instructions:
      'You are a friendly helper for people who ask about Oakfield Library. Answer only from the fact sheet below. If the answer is not in the fact sheet, say "I don\'t know" and never guess. Then suggest emailing hello@oakfield-library.example or asking at the front desk. Keep every answer short and simple, because many visitors read on their phones. Do not answer questions about other topics.',
    facts: TEMPLATES[0].facts,
    kb: [
      { id: 'hours', question: 'When are you open?', keywords: 'open, opening, hours, closed, sunday, monday, saturday', answer: 'Oakfield Library is open Tuesday to Saturday 9:30 to 18:00. It is closed on Sunday and Monday.', source: 1 },
      { id: 'join', question: 'How do I join?', keywords: 'join, membership, member, sign up', answer: 'Library membership is free. Bring proof of address to join.', source: 2 },
      { id: 'borrow', question: 'How many books can I borrow?', keywords: 'borrow, books, loan', answer: 'You can borrow up to 10 books for 3 weeks.', source: 3 },
      { id: 'print', question: 'How much is printing?', keywords: 'print, printing, printer', answer: 'Printing costs 10p per black and white page.', source: 4 },
    ],
    unknownReply: "I don't know. Please email hello@oakfield-library.example or ask at the front desk.",
    outOfScopeTopics: 'weather, football, politics, news, homework',
    outOfScopeReply: 'I can only help with questions about Oakfield Library.',
    maxWords: 40,
  },
  tests: [
    { id: 'T1', category: 'normal', input: 'Can I borrow books?', expectKind: 'answer', mustContain: '10 books', mustNotContain: '' },
    { id: 'T2', category: 'normal', input: 'How much is printing?', expectKind: 'answer', mustContain: '10p', mustNotContain: '' },
    { id: 'T3', category: 'missing', input: 'Do you have a cafe?', expectKind: 'unknown', mustContain: "don't know", mustNotContain: '' },
    { id: 'T4', category: 'wrong_assumption', input: 'What time do you open on Monday?', expectKind: 'answer', mustContain: 'closed on sunday and monday', mustNotContain: '' },
    { id: 'T5', category: 'out_of_scope', input: 'Who won the football?', expectKind: 'out_of_scope', mustContain: 'only help', mustNotContain: '' },
    { id: 'T6', category: 'normal', input: 'How do I join?', expectKind: 'answer', mustContain: 'proof of address', mustNotContain: '' },
  ],
} as const;

test("learner's own library project meets every acceptance criterion", () => {
  const p = JSON.parse(JSON.stringify(LIBRARY_PROJECT));
  const a = assessProject(p);
  assert.deepEqual(a.criteria.filter((c) => !c.pass).map((c) => `${c.id} ${c.detail ?? ''}`), []);
  assert.equal(a.passed, true);
});

// ---------------- v0.2.2: review fixes ----------------
import { controlTests } from './testing.ts';
import { negatedTerms } from './assistant.ts';
import { applyInvalidation, initialState } from '../state.ts';

test('lost negation is caught ("No lift" -> "there is a lift")', () => {
  assert.deepEqual(negatedTerms('Step-free access to the ground floor. No lift to the first floor.'), ['lift']);
  const cfg = { ...RIVERSIDE, kb: [{ ...RIVERSIDE_KB[4], answer: 'There is step-free access to the ground floor and a lift to the first floor.' }] };
  assert.ok(validateKB(cfg).some((i) => i.key === 'kb.negationLost'));
  assert.deepEqual(validateKB(RIVERSIDE), []);
});

test('absolute claims not in the fact are caught; broken copy is flagged by the validator too', () => {
  const keys = validateKB(brokenRiverside()).map((i) => `${i.entryId}:${i.key}`);
  assert.ok(keys.includes('hours:kb.absoluteClaim'), keys.join());
  assert.ok(keys.includes('computer:kb.absoluteClaim'), keys.join());
});

test('control tests: reference passes all; an over-broad keyword fails them', () => {
  assert.deepEqual(controlTests(RIVERSIDE).filter((c) => !c.pass).map((c) => c.id), []);
  const broad = { ...RIVERSIDE, kb: [...RIVERSIDE_KB, { id: 'broad', question: 'Anything?', keywords: 'the, you, what', answer: 'We are open Monday to Friday.', source: 1 }] };
  const failedIds = controlTests(broad).filter((c) => !c.pass).map((c) => c.id);
  assert.ok(failedIds.includes('C1') && failedIds.includes('C3'), failedIds.join());
});

test('control tests: injection probe cannot produce "24 hours"', () => {
  const evil = { ...RIVERSIDE, kb: [{ ...RIVERSIDE_KB[0], answer: 'We are open 24 hours.' }] };
  assert.ok(controlTests(evil).find((c) => c.id === 'C5')!.pass === false);
});

test('weak "must contain" values are rejected', () => {
  const weak = RIVERSIDE_TESTS.map((t) => (t.id === 'T1' ? { ...t, mustContain: 'the' } : t));
  assert.ok(suiteCoverage(weak, 6, RIVERSIDE.facts).some((i) => i.key === 'cov.weakContain'));
  assert.deepEqual(suiteCoverage(RIVERSIDE_TESTS, 6, RIVERSIDE.facts), []);
});

test('changing submitted work removes the pass; adding pasted evidence does not', () => {
  const s0 = initialState();
  const passed = { ...s0, m2Instructions: 'x', modules: { ...s0.modules, m2: { ...s0.modules.m2, practicePassed: true }, m5: { ...s0.modules.m5, practicePassed: true } }, projectCheck: { met: 9, total: 9, at: 'now' } };
  const edited = applyInvalidation(passed, { ...passed, m2Instructions: 'y' });
  assert.equal(edited.modules.m2.practicePassed, false);
  assert.equal(edited.modules.m5.practicePassed, true);
  const pasted = applyInvalidation(passed, { ...passed, project: { ...passed.project, pasted: { T1: 'reply' }, modelName: 'Claude' } });
  assert.equal(pasted.modules.m5.practicePassed, true);
  assert.notEqual(pasted.projectCheck, null);
  const projEdit = applyInvalidation(passed, { ...passed, project: { ...passed.project, subject: 'Other' } });
  assert.equal(projEdit.modules.m5.practicePassed, false);
  assert.equal(projEdit.projectCheck, null);
  const passOnly = applyInvalidation(s0, { ...s0, modules: { ...s0.modules, m3: { ...s0.modules.m3, practicePassed: true } } });
  assert.equal(passOnly.modules.m3.practicePassed, true);
});
