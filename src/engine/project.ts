// Final project assessment: evidence only. Separate from the knowledge score.
import { parseFacts, validateKB, type AssistantConfig } from './assistant.ts';
import { lintInstructions, lintPassed } from './lint.ts';
import { controlTests, runSuite, suiteCoverage, type ControlResult, type TestCase, type TestResult } from './testing.ts';
import { normalize, wordCount } from './text.ts';
import { RIVERSIDE_FACTS } from '../data/course.ts';

export interface Project {
  config: AssistantConfig;
  subject: string;
  tests: TestCase[];
  /** pasted replies from a real model, by test id */
  pasted: Record<string, string>;
  modelName: string;
}

export interface Criterion {
  id: string;
  label: string; // i18n key
  pass: boolean;
  detail?: string;
}

export function subjectTerms(subject: string): string[] {
  return normalize(subject)
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .map((w) => w.replace(/[^a-z0-9]/g, ''))
    .filter(Boolean)
    .map((w) => (w === 'centre' || w === 'center' ? 'centre|center' : w));
}

export function assessProject(p: Project): { criteria: Criterion[]; results: TestResult[]; control: ControlResult[]; passed: boolean } {
  const c = p.config;
  const terms = subjectTerms(p.subject);
  const lint = lintInstructions(c.instructions, { placeTerms: terms.length ? terms : ['__no_subject__'] });
  const kbIssues = validateKB(c);
  const cov = suiteCoverage(p.tests, 6, c.facts);
  const control = controlTests(c);
  const controlFailed = control.filter((x) => !x.pass).length;
  const results = runSuite(c, p.tests);
  const failedTests = results.filter((r) => !r.pass).length;
  const criteria: Criterion[] = [
    { id: 'basics', label: 'acc.basics', pass: c.name.trim().length > 1 && wordCount(c.purpose) >= 8 && terms.length > 0 },
    { id: 'facts', label: 'acc.facts', pass: parseFacts(c.facts).length >= 4, detail: String(parseFacts(c.facts).length) },
    { id: 'instructions', label: 'acc.instructions', pass: lintPassed(lint), detail: `${lint.filter((x) => x.pass).length}/${lint.length}` },
    { id: 'kb', label: 'acc.kb', pass: c.kb.length >= 4 && kbIssues.length === 0, detail: `${c.kb.length} / ${kbIssues.length}` },
    {
      id: 'replies',
      label: 'acc.replies',
      pass: c.unknownReply.trim().length > 0 && c.outOfScopeReply.trim().length > 0 && /\b(phone|call|email|reception|desk|ask|contact|@|\d{3,})/i.test(c.unknownReply),
    },
    { id: 'coverage', label: 'acc.coverage', pass: cov.length === 0, detail: String(cov.length) },
    {
      id: 'original',
      label: 'acc.original',
      pass: terms.length > 0 && !(terms.includes('riverside')) && normalize(c.facts) !== normalize(RIVERSIDE_FACTS),
    },
    { id: 'tests', label: 'acc.tests', pass: p.tests.length > 0 && failedTests === 0, detail: `${results.length - failedTests}/${results.length}` },
    { id: 'control', label: 'acc.control', pass: c.kb.length > 0 && controlFailed === 0, detail: `${control.length - controlFailed}/${control.length}` },
  ];
  return { criteria, results, control, passed: criteria.every((x) => x.pass) };
}
