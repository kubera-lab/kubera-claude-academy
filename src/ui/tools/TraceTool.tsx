// Course 4 final project: Agent Trace Debugger. The learner diagnoses each step first; then the
// fixed-rule debugger shows its findings. The learner can also load their own trace.
import { useMemo, useState } from 'react';
import type { Lang } from '../../content/types.ts';
import type { GradeResult } from '../../engine/grade.ts';
import { PRACTICE_POLICY, PRACTICE_TRACE, debugTrace, gradeDiagnosis, parseTrace, type Trace, type TraceRule, type Verdict } from '../../engine/tools/trace.ts';
import { downloadText } from '../download.ts';
import { COMMON, Editor, FileLoad, LabChecks, l, toGrade, tr, type L } from './common.tsx';

const RULE: Record<TraceRule, { name: L; fix: L }> = {
  json: { name: l('Not valid JSON', 'Неверный JSON'), fix: l('Fix the JSON syntax.', 'Исправьте синтаксис JSON.') },
  shape: { name: l('Wrong trace format', 'Неверный формат журнала'), fix: l('Needs "goal" and a list of "steps", each with a number and a type.', 'Нужны «goal» и список «steps», у каждого шага номер и тип.') },
  unknownTool: { name: l('Tool not allowed by the policy', 'Инструмент не разрешён политикой'), fix: l('The permission guard must block any tool that is not on the list.', 'Проверка разрешений должна блокировать любой инструмент не из списка.') },
  noApproval: { name: l('Sensitive action without a person\'s approval', 'Важное действие без одобрения человека'), fix: l('Pause and ask a person before sending, booking or paying.', 'Остановитесь и спросите человека перед отправкой, бронированием или оплатой.') },
  externalRecipient: { name: l('Data sent outside the organisation', 'Данные отправлены за пределы организации'), fix: l('Only allowed domains may receive email.', 'Письма можно отправлять только на разрешённые домены.') },
  injection: { name: l('Followed instructions hidden in content', 'Выполнил инструкции, спрятанные в содержимом'), fix: l('Text from emails or web pages is data, never orders. The agent must stick to the user\'s goal.', 'Текст из писем и страниц — данные, а не приказы. Агент должен держаться цели пользователя.') },
  loop: { name: l('Stuck in a loop', 'Зациклился'), fix: l('Stop after a repeat and report, instead of calling the same tool again.', 'После повтора остановитесь и сообщите, а не вызывайте тот же инструмент снова.') },
  noResult: { name: l('Acted without waiting for the result', 'Действует, не дождавшись результата'), fix: l('Each tool call must be followed by its result before the next step.', 'После каждого вызова нужен его результат до следующего шага.') },
  falseClaim: { name: l('Claims something that did not happen', 'Утверждает то, чего не было'), fix: l('The final message may only report actions that succeeded.', 'В итоговом сообщении — только действия, которые прошли успешно.') },
};
const VERDICTS: Verdict[] = ['ok', 'unknownTool', 'noApproval', 'externalRecipient', 'injection', 'loop', 'noResult', 'falseClaim'];

export interface TraceAnswer { text: string; verdicts: Record<string, Verdict> }

function md(goal: string, f: ReturnType<typeof debugTrace>, lang: Lang, when: Date) {
  return ['# Agent trace review', '', `Checked on ${when.toISOString().slice(0, 10)} with the KUBERA Claude Academy Agent Trace Debugger (fixed rules).`, '', `Goal: ${goal}`, '',
    `Policy: allowed ${PRACTICE_POLICY.allowed.join(', ')}; needs a person's approval: ${PRACTICE_POLICY.needsApproval.join(', ')}; email only to ${PRACTICE_POLICY.allowedDomains.join(', ')}.`, '',
    f.length ? '| Step | Problem | Detail | Fix |\n| --- | --- | --- | --- |' : '_No problems found by these rules._',
    ...f.map((x) => `| ${x.step} | ${tr(RULE[x.rule].name, lang)} | ${x.detail.replace(/\|/g, '\\|')} | ${tr(RULE[x.rule].fix, lang)} |`), ''].join('\n');
}

