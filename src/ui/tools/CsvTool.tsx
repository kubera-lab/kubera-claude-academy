// Course 5 final project: CSV Data Quality Auditor.
import { useMemo, useState } from 'react';
import type { Lang } from '../../content/types.ts';
import type { GradeResult } from '../../engine/grade.ts';
import { PRACTICE_CSV, PROPERTY_SCHEMA, audit, gradePractice, parseCsv, qualityScore, reportJson, summary, type Finding, type Rule } from '../../engine/tools/csv.ts';
import { downloadText } from '../download.ts';
import { COMMON, Editor, FileLoad, LabChecks, l, toGrade, tr, type L } from './common.tsx';

const RULE: Record<Rule, { name: L; fix: L }> = {
  columns: { name: l('Missing column', 'Нет столбца'), fix: l('Add the column to the header row.', 'Добавьте столбец в строку заголовков.') },
  width: { name: l('Wrong number of cells', 'Неверное число ячеек'), fix: l('Each row needs one value per column. Look for an extra or missing comma.', 'В каждой строке по одному значению на столбец. Ищите лишнюю или пропущенную запятую.') },
  required: { name: l('Empty required field', 'Пустое обязательное поле'), fix: l('Fill it from the source. Never invent a value.', 'Заполните по источнику. Не выдумывайте значение.') },
  duplicate: { name: l('Duplicate record', 'Дубликат записи'), fix: l('Same id and source twice: keep one row.', 'Один и тот же id и источник дважды: оставьте одну строку.') },
  date: { name: l('Invalid date', 'Неверная дата'), fix: l('Use YYYY-MM-DD and a date that exists (no 31 February).', 'Формат ГГГГ-ММ-ДД и существующая дата (нет 31 февраля).') },
  number: { name: l('Invalid number', 'Неверное число'), fix: l('Digits only, no £ or commas; prices above 0, bedrooms 0 or more, whole numbers.', 'Только цифры, без £ и запятых; цена больше 0, спален 0 или больше, целые числа.') },
  postcode: { name: l('Invalid postcode', 'Неверный индекс'), fix: l('UK postcode pattern, for example AB1 2CD.', 'Шаблон британского индекса, например AB1 2CD.') },
  conflict: { name: l('Sources disagree', 'Источники расходятся'), fix: l('Two sources give different values. Decide which source is authoritative (for a completed sale: the official register) and keep that value; note your decision.', 'Два источника дают разные значения. Решите, какой источник главный (для завершённой сделки — официальный реестр), оставьте его значение и запишите решение.') },
};

const LAB: Record<string, L> = {
  dup: l('Duplicate record removed (P03)', 'Дубликат удалён (P03)'),
  required: l('Missing postcode filled (P04)', 'Пустой индекс заполнен (P04)'),
  'impossible-date': l('Impossible date corrected (P05)', 'Несуществующая дата исправлена (P05)'),
  'date-format': l('Date written as YYYY-MM-DD (P06)', 'Дата в формате ГГГГ-ММ-ДД (P06)'),
  'not-number': l('Price is a number (P07)', 'Цена — число (P07)'),
  negative: l('Bedrooms not negative (P08)', 'Спальни не отрицательные (P08)'),
  postcode: l('Postcode is valid (P09)', 'Индекс правильный (P09)'),
  conflict: l('Conflict between sources resolved (P10)', 'Конфликт источников решён (P10)'),
  kept: COMMON.kept,
  clean: COMMON.clean,
};

function toMarkdown(file: string, rows: number, score: number, findings: Finding[], lang: Lang, when: Date): string {
  const s = summary(findings);
  return [
    `# Data quality report — ${file}`,
    '',
    `Checked on ${when.toISOString().slice(0, 10)} with the KUBERA Claude Academy CSV Data Quality Auditor (rule-based, no AI).`,
    '',
    `- Rows: ${rows}`,
    `- Rows without findings: ${score}%`,
    `- Findings: ${findings.length}`,
    '',
    '| Rule | Count |', '| --- | --- |',
    ...(Object.keys(s) as Rule[]).filter((k) => s[k]).map((k) => `| ${RULE[k].name.en} | ${s[k]} |`),
    '',
    '## Findings',
    '',
    findings.length ? '| Line | Record | Column | Problem | Value | How to fix |\n| --- | --- | --- | --- | --- | --- |' : '_No problems found by these rules._',
    ...findings.map((f) => `| ${f.line} | ${f.key} | ${f.column} | ${tr(RULE[f.rule].name, lang)} | ${f.value.replace(/\|/g, '\\|')} | ${tr(RULE[f.rule].fix, lang)} |`),
    '',
    '_A clean result means these rules found nothing; it does not prove every value is true._',
    '',
  ].join('\n');
}

