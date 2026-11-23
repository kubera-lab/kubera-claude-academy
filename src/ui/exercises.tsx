// Interactive exercises for the generic lessons. Grading is in src/engine/grade.ts (pure, unit-tested).
import { Suspense, lazy, useEffect, useState } from 'react';
import { t, tReason } from '../i18n/index.ts';
import { tx, type Exercise, type Lang, type Lesson } from '../content/types.ts';
import {
  gradeChoice, gradeClassify, gradeCodeRuns, gradeManual, gradeNumeric, gradeOrder, gradeSql, hashOf,
  type ClassifyAnswer, type CodeRun, type GradeResult, type SqlResult,
} from '../engine/grade.ts';
import { lintInstructions } from '../engine/lint.ts';
import { subjectTerms } from '../engine/project.ts';
import { getRunner } from '../runtime/sqlRunner.ts';
import { runInWorker } from '../runtime/code.ts';
import type { LessonProgress } from '../state.ts';
import { CheckList, Status } from './parts.tsx';

// Course tools load only when their lesson opens (separate bundles).
const CsvTool = lazy(() => import('./tools/CsvTool.tsx'));
const GeoTool = lazy(() => import('./tools/GeoTool.tsx'));
const WebTool = lazy(() => import('./tools/WebTool.tsx'));
const SqlReportTool = lazy(() => import('./tools/SqlReportTool.tsx'));
const SafetyTool = lazy(() => import('./tools/SafetyTool.tsx'));
const AbTool = lazy(() => import('./tools/AbTool.tsx'));
const TraceTool = lazy(() => import('./tools/TraceTool.tsx'));

export interface ExerciseProps {
  lesson: Lesson;
  lang: Lang;
  progress: LessonProgress | undefined;
  onAnswer: (answer: unknown) => void;
  onGraded: (r: GradeResult) => void;
}

export function initialAnswer(ex: Exercise): unknown {
  switch (ex.kind) {
    case 'choice': return {};
    case 'classify': return { labels: {}, evidence: {} } as ClassifyAnswer;
    case 'order': return ex.steps.map((s) => s.id);
    case 'sql': return ex.starter;
    case 'code': return ex.starter;
    case 'prompt': return ex.starter;
    // null = the tool starts from its own practice file (tools and their data load lazily).
    case 'tool': return null;
    default: return '';
  }
}

/** Result banner shared by all exercise types. Shows a warning when the work changed after the last check. */
function ResultBar({ p, version, extra }: { p: LessonProgress | undefined; version: number; extra?: React.ReactNode }) {
  const r = p?.result;
  if (!r) return null;
  const stale = r.v !== version || r.hash !== hashOf(p!.answer);
  if (stale) return <p className="note" role="status">{t('ex.stale')}</p>;
  const text = r.outcome === 'manual' ? t('ex.manual') : r.outcome === 'passed' ? t('ex.passed', { s: r.score, t: r.total }) : t('ex.failed', { s: r.score, t: r.total });
  return (
    <div className="row" role="status">
      <Status ok={r.outcome === 'passed' ? true : r.outcome === 'manual' ? null : false} text={text} />
      {extra}
    </div>
  );
}

const fresh = (p: LessonProgress | undefined, version: number) => !!p?.result && p.result.v === version && p.result.hash === hashOf(p.answer);
const itemOf = (p: LessonProgress | undefined, id: string) => p?.result?.items.find((i) => i.id === id);
const Reasons = ({ reasons }: { reasons: string[] }) => <>{reasons.map((r) => <span key={r} className="reason">{tReason(r)} </span>)}</>;

export function ExerciseView(props: ExerciseProps) {
  const ex = props.lesson.exercise;
  switch (ex.kind) {
    case 'choice': return <ChoiceEx {...props} ex={ex} />;
    case 'classify': return <ClassifyEx {...props} ex={ex} />;
    case 'order': return <OrderEx {...props} ex={ex} />;
    case 'numeric': return <NumericEx {...props} ex={ex} />;
    case 'sql': return <SqlEx {...props} ex={ex} />;
    case 'code': return <CodeEx {...props} ex={ex} />;
    case 'prompt': return <PromptEx {...props} ex={ex} />;
    case 'manual': return <ManualEx {...props} ex={ex} />;
    case 'tool': return <ToolEx {...props} ex={ex} />;
  }
}