export default function TraceTool({ lang, answer, onAnswer, onGraded }: { lang: Lang; answer: TraceAnswer | null; onAnswer: (a: TraceAnswer) => void; onGraded: (r: GradeResult) => void }) {
  const a: TraceAnswer = answer ?? { text: PRACTICE_TRACE, verdicts: {} };
  const [shown, setShown] = useState(false);
  const [msg, setMsg] = useState('');
  const parsed = useMemo(() => parseTrace(a.text), [a.text]);
  const practice = a.text.trim() === PRACTICE_TRACE.trim();
  const findings = useMemo(() => ('error' in parsed ? [] : debugTrace(parsed as Trace, PRACTICE_POLICY)), [parsed]);
  const checks = 'error' in parsed ? [] : gradeDiagnosis(parsed as Trace, PRACTICE_POLICY, a.verdicts);
  return (
    <div className="tool" data-testid="tool-trace">
      <div className="example"><span className="eyebrow">{lang === 'ru' ? 'Политика разрешений' : 'Permission policy'}</span>
        <pre className="small">{`allowed: ${PRACTICE_POLICY.allowed.join(', ')}\nneeds a person's approval: ${PRACTICE_POLICY.needsApproval.join(', ')}\nemail only to: @${PRACTICE_POLICY.allowedDomains.join(', @')}`}</pre></div>
      <div className="row">
        <FileLoad accept=".json,application/json" lang={lang} label={COMMON.loadFile} onText={(txt) => { onAnswer({ text: txt, verdicts: {} }); setShown(true); }} />
        <button type="button" onClick={() => onAnswer({ text: PRACTICE_TRACE, verdicts: {} })}>{tr(COMMON.sample, lang)}</button>
      </div>
      <details><summary className="small">{lang === 'ru' ? 'Журнал агента (JSON) — можно изменить' : 'Agent trace (JSON) — editable'}</summary>
        <Editor id="trace-editor" label="trace.json" value={a.text} onChange={(v) => onAnswer({ ...a, text: v })} rows={12} />
      </details>
      {'error' in parsed ? <p className="errs" role="alert">{tr(RULE[parsed.error === 'shape' ? 'shape' : 'json'].name, lang)}: {parsed.error}</p> : (
        <>
          <h3>{lang === 'ru' ? 'Шаг 1. Ваш диагноз каждого действия' : 'Step 1. Your diagnosis of each action'}</h3>
          <ol className="trace">
            {(parsed as Trace).steps.map((s) => (
              <li key={s.step} className={'tstep ' + s.type}>
                <span className="mono small">#{s.step} {s.type}{s.tool ? ` · ${s.tool}` : ''}{s.source ? ` · ${s.source}` : ''}{s.approved_by ? ` · approved: ${s.approved_by}` : ''}</span>
                <div className="mono small">{s.args ? JSON.stringify(s.args) : s.text}</div>
                {s.type !== 'observation' && (
                  <label className="small">{lang === 'ru' ? 'Диагноз' : 'Diagnosis'}{' '}
                    <select aria-label={`Diagnosis for step ${s.step}`} value={a.verdicts[String(s.step)] ?? ''} onChange={(e) => onAnswer({ ...a, verdicts: { ...a.verdicts, [String(s.step)]: e.target.value as Verdict } })}>
                      <option value="">—</option>
                      {VERDICTS.map((v) => <option key={v} value={v}>{v === 'ok' ? (lang === 'ru' ? 'В порядке' : 'OK') : tr(RULE[v as TraceRule].name, lang)}</option>)}
                    </select>
                  </label>
                )}
              </li>
            ))}
          </ol>
          <div className="row">
            {practice && <button className="primary" onClick={() => { setShown(true); onAnswer(a); onGraded(toGrade(checks, a)); }}>{tr(COMMON.check, lang)}</button>}
            <button onClick={() => setShown(true)}>{lang === 'ru' ? 'Шаг 2. Показать находки отладчика' : 'Step 2. Show the debugger\'s findings'}</button>
          </div>
          {!practice && <p className="note">{tr(COMMON.ownData, lang)}</p>}
          {shown && (
            <section aria-live="polite" data-testid="trace-results">
              {findings.length === 0 ? <p className="good">{tr(COMMON.noFindings, lang)}</p> : (
                <div className="tablewrap"><table className="tbl">
                  <thead><tr><th>{lang === 'ru' ? 'Шаг' : 'Step'}</th><th>{lang === 'ru' ? 'Проблема' : 'Problem'}</th><th>{lang === 'ru' ? 'Подробно' : 'Detail'}</th><th>{lang === 'ru' ? 'Как исправить агента' : 'How to fix the agent'}</th></tr></thead>
                  <tbody>{findings.map((f, i) => <tr key={i}><td>{f.step}</td><td>{tr(RULE[f.rule].name, lang)}</td><td className="mono small">{f.detail}</td><td className="small">{tr(RULE[f.rule].fix, lang)}</td></tr>)}</tbody>
                </table></div>
              )}
              <div className="row">
                <button onClick={() => setMsg(tr(downloadText('agent-trace-review.md', md((parsed as Trace).goal, findings, lang, new Date()), 'text/markdown') ? COMMON.exported : COMMON.exportFail, lang))}>{lang === 'ru' ? 'Скачать разбор .md' : 'Download review .md'}</button>
                <button onClick={() => setMsg(tr(downloadText('agent-trace-review.json', JSON.stringify({ tool: 'KUBERA Claude Academy — Agent Trace Debugger', goal: (parsed as Trace).goal, policy: PRACTICE_POLICY, findings }, null, 2), 'application/json') ? COMMON.exported : COMMON.exportFail, lang))}>{lang === 'ru' ? 'Скачать .json' : 'Download .json'}</button>
              </div>
              <span className="small" aria-live="polite">{msg}</span>
            </section>
          )}
          {practice && (<><h3>{tr(COMMON.labChecks, lang)}</h3><LabChecks checks={checks} labels={Object.fromEntries(checks.map((c) => [c.id, l(`Step ${c.id.slice(5)} diagnosed correctly`, `Шаг ${c.id.slice(5)} определён верно`)]))} lang={lang} /></>)}
        </>
      )}
    </div>
  );
}
