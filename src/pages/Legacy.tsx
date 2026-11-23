import { Glossary } from '../ui/Glossary.tsx';
import { GLOSSARY } from '../content/extras.ts';
import { useEffect, useMemo, useState } from 'react';
import { getLang, t } from '../i18n/index.ts';
import { RIVERSIDE, RIVERSIDE_INSTRUCTIONS, RIVERSIDE_TESTS, SPOT_ITEMS, TEMPLATES, brokenRiverside, type ModuleDef, type ModuleId } from '../data/course.ts';
import { SPOT_WHY_RU, TEMPLATE_LABEL_RU, modulesFor } from '../data/course.ru.ts';
import { withHistory, type AppState, type ModuleProgress } from '../state.ts';
import { ChatBox, ConfigFields, ControlTable, CopyButton, Field, InstructionEditor, KBEditor, Quiz, RealModelPanel, ResultsTable, Status, TestEditor, TestRunner } from '../ui/parts.tsx';
import { validateKB } from '../engine/assistant.ts';
import { runSuite } from '../engine/testing.ts';
import { assessProject, subjectTerms } from '../engine/project.ts';
import { buildExport } from '../engine/export.ts';

export const mods = () => modulesFor(getLang());
export type SetState = React.Dispatch<React.SetStateAction<AppState>>;

export function moduleDone(s: AppState, id: ModuleId): boolean {
  const m = s.modules[id];
  return m.quizChecked && m.quizScore === m.quizTotal && m.quizTotal > 0 && m.practicePassed;
}
export function knowledge(s: AppState) {
  const total = mods().reduce((a, m) => a + m.quiz.length, 0);
  const score = mods().reduce((a, m) => a + (s.modules[m.id].quizChecked ? s.modules[m.id].quizScore : 0), 0);
  return { score, total };
}

export function CourseCard() {
  const hours = Math.round(mods().reduce((a, m) => a + m.minutes, 0) / 60 * 2) / 2;
  return (
    <article className="ccard">
      <Status ok text={t('course.available')} />
      <h3>{t('course.c3.title')}</h3>
      <p className="small muted">{t('course.c3.level')} · {t('course.lessons', { n: 5 })} · {t('course.estimate', { h: hours })}</p>
      <ul className="small">{mods()[0].objectives.slice(0, 1).concat(mods()[3].objectives[0], mods()[4].objectives[0]).map((o) => <li key={o}>{o}</li>)}</ul>
      <p className="small"><b>{t('course.outcome')}:</b> {t('course.c3.outcome')}</p>
      <a className="btn primary" href="#course">{t('course.open')}</a>
    </article>
  );
}