// ---------- course tools (final projects of courses 5–8) ----------
function ToolEx({ ex, lang, progress, onAnswer, onGraded, lesson }: P<'tool'>) {
  const answer = progress?.answer ?? initialAnswer(ex);
  const common = { lang, onGraded };
  return (
    <div>
      <p><b>{tx(ex.task, lang)}</b></p>
      <Suspense fallback={<p className="small muted" role="status">{lang === 'ru' ? 'Загрузка инструмента…' : 'Loading the tool…'}</p>}>
        {ex.tool === 'csv' && <CsvTool {...common} answer={answer as string | null} onAnswer={onAnswer} />}
        {ex.tool === 'geojson' && <GeoTool {...common} answer={answer as string | null} onAnswer={onAnswer} />}
        {ex.tool === 'web' && <WebTool {...common} answer={answer as string | null} onAnswer={onAnswer} />}
        {ex.tool === 'sqlreport' && <SqlReportTool {...common} answer={answer as never} onAnswer={onAnswer} />}
        {ex.tool === 'safety' && <SafetyTool {...common} answer={answer as never} onAnswer={onAnswer} />}
        {ex.tool === 'abtest' && <AbTool {...common} answer={answer as never} onAnswer={onAnswer} />}
        {ex.tool === 'trace' && <TraceTool {...common} answer={answer as never} onAnswer={onAnswer} />}
      </Suspense>
      <ResultBar p={progress} version={lesson.v} />
    </div>
  );
}

type P<K extends Exercise['kind']> = ExerciseProps & { ex: Extract<Exercise, { kind: K }> };

// ---------- choice ----------
function ChoiceEx({ ex, lang, progress, onAnswer, onGraded, lesson }: P<'choice'>) {
  const ans = (progress?.answer ?? {}) as Record<string, number>;
  const shown = fresh(progress, lesson.v);
  // Warm-ups explain every answer right away; graded quizzes wait for a second attempt.
  const reveal = ex.warmup || (progress?.attempts ?? 0) >= 2;
  return (
    <div>
      {ex.questions.map((q, qi) => {
        const fb = shown ? itemOf(progress, q.id) : undefined;
        return (
          <fieldset key={q.id} className="q">
            <legend>{qi + 1}. {tx(q.prompt, lang)}</legend>
            {q.options.map((o, oi) => (
              <label key={oi} className={'opt' + (fb && oi === q.correct && fb.ok ? ' right' : '') + (fb && !fb.ok && ans[q.id] === oi ? ' wrongpick' : '')}>
                <input type="radio" name={lesson.id + q.id} checked={ans[q.id] === oi} onChange={() => onAnswer({ ...ans, [q.id]: oi })} />
                <span>{tx(o, lang)}</span>
              </label>
            ))}
            {fb && (
              <p className={'fbline ' + (fb.ok ? 'good' : 'bad')}>
                <b>{fb.ok ? t('module.correct') : fb.reasons.includes('g.missing') ? t('module.missing') : t('module.wrong')}</b> {fb.ok || reveal ? tx(q.why, lang) : t('ex.thinkAgain')}
              </p>
            )}
          </fieldset>
        );
      })}
      <div className="row">
        <button className="primary" onClick={() => onGraded(gradeChoice(ex.questions, ans))}>{t('module.check')}</button>
        {shown && progress?.result?.outcome === 'failed' && (
          <button onClick={() => onAnswer(Object.fromEntries(Object.entries(ans).filter(([k]) => itemOf(progress, k)?.ok)))}>{t('ex.clearWrong')}</button>
        )}
      </div>
      <ResultBar p={progress} version={lesson.v} />
    </div>
  );
}

