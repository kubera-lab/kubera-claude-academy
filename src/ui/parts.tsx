import { useEffect, useId, useMemo, useState } from 'react';
import { t, tReason } from '../i18n/index.ts';
import { lintInstructions, type Check } from '../engine/lint.ts';
import { respond, validateKB, type AssistantConfig, type KBEntry, type Reply } from '../engine/assistant.ts';
import { gradePasted, runSuite, type ControlResult, type TestCase, type TestCategory, type TestResult } from '../engine/testing.ts';
import type { ReplyKind } from '../engine/assistant.ts';
import type { ChoiceQuestion } from '../engine/quiz.ts';
import { gradeChoices } from '../engine/quiz.ts';
import { wordCount } from '../engine/text.ts';

export function Field(props: { label: string; value: string; onChange: (v: string) => void; area?: boolean; rows?: number; placeholder?: string; mono?: boolean }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{props.label}</label>
      {props.area ? (
        <textarea id={id} rows={props.rows ?? 4} value={props.value} placeholder={props.placeholder} className={props.mono ? 'mono' : ''} onChange={(e) => props.onChange(e.target.value)} />
      ) : (
        <input id={id} type="text" value={props.value} placeholder={props.placeholder} onChange={(e) => props.onChange(e.target.value)} />
      )}
    </div>
  );
}

export function Status({ ok, text }: { ok: boolean | null; text: string }) {
  const cls = ok === null ? 'pill' : ok ? 'pill good' : 'pill bad';
  return <span className={cls}>{text}</span>;
}

// ---------------- Quiz ----------------
export function Quiz(props: {
  questions: ChoiceQuestion[];
  answers: Record<string, number>;
  checked: boolean;
  onAnswer: (id: string, v: number) => void;
  onCheck: (score: number, total: number, wrong: string[]) => void;
  onRetry: () => void;
}) {
  const res = useMemo(() => gradeChoices(props.questions, props.answers), [props.questions, props.answers]);
  return (
    <div>
      {props.questions.map((q, qi) => {
        const st = res.perQuestion[q.id];
        return (
          <fieldset key={q.id} className="q" disabled={props.checked}>
            <legend>
              {qi + 1}. {q.prompt}
            </legend>
            {q.options.map((o, oi) => (
              <label key={oi} className={'opt' + (props.checked && oi === q.correct ? ' right' : '') + (props.checked && props.answers[q.id] === oi && oi !== q.correct ? ' wrongpick' : '')}>
                <input type="radio" name={q.id} checked={props.answers[q.id] === oi} onChange={() => props.onAnswer(q.id, oi)} />
                <span>{o}</span>
              </label>
            ))}
            {props.checked && (
              <p className={'fbline ' + (st === 'correct' ? 'good' : 'bad')} role="status">
                <b>{st === 'correct' ? t('module.correct') : st === 'missing' ? t('module.missing') : t('module.wrong')}</b> {q.why}
              </p>
            )}
          </fieldset>
        );
      })}
      <div className="row">
        {!props.checked ? (
          <button className="primary" onClick={() => props.onCheck(res.score, res.total, res.wrongIds)}>
            {t('module.check')}
          </button>
        ) : (
          <>
            <Status ok={res.score === res.total} text={t('module.score', { s: res.score, t: res.total })} />
            {res.score < res.total && <button onClick={props.onRetry}>{t('module.retry')}</button>}
          </>
        )}
      </div>
    </div>
  );
}

// ---------------- Instructions ----------------
export function CheckList({ checks }: { checks: Check[] }) {
  const req = checks.filter((c) => c.level === 'required');
  const qual = checks.filter((c) => c.level === 'quality');
  const item = (c: Check) => (
    <li key={c.id} className={c.pass ? 'ok' : 'no'}>
      <b>{t(c.label)}</b>
      {!c.pass && <span> — {t(c.fix)}</span>}
    </li>
  );
  return (
    <div className="checks">
      <div>
        <h4>{t('instr.required')}</h4>
        <ul>{req.map(item)}</ul>
      </div>
      <div>
        <h4>{t('instr.quality')}</h4>
        <ul>{qual.map(item)}</ul>
      </div>
    </div>
  );
}

