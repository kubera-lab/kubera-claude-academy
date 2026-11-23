// Course 2 final project: Prompt A/B Tester (same fixed rulebook for both versions).
import { useMemo, useState } from 'react';
import type { Lang } from '../../content/types.ts';
import type { GradeResult } from '../../engine/grade.ts';
import { AB_FACTS, AB_TESTS, PROMPT_A, abMarkdown, emptyAb, gradeAb, gradeReplies, scoreVariant, winner, type AbAnswer } from '../../engine/tools/abtest.ts';
import { t } from '../../i18n/index.ts';
import { downloadText } from '../download.ts';
import { COMMON, LabChecks, l, toGrade, tr, type L } from './common.tsx';

const LAB: Record<string, L> = {
  'b-required': l('Version B passes every required check', 'Версия B проходит все обязательные проверки'),
  'b-quality': l('Version B passes every quality check (no stuffing, no contradictions)', 'Версия B проходит все проверки качества (без набивки и противоречий)'),
  'b-wins': l('Version B wins the A/B test under the same rules', 'Версия B выигрывает A/B-тест по тем же правилам'),
  'a-kept': l('Version A is kept for comparison', 'Версия A сохранена для сравнения'),
};

export default function AbTool({ lang, answer, onAnswer, onGraded }: { lang: Lang; answer: AbAnswer | null; onAnswer: (a: AbAnswer) => void; onGraded: (r: GradeResult) => void }) {
  const a: AbAnswer = { ...emptyAb(), ...(answer ?? {}) };
  const [msg, setMsg] = useState('');
  const sa = useMemo(() => scoreVariant(a.a), [a.a]);
  const sb = useMemo(() => scoreVariant(a.b), [a.b]);
  const w = winner(sa, sb);
  const ra = gradeReplies(a.repliesA), rb = gradeReplies(a.repliesB);
  const checks = gradeAb(a);
  return (
    <div className="tool" data-testid="tool-abtest">
      <div className="example"><span className="eyebrow">{lang === 'ru' ? 'Факты магазина' : 'Shop facts'}</span><pre>{AB_FACTS}</pre></div>
      <div className="grid2">
        <div className="field"><label htmlFor="ab-a">{lang === 'ru' ? 'Версия A (исходная)' : 'Version A (original)'}</label><textarea id="ab-a" rows={7} value={a.a} onChange={(e) => onAnswer({ ...a, a: e.target.value })} /></div>
        <div className="field"><label htmlFor="ab-b">{lang === 'ru' ? 'Версия B (ваша улучшенная, на английском)' : 'Version B (your improved version, English)'}</label><textarea id="ab-b" rows={7} value={a.b} onChange={(e) => onAnswer({ ...a, b: e.target.value })} /></div>
      </div>
      <button type="button" onClick={() => onAnswer({ ...a, a: PROMPT_A })}>{lang === 'ru' ? 'Вернуть исходную версию A' : 'Reset version A'}</button>
      <p role="status"><b>{lang === 'ru' ? 'Победитель' : 'Winner'}: {w === 'tie' ? (lang === 'ru' ? 'ничья' : 'tie') : w}</b> · A: {sa.required}/{sa.requiredTotal} {lang === 'ru' ? 'обяз.' : 'required'}, {sa.quality}/{sa.qualityTotal} {lang === 'ru' ? 'кач.' : 'quality'} · B: {sb.required}/{sb.requiredTotal}, {sb.quality}/{sb.qualityTotal}</p>
      <div className="tablewrap">
        <table className="tbl" data-testid="ab-table">
          <thead><tr><th>{lang === 'ru' ? 'Проверка' : 'Check'}</th><th>A</th><th>B</th></tr></thead>
          <tbody>{sa.checks.map((c, i) => (
            <tr key={c.id}><td>{t(c.label)}{c.level === 'quality' ? <span className="small muted"> · {lang === 'ru' ? 'качество' : 'quality'}</span> : null}{!sb.checks[i].pass ? <div className="small muted">{t(sb.checks[i].fix)}</div> : null}</td><td>{c.pass ? '✅' : '❌'}</td><td>{sb.checks[i].pass ? '✅' : '❌'}</td></tr>
          ))}</tbody>
        </table>
      </div>
      <details className="card subtle">
        <summary><b>{lang === 'ru' ? 'По желанию: вставьте ответы реальной модели для A и B' : 'Optional: paste a real model\'s replies for A and B'}</b></summary>
        <p className="small">{lang === 'ru' ? 'Здесь нет встроенной модели. Задайте эти вопросы любой бесплатной модели с версией A, затем с версией B, и вставьте ответы — их проверят те же фиксированные правила.' : 'There is no built-in model. Ask these questions to any free model with version A, then with version B, and paste the replies — the same fixed rules grade them.'}</p>
        {AB_TESTS.map((x) => (
          <div key={x.id} className="grid2">
            <div className="field"><label htmlFor={'ra-' + x.id}>A · {x.input}</label><textarea id={'ra-' + x.id} rows={2} value={a.repliesA[x.id] ?? ''} onChange={(e) => onAnswer({ ...a, repliesA: { ...a.repliesA, [x.id]: e.target.value } })} />{ra.find((r) => r.id === x.id) && <span className={'small ' + (ra.find((r) => r.id === x.id)!.pass ? 'good' : 'errs')}>{ra.find((r) => r.id === x.id)!.pass ? '✅' : '❌ ' + ra.find((r) => r.id === x.id)!.reasons.map((k) => t(k.split(':')[0], { w: k.split(':')[1] ?? '' })).join(' ')}</span>}</div>
            <div className="field"><label htmlFor={'rb-' + x.id}>B · {x.input}</label><textarea id={'rb-' + x.id} rows={2} value={a.repliesB[x.id] ?? ''} onChange={(e) => onAnswer({ ...a, repliesB: { ...a.repliesB, [x.id]: e.target.value } })} />{rb.find((r) => r.id === x.id) && <span className={'small ' + (rb.find((r) => r.id === x.id)!.pass ? 'good' : 'errs')}>{rb.find((r) => r.id === x.id)!.pass ? '✅' : '❌ ' + rb.find((r) => r.id === x.id)!.reasons.map((k) => t(k.split(':')[0], { w: k.split(':')[1] ?? '' })).join(' ')}</span>}</div>
          </div>
        ))}
      </details>
      <div className="row">
        <button className="primary" onClick={() => { onAnswer(a); onGraded(toGrade(checks, a)); }}>{tr(COMMON.check, lang)}</button>
        <button onClick={() => setMsg(tr(downloadText('prompt-ab-test.md', abMarkdown(a, (k) => t(k), new Date()), 'text/markdown') ? COMMON.exported : COMMON.exportFail, lang))}>{lang === 'ru' ? 'Скачать отчёт A/B .md' : 'Download A/B report .md'}</button>
        <button onClick={() => setMsg(tr(downloadText('prompt-ab-test.json', JSON.stringify({ tool: 'KUBERA Claude Academy — Prompt A/B Tester', winner: w, a: { text: a.a, ...sa, checks: sa.checks.map((c) => ({ id: c.id, level: c.level, pass: c.pass })) }, b: { text: a.b, ...sb, checks: sb.checks.map((c) => ({ id: c.id, level: c.level, pass: c.pass })) }, pasted: { a: ra, b: rb }, note: 'Rule checks only; no AI model scored these prompts.' }, null, 2), 'application/json') ? COMMON.exported : COMMON.exportFail, lang))}>{lang === 'ru' ? 'Скачать .json' : 'Download .json'}</button>
      </div>
      <span className="small" aria-live="polite">{msg}</span>
      <h3>{tr(COMMON.labChecks, lang)}</h3>
      <LabChecks checks={checks} labels={LAB} lang={lang} />
    </div>
  );
}
