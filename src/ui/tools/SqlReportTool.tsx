// Course 6 final project: SQL Report Builder on a real SQLite database in the browser.
import { useState } from 'react';
import type { Lang } from '../../content/types.ts';
import type { GradeResult, SqlResult } from '../../engine/grade.ts';
import { REPORT_TASKS, buildSqlFile, buildSqlMarkdown, explainSqlError, gradeReportTask, type ReportEntry } from '../../engine/tools/sqlreport.ts';
import { getRunner } from '../../runtime/sqlRunner.ts';
import { downloadText, safeName } from '../download.ts';
import { COMMON, LabChecks, l, toGrade, tr, type L } from './common.tsx';

export interface SqlReportAnswer { title: string; note: string; queries: Record<string, string> }
export const emptyReport = (): SqlReportAnswer => ({ title: 'Area price report', note: '', queries: Object.fromEntries(REPORT_TASKS.map((t) => [t.id, ''])) });

const REASON: Record<string, L> = {
  'g.sqlEmpty': l('Write a query first.', 'Сначала напишите запрос.'),
  'g.sqlReadOnly': l('Only one SELECT query is allowed. The practice database is protected: INSERT, UPDATE, DELETE, DROP and several statements are refused.', 'Разрешён один запрос SELECT. Учебная база защищена: INSERT, UPDATE, DELETE, DROP и несколько команд подряд не выполняются.'),
  'g.sqlOrder': l('Right rows, wrong order. Check ORDER BY.', 'Строки верные, порядок нет. Проверьте ORDER BY.'),
  'g.sqlValuesAny': l('Some values differ from the expected result.', 'Часть значений отличается от ожидаемого результата.'),
  'g.sqlError': l('The query stopped with an error (see the explanation).', 'Запрос остановился с ошибкой (см. объяснение).'),
};
const reasonText = (r: string, lang: Lang) => {
  const [k, v] = r.split(':');
  if (k === 'g.sqlColumns') { const [want, got] = v.split('|'); return lang === 'ru' ? `Нужно столбцов: ${want}, у вас: ${got}.` : `Expected ${want} column(s), got ${got}.`; }
  if (k === 'g.sqlRows') { const [want, got] = v.split('|'); return lang === 'ru' ? `Нужно строк: ${want}, у вас: ${got}.` : `Expected ${want} row(s), got ${got}.`; }
  if (k === 'g.sqlValues') return lang === 'ru' ? `Строка ${v} отличается.` : `Row ${v} differs.`;
  return tr(REASON[k] ?? l(r, r), lang);
};