export function InstructionEditor(props: { value: string; onChange: (v: string) => void; placeTerms: string[]; starter: string; onResult?: (passed: boolean) => void }) {
  const [checks, setChecks] = useState<Check[] | null>(null);
  const run = () => {
    const c = lintInstructions(props.value, { placeTerms: props.placeTerms });
    setChecks(c);
    props.onResult?.(c.every((x) => x.pass));
  };
  const passed = checks?.filter((c) => c.pass).length ?? 0;
  return (
    <div>
      <Field label={t('instr.label')} value={props.value} onChange={(v) => { props.onChange(v); setChecks(null); }} area rows={8} mono placeholder="You are ..." />
      <div className="row">
        <button className="primary" onClick={run}>{t('instr.run')}</button>
        {!props.value.trim() && <button onClick={() => props.onChange(props.starter)}>{t('instr.example')}</button>}
        <span className="muted small">{t('instr.words', { n: wordCount(props.value) })}</span>
        {checks && <Status ok={passed === checks.length} text={`${passed} / ${checks.length}`} />}
      </div>
      {checks && <CheckList checks={checks} />}
      <p className="muted small">{t('instr.note')}</p>
    </div>
  );
}

// ---------------- Knowledge base ----------------
export function KBEditor(props: { cfg: AssistantConfig; onChange: (cfg: AssistantConfig) => void; editFacts?: boolean; onValidated?: (ok: boolean) => void }) {
  const [shown, setShown] = useState(false);
  const issues = useMemo(() => validateKB(props.cfg), [props.cfg]);
  const set = (i: number, patch: Partial<KBEntry>) => props.onChange({ ...props.cfg, kb: props.cfg.kb.map((e, j) => (j === i ? { ...e, ...patch } : e)) });
  const add = () => {
    let n = props.cfg.kb.length + 1;
    while (props.cfg.kb.some((e) => e.id === 'e' + n)) n++;
    props.onChange({ ...props.cfg, kb: [...props.cfg.kb, { id: 'e' + n, question: '', keywords: '', answer: '', source: 0 }] });
    setShown(false);
  };
  return (
    <div>
      {props.editFacts ? (
        <Field label={t('kb.facts')} value={props.cfg.facts} onChange={(v) => props.onChange({ ...props.cfg, facts: v })} area rows={6} mono />
      ) : (
        <pre className="facts">{props.cfg.facts}</pre>
      )}
      <h4>{t('kb.title')}</h4>
      {props.cfg.kb.map((e, i) => {
        const mine = shown ? issues.filter((x) => x.entryId === e.id) : [];
        return (
          <div key={e.id + i} className={'kb' + (mine.length ? ' haserr' : '')}>
            <div className="kbhead">
              <code>{e.id}</code>
              <button className="ghost small" onClick={() => props.onChange({ ...props.cfg, kb: props.cfg.kb.filter((_, j) => j !== i) })}>{t('kb.remove')}</button>
            </div>
            <div className="grid2">
              <Field label={t('kb.question')} value={e.question} onChange={(v) => set(i, { question: v })} />
              <Field label={t('kb.keywords')} value={e.keywords} onChange={(v) => set(i, { keywords: v })} />
            </div>
            <div className="grid-ans">
              <Field label={t('kb.answer')} value={e.answer} onChange={(v) => set(i, { answer: v })} area rows={2} />
              <Field label={t('kb.source')} value={e.source ? String(e.source) : ''} onChange={(v) => set(i, { source: Number(v.replace(/\D/g, '')) || 0 })} />
            </div>
            {mine.length > 0 && (
              <ul className="errs">
                {mine.map((m, k) => (
                  <li key={k}>{t(m.key, { d: m.detail ?? '' })}</li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
      <div className="row">
        <button onClick={add}>{t('kb.add')}</button>
        <button className="primary" onClick={() => { setShown(true); props.onValidated?.(issues.length === 0); }}>{t('kb.validate')}</button>
        {shown && <Status ok={issues.length === 0} text={issues.length === 0 ? t('kb.valid') : t('kb.issues', { n: issues.length })} />}
      </div>
    </div>
  );
}

// ---------------- Chat ----------------
export function ChatBox({ cfg }: { cfg: AssistantConfig }) {
  const id = useId();
  const [q, setQ] = useState('');
  const [log, setLog] = useState<{ q: string; r: Reply }[]>([]);
  const ask = () => {
    if (!q.trim()) return;
    setLog((l) => [{ q, r: respond(cfg, q) }, ...l].slice(0, 8));
    setQ('');
  };
  return (
    <div className="chat">
      <h4>{t('chat.title')}</h4>
      <p className="muted small">{t('chat.offline')}</p>
      <form className="row" onSubmit={(e) => { e.preventDefault(); ask(); }}>
        <label htmlFor={id} className="sr">{t('chat.placeholder')}</label>
        <input id={id} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('chat.placeholder')} />
        <button className="primary" type="submit">{t('chat.send')}</button>
      </form>
      <div aria-live="polite">
        {log.map((m, i) => (
          <div key={i} className="msg">
            <div className="you">{m.q}</div>
            <div className="bot">{m.r.text}</div>
            <details>
              <summary>
                {t('chat.trace')}: {t('chat.kind.' + m.r.kind, { s: m.r.source ?? '' })}
              </summary>
              <ul className="small mono">{m.r.trace.map((x, k) => <li key={k}>{x}</li>)}</ul>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------- Config fields ----------------
export function ConfigFields({ cfg, onChange, withName }: { cfg: AssistantConfig; onChange: (c: AssistantConfig) => void; withName?: boolean }) {
  return (
    <div className="stack">
      {withName && (
        <div className="grid2">
          <Field label={t('cfg.name')} value={cfg.name} onChange={(v) => onChange({ ...cfg, name: v })} />
          <Field label={t('cfg.purpose')} value={cfg.purpose} onChange={(v) => onChange({ ...cfg, purpose: v })} />
        </div>
      )}
      <Field label={t('cfg.unknownReply')} value={cfg.unknownReply} onChange={(v) => onChange({ ...cfg, unknownReply: v })} />
      <div className="grid2">
        <Field label={t('cfg.oosTopics')} value={cfg.outOfScopeTopics} onChange={(v) => onChange({ ...cfg, outOfScopeTopics: v })} />
        <Field label={t('cfg.oosReply')} value={cfg.outOfScopeReply} onChange={(v) => onChange({ ...cfg, outOfScopeReply: v })} />
      </div>
    </div>
  );
}

// ---------------- Tests ----------------
const CATS: TestCategory[] = ['normal', 'unclear', 'missing', 'wrong_assumption', 'out_of_scope'];
const KINDS: ReplyKind[] = ['answer', 'unknown', 'out_of_scope', 'clarify'];

export function TestEditor({ tests, onChange }: { tests: TestCase[]; onChange: (t: TestCase[]) => void }) {
  const set = (i: number, p: Partial<TestCase>) => onChange(tests.map((x, j) => (j === i ? { ...x, ...p } : x)));
  const add = () => {
    let n = tests.length + 1;
    while (tests.some((x) => x.id === 'T' + n)) n++;
    onChange([...tests, { id: 'T' + n, category: 'normal', input: '', expectKind: 'answer', mustContain: '', mustNotContain: '' }]);
  };
  return (
    <div>
      {tests.map((tc, i) => (
        <div key={tc.id} className="kb">
          <div className="kbhead">
            <code>{tc.id}</code>
            <button className="ghost small" onClick={() => onChange(tests.filter((_, j) => j !== i))}>{t('kb.remove')}</button>
          </div>
          <Field label={t('tests.input')} value={tc.input} onChange={(v) => set(i, { input: v })} />
          <div className="grid4">
            <Select label={t('tests.category')} value={tc.category} options={CATS.map((c) => [c, t('cat.' + c)])} onChange={(v) => set(i, { category: v as TestCategory })} />
            <Select label={t('tests.expect')} value={tc.expectKind} options={KINDS.map((k) => [k, t('kind.' + k)])} onChange={(v) => set(i, { expectKind: v as ReplyKind })} />
            <Field label={t('tests.contain')} value={tc.mustContain} onChange={(v) => set(i, { mustContain: v })} />
            <Field label={t('tests.notContain')} value={tc.mustNotContain} onChange={(v) => set(i, { mustNotContain: v })} />
          </div>
        </div>
      ))}
      <button onClick={add}>{t('tests.add')}</button>
    </div>
  );
}

export function Select(props: { label: string; value: string; options: [string, string][]; onChange: (v: string) => void }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{props.label}</label>
      <select id={id} value={props.value} onChange={(e) => props.onChange(e.target.value)}>
        {props.options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </div>
  );
}

export function TestRunner({ cfg, tests, onRun }: { cfg: AssistantConfig; tests: TestCase[]; onRun?: (r: TestResult[]) => void }) {
  const [results, setResults] = useState<TestResult[] | null>(null);
  // results describe one exact configuration: any change makes them stale
  useEffect(() => setResults(null), [cfg, tests]);
  const run = () => {
    const r = runSuite(cfg, tests);
    setResults(r);
    onRun?.(r);
  };
  const p = results?.filter((r) => r.pass).length ?? 0;
  return (
    <div>
      <div className="row">
        <button className="primary" onClick={run}>{t('tests.run')}</button>
        <Status ok={results ? p === results.length && results.length > 0 : null} text={results ? t('tests.passed', { p, t: results.length }) : t('tests.notRun')} />
      </div>
      {results && <ResultsTable tests={tests} results={results} />}
    </div>
  );
}

export function ResultsTable({ tests, results }: { tests: TestCase[]; results: TestResult[] }) {
  return (
    <div className="tablewrap">
      <table>
        <thead>
          <tr><th>ID</th><th>{t('tests.category')}</th><th>{t('tests.input')}</th><th>{t('tests.reply')}</th><th>Result</th></tr>
        </thead>
        <tbody>
          {results.map((r) => {
            const tc = tests.find((x) => x.id === r.id);
            if (!tc) return null;
            return (
              <tr key={r.id} className={r.pass ? 'rowok' : 'rowno'}>
                <td><code>{r.id}</code></td>
                <td>{t('cat.' + tc.category)}</td>
                <td>{tc.input}</td>
                <td>{r.reply}</td>
                <td>
                  <b className={r.pass ? 'okc' : 'noc'}>{r.pass ? 'PASS' : 'FAIL'}</b>
                  {!r.pass && <ul className="small">{r.reasons.map((x, k) => <li key={k}>{tReason(x)}</li>)}</ul>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---------------- Real model, by hand ----------------
export function promptForRealModel(cfg: AssistantConfig): string {
  return `${cfg.instructions.trim()}

FACT SHEET
${cfg.facts.trim()}

If a question is about: ${cfg.outOfScopeTopics || '(none listed)'} — reply exactly: "${cfg.outOfScopeReply}"
If the answer is not in the fact sheet — reply: "${cfg.unknownReply}"`;
}

export function RealModelPanel(props: {
  cfg: AssistantConfig;
  tests: TestCase[];
  pasted: Record<string, string>;
  modelName: string;
  onChange: (pasted: Record<string, string>, modelName: string) => void;
}) {
  const [graded, setGraded] = useState<Record<string, TestResult>>({});
  const [msg, setMsg] = useState('');
  const results = Object.values(graded);
  return (
    <details className="real">
      <summary>{t('real.title')}</summary>
      <p className="small">{t('real.text')}</p>
      <div className="row">
        <CopyButton text={promptForRealModel(props.cfg)} label={t('real.copyPrompt')} onMsg={setMsg} />
        <span className="small muted">{msg}</span>
      </div>
      <Field label={t('real.model')} value={props.modelName} onChange={(v) => props.onChange(props.pasted, v)} />
      {props.tests.map((tc) => (
        <div key={tc.id} className="kb">
          <div className="small"><code>{tc.id}</code> {tc.input} <span className="muted">→ {t('kind.' + tc.expectKind)}</span></div>
          <Field label={t('real.paste')} value={props.pasted[tc.id] ?? ''} onChange={(v) => props.onChange({ ...props.pasted, [tc.id]: v }, props.modelName)} area rows={2} />
          <div className="row">
            <button onClick={() => setGraded((g) => ({ ...g, [tc.id]: gradePasted(props.pasted[tc.id] ?? '', tc, props.cfg.maxWords) }))}>{t('real.grade')}</button>
            {graded[tc.id] && <Status ok={graded[tc.id].pass} text={graded[tc.id].pass ? 'PASS' : 'FAIL'} />}
          </div>
          {graded[tc.id] && !graded[tc.id].pass && <ul className="small errs">{graded[tc.id].reasons.map((x, k) => <li key={k}>{tReason(x)}</li>)}</ul>}
        </div>
      ))}
      <p className="small">{results.length ? t('real.summary', { p: results.filter((r) => r.pass).length, t: results.length }) : t('real.none')}</p>
    </details>
  );
}

export function CopyButton({ text, label, onMsg }: { text: string; label?: string; onMsg: (m: string) => void }) {
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          onMsg(t('export.copied'));
        } catch {
          onMsg(t('export.copyFail'));
        }
      }}
    >
      {label ?? t('export.copy')}
    </button>
  );
}

export function ControlTable({ control }: { control: ControlResult[] }) {
  return (
    <div className="ctrl">
      <h3>{t('ctrl.title')}</h3>
      <p className="small muted">{t('ctrl.text')}</p>
      <div className="tablewrap">
        <table>
          <thead><tr><th>ID</th><th>Check</th><th>{t('tests.input')}</th><th>{t('tests.reply')}</th><th>Result</th></tr></thead>
          <tbody>
            {control.map((c) => (
              <tr key={c.id} className={c.pass ? 'rowok' : 'rowno'}>
                <td><code>{c.id}</code></td>
                <td>{t(c.key, { d: c.detail ?? '' })}</td>
                <td>{c.input ?? '—'}</td>
                <td>{c.reply ?? '—'}</td>
                <td><b className={c.pass ? 'okc' : 'noc'}>{c.pass ? 'PASS' : 'FAIL'}</b></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