// ---------- classify (with optional evidence) ----------
function ClassifyEx({ ex, lang, progress, onAnswer, onGraded, lesson }: P<'classify'>) {
  const ans = (progress?.answer ?? { labels: {}, evidence: {} }) as ClassifyAnswer;
  const shown = fresh(progress, lesson.v);
  const reveal = (progress?.attempts ?? 0) >= 2;
  const setLabel = (id: string, v: string) => onAnswer({ ...ans, labels: { ...ans.labels, [id]: v } });
  const setEv = (id: string, v: string) => onAnswer({ ...ans, evidence: { ...(ans.evidence ?? {}), [id]: v } });
  return (
    <div>
      <p>{tx(ex.intro, lang)}</p>
      {ex.items.map((it, i) => {
        const fb = shown ? itemOf(progress, it.id) : undefined;
        const labelWrong = fb?.reasons.includes('g.wrongLabel');
        return (
          <fieldset key={it.id} className="qa">
            <legend>{i + 1}. <span className="mono">{tx(it.text, lang)}</span></legend>
            <div className="chips" role="radiogroup">
              {ex.labels.map((lb) => (
                <label key={lb.id} className="chip">
                  <input type="radio" name={lesson.id + it.id} checked={ans.labels[it.id] === lb.id} onChange={() => setLabel(it.id, lb.id)} />
                  {tx(lb.label, lang)}
                </label>
              ))}
            </div>
            {it.evidence && (
              <div className="field">
                <label htmlFor={lesson.id + it.id + 'ev'}>{t('ex.evidence')}</label>
                <input id={lesson.id + it.id + 'ev'} value={ans.evidence?.[it.id] ?? ''} onChange={(e) => setEv(it.id, e.target.value)} placeholder={t('ex.evidencePh')} />
              </div>
            )}
            {fb && (
              <p className={'fbline ' + (fb.ok ? 'good' : 'bad')}>
                <b>{fb.ok ? t('module.correct') : t('module.wrong')}</b>{' '}
                {labelWrong ? (reveal ? t('ex.rightLabel', { l: tx(ex.labels.find((x) => x.id === it.correct)!.label, lang) }) + ' ' + tx(it.why, lang) : t('ex.thinkAgain')) : tx(it.why, lang)}{' '}
                {!fb.ok && <Reasons reasons={fb.reasons.filter((r) => r !== 'g.wrongLabel')} />}
              </p>
            )}
          </fieldset>
        );
      })}
      <div className="row">
        <button className="primary" onClick={() => onGraded(gradeClassify(ex.items, ans))}>{t('module.check')}</button>
      </div>
      <ResultBar p={progress} version={lesson.v} />
    </div>
  );
}

// ---------- order ----------
function OrderEx({ ex, lang, progress, onAnswer, onGraded, lesson }: P<'order'>) {
  const order = (progress?.answer as string[] | undefined) ?? ex.steps.map((s) => s.id);
  const shown = fresh(progress, lesson.v);
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= order.length) return;
    const next = order.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onAnswer(next);
  };
  return (
    <div>
      <p>{tx(ex.intro, lang)}</p>
      <ol className="order">
        {order.map((id, i) => {
          const s = ex.steps.find((x) => x.id === id)!;
          const fb = shown ? itemOf(progress, ex.correct[i]) : undefined;
          return (
            <li key={id} className={fb ? (fb.ok ? 'ok' : 'no') : ''}>
              <span>{tx(s.text, lang)}</span>
              <span className="row tight">
                <button aria-label={t('ex.up', { n: i + 1 })} disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
                <button aria-label={t('ex.down', { n: i + 1 })} disabled={i === order.length - 1} onClick={() => move(i, 1)}>↓</button>
              </span>
            </li>
          );
        })}
      </ol>
      <div className="row"><button className="primary" onClick={() => onGraded(gradeOrder(ex.correct, order))}>{t('module.check')}</button></div>
      <ResultBar p={progress} version={lesson.v} />
      {shown && <p className={'fbline ' + (progress?.result?.outcome === 'passed' ? 'good' : 'bad')}>{progress?.result?.outcome === 'passed' ? tx(ex.why, lang) : t('ex.orderHint')}</p>}
    </div>
  );
}

// ---------- numeric ----------
function NumericEx({ ex, lang, progress, onAnswer, onGraded, lesson }: P<'numeric'>) {
  const v = (progress?.answer as string) ?? '';
  return (
    <div>
      <p>{tx(ex.task, lang)}</p>
      <div className="field"><label htmlFor={lesson.id + 'num'}>{t('ex.yourAnswer')} ({ex.unit})</label><input id={lesson.id + 'num'} inputMode="decimal" value={v} onChange={(e) => onAnswer(e.target.value)} /></div>
      <div className="row"><button className="primary" onClick={() => onGraded(gradeNumeric(ex.answer, ex.tolerance, v))}>{t('module.check')}</button></div>
      <ResultBar p={progress} version={lesson.v} />
    </div>
  );
}