export default function CsvTool({ lang, answer: saved, onAnswer, onGraded }: { lang: Lang; answer: string | null; onAnswer: (a: string) => void; onGraded: (r: GradeResult) => void }) {
  const answer = saved ?? PRACTICE_CSV;
  const [fileName, setFileName] = useState('practice.csv');
  const [msg, setMsg] = useState('');
  const parsed = useMemo(() => parseCsv(answer), [answer]);
  const findings = useMemo(() => ('error' in parsed ? [] : audit(parsed, PROPERTY_SCHEMA)), [parsed]);
  const [shown, setShown] = useState(false);
  const lab = useMemo(() => gradePractice(answer), [answer]);
  const own = fileName !== 'practice.csv';
  const save = (name: string, text: string, type: string) => setMsg(tr(downloadText(name, text, type) ? COMMON.exported : COMMON.exportFail, lang));
  const when = new Date();
  const s = summary(findings);
  return (
    <div className="tool" data-testid="tool-csv">
      <div className="row">
        <FileLoad accept=".csv,text/csv" lang={lang} label={COMMON.loadFile} onText={(t, n) => { onAnswer(t); setFileName(n); setShown(true); }} />
        <button type="button" onClick={() => { onAnswer(PRACTICE_CSV); setFileName('practice.csv'); }}>{tr(COMMON.sample, lang)}</button>
      </div>
      {own && <p className="note">{tr(COMMON.ownData, lang)}</p>}
      <Editor id="csv-editor" label={lang === 'ru' ? `CSV (${fileName}) — исправляйте прямо здесь` : `CSV (${fileName}) — fix it right here`} value={answer} onChange={onAnswer} rows={14} />
      <div className="row">
        <button className="primary" onClick={() => setShown(true)}>{tr(COMMON.audit, lang)}</button>
        {!own && <button onClick={() => { setShown(true); onAnswer(answer); onGraded(toGrade(lab.checks, answer)); }}>{tr(COMMON.check, lang)}</button>}
      </div>
      {shown && (
        <section aria-live="polite" data-testid="csv-results">
          {'error' in parsed ? (
            <p className="errs" role="alert">{parsed.error === 'unclosedQuote' ? tr(l('A quote " is opened but never closed.', 'Кавычка " открыта и не закрыта.'), lang) : tr(l('The file is empty.', 'Файл пустой.'), lang)}</p>
          ) : (
            <>
              <p><b>{lang === 'ru' ? 'Строк без замечаний' : 'Rows without findings'}: {qualityScore(parsed, findings)}%</b> · {lang === 'ru' ? 'строк' : 'rows'}: {parsed.rows.length} · {lang === 'ru' ? 'замечаний' : 'findings'}: {findings.length}</p>
              <p className="small">{(Object.keys(s) as Rule[]).filter((k) => s[k]).map((k) => `${tr(RULE[k].name, lang)}: ${s[k]}`).join(' · ')}</p>
              {findings.length === 0 ? <p className="good">{tr(COMMON.noFindings, lang)}</p> : (
                <div className="tablewrap">
                  <table className="tbl">
                    <thead><tr><th>{lang === 'ru' ? 'Строка' : 'Line'}</th><th>{lang === 'ru' ? 'Запись' : 'Record'}</th><th>{lang === 'ru' ? 'Столбец' : 'Column'}</th><th>{lang === 'ru' ? 'Проблема' : 'Problem'}</th><th>{lang === 'ru' ? 'Значение' : 'Value'}</th><th>{lang === 'ru' ? 'Как исправить' : 'How to fix'}</th></tr></thead>
                    <tbody>
                      {findings.map((f, i) => (
                        <tr key={i}><td>{f.line}</td><td>{f.key}</td><td className="mono">{f.column}</td><td>{tr(RULE[f.rule].name, lang)}{f.other !== undefined ? (lang === 'ru' ? ` (см. строку ${f.other + 2})` : ` (see line ${f.other + 2})`) : ''}</td><td className="mono">{f.value || '—'}</td><td className="small">{tr(RULE[f.rule].fix, lang)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="row">
                <button onClick={() => save(fileName.replace(/\.csv$/i, '') + '-quality-report.md', toMarkdown(fileName, parsed.rows.length, qualityScore(parsed, findings), findings, lang, when), 'text/markdown')}>{lang === 'ru' ? 'Скачать отчёт .md' : 'Download report .md'}</button>
                <button onClick={() => save(fileName.replace(/\.csv$/i, '') + '-quality-report.json', reportJson(fileName, parsed, findings, when), 'application/json')}>{lang === 'ru' ? 'Скачать отчёт .json' : 'Download report .json'}</button>
                <button onClick={() => save(fileName.replace(/\.csv$/i, '') + '-cleaned.csv', answer, 'text/csv')}>{lang === 'ru' ? 'Скачать исправленный .csv' : 'Download fixed .csv'}</button>
              </div>
              <span className="small" aria-live="polite">{msg}</span>
            </>
          )}
        </section>
      )}
      {!own && (
        <section>
          <h3>{tr(COMMON.labChecks, lang)}</h3>
          <LabChecks checks={lab.checks} labels={LAB} lang={lang} />
        </section>
      )}
    </div>
  );
}