function Table({ r }: { r: SqlResult }) {
  return (
    <div className="tablewrap">
      <table className="tbl">
        <thead><tr>{r.columns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
        <tbody>{r.rows.map((row, i) => <tr key={i}>{row.map((v, j) => <td key={j}>{v === null ? 'NULL' : String(v)}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

export default function SqlReportTool({ lang, answer, onAnswer, onGraded }: { lang: Lang; answer: SqlReportAnswer | null; onAnswer: (a: SqlReportAnswer) => void; onGraded: (r: GradeResult) => void }) {
  const a: SqlReportAnswer = { ...emptyReport(), ...answer, queries: { ...emptyReport().queries, ...(answer?.queries ?? {}) } };
  const [out, setOut] = useState<Record<string, { result?: SqlResult; error?: string; reasons: string[]; passed: boolean } | undefined>>({});
  const [busy, setBusy] = useState(false);
  const [loadErr, setLoadErr] = useState(false);
  const [msg, setMsg] = useState('');
  const setQ = (id: string, v: string) => onAnswer({ ...a, queries: { ...a.queries, [id]: v } });

  const runOne = async (id: string) => {
    setBusy(true);
    try {
      const run = await getRunner();
      const t = REPORT_TASKS.find((x) => x.id === id)!;
      const g = gradeReportTask(run, t, a.queries[id] ?? '');
      setOut((o) => ({ ...o, [id]: { result: g.preview, error: g.error, reasons: g.items.flatMap((x) => x.reasons), passed: g.outcome === 'passed' } }));
    } catch { setLoadErr(true); } finally { setBusy(false); }
  };
  const runAll = async (): Promise<ReportEntry[] | null> => {
    setBusy(true);
    try {
      const run = await getRunner();
      const entries: ReportEntry[] = [];
      const next: typeof out = {};
      for (const t of REPORT_TASKS) {
        const g = gradeReportTask(run, t, a.queries[t.id] ?? '');
        next[t.id] = { result: g.preview, error: g.error, reasons: g.items.flatMap((x) => x.reasons), passed: g.outcome === 'passed' };
        entries.push({ task: t, query: a.queries[t.id] ?? '', passed: g.outcome === 'passed', result: g.preview });
      }
      setOut(next);
      return entries;
    } catch { setLoadErr(true); return null; } finally { setBusy(false); }
  };
  const checks = REPORT_TASKS.map((t) => ({ id: t.id, ok: !!out[t.id]?.passed }));
  const labels = Object.fromEntries(REPORT_TASKS.map((t) => [t.id, l(`${t.skill}: ${t.title.en}`, `${t.skill}: ${t.title.ru}`)]));
  const save = (name: string, text: string, type: string) => setMsg(tr(downloadText(name, text, type) ? COMMON.exported : COMMON.exportFail, lang));
  return (
    <div className="tool" data-testid="tool-sqlreport">
      <div className="example">
        <span className="eyebrow">{lang === 'ru' ? 'База данных (синтетическая)' : 'Database (synthetic)'}</span>
        <pre className="mono small">{`areas (area_id PK, name)
homes (home_id PK, area_id FK → areas.area_id, address, bedrooms)
sales (sale_id PK, home_id FK → homes.home_id, sale_date, price)`}</pre>
      </div>
      <div className="field">
        <label htmlFor="rep-title">{lang === 'ru' ? 'Название отчёта' : 'Report title'}</label>
        <input id="rep-title" value={a.title} onChange={(e) => onAnswer({ ...a, title: e.target.value })} />
      </div>
      {REPORT_TASKS.map((t, i) => {
        const o = out[t.id];
        const ex = o?.error ? explainSqlError(o.error) : null;
        return (
          <fieldset key={t.id} className="qa" data-testid={'rep-' + t.id}>
            <legend>{i + 1}. <b>{t.skill}</b> — {tr(t.title, lang)}</legend>
            <p>{tr(t.task, lang)}</p>
            <div className="field">
              <label htmlFor={'rep-q-' + t.id}>{lang === 'ru' ? 'Ваш SQL-запрос' : 'Your SQL query'}</label>
              <textarea id={'rep-q-' + t.id} className="mono" rows={3} spellCheck={false} value={a.queries[t.id] ?? ''} onChange={(e) => setQ(t.id, e.target.value)} />
            </div>
            <div className="row">
              <button onClick={() => runOne(t.id)} disabled={busy}>{lang === 'ru' ? 'Выполнить и проверить' : 'Run and check'}</button>
              <details className="small"><summary>{lang === 'ru' ? 'Подсказка' : 'Hint'}</summary><p className="mono">{tr(t.hint, lang)}</p></details>
            </div>
            {o && (
              <div aria-live="polite">
                <p className={'fbline ' + (o.passed ? 'good' : 'bad')}>
                  {o.passed ? (lang === 'ru' ? 'Верно на видимых и скрытых данных.' : 'Correct on visible and hidden data.') : o.reasons.map((r) => reasonText(r, lang)).join(' ')}
                </p>
                {ex && <p className="fbline bad" role="alert"><b>{lang === 'ru' ? 'Что не так:' : 'What went wrong:'}</b> {tr(ex.text, lang)} <span className="small muted mono">({o.error})</span></p>}
                {o.result && <Table r={o.result} />}
              </div>
            )}
          </fieldset>
        );
      })}
      <div className="field">
        <label htmlFor="rep-note">{lang === 'ru' ? 'Вывод аналитика (по желанию)' : 'Analyst note (optional)'}</label>
        <textarea id="rep-note" rows={3} value={a.note} onChange={(e) => onAnswer({ ...a, note: e.target.value })} />
      </div>
      <div className="row">
        <button className="primary" disabled={busy} onClick={async () => { const e = await runAll(); if (e) { onAnswer(a); onGraded(toGrade(e.map((x) => ({ id: x.task.id, ok: x.passed })), a)); } }}>{tr(COMMON.check, lang)}</button>
        <button disabled={busy} onClick={async () => { const e = await runAll(); if (e) save(safeName(a.title, 'sql-report') + '.sql', buildSqlFile(e, a.title, new Date()), 'application/sql'); }}>{lang === 'ru' ? 'Скачать .sql' : 'Download .sql'}</button>
        <button disabled={busy} onClick={async () => { const e = await runAll(); if (e) save(safeName(a.title, 'sql-report') + '.md', buildSqlMarkdown(e, a.title, a.note, new Date()), 'text/markdown'); }}>{lang === 'ru' ? 'Скачать отчёт .md' : 'Download report .md'}</button>
      </div>
      {loadErr && <p className="fbline bad" role="alert">{lang === 'ru' ? 'Не удалось загрузить SQLite. Обновите страницу.' : 'Could not load SQLite. Reload the page.'}</p>}
      <span className="small" aria-live="polite">{msg}</span>
      <h3>{tr(COMMON.labChecks, lang)}</h3>
      <LabChecks checks={checks} labels={labels} lang={lang} />
    </div>
  );
}