// ---------- SQL (real SQLite in the browser) ----------

function ResultTable({ r }: { r: SqlResult }) {
  if (!r.columns.length) return <p className="small muted">{t('sql.noRows')}</p>;
  return (
    <div className="tablewrap">
      <table className="results">
        <thead><tr>{r.columns.map((c, i) => <th key={i} scope="col">{c}</th>)}</tr></thead>
        <tbody>{r.rows.map((row, i) => <tr key={i}>{row.map((v, j) => <td key={j}>{v === null ? 'NULL' : String(v)}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function SqlEx({ ex, lang, progress, onAnswer, onGraded, lesson }: P<'sql'>) {
  const q = (progress?.answer as string) ?? ex.starter;
  const [preview, setPreview] = useState<SqlResult | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loadErr, setLoadErr] = useState(false);
  const shown = fresh(progress, lesson.v);
  const run = async (grade: boolean) => {
    setBusy(true);
    setError('');
    try {
      const runner = await getRunner();
      if (grade) {
        const r = gradeSql(runner, ex.datasets, ex.reference, q, ex.orderMatters);
        setPreview(r.preview ?? null);
        setError(r.error ?? '');
        onGraded(r);
      } else {
        const r = runner(ex.datasets[0].setup, q.trim().replace(/;\s*$/, ''));
        if ('error' in r) { setError(r.error); setPreview(null); } else setPreview(r);
      }
    } catch {
      setLoadErr(true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <p><b>{tx(ex.task, lang)}</b></p>
      <p className="small muted mono">{tx(ex.schema, lang)}</p>
      <div className="field">
        <label htmlFor={lesson.id + 'sql'}>{t('sql.query')}</label>
        <textarea id={lesson.id + 'sql'} className="mono" rows={6} spellCheck={false} value={q} onChange={(e) => onAnswer(e.target.value)} />
      </div>
      <div className="row">
        <button onClick={() => run(false)} disabled={busy}>{t('sql.run')}</button>
        <button className="primary" onClick={() => run(true)} disabled={busy}>{t('sql.check')}</button>
        <details className="small"><summary>{t('ex.hint')}</summary><p className="mono">{tx(ex.hint, lang)}</p></details>
      </div>
      <p className="small muted">{t('sql.note')}</p>
      {loadErr && <p className="fbline bad" role="alert">{t('sql.loadFail')}</p>}
      {error && <p className="fbline bad" role="alert">{t('sql.error')}: <code>{error}</code></p>}
      {preview && <ResultTable r={preview} />}
      {shown && progress?.result?.items.map((it) => (
        <p key={it.id} className={'fbline ' + (it.ok ? 'good' : 'bad')}><b>{t('sql.ds.' + it.id)}:</b> {it.ok ? t('sql.match') : <Reasons reasons={it.reasons} />}</p>
      ))}
      <ResultBar p={progress} version={lesson.v} />
    </div>
  );
}

// ---------- JavaScript (real execution in a Web Worker) ----------
function CodeEx({ ex, lang, progress, onAnswer, onGraded, lesson }: P<'code'>) {
  const src = (progress?.answer as string) ?? ex.starter;
  const [runs, setRuns] = useState<{ hash: string; runs: CodeRun[]; compileError?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const shown = fresh(progress, lesson.v);
  useEffect(() => { if (runs && runs.hash !== hashOf(src)) setRuns(null); }, [src]); // eslint-disable-line react-hooks/exhaustive-deps
  const run = async () => {
    setBusy(true);
    const out = await runInWorker(src, ex.fnName, ex.tests);
    const r = gradeCodeRuns(src, ex.fnName, ex.tests, out);
    setRuns({ hash: hashOf(src), runs: r.runs, compileError: r.compileError });
    setBusy(false);
    onGraded(r);
  };
  const pre = shown ? progress?.result?.items.find((i) => i.id === 'code') : undefined;
  return (
    <div>
      <p><b>{tx(ex.task, lang)}</b></p>
      <div className="field">
        <label htmlFor={lesson.id + 'code'}>{t('code.editor')}</label>
        <textarea id={lesson.id + 'code'} className="mono" rows={12} spellCheck={false} value={src} onChange={(e) => onAnswer(e.target.value)} />
        <span className="small muted">{t('code.tabNote')}</span>
      </div>
      <div className="row">
        <button className="primary" onClick={run} disabled={busy}>{busy ? t('code.running') : t('code.run')}</button>
        <details className="small"><summary>{t('ex.hint')}</summary><p className="mono">{tx(ex.hint, lang)}</p></details>
      </div>
      <p className="small muted">{t('code.note')}</p>
      {pre && <p className="fbline bad" role="alert"><Reasons reasons={pre.reasons} />{runs?.compileError ? <code> {runs.compileError}</code> : null}</p>}
      {shown && runs && runs.runs.length > 0 && (
        <ul className="tests">
          {ex.tests.map((tc) => {
            const r = runs.runs.find((x) => x.id === tc.id);
            return (
              <li key={tc.id} className={r?.ok ? 'ok' : 'no'}>
                <span>{tc.hidden ? '🔒 ' : ''}{tx(tc.label, lang)}</span>
                {!tc.hidden && !r?.ok && <span className="small mono"> — {t('code.expected')} {JSON.stringify(tc.expect)}, {t('code.got')} {r?.error ? t('code.error') + ': ' + r.error : r?.got}</span>}
                {tc.hidden && !r?.ok && <span className="small"> — {r?.error ? t('code.error') + ': ' + r.error : t('code.hiddenFail')}</span>}
              </li>
            );
          })}
        </ul>
      )}
      <ResultBar p={progress} version={lesson.v} />
    </div>
  );
}

// ---------- system prompt (same checker as course 3) ----------
function PromptEx({ ex, lang, progress, onAnswer, onGraded, lesson }: P<'prompt'>) {
  const text = (progress?.answer as string) ?? ex.starter;
  const shown = fresh(progress, lesson.v);
  const checks = lintInstructions(text, { placeTerms: subjectTerms(ex.subject) });
  const check = () => {
    const items = checks.map((c) => ({ id: c.id, ok: c.pass, reasons: c.pass ? [] : [c.fix] }));
    const score = items.filter((i) => i.ok).length;
    onGraded({ outcome: score === items.length ? 'passed' : 'failed', score, total: items.length, items, hash: hashOf(text) });
  };
  return (
    <div>
      <p><b>{tx(ex.task, lang)}</b></p>
      <div className="field">
        <label htmlFor={lesson.id + 'pr'}>{t('instr.label')}</label>
        <textarea id={lesson.id + 'pr'} rows={8} value={text} onChange={(e) => onAnswer(e.target.value)} lang="en" />
        <span className="small muted">{t('instr.words', { n: (text.trim().match(/\S+/g) ?? []).length })}</span>
      </div>
      <div className="row"><button className="primary" onClick={check}>{t('instr.run')}</button></div>
      {shown && <CheckList checks={checks} />}
      <p className="small muted">{t('instr.note')}</p>
      <ResultBar p={progress} version={lesson.v} />
    </div>
  );
}

// ---------- open task (human review) ----------
function ManualEx({ ex, lang, progress, onAnswer, onGraded, lesson }: P<'manual'>) {
  const text = (progress?.answer as string) ?? '';
  return (
    <div>
      <p><b>{tx(ex.task, lang)}</b></p>
      <ul>{ex.checklist.map((c, i) => <li key={i}>{tx(c, lang)}</li>)}</ul>
      <div className="field"><label htmlFor={lesson.id + 'man'}>{t('ex.yourAnswer')}</label><textarea id={lesson.id + 'man'} rows={8} value={text} onChange={(e) => onAnswer(e.target.value)} /></div>
      <div className="row"><button className="primary" onClick={() => onGraded(gradeManual(text, ex.minWords))}>{t('ex.submitManual')}</button></div>
      <ResultBar p={progress} version={lesson.v} />
    </div>
  );
}
