// Shared pieces for the course tools (courses 5–8). Text is bilingual data, like lesson content.
import { useRef, useState } from 'react';
import type { Lang } from '../../content/types.ts';
import { hashOf, type GradeResult } from '../../engine/grade.ts';
import { Status } from '../parts.tsx';

export type L = { en: string; ru: string };
export const l = (en: string, ru: string): L => ({ en, ru });
export const tr = (v: L, lang: Lang) => v[lang] || v.en;

/** Lab checks → the platform's GradeResult. A pass is valid only for the exact text that was checked. */
export function toGrade(checks: { id: string; ok: boolean }[], answer: unknown): GradeResult {
  const score = checks.filter((c) => c.ok).length;
  return {
    outcome: score === checks.length && checks.length > 0 ? 'passed' : 'failed',
    score,
    total: checks.length,
    items: checks.map((c) => ({ id: c.id, ok: c.ok, reasons: [] })),
    hash: hashOf(answer),
  };
}

export function LabChecks({ checks, labels, lang }: { checks: { id: string; ok: boolean }[]; labels: Record<string, L>; lang: Lang }) {
  return (
    <ul className="crit" data-testid="lab-checks">
      {checks.map((c) => (
        <li key={c.id}><Status ok={c.ok} text={c.ok ? (lang === 'ru' ? 'готово' : 'done') : (lang === 'ru' ? 'ещё нет' : 'not yet')} /> {tr(labels[c.id] ?? l(c.id, c.id), lang)}</li>
      ))}
    </ul>
  );
}

/** Read a local text file into the editor. The file never leaves the browser. */
export function FileLoad({ accept, onText, lang, label }: { accept: string; onText: (t: string, name: string) => void; lang: Lang; label: L }) {
  const ref = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState('');
  return (
    <span>
      <button type="button" onClick={() => ref.current?.click()}>{tr(label, lang)}</button>
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="sr"
        aria-label={tr(label, lang)}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (!f) return;
          if (f.size > 2_000_000) { setErr(lang === 'ru' ? 'Файл больше 2 МБ.' : 'File is larger than 2 MB.'); return; }
          f.text().then((t) => { setErr(''); onText(t, f.name); }, () => setErr(lang === 'ru' ? 'Не удалось прочитать файл.' : 'Could not read the file.'));
        }}
      />
      {err && <span className="small errs" role="alert"> {err}</span>}
    </span>
  );
}

export function Editor({ id, label, value, onChange, rows = 12 }: { id: string; label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <textarea id={id} className="mono" rows={rows} spellCheck={false} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export const COMMON = {
  loadFile: l('Open a file', 'Открыть файл'),
  sample: l('Reset to the practice file', 'Вернуть учебный файл'),
  check: l('Check the lab', 'Проверить лабораторную'),
  audit: l('Run the audit', 'Запустить проверку'),
  exported: l('File saved to your Downloads.', 'Файл сохранён в «Загрузки».'),
  exportFail: l('Your browser blocked the download.', 'Браузер заблокировал загрузку.'),
  labChecks: l('Lab checks', 'Проверки лабораторной'),
  kept: l('All records of the practice file are still there (deleting a broken record does not fix it)', 'Все записи учебного файла на месте (удаление сломанной записи — не исправление)'),
  clean: l('The audit finds nothing left to fix', 'Проверка больше ничего не находит'),
  ownData: l('You are checking your own data. The lab checks apply only to the practice file, but the audit and the exports work for any file.', 'Вы проверяете свои данные. Проверки лабораторной относятся только к учебному файлу, но аудит и экспорт работают для любого файла.'),
  noFindings: l('No problems found by these rules.', 'Эти правила не нашли проблем.'),
};
