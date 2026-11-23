// Deterministic graders for the generic lesson engine (courses 1, 2, 4–8).
// No grader calls an AI model. The same answer always gets the same result.
import { normalize, wordCount } from './text.ts';

/** Words in English or Russian (the shared tokenizer is English-only). */
export const words = (s: string): string[] => normalize(s).match(/[a-z\u0430-\u044f\u04510-9']+/g) ?? [];

export type Outcome = 'passed' | 'failed' | 'manual';

export interface ItemFeedback {
  id: string;
  ok: boolean;
  /** Message keys (translated by the UI), e.g. "g.wrongChoice" or "g.evidenceShort". */
  reasons: string[];
}
export interface GradeResult {
  outcome: Outcome;
  score: number;
  total: number;
  items: ItemFeedback[];
  /** Fingerprint of the answer that was graded. A pass is valid only for this exact answer. */
  hash: string;
}

/** Small, stable string hash (FNV-1a). Used to detect that work changed after a pass. */
export function hashOf(value: unknown): string {
  const s = JSON.stringify(value ?? null);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16);
}

const result = (items: ItemFeedback[], answer: unknown): GradeResult => {
  const score = items.filter((i) => i.ok).length;
  return { outcome: score === items.length && items.length > 0 ? 'passed' : 'failed', score, total: items.length, items, hash: hashOf(answer) };
};

// ---------- multiple choice ----------
export function gradeChoice(questions: { id: string; correct: number }[], answer: Record<string, number>): GradeResult {
  const items = questions.map((q) => {
    const a = answer[q.id];
    if (a === undefined) return { id: q.id, ok: false, reasons: ['g.missing'] };
    return { id: q.id, ok: a === q.correct, reasons: a === q.correct ? [] : ['g.wrongChoice'] };
  });
  return result(items, answer);
}

// ---------- labelling with optional written evidence ----------
export interface EvidenceRule {
  minWords: number;
  /** At least one of these terms must appear (e.g. "uprn", "postcode"). Lower case. */
  anyOf: string[];
}
export interface ClassifyItem {
  id: string;
  correct: string;
  evidence?: EvidenceRule;
}
export interface ClassifyAnswer {
  labels: Record<string, string>;
  evidence?: Record<string, string>;
}

/** Evidence must be a real sentence about the record, not "x" or "a a a a". */
export function evidenceIssues(text: string, rule: EvidenceRule): string[] {
  const t = text.trim();
  const out: string[] = [];
  if (!t) return ['g.evidenceMissing'];
  const ws = words(t);
  if (wordCount(t) < rule.minWords) out.push('g.evidenceShort');
  const real = ws.filter((w) => /[a-z\u0430-\u044f\u0451]{2,}|\d/.test(w));
  const unique = new Set(real);
  if (real.length < 3 || unique.size / Math.max(1, real.length) < 0.6) out.push('g.evidenceJunk');
  const n = normalize(t);
  if (rule.anyOf.length && !rule.anyOf.some((term) => n.includes(term))) out.push('g.evidenceNoField');
  return out;
}

export function gradeClassify(items: ClassifyItem[], answer: ClassifyAnswer): GradeResult {
  const fb = items.map((it) => {
    const label = answer.labels[it.id];
    const reasons: string[] = [];
    if (!label) reasons.push('g.missing');
    else if (label !== it.correct) reasons.push('g.wrongLabel');
    if (it.evidence) reasons.push(...evidenceIssues(answer.evidence?.[it.id] ?? '', it.evidence));
    return { id: it.id, ok: reasons.length === 0, reasons };
  });
  return result(fb, answer);
}

// ---------- ordering ----------
export function gradeOrder(correct: string[], answer: string[]): GradeResult {
  const items = correct.map((id, i) => ({ id, ok: answer[i] === id, reasons: answer[i] === id ? [] : ['g.wrongPosition'] }));
  if (answer.length !== correct.length || new Set(answer).size !== answer.length) {
    return { ...result(items.map((i) => ({ ...i, ok: false, reasons: ['g.orderIncomplete'] })), answer), outcome: 'failed' };
  }
  return result(items, answer);
}

// ---------- numeric ----------
export function gradeNumeric(expected: number, tolerance: number, raw: string): GradeResult {
  const v = Number(raw.replace(',', '.').trim());
  const ok = raw.trim() !== '' && Number.isFinite(v) && Math.abs(v - expected) <= tolerance;
  return result([{ id: 'n', ok, reasons: ok ? [] : [raw.trim() === '' || !Number.isFinite(v) ? 'g.notNumber' : 'g.wrongNumber'] }], raw);
}

// ---------- manual review ----------
/** Open tasks cannot be judged objectively. They are saved and marked for human review, never auto-passed. */
export function gradeManual(text: string, minWords: number): GradeResult {
  const ws = words(text);
  const enough = wordCount(text) >= minWords && new Set(ws.filter((w) => w.length > 3)).size >= Math.min(8, minWords / 2);
  return { outcome: enough ? 'manual' : 'failed', score: 0, total: 0, items: [{ id: 'm', ok: enough, reasons: enough ? [] : ['g.manualShort'] }], hash: hashOf(text) };
}

// ---------- SQL ----------
export interface SqlResult {
  columns: string[];
  rows: (string | number | null)[][];
}
export type SqlRunner = (setupSql: string, query: string) => SqlResult | { error: string };

const READ_ONLY = /^\s*(select|with)\b/i;
const WRITE = /\b(insert|update|delete|drop|alter|create|replace|attach|pragma|vacuum)\b/i;

const cell = (v: string | number | null) => (v === null ? 'NULL' : typeof v === 'number' ? String(Math.round(v * 100) / 100) : String(v).trim());
const rowKey = (r: (string | number | null)[]) => r.map(cell).join('␟');

export function compareSql(actual: SqlResult, expected: SqlResult, orderMatters: boolean): string[] {
  if (actual.columns.length !== expected.columns.length) return [`g.sqlColumns:${expected.columns.length}|${actual.columns.length}`];
  if (actual.rows.length !== expected.rows.length) return [`g.sqlRows:${expected.rows.length}|${actual.rows.length}`];
  const a = actual.rows.map(rowKey);
  const e = expected.rows.map(rowKey);
  if (orderMatters) {
    const i = a.findIndex((k, j) => k !== e[j]);
    if (i >= 0) return e.slice().sort().join() === a.slice().sort().join() ? ['g.sqlOrder'] : [`g.sqlValues:${i + 1}`];
    return [];
  }
  const sa = a.slice().sort();
  const se = e.slice().sort();
  return sa.every((k, j) => k === se[j]) ? [] : ['g.sqlValuesAny'];
}

/**
 * Runs the learner's query and the reference query on the main dataset AND on a hidden variant dataset.
 * A query that hard-codes the visible answer (e.g. SELECT 'Mitcham', 3) fails on the variant.
 */
export function gradeSql(run: SqlRunner, datasets: { id: string; setup: string }[], reference: string, query: string, orderMatters: boolean): GradeResult & { preview?: SqlResult; error?: string } {
  const q = query.trim().replace(/;\s*$/, '');
  if (!q) return { ...result([{ id: 'sql', ok: false, reasons: ['g.sqlEmpty'] }], query) };
  if (!READ_ONLY.test(q) || WRITE.test(q) || q.includes(';')) return { ...result([{ id: 'sql', ok: false, reasons: ['g.sqlReadOnly'] }], query) };
  const items: ItemFeedback[] = [];
  let preview: SqlResult | undefined;
  let error: string | undefined;
  for (const d of datasets) {
    const got = run(d.setup, q);
    const want = run(d.setup, reference);
    if ('error' in want) throw new Error('Reference query failed: ' + want.error);
    if ('error' in got) {
      error = got.error;
      items.push({ id: d.id, ok: false, reasons: ['g.sqlError'] });
      break;
    }
    if (!preview) preview = got;
    const reasons = compareSql(got, want, orderMatters);
    items.push({ id: d.id, ok: reasons.length === 0, reasons });
  }
  return { ...result(items, query), preview, error };
}

// ---------- JavaScript functions (executed for real) ----------
export interface CodeTest {
  id: string;
  args: unknown[];
  expect: unknown;
  /** For numbers: allowed absolute difference. */
  tol?: number;
  hidden?: boolean;
}
export interface CodeRun {
  id: string;
  ok: boolean;
  got?: string;
  error?: string;
}

const BANNED = /\b(fetch|XMLHttpRequest|importScripts|WebSocket|indexedDB|localStorage|navigator\.sendBeacon|eval)\b/;
export function codeStaticIssues(src: string, fnName: string): string[] {
  if (!src.trim()) return ['g.codeEmpty'];
  if (BANNED.test(src)) return ['g.codeBanned'];
  if (!new RegExp(`\\bfunction\\s+${fnName}\\s*\\(|\\b(const|let|var)\\s+${fnName}\\s*=`).test(src)) return [`g.codeNoFn:${fnName}`];
  return [];
}

/**
 * Self-contained: it is also serialised with Function.prototype.toString and run inside a Web Worker,
 * so it must not reference anything outside its own body.
 */
export function evaluateCode(src: string, fnName: string, tests: { id: string; args: unknown[]; expect: unknown; tol?: number }[]): { compileError?: string; runs: { id: string; ok: boolean; got?: string; error?: string }[] } {
  const show = (v: unknown) => {
    try {
      return v === undefined ? 'undefined' : JSON.stringify(v);
    } catch {
      return String(v);
    }
  };
  const equal = (a: unknown, b: unknown, tol?: number): boolean => {
    if (typeof a === 'number' && typeof b === 'number') return tol !== undefined ? Math.abs(a - b) <= tol : a === b || (Number.isNaN(a) && Number.isNaN(b));
    if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return a === b;
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    const ka = Object.keys(a as object);
    const kb = Object.keys(b as object);
    if (ka.length !== kb.length) return false;
    return ka.every((k) => equal((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], tol));
  };
  let fn: unknown;
  try {
    fn = new Function(`"use strict";\n${src}\n;return typeof ${fnName} === "function" ? ${fnName} : undefined;`)();
  } catch (e) {
    return { compileError: String((e as Error).message || e), runs: [] };
  }
  if (typeof fn !== 'function') return { compileError: 'not a function: ' + fnName, runs: [] };
  const runs = tests.map((t) => {
    try {
      const args = JSON.parse(JSON.stringify(t.args)) as unknown[];
      const got = (fn as (...a: unknown[]) => unknown)(...args);
      return { id: t.id, ok: equal(got, t.expect, t.tol), got: show(got) };
    } catch (e) {
      return { id: t.id, ok: false, error: String((e as Error).message || e) };
    }
  });
  return { runs };
}

export function gradeCodeRuns(src: string, fnName: string, tests: CodeTest[], out: { compileError?: string; runs: CodeRun[] } | 'timeout'): GradeResult & { runs: CodeRun[]; compileError?: string } {
  const pre = codeStaticIssues(src, fnName);
  if (pre.length) return { ...result([{ id: 'code', ok: false, reasons: pre }], src), runs: [] };
  if (out === 'timeout') return { ...result([{ id: 'code', ok: false, reasons: ['g.codeTimeout'] }], src), runs: [] };
  if (out.compileError) return { ...result([{ id: 'code', ok: false, reasons: ['g.codeCompile'] }], src), runs: [], compileError: out.compileError };
  const items = tests.map((t) => {
    const r = out.runs.find((x) => x.id === t.id);
    return { id: t.id, ok: !!r?.ok, reasons: r?.ok ? [] : [r?.error ? 'g.codeThrew' : 'g.codeWrong'] };
  });
  return { ...result(items, src), runs: out.runs };
}
