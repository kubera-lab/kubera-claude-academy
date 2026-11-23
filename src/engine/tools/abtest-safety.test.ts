import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PROMPT_A, abMarkdown, gradeAb, gradeReplies, scoreVariant, winner } from './abtest.ts';
import { CASES, EXPECTED_RISK, assess, cardMarkdown, gradeSafety, missingSafeguards, type Card } from './safety.ts';

const GOOD = 'You are a friendly helper for customers of Spoke & Chain Bike Repair. Answer only from the price list below. If the answer is not in the price list, say "I don\'t know" and never guess. Then suggest calling the shop on 020 0000 2222. Keep every answer short and simple, in two sentences or fewer. Do not answer questions about other topics.';

test('A/B: the weak prompt A loses to a grounded prompt B under the same rules', () => {
  const a = scoreVariant(PROMPT_A), b = scoreVariant(GOOD);
  assert.ok(a.required < a.requiredTotal);
  assert.equal(b.required, b.requiredTotal);
  assert.equal(winner(a, b), 'B');
  assert.equal(winner(b, b), 'tie');
});

test('A/B lab: copying A into B fails; a better B passes; a stuffed B fails quality', () => {
  assert.equal(gradeAb({ a: PROMPT_A, b: PROMPT_A, repliesA: {}, repliesB: {} }).every((c) => c.ok), false);
  assert.ok(gradeAb({ a: PROMPT_A, b: GOOD, repliesA: {}, repliesB: {} }).every((c) => c.ok));
  const stuffed = 'You are a helper for Spoke & Chain Bike Repair. only facts only facts don\'t know never guess phone call short simple only facts don\'t know never guess phone call short simple only facts';
  assert.equal(gradeAb({ a: PROMPT_A, b: stuffed, repliesA: {}, repliesB: {} }).find((c) => c.id === 'b-quality')!.ok, false);
});

test('A/B: pasted replies are graded by fixed rules; empty ones are skipped', () => {
  const r = gradeReplies({ t1: 'A puncture repair costs £12.', t2: 'Yes, we sell lots of scooters!', t3: '' });
  assert.equal(r.length, 2);
  assert.equal(r.find((x) => x.id === 't1')!.pass, true);
  assert.equal(r.find((x) => x.id === 't2')!.pass, false);
  const md = abMarkdown({ a: PROMPT_A, b: GOOD, repliesA: {}, repliesB: { t1: 'It is £12.' } }, (k) => k, new Date('2026-11-23T00:00:00Z'));
  assert.match(md, /\*\*Winner: B\*\*/);
  assert.match(md, /no AI model scored them/);
});

test('safety rules: practice cases give the expected risk', () => {
  for (const c of CASES) assert.equal(assess({ title: c.title, ...c.key, safeguards: [] }).risk, EXPECTED_RISK[c.id], c.id);
});

test('safety lab: wrong facts or missing safeguards fail; complete cards pass', () => {
  const cards: Record<string, Card> = Object.fromEntries(CASES.map((c) => {
    const card: Card = { title: c.title, ...c.key, safeguards: [] };
    return [c.id, { ...card, safeguards: assess(card).required }];
  }));
  assert.ok(gradeSafety(cards).every((x) => x.ok));
  const noReview = { ...cards, c2: { ...cards.c2, safeguards: cards.c2.safeguards.filter((s) => s !== 'human_review') } };
  assert.equal(gradeSafety(noReview).find((x) => x.id === 'c2-safeguards')!.ok, false);
  assert.deepEqual(missingSafeguards(noReview.c2), ['human_review']);
  const wrongFacts = { ...cards, c3: { ...cards.c3, data: 'none' as const } };
  assert.equal(gradeSafety(wrongFacts).find((x) => x.id === 'c3-facts')!.ok, false);
  assert.match(cardMarkdown(Object.values(cards), (k) => k, new Date('2026-11-23T00:00:00Z')), /Risk: HIGH/);
});

test('safety: automatic significant decisions always need human review and logs', () => {
  const a = assess({ title: 'x', affects: 'significant', data: 'none', mode: 'automatic', impact: 'low', safeguards: [] });
  assert.equal(a.risk, 'high');
  assert.ok(a.required.includes('human_review') && a.required.includes('log_decisions'));
});
