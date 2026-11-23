// Course 2 tool: Prompt A/B Tester. Two versions of a system prompt are checked against the SAME rulebook
// (the course's deterministic instruction checker). Optionally, the learner pastes the replies a real model
// gave to each version for fixed test questions; those replies are graded by the same fixed rules.
// No model is called here and nothing pretends to be model output.
import { lintInstructions, type Check } from '../lint.ts';
import { subjectTerms } from '../project.ts';
import { gradePasted, type TestCase, type TestResult } from '../testing.ts';

export const AB_SUBJECT = 'Spoke & Chain Bike Repair';

export const PROMPT_A = `You are a helpful assistant for a bike shop. Answer customer questions in detail and always give an answer.`;

export const AB_TESTS: TestCase[] = [
  { id: 't1', category: 'normal', input: 'How much is a puncture repair?', expectKind: 'answer', mustContain: '£12', mustNotContain: '' },
  { id: 't2', category: 'missing', input: 'Do you sell electric scooters?', expectKind: 'unknown', mustContain: '020 0000 2222', mustNotContain: '' },
  { id: 't3', category: 'out_of_scope', input: 'Who will win the football tonight?', expectKind: 'out_of_scope', mustContain: '', mustNotContain: '' },
];

export const AB_FACTS = 'Price list: puncture repair £12; brake adjustment £15; full service £60. Phone: 020 0000 2222.';

export interface VariantScore { checks: Check[]; required: number; requiredTotal: number; quality: number; qualityTotal: number }

export function scoreVariant(text: string): VariantScore {
  const checks = lintInstructions(text, { placeTerms: subjectTerms(AB_SUBJECT) });
  const req = checks.filter((c) => c.level === 'required');
  const q = checks.filter((c) => c.level === 'quality');
  return { checks, required: req.filter((c) => c.pass).length, requiredTotal: req.length, quality: q.filter((c) => c.pass).length, qualityTotal: q.length };
}

/** Winner by fixed rule: more required checks passed; if equal, more quality checks; otherwise a tie. */
export function winner(a: VariantScore, b: VariantScore): 'A' | 'B' | 'tie' {
  if (a.required !== b.required) return a.required > b.required ? 'A' : 'B';
  if (a.quality !== b.quality) return a.quality > b.quality ? 'A' : 'B';
  return 'tie';
}

export function gradeReplies(replies: Record<string, string>): TestResult[] {
  return AB_TESTS.filter((t) => (replies[t.id] ?? '').trim()).map((t) => gradePasted(replies[t.id], t, 60));
}

export interface AbAnswer { a: string; b: string; repliesA: Record<string, string>; repliesB: Record<string, string> }
export const emptyAb = (): AbAnswer => ({ a: PROMPT_A, b: PROMPT_A, repliesA: {}, repliesB: {} });

/** Lab: version B must pass every check, beat version A, and stay a real prompt about the shop. */
export function gradeAb(ans: AbAnswer): { id: string; ok: boolean }[] {
  const a = scoreVariant(ans.a), b = scoreVariant(ans.b);
  return [
    { id: 'b-required', ok: b.required === b.requiredTotal },
    { id: 'b-quality', ok: b.quality === b.qualityTotal },
    { id: 'b-wins', ok: winner(a, b) === 'B' },
    { id: 'a-kept', ok: ans.a.trim().length >= 20 },
  ];
}

export function abMarkdown(ans: AbAnswer, label: (key: string) => string, when: Date): string {
  const a = scoreVariant(ans.a), b = scoreVariant(ans.b);
  const ra = gradeReplies(ans.repliesA), rb = gradeReplies(ans.repliesB);
  const row = (i: number) => `| ${label(a.checks[i].label)} | ${a.checks[i].level} | ${a.checks[i].pass ? '✅' : '❌'} | ${b.checks[i].pass ? '✅' : '❌'} |`;
  return [
    `# Prompt A/B test — ${AB_SUBJECT}`, '',
    `Run on ${when.toISOString().slice(0, 10)} in KUBERA Claude Academy (course 2). Both versions were checked by the same fixed rules; no AI model scored them.`, '',
    `**Winner: ${winner(a, b)}** · A: ${a.required}/${a.requiredTotal} required, ${a.quality}/${a.qualityTotal} quality · B: ${b.required}/${b.requiredTotal} required, ${b.quality}/${b.qualityTotal} quality`, '',
    '## Version A', '', '```text', ans.a.trim(), '```', '',
    '## Version B', '', '```text', ans.b.trim(), '```', '',
    '## Checks', '', '| Check | Level | A | B |', '| --- | --- | --- | --- |', ...a.checks.map((_, i) => row(i)), '',
    ra.length || rb.length ? '## Pasted model replies (graded by fixed rules)' : '',
    ...(ra.length || rb.length ? ['', '| Test | A | B |', '| --- | --- | --- |', ...AB_TESTS.map((t) => `| ${t.input} | ${ra.find((r) => r.id === t.id)?.pass ? '✅' : ra.find((r) => r.id === t.id) ? '❌' : '—'} | ${rb.find((r) => r.id === t.id)?.pass ? '✅' : rb.find((r) => r.id === t.id) ? '❌' : '—'} |`)] : []),
    '', '_Rule checks show whether a prompt contains what a grounded assistant needs; they do not prove how a model will behave. Pasted replies are graded only if you add them._', '',
  ].join('\n');
}
