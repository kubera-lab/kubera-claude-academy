import { Glossary } from './ui/Glossary.tsx';
import { useEffect, useMemo, useState } from 'react';
import { getLang, setLang, t } from './i18n/index.ts';
import { useAppState, storageAvailable, lessonPassed, lessonStale, withHistory, parseSaved, type AppState } from './state.ts';
import { COURSES, ALL_LESSONS, courseById, lessonById, searchContent } from './content/catalog.ts';
import { REGISTER, SRC } from './content/sources.ts';
import { tx, type Course, type Lang } from './content/types.ts';
import { ExerciseView, initialAnswer } from './ui/exercises.tsx';
import { CopyButton, Status } from './ui/parts.tsx';
import { LegacyCourse, ModulePage, ProjectPage, knowledge, moduleDone, mods, type SetState } from './pages/Legacy.tsx';
import { buildPortfolio, courseSummaries } from './engine/portfolio.ts';
import type { ModuleId } from './data/course.ts';

type Route =
  | { page: 'home' } | { page: 'courses' } | { page: 'course'; id: string } | { page: 'lesson'; id: string }
  | { page: 'module'; id: ModuleId } | { page: 'project' } | { page: 'dashboard' } | { page: 'search' } | { page: 'about' };

export function parseRoute(hash: string): Route {
  const h = decodeURIComponent(hash.replace(/^#/, ''));
  if (/^m[1-5]$/.test(h)) return { page: 'module', id: h as ModuleId };
  if (h === 'course' || h === 'c/assistant') return { page: 'course', id: 'assistant' };
  if (h.startsWith('c/') && courseById(h.slice(2))) return { page: 'course', id: h.slice(2) };
  if (h.startsWith('l/') && lessonById(h.slice(2))) return { page: 'lesson', id: h.slice(2) };
  if (['courses', 'project', 'dashboard', 'search', 'about'].includes(h)) return { page: h } as Route;
  return { page: 'home' };
}

function legacyStats(s: AppState) {
  const ms = mods();
  const passed = ms.filter((m) => moduleDone(s, m.id)).length;
  const k = knowledge(s);
  return {
    passed, total: ms.length,
    knowledge: `${k.score} / ${k.total}`,
    project: s.projectCheck ? `${s.projectCheck.met} / ${s.projectCheck.total} ${getLang() === 'ru' ? 'критериев' : 'criteria'}` : '—',
  };
}

export default function App() {
  const { state, setState, reset, restore } = useAppState();
  setLang(state.lang);
  const lang = state.lang;
  const [route, setRoute] = useState<Route>(() => parseRoute(location.hash));
  const [menu, setMenu] = useState(false);
  const canStore = useMemo(storageAvailable, []);
  useEffect(() => {
    const on = () => { setRoute(parseRoute(location.hash)); setMenu(false); document.getElementById('main')?.focus({ preventScroll: true }); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  useEffect(() => { document.title = t('app.name') + ' — ' + t('app.tagline'); }, [lang]);
  const totalUnits = ALL_LESSONS.length + mods().length;
  const doneUnits = ALL_LESSONS.filter((l) => lessonPassed(state.lessons[l.id], l.v)).length + mods().filter((m) => moduleDone(state, m.id)).length;
  const cur = (p: Route['page']) => (route.page === p ? 'page' : undefined);
  return (
    <>
      <a className="skip" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>{t('nav.skip')}</a>
      <header className="top">
        <div className="topin">
          <a href="#home" className="brand"><span className="mark" aria-hidden="true">K</span>{t('app.name')}</a>
          <button className="menubtn" aria-expanded={menu} aria-controls="nav" onClick={() => setMenu(!menu)}>{t('nav.menu')}</button>
          <nav id="nav" className={menu ? 'open' : ''} aria-label={t('nav.main')}>
            <a href="#home" aria-current={cur('home')}>{t('nav.home')}</a>
            <a href="#courses" aria-current={route.page === 'courses' || route.page === 'course' || route.page === 'lesson' || route.page === 'module' ? 'page' : undefined}>{t('nav.courses')}</a>
            <a href="#dashboard" aria-current={cur('dashboard')}>{t('nav.dashboard')}</a>
            <a href="#search" aria-current={cur('search')}>{t('nav.search')}</a>
            <a href="#about" aria-current={cur('about')}>{t('nav.about')}</a>
            <span className="langsw" role="group" aria-label={t('nav.lang')}>
              {(['en', 'ru'] as Lang[]).map((l) => (
                <button key={l} className={'ghost' + (lang === l ? ' on' : '')} aria-pressed={lang === l} onClick={() => setState((s) => ({ ...s, lang: l }))}>{l.toUpperCase()}</button>
              ))}
            </span>
          </nav>
          <div className="prog" role="img" aria-label={t('nav.progress', { d: doneUnits, t: totalUnits })}><i style={{ width: `${(doneUnits / totalUnits) * 100}%` }} /></div>
        </div>
      </header>
      <main id="main" tabIndex={-1}>
        {route.page === 'home' && <Home state={state} />}
        {route.page === 'courses' && <Catalogue state={state} />}
        {route.page === 'course' && (route.id === 'assistant' ? <LegacyCourse state={state} /> : <CoursePage course={courseById(route.id)!} state={state} />)}
        {route.page === 'lesson' && <LessonPage key={route.id} id={route.id} state={state} setState={setState} />}
        {route.page === 'module' && <ModulePage key={route.id + lang} def={mods().find((m) => m.id === route.id)!} state={state} setState={setState} />}
        {route.page === 'project' && <ProjectPage state={state} setState={setState} />}
        {route.page === 'dashboard' && <Dashboard state={state} restore={restore} reset={reset} canStore={canStore} />}
        {route.page === 'search' && <Search lang={lang} />}
        {route.page === 'about' && <About lang={lang} />}
      </main>
      <footer>{t('footer')}</footer>
    </>
  );
}

// ---------------- Home ----------------
function Home({ state }: { state: AppState }) {
  const lang = state.lang;
  const steps = t('home.steps').split(';').map((s) => s.split('|'));
  const next = nextStep(state);
  return (
    <div className="wrap">
      <section className="hero">
        <p className="eyebrow">{t('app.tagline')}</p>
        <h1>{t('home.title')}</h1>
        <p className="lead">{t('home.lead')}</p>
        <div className="row">
          <a className="btn primary" href={next ? next.href : '#courses'}>{next ? t('home.continue') : t('home.start')}</a>
          <a className="btn" href="#courses">{t('nav.courses')}</a>
        </div>
      </section>
      <section>
        <h2>{t('home.how')}</h2>
        <ol className="steps">{steps.map(([h, d], i) => <li key={i}><b>{h}</b><span>{d}</span></li>)}</ol>
      </section>
      <section className="card">
        <h2>{t('home.assess')}</h2>
        <p>{t('home.assess.text')}</p>
      </section>
      <section>
        <h2>{t('home.catalogue')}</h2>
        <CourseCards state={state} lang={lang} />
      </section>
      <section className="card subtle">
        <h2>{t('home.honest')}</h2>
        <p>{t('home.honest.text')}</p>
      </section>
    </div>
  );
}

function nextStep(s: AppState): { href: string } | null {
  const started = s.history.length > 0 || Object.values(s.modules).some((m) => m.attempts > 0);
  if (!started) return null;
  const l = ALL_LESSONS.find((x) => s.lessons[x.id] && !lessonPassed(s.lessons[x.id], x.v));
  if (l) return { href: '#l/' + l.id };
  const m = mods().find((x) => s.modules[x.id].attempts > 0 && !moduleDone(s, x.id));
  if (m) return { href: '#' + m.id };
  return { href: '#dashboard' };
}

function courseProgress(c: Course, s: AppState) {
  if (c.legacy) {
    const ms = mods();
    return { done: ms.filter((m) => moduleDone(s, m.id)).length, total: ms.length, minutes: ms.reduce((a, m) => a + m.minutes, 0) };
  }
  return { done: c.lessons.filter((l) => lessonPassed(s.lessons[l.id], l.v)).length, total: c.lessons.length, minutes: c.lessons.reduce((a, l) => a + l.minutes, 0) };
}

function CourseCards({ state, lang }: { state: AppState; lang: Lang }) {
  return (
    <div className="cards">
      {COURSES.map((c) => {
        const p = courseProgress(c, state);
        return (
          <article key={c.id} className="ccard">
            <Status ok={p.done === p.total ? true : null} text={p.done === p.total ? t('course.complete') : t('course.progress', { d: p.done, t: p.total })} />
            <h3>{c.n}. {tx(c.title, lang)}</h3>
            <p className="small muted">{tx(c.level, lang)} · {t('course.units', { n: p.total })} · {t('course.estimate', { h: Math.max(0.5, Math.round((p.minutes / 60) * 2) / 2) })}</p>
            <p className="small">{tx(c.summary, lang)}</p>
            <p className="small"><b>{t('course.outcome')}:</b> {tx(c.outcome, lang)}</p>
            <a className="btn primary" href={'#c/' + c.id}>{t('course.open')}</a>
          </article>
        );
      })}
    </div>
  );
}

function Catalogue({ state }: { state: AppState }) {
  return (
    <div className="wrap">
      <h1>{t('cat.title')}</h1>
      <p className="lead">{t('cat.lead')}</p>
      <CourseCards state={state} lang={state.lang} />
    </div>
  );
}

// ---------------- Course ----------------
function CoursePage({ course, state }: { course: Course; state: AppState }) {
  const lang = state.lang;
  return (
    <div className="wrap">
      <p className="eyebrow"><a href="#courses">{t('nav.courses')}</a> · {tx(course.level, lang)}</p>
      <h1>{course.n}. {tx(course.title, lang)}</h1>
      <p className="lead">{tx(course.summary, lang)}</p>
      <p><b>{t('course.outcome')}:</b> {tx(course.outcome, lang)}</p>
      <Glossary items={course.glossary} lang={lang} />
      <ol className="modlist">
        {course.lessons.map((l, i) => {
          const p = state.lessons[l.id];
          const ok = lessonPassed(p, l.v);
          const manual = p?.result?.outcome === 'manual';
          return (
            <li key={l.id}>
              <a href={'#l/' + l.id}>
                <span className="num">{i + 1}</span>
                <span className="mt"><b>{tx(l.title, lang)}</b><span className="small muted">{l.lab ? t('lesson.lab') + ' · ' : ''}{t('module.minutes', { m: l.minutes })}</span></span>
                <span className="mstat">
                  <Status ok={ok ? true : p?.result && !lessonStale(p, l.v) && !manual ? false : null} text={ok ? t('status.passed') : manual ? t('ex.manualShort') : p?.result ? (lessonStale(p, l.v) ? t('lesson.changed') : t('lesson.retry')) : t('status.notYet')} />
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ---------------- Lesson ----------------
function LessonPage({ id, state, setState }: { id: string; state: AppState; setState: SetState }) {
  const lesson = lessonById(id)!;
  const course = courseById(lesson.courseId)!;
  const lang = state.lang;
  const idx = course.lessons.findIndex((l) => l.id === id);
  const next = course.lessons[idx + 1];
  const prev = course.lessons[idx - 1];
  const p = state.lessons[id];
  const progress = p ?? { answer: initialAnswer(lesson.exercise), attempts: 0 };
  const passed = lessonPassed(p, lesson.v);
  const [msg, setMsg] = useState('');
  return (
    <div className="wrap">
      <p className="eyebrow"><a href={'#c/' + course.id}>{tx(course.title, lang)}</a> · {t('lesson.of', { n: idx + 1, t: course.lessons.length })} · {t('module.minutes', { m: lesson.minutes })}{lesson.lab ? ' · ' + t('lesson.lab') : ''}</p>
      <h1>{tx(lesson.title, lang)}</h1>
      <section className="lesson">
        <h2>{t('module.lesson')}</h2>
        {lesson.explain.map((x, i) => <p key={i}>{tx(x, lang)}</p>)}
        <div className="example"><span className="eyebrow">{t('module.example')}</span><pre>{tx(lesson.example, lang)}</pre></div>
      </section>
      <section className="card task">
        <h2>{lesson.lab ? t('lesson.labTask') : t('lesson.practice')}</h2>
        <ExerciseView
          lesson={lesson}
          lang={lang}
          progress={progress}
          onAnswer={(answer) => setState((s) => ({ ...s, lessons: { ...s.lessons, [id]: { ...(s.lessons[id] ?? { attempts: 0 }), answer } } }))}
          onGraded={(r) => setState((s) => {
            const cur = s.lessons[id] ?? { answer: initialAnswer(lesson.exercise), attempts: 0 };
            const result = { outcome: r.outcome, score: r.score, total: r.total, hash: r.hash, v: lesson.v, at: new Date().toISOString(), items: r.items };
            return withHistory({ ...s, lessons: { ...s.lessons, [id]: { ...cur, attempts: cur.attempts + 1, result } } }, { id, outcome: r.outcome, score: r.score, total: r.total });
          })}
        />
        <p className="small muted">{t('lesson.attempts', { n: progress.attempts })}</p>
      </section>
      <section className="card subtle">
        <h2>{t('lesson.sources')}</h2>
        <ul className="sources">
          {lesson.sources.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a> — {s.org}. <span className="small">{tx(s.purpose, lang)}</span>
              <span className="small muted"> {t('lesson.checked', { d: s.checked })} · {t('lesson.license')}: {s.license}</span>
            </li>
          ))}
        </ul>
        <p className="small muted">{t('lesson.sourcesNote')}</p>
      </section>
      <section className={'card ' + (passed ? 'donecard' : 'subtle')} role="status">
        <h2>{passed ? t('lesson.done') : p?.result?.outcome === 'manual' ? t('ex.manual') : t('lesson.notDone')}</h2>
        <div className="row">
          {prev && <a className="btn" href={'#l/' + prev.id}>← {tx(prev.title, lang)}</a>}
          {next ? <a className={'btn' + (passed ? ' primary' : '')} href={'#l/' + next.id}>{tx(next.title, lang)} →</a> : <a className="btn primary" href={'#c/' + course.id}>{t('lesson.backToCourse')}</a>}
          {p && <button className="ghost" onClick={() => setState((s) => ({ ...s, lessons: { ...s.lessons, [id]: { answer: initialAnswer(lesson.exercise), attempts: s.lessons[id]?.attempts ?? 0 } } }))}>{t('lesson.restart')}</button>}
        </div>
        <span aria-live="polite" className="small">{msg}</span>
        {passed && lesson.lab && <CopyButton text={String(p?.answer ?? '')} label={t('lesson.copyWork')} onMsg={setMsg} />}
      </section>
    </div>
  );
}

// ---------------- Search ----------------
function Search({ lang }: { lang: Lang }) {
  const [q, setQ] = useState('');
  const legacy = mods().map((m) => ({ id: m.id, title: m.title, text: m.lesson.map((b) => (Array.isArray(b.text) ? b.text.join(' ') : b.text)).join(' ') }));
  const hits = searchContent(q, lang, legacy);
  return (
    <div className="wrap">
      <h1>{t('search.title')}</h1>
      <div className="field">
        <label htmlFor="q">{t('search.label')}</label>
        <input id="q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('search.ph')} autoFocus />
      </div>
      <p className="small muted" aria-live="polite">{q.trim().length > 1 ? t('search.count', { n: hits.length }) : t('search.hint')}</p>
      <ul className="hits">
        {hits.map((h) => (
          <li key={h.kind + h.id}><a href={h.href}><b>{h.title}</b></a> <span className="small muted">— {h.course}</span><br /><span className="small">{h.snippet}</span></li>
        ))}
      </ul>
    </div>
  );
}

// ---------------- About: sources, research register, tutor ----------------
function About({ lang }: { lang: Lang }) {
  return (
    <div className="wrap">
      <h1>{t('about.title')}</h1>
      <p className="lead">{t('about.lead')}</p>
      <section className="card">
        <h2>{t('about.tutor')}</h2>
        <p>{t('about.tutorText')}</p>
        <Status ok={null} text={t('about.tutorStatus')} />
      </section>
      <section className="card">
        <h2>{t('about.sources')}</h2>
        <ul className="sources">
          {Object.values(SRC).map((s) => (
            <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a> — {s.org}. <span className="small">{tx(s.purpose, lang)}</span> <span className="small muted">{t('lesson.checked', { d: s.checked })} · {s.license}</span></li>
          ))}
        </ul>
      </section>
      <section className="card">
        <h2>{t('about.register')}</h2>
        <p className="small muted">{t('about.registerNote')}</p>
        <div className="tablewrap">
          <table className="results">
            <thead><tr><th scope="col">{t('reg.name')}</th><th scope="col">{t('reg.country')}</th><th scope="col">{t('reg.what')}</th><th scope="col">{t('reg.assess')}</th><th scope="col">{t('reg.license')}</th><th scope="col">{t('reg.reuse')}</th><th scope="col">{t('reg.status')}</th></tr></thead>
            <tbody>
              {REGISTER.map((r) => (
                <tr key={r.url}>
                  <td><a href={r.url} target="_blank" rel="noopener noreferrer">{r.name}</a><br /><span className="small muted">{r.developer}</span></td>
                  <td>{r.country}</td>
                  <td className="small">{tx(r.implemented, lang)} {tx(r.labs, lang)}</td>
                  <td className="small">{tx(r.assessment, lang)}</td>
                  <td className="small">{r.license}</td>
                  <td className="small">{tx(r.reuse, lang)}</td>
                  <td className="small">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="card subtle">
        <h2>{t('home.honest')}</h2>
        <p>{t('home.honest.text')}</p>
      </section>
    </div>
  );
}

// ---------------- Dashboard ----------------
function download(name: string, text: string, type: string): boolean {
  try {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    return true;
  } catch {
    return false;
  }
}

function Dashboard({ state, restore, reset, canStore }: { state: AppState; restore: (s: AppState) => void; reset: () => void; canStore: boolean }) {
  const lang = state.lang;
  const [ask, setAsk] = useState(false);
  const [msg, setMsg] = useState('');
  const legacy = legacyStats(state);
  const summaries = courseSummaries(state, lang, legacy);
  const portfolio = buildPortfolio(state, lang, legacy, new Date());
  const mistakes = ALL_LESSONS.filter((l) => state.lessons[l.id]?.result && !lessonPassed(state.lessons[l.id], l.v) && state.lessons[l.id]?.result?.outcome !== 'manual');
  const manual = ALL_LESSONS.filter((l) => state.lessons[l.id]?.result?.outcome === 'manual');
  const legacyMistakes = mods().flatMap((m) => state.modules[m.id].wrong.map((id) => ({ m, q: m.quiz.find((q) => q.id === id)! }))).filter((x) => x.q);
  const titleOf = (id: string) => {
    const l = lessonById(id);
    if (l) return tx(l.title, lang);
    const m = mods().find((x) => id.startsWith(x.id + '-'));
    return m ? `${m.title} (${id.endsWith('quiz') ? t('module.quiz') : t('module.practice')})` : id;
  };
  const importFile = async (f: File | undefined) => {
    if (!f) return;
    const text = await f.text();
    const parsed = parseSaved(text, null);
    if (parsed.history.length === 0 && Object.keys(parsed.lessons).length === 0 && !Object.values(parsed.modules).some((m) => m.attempts > 0)) {
      setMsg(t('dash.importFail'));
      return;
    }
    restore({ ...parsed, lang: state.lang });
    setMsg(t('dash.importOk'));
  };
  return (
    <div className="wrap">
      <h1>{t('dash.title')}</h1>
      <p className="note">{canStore ? t('dash.storage') : t('dash.storageOff')}</p>
      <div className="tiles">
        {summaries.map((c) => (
          <a key={c.id} className="tile" href={'#c/' + c.id}>
            <span className="eyebrow">{c.title}</span>
            <b>{c.passed} / {c.total}</b>
            <span className="small muted">{c.manual ? t('dash.manualN', { n: c.manual }) : t('dash.passedUnits')}</span>
          </a>
        ))}
      </div>
      <section className="card">
        <h2>{t('dash.assistant')}</h2>
        <p>{t('dash.knowledge')}: <b>{legacy.knowledge}</b> · {t('dash.project')}: <b>{legacy.project}</b></p>
      </section>
      <section className="card">
        <h2>{t('dash.mistakes')}</h2>
        {mistakes.length + legacyMistakes.length === 0 ? <p className="muted">{t('dash.noMistakes')}</p> : (
          <ul>
            {mistakes.map((l) => <li key={l.id}><a href={'#l/' + l.id}>{tx(l.title, lang)}</a> <span className="small muted">— {lessonStale(state.lessons[l.id], l.v) ? t('lesson.changed') : t('dash.lastScore', { s: state.lessons[l.id]!.result!.score, t: state.lessons[l.id]!.result!.total })}</span></li>)}
            {legacyMistakes.map(({ m, q }) => <li key={q.id}><a href={'#' + m.id}>{m.number}. {q.prompt}</a></li>)}
          </ul>
        )}
        {manual.length > 0 && <><h3>{t('dash.manualTitle')}</h3><ul>{manual.map((l) => <li key={l.id}><a href={'#l/' + l.id}>{tx(l.title, lang)}</a></li>)}</ul></>}
      </section>
      <section className="card">
        <h2>{t('dash.history')}</h2>
        {state.history.length === 0 ? <p className="muted">{t('dash.empty')}</p> : (
          <div className="tablewrap">
            <table className="results">
              <thead><tr><th scope="col">{t('dash.when')}</th><th scope="col">{t('dash.what')}</th><th scope="col">{t('dash.result')}</th></tr></thead>
              <tbody>
                {state.history.slice(0, 30).map((h, i) => (
                  <tr key={i}><td className="small">{h.at.slice(0, 16).replace('T', ' ')}</td><td>{titleOf(h.id)}</td><td><Status ok={h.outcome === 'passed' ? true : h.outcome === 'manual' ? null : false} text={h.outcome === 'manual' ? t('ex.manualShort') : `${h.score}/${h.total}`} /></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section className="card">
        <h2>{t('dash.portfolio')}</h2>
        <p className="small muted">{t('dash.portfolioText')}</p>
        <div className="row">
          <button className="primary" onClick={() => setMsg(download('kubera-ai-academy-portfolio.md', portfolio, 'text/markdown') ? t('dash.downloaded') : t('export.copyFail'))}>{t('dash.downloadMd')}</button>
          <CopyButton text={portfolio} label={t('dash.copyMd')} onMsg={setMsg} />
          <button onClick={() => setMsg(download('kubera-ai-academy-progress.json', JSON.stringify(state), 'application/json') ? t('dash.downloaded') : t('export.copyFail'))}>{t('dash.backup')}</button>
          <label className="btn filebtn">{t('dash.restore')}<input type="file" accept="application/json,.json" onChange={(e) => importFile(e.target.files?.[0])} /></label>
        </div>
        <p aria-live="polite" className="small">{msg}</p>
        <details className="file"><summary>{t('dash.preview')}</summary><pre>{portfolio}</pre></details>
      </section>
      <section className="card subtle">
        {!ask ? <button className="ghost" onClick={() => setAsk(true)}>{t('dash.reset')}</button> : (
          <div role="alertdialog" aria-label={t('dash.reset')}>
            <p>{t('dash.resetConfirm')}</p>
            <div className="row"><button className="danger" onClick={() => { reset(); setAsk(false); }}>{t('dash.resetYes')}</button><button onClick={() => setAsk(false)}>{t('project.cancel')}</button></div>
          </div>
        )}
      </section>
    </div>
  );
}
