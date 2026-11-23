// Builds the files a learner copies into a GitHub repository.
import { assessProject, type Project } from './project.ts';
import { gradePasted, type TestResult } from './testing.ts';

export interface ExportFile {
  name: string;
  content: string;
}

export function buildExport(p: Project, knowledge: { score: number; total: number }, when: Date): ExportFile[] {
  const { criteria, results, control, passed } = assessProject(p);
  const date = when.toISOString().slice(0, 10);
  const c = p.config;
  const passedCount = results.filter((r) => r.pass).length;
  const pastedResults: TestResult[] = p.tests
    .filter((tc) => (p.pasted[tc.id] ?? '').trim())
    .map((tc) => gradePasted(p.pasted[tc.id], tc, c.maxWords));
  const realLine = pastedResults.length
    ? `${pastedResults.filter((r) => r.pass).length} of ${pastedResults.length} real-model replies passed (model: ${p.modelName || 'not stated'}; copied by hand, single runs).`
    : 'Not tested with a real AI model.';

  const readme = `# ${c.name || 'My assistant'}

${c.purpose}

Built in the KUBERA Claude Academy course "Build Your First AI Assistant" (prototype v0.2).

## What it is
- Subject: ${p.subject}
- Type: offline rule-based assistant. It answers only from \`assistant.json\` (facts + knowledge entries) by keyword matching. It is **not** a language model and does not generate new text.
- The instructions in \`assistant.json\` are written for use with a real AI model (paste them as the system prompt).

## Evidence (${date})
- Offline tests (written by the author): **${passedCount} of ${results.length} passed** (see \`TEST_REPORT.md\`).
- Control tests (fixed by the course, not editable): ${control.filter((x) => x.pass).length} of ${control.length} passed.
- Acceptance criteria: ${criteria.filter((x) => x.pass).length} of ${criteria.length} met${passed ? ' (all)' : ''}.
- Real AI model: ${realLine}
- Course knowledge checks: ${knowledge.score} of ${knowledge.total} correct (separate from the project result).

## Limitations
- Keyword matching misses questions phrased with words that are not in the keyword lists.
- The instruction checker uses fixed rules and cannot fully judge meaning.
- Real-model results above are single, hand-copied runs; models can answer differently next time.
- Facts are ${p.subject ? 'written by the author' : 'not provided'}; check them before real use. No certificate or accreditation is implied.

## Files
- \`assistant.json\` — configuration: instructions, facts, knowledge base, replies.
- \`tests.json\` — test cases.
- \`TEST_REPORT.md\` — results of the last run.
`;

  const report = `# Test report — ${c.name || 'My assistant'}

Date: ${date} · Runner: KUBERA Claude Academy offline rule engine v0.2 (deterministic: same input, same result)

| ID | Kind | Question | Expected | Reply | Result |
|---|---|---|---|---|---|
${results
  .map((r) => {
    const tc = p.tests.find((x) => x.id === r.id)!; // results come from p.tests, so tc always exists
    const esc = (s: string) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ');
    return `| ${r.id} | ${tc.category} | ${esc(tc.input)} | ${tc.expectKind}${tc.mustContain ? ` + "${esc(tc.mustContain)}"` : ''} | ${esc(r.reply)} | ${r.pass ? 'PASS' : 'FAIL: ' + esc(r.reasons.join('; '))} |`;
  })
  .join('\n')}

**${passedCount} of ${results.length} passed.**

## Acceptance criteria
${criteria.map((x) => `- [${x.pass ? 'x' : ' '}] ${x.id}${x.detail ? ` (${x.detail})` : ''}`).join('\n')}

## Control tests (fixed by the course)
${control.map((x) => `- ${x.id} ${x.pass ? 'PASS' : 'FAIL'}${x.input ? ` — "${x.input}"` : ''}${x.detail ? ` (${x.detail})` : ''}`).join('\n')}

## Real AI model (hand-copied replies)
${pastedResults.length ? pastedResults.map((r) => `- ${r.id}: ${r.pass ? 'PASS' : 'FAIL: ' + r.reasons.join('; ')}`).join('\n') : 'None.'}
`;

  return [
    { name: 'README.md', content: readme },
    { name: 'assistant.json', content: JSON.stringify(c, null, 2) },
    { name: 'tests.json', content: JSON.stringify(p.tests, null, 2) },
    { name: 'TEST_REPORT.md', content: report },
  ];
}