// ---------------- Course overview ----------------
export function LegacyCourse({ state }: { state: AppState }) {
  return (
    <div className="wrap">
      <p className="eyebrow">{t('course.c3.level')} · {t('course.lessons', { n: 5 })}</p>
      <h1>{t('course.c3.title')}</h1>
      <p className="lead">{t('course.c3.outcome')}</p>
      <Glossary items={GLOSSARY.assistant} lang={state.lang} />
      <ol className="modlist">
        {mods().map((m) => {
          const p = state.modules[m.id];
          return (
            <li key={m.id}>
              <a href={'#' + m.id}>
                <span className="num">{m.number}</span>
                <span className="mt"><b>{m.title}</b><span className="small muted">{t('module.minutes', { m: m.minutes })}</span></span>
                <span className="mstat">
                  <Status ok={p.quizChecked ? p.quizScore === p.quizTotal : null} text={`${t('module.status.quiz')}: ${p.quizChecked ? `${p.quizScore}/${p.quizTotal}` : t('status.notYet')}`} />
                  <Status ok={p.practicePassed ? true : null} text={`${t('module.status.practice')}: ${p.practicePassed ? t('status.passed') : t('status.notYet')}`} />
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ---------------- Module ----------------
export function ModulePage({ def, state, setState }: { def: ModuleDef; state: AppState; setState: SetState }) {
  const p = state.modules[def.id];
  const upd = (patch: Partial<ModuleProgress>) => setState((s) => ({ ...s, modules: { ...s.modules, [def.id]: { ...s.modules[def.id], ...patch } } }));
  const idx = mods().indexOf(def);
  const next = mods()[idx + 1];
  const complete = moduleDone(state, def.id);
  return (
    <div className="wrap">
      <p className="eyebrow">{t('module.label', { n: def.number })} · {t('module.minutes', { m: def.minutes })}</p>
      <h1>{def.title}</h1>
      <section className="card">
        <h2>{t('module.objectives')}</h2>
        <ul>{def.objectives.map((o) => <li key={o}>{o}</li>)}</ul>
      </section>
      <section className="lesson">
        <h2>{t('module.lesson')}</h2>
        {def.lesson.map((b, i) =>
          b.kind === 'h' ? <h3 key={i}>{b.text as string}</h3> :
          b.kind === 'list' ? <ul key={i}>{(b.text as string[]).map((x) => <li key={x}>{x}</li>)}</ul> :
          b.kind === 'example' ? <div key={i} className="example"><span className="eyebrow">{t('module.example')}</span><pre>{b.text as string}</pre></div> :
          b.kind === 'note' ? <p key={i} className="note">{b.text as string}</p> :
          <p key={i}>{b.text as string}</p>,
        )}
      </section>
      <section className="card task">
        <h2>{t('module.quiz')}</h2>
        <Quiz
          questions={def.quiz}
          answers={p.answers}
          checked={p.quizChecked}
          onAnswer={(id, v) => upd({ answers: { ...p.answers, [id]: v } })}
          onCheck={(score, total, wrong) => setState((s) => withHistory({ ...s, modules: { ...s.modules, [def.id]: { ...s.modules[def.id], quizChecked: true, quizScore: score, quizTotal: total, wrong, attempts: p.attempts + 1 } } }, { id: def.id + '-quiz', outcome: score === total ? 'passed' : 'failed', score, total }))}
          onRetry={() => upd({ quizChecked: false, answers: Object.fromEntries(Object.entries(p.answers).filter(([k]) => !p.wrong.includes(k))) })}
        />
      </section>
      <section className="card task">
        <h2>{t('module.practice')}: {def.practiceTitle}</h2>
        <p>{def.practiceIntro}</p>
        <Practice id={def.id} state={state} setState={setState} pass={(ok) => setState((s) => withHistory({ ...s, modules: { ...s.modules, [def.id]: { ...s.modules[def.id], practicePassed: ok, attempts: s.modules[def.id].attempts + 1 } } }, { id: def.id + '-practice', outcome: ok ? 'passed' : 'failed', score: ok ? 1 : 0, total: 1 }))} />
      </section>
      <section className={'card ' + (complete ? 'donecard' : 'subtle')} role="status">
        <h2>{complete ? t('module.done') : t('module.notDone')}</h2>
        <div className="row">
          {next ? <a className={'btn' + (complete ? ' primary' : '')} href={'#' + next.id}>{t('module.next')}: {next.title}</a> : <a className="btn primary" href="#project">{t('module.toProject')}</a>}
        </div>
      </section>
    </div>
  );
}

function Practice({ id, state, setState, pass }: { id: ModuleId; state: AppState; setState: SetState; pass: (ok: boolean) => void }) {
  if (id === 'm1') return <SpotPractice state={state} setState={setState} pass={pass} />;
  if (id === 'm2')
    return (
      <InstructionEditor
        value={state.m2Instructions}
        onChange={(v) => setState((s) => ({ ...s, m2Instructions: v }))}
        placeTerms={['riverside', 'centre|center']}
        starter="You are a friendly helper for visitors of Riverside Community Centre. "
        onResult={pass}
      />
    );
  if (id === 'm3') return <BuildPractice state={state} setState={setState} pass={pass} />;
  if (id === 'm4') return <FixPractice state={state} setState={setState} pass={pass} />;
  return (
    <div>
      <p><a className="btn primary" href="#project">{t('module.toProject')}</a></p>
      <p className="small muted">{state.projectCheck ? `${state.projectCheck.met} / ${state.projectCheck.total}` : t('dash.notChecked')}</p>
    </div>
  );
}

function SpotPractice({ state, setState, pass }: { state: AppState; setState: SetState; pass: (ok: boolean) => void }) {
  const [checked, setChecked] = useState(false);
  const labels: Record<string, string> = { correct: t('spot.correct'), invented: t('spot.invented'), refusal: t('spot.refusal') };
  const score = SPOT_ITEMS.filter((it, i) => state.spot[i] === it.correct).length;
  return (
    <div>
      <pre className="facts">{RIVERSIDE.facts}</pre>
      <p className="small muted">{t('spot.help')}</p>
      {SPOT_ITEMS.map((it, i) => (
        <fieldset key={i} className="qa" disabled={checked}>
          <legend>Q{i + 1}. {it.q}</legend>
          <p className="ans">{it.a}</p>
          <div className="chips">
            {Object.keys(labels).map((k) => (
              <label key={k} className="chip">
                <input type="radio" name={'spot' + i} checked={state.spot[i] === k} onChange={() => setState((s) => ({ ...s, spot: { ...s.spot, [i]: k } }))} />
                {labels[k]}
              </label>
            ))}
          </div>
          {checked && (
            <p className={'fbline ' + (state.spot[i] === it.correct ? 'good' : 'bad')}>
              <b>{state.spot[i] === it.correct ? t('module.correct') : `${t('module.wrong')} → ${labels[it.correct]}.`}</b> {getLang() === 'ru' ? SPOT_WHY_RU[i] : it.why}
            </p>
          )}
        </fieldset>
      ))}
      <div className="row">
        {!checked ? (
          <button className="primary" onClick={() => { setChecked(true); pass(score === SPOT_ITEMS.length); }}>{t('spot.check')}</button>
        ) : (
          <>
            <Status ok={score === SPOT_ITEMS.length} text={t('module.score', { s: score, t: SPOT_ITEMS.length })} />
            <button onClick={() => setChecked(false)}>{t('module.retry')}</button>
          </>
        )}
      </div>
    </div>
  );
}

function BuildPractice({ state, setState, pass }: { state: AppState; setState: SetState; pass: (ok: boolean) => void }) {
  const cfg = state.m3;
  const [res, setRes] = useState<ReturnType<typeof runSuite> | null>(null);
  const evaluate = () => {
    const issues = validateKB(cfg);
    const sources = new Set(cfg.kb.map((e) => e.source));
    const r = runSuite(cfg, RIVERSIDE_TESTS);
    setRes(r);
    pass(issues.length === 0 && [1, 2, 3, 4, 5].every((n) => sources.has(n)) && r.every((x) => x.pass));
  };
  return (
    <div>
      <KBEditor cfg={cfg} onChange={(c) => setState((s) => ({ ...s, m3: c }))} />
      <ChatBox cfg={cfg} />
      <h4>{t('tests.title')}</h4>
      <p className="small muted">{t('build.note')}</p>
      <div className="row"><button className="primary" onClick={evaluate}>{t('tests.run')}</button>{res && <Status ok={res.every((x) => x.pass)} text={t('tests.passed', { p: res.filter((x) => x.pass).length, t: res.length })} />}</div>
      {res && <ResultsTable tests={RIVERSIDE_TESTS} results={res} />}
    </div>
  );
}

function FixPractice({ state, setState, pass }: { state: AppState; setState: SetState; pass: (ok: boolean) => void }) {
  const cfg = state.m4;
  const set = (c: typeof cfg) => setState((s) => ({ ...s, m4: c }));
  return (
    <div>
      <p className="note">{t('fix.hint')}</p>
      <ConfigFields cfg={cfg} onChange={set} />
      <KBEditor cfg={cfg} onChange={set} />
      <h4>{t('tests.title')}</h4>
      <TestRunner cfg={cfg} tests={RIVERSIDE_TESTS} onRun={(r) => pass(r.every((x) => x.pass) && validateKB(cfg).length === 0)} />
      <div className="row"><button className="ghost" onClick={() => set(brokenRiverside())}>{t('fix.reset')}</button></div>
      <RealModelPanel cfg={cfg} tests={RIVERSIDE_TESTS} pasted={state.m4Pasted} modelName={state.m4ModelName} onChange={(p, n) => setState((s) => ({ ...s, m4Pasted: p, m4ModelName: n }))} />
    </div>
  );
}

// ---------------- Final project ----------------
export function ProjectPage({ state, setState }: { state: AppState; setState: SetState }) {
  const p = state.project;
  const setP = (patch: Partial<typeof p>) => setState((s) => ({ ...s, project: { ...s.project, ...patch } }));
  const setCfg = (c: typeof p.config) => setP({ config: c });
  const [tpl, setTpl] = useState(TEMPLATES[0].id);
  const [confirm, setConfirm] = useState(false);
  const [assessment, setAssessment] = useState<ReturnType<typeof assessProject> | null>(null);
  const [msg, setMsg] = useState('');
  const terms = subjectTerms(p.subject);
  // an assessment describes one exact project: any edit makes it stale
  useEffect(() => setAssessment(null), [p]);
  const runAssess = () => {
    const a = assessProject(p);
    setAssessment(a);
    const met = a.criteria.filter((c) => c.pass).length;
    setState((s) => ({
      ...s,
      projectCheck: { met, total: a.criteria.length, at: new Date().toISOString() },
      modules: { ...s.modules, m5: { ...s.modules.m5, practicePassed: a.passed } },
    }));
  };
  const files = useMemo(() => (assessment ? buildExport(p, knowledge(state), new Date()) : []), [assessment]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="wrap">
      <p className="eyebrow">{t('module.label', { n: 5 })}</p>
      <h1>{t('project.title')}</h1>
      <p className="lead">{mods()[4].lesson[0].text as string}</p>

      <section className="card">
        <h2>{t('project.step1')}</h2>
        <div className="row">
          <label className="small" htmlFor="tpl">{t('project.template')}</label>
          <select id="tpl" value={tpl} onChange={(e) => setTpl(e.target.value)}>{TEMPLATES.map((x) => <option key={x.id} value={x.id}>{getLang() === 'ru' ? TEMPLATE_LABEL_RU[x.id] : x.label}</option>)}</select>
          {!confirm ? <button onClick={() => setConfirm(true)}>{t('project.useTemplate')}</button> : (
            <span className="confirm" role="alertdialog" aria-label={t('project.templateWarn')}>
              <span className="small">{t('project.templateWarn')}</span>
              <button className="primary" onClick={() => { const x = TEMPLATES.find((y) => y.id === tpl)!; setP({ subject: x.subject, config: { ...p.config, facts: x.facts } }); setConfirm(false); }}>{t('project.confirm')}</button>
              <button onClick={() => setConfirm(false)}>{t('project.cancel')}</button>
            </span>
          )}
        </div>
        <div className="grid2">
          <Field label={t('cfg.name')} value={p.config.name} onChange={(v) => setCfg({ ...p.config, name: v })} />
          <Field label={t('cfg.subject')} value={p.subject} onChange={(v) => setP({ subject: v })} />
        </div>
        <Field label={t('cfg.purpose')} value={p.config.purpose} onChange={(v) => setCfg({ ...p.config, purpose: v })} />
        <Field label={t('kb.facts')} value={p.config.facts} onChange={(v) => setCfg({ ...p.config, facts: v })} area rows={6} mono />
      </section>

      <section className="card">
        <h2>{t('project.step2')}</h2>
        <InstructionEditor value={p.config.instructions} onChange={(v) => setCfg({ ...p.config, instructions: v })} placeTerms={terms.length ? terms : ['__subject__']} starter={p.subject ? `You are a friendly helper for people who ask about ${p.subject}. ` : 'You are a friendly helper for '} />
        <ConfigFields cfg={p.config} onChange={setCfg} />
      </section>

      <section className="card">
        <h2>{t('project.step3')}</h2>
        <KBEditor cfg={p.config} onChange={setCfg} />
        <ChatBox cfg={p.config} />
      </section>

      <section className="card">
        <h2>{t('project.step4')}</h2>
        <TestEditor tests={p.tests} onChange={(tests) => setP({ tests })} />
        <h4>{t('tests.run')}</h4>
        <TestRunner cfg={p.config} tests={p.tests} />
        <RealModelPanel cfg={p.config} tests={p.tests} pasted={p.pasted} modelName={p.modelName} onChange={(pasted, modelName) => setP({ pasted, modelName })} />
      </section>

      <section className="card task">
        <h2>{t('project.step5')}</h2>
        <div className="row">
          <button className="primary" onClick={runAssess}>{t('project.assess')}</button>
          {assessment && <Status ok={assessment.passed} text={assessment.passed ? t('project.passed') : t('project.notPassed', { n: assessment.criteria.filter((c) => !c.pass).length })} />}
        </div>
        {assessment && (
          <>
            <ul className="crit">{assessment.criteria.map((c) => <li key={c.id} className={c.pass ? 'ok' : 'no'}>{t(c.label)}{c.detail ? <span className="muted small"> ({c.detail})</span> : null}</li>)}</ul>
            {assessment.results.length > 0 && <ResultsTable tests={p.tests} results={assessment.results} />}
            <ControlTable control={assessment.control} />
            <h3>{t('export.title')}</h3>
            <p className="small muted">{t('export.text')} <span aria-live="polite">{msg}</span></p>
            {files.map((f) => (
              <details key={f.name} className="file">
                <summary><code>{f.name}</code> <CopyButton text={f.content} onMsg={setMsg} /></summary>
                <pre>{f.content}</pre>
              </details>
            ))}
          </>
        )}
        <details className="small">
          <summary>{t('ref.summary')}</summary>
          <p>{t('ref.text')}</p>
          <button onClick={() => setP({ subject: 'Riverside Community Centre', config: { ...RIVERSIDE, instructions: RIVERSIDE_INSTRUCTIONS }, tests: RIVERSIDE_TESTS.map((x) => ({ ...x })) })}>{t('ref.load')}</button>
        </details>
      </section>
    </div>
  );
}

