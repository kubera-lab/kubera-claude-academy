// Интерфейс школы: главная, список уроков, урок по шагам, повтор ошибок.
import { COURSES, LAB_COURSES } from '../data/courses.js';
import { COURSE1 } from '../data/course1.js';
import { LAB1 } from '../data/lab1.js';
import { UI } from './i18n.js';
import {
  STORE_KEY, parseProgress, emptyProgress, recordAnswer, finishLesson,
  nextLesson, isUnlocked, checkAnswer, labResult, LAB_PARTS, LAB_TEXT,
} from './logic.js';

const COURSE_DATA = { c1: COURSE1, k1: LAB1 };
const ALL_META = [...COURSES, ...LAB_COURSES];
const app = document.getElementById('app');

// ---------- Прогресс в браузере (может быть недоступен, тогда работаем без сохранения) ----------
let progress = load();
function load() {
  try { return parseProgress(localStorage.getItem(STORE_KEY)); } catch { return emptyProgress(); }
}
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(progress)); } catch { /* приватный режим */ }
}
if (!progress.lang) {
  const nav = (navigator.language || 'en').toLowerCase();
  progress.lang = /^(ru|uk|be|kk)/.test(nav) ? 'ru' : 'en';
}
const t = () => UI[progress.lang];
const L = (lesson) => lesson[progress.lang];

// ---------- Мини-конструктор элементов ----------
function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

function header(backHref) {
  return h('header', { class: 'top' }, h('div', { class: 'topin' },
    backHref
      ? h('a', { class: 'btn ghost', href: backHref }, t().back)
      : h('a', { class: 'brand', href: '#/' }, h('span', { class: 'mark', 'aria-hidden': 'true' }, '✦'), 'KUBERA AI START'),
    h('button', {
      class: 'btn ghost', type: 'button', 'aria-label': t().langName, lang: progress.lang === 'ru' ? 'en' : 'ru',
      onclick: () => { progress.lang = progress.lang === 'ru' ? 'en' : 'ru'; save(); render(); },
    }, t().lang),
  ));
}

function footer() {
  let armed = false;
  const resetBtn = h('button', {
    class: 'link', type: 'button',
    onclick: () => {
      if (!armed) { armed = true; resetBtn.textContent = t().resetAsk; return; }
      const lang = progress.lang; progress = { ...emptyProgress(), lang }; save(); location.hash = '#/'; render();
    },
  }, t().reset);
  return h('footer', { class: 'foot' }, h('p', {}, t().privacy), resetBtn, h('p', {}, t().footer),
    h('p', {}, h('a', { href: '../' }, t().academy)));
}

function page(backHref, ...content) {
  document.documentElement.lang = progress.lang;
  app.replaceChildren(header(backHref), h('main', { id: 'main', class: 'wrap' }, ...content), footer());
  window.scrollTo(0, 0);
  const focusTarget = app.querySelector('h1');
  if (focusTarget) { focusTarget.setAttribute('tabindex', '-1'); focusTarget.focus({ preventScroll: true }); }
}


// ---------- Главная ----------
function homeView() {
  const lessons = COURSE1.lessons;
  const anyDone = lessons.some((l) => progress.done[l.id]);
  const target = nextLesson(progress, lessons);
  page(null,
    h('section', { class: 'hero' },
      h('p', { class: 'eyebrow' }, t().eyebrow),
      h('h1', {}, t().tagline),
      h('p', { class: 'lead' }, t().heroText),
      h('a', { class: 'btn primary big', href: `#/c1/${target}` }, anyDone ? t().cont : t().start),
    ),
    h('h2', {}, t().courses),
    h('ol', { class: 'grid' },
      COURSES.map((c, i) => {
        const inner = [
          h('span', { class: 'num' }, String(i + 1).padStart(2, '0')),
          h('strong', {}, c.title[progress.lang]),
          h('span', { class: 'muted' }, c.sub[progress.lang]),
          c.open
            ? h('span', { class: 'pill' }, `${countDone(c.id)}/${COURSE_DATA[c.id].lessons.length}`)
            : h('span', { class: 'pill soon' }, t().soon),
        ];
        return h('li', {}, c.open
          ? h('a', { class: 'card', href: `#/${c.id}` }, inner)
          : h('div', { class: 'card off', 'aria-disabled': 'true' }, inner));
      }),
    ),
    h('h2', {}, t().labSection),
    h('p', { class: 'muted' }, t().labSectionText),
    h('ol', { class: 'labgrid' },
      LAB_COURSES.map((c) => h('li', {}, h('a', { class: 'card', href: `#/${c.id}` },
        h('span', { class: 'icon', 'aria-hidden': 'true' }, c.icon),
        h('strong', {}, c.title[progress.lang]),
        h('span', { class: 'muted' }, c.sub[progress.lang]),
        h('span', { class: 'pill' }, `${countDone(c.id)}/${COURSE_DATA[c.id].lessons.length}`)))),
    ),
  );
}
function totalScore(course) { return course.lessons.reduce((n, l) => n + ((progress.scores || {})[l.id] || 0), 0); }
function countDone(cid) { return COURSE_DATA[cid].lessons.filter((l) => progress.done[l.id]).length; }

// ---------- Список уроков курса ----------
function courseView(cid) {
  const course = COURSE_DATA[cid];
  const meta = ALL_META.find((c) => c.id === cid);
  const isLab = LAB_COURSES.includes(meta);
  const all = course.lessons.every((l) => progress.done[l.id]);
  const mistakes = progress.mistakes.filter((m) => m.startsWith(cid));
  page('#/',
    h('p', { class: 'eyebrow' }, isLab ? t().labSection : t().courseN(COURSES.indexOf(meta) + 1)),
    h('h1', {}, meta.title[progress.lang]),
    h('p', { class: 'lead' }, meta.sub[progress.lang]),
    all && h('div', { class: 'badge', role: 'status' },
      h('span', { class: 'check', 'aria-hidden': 'true' }, '✓'),
      h('div', {}, h('strong', {}, t().badge), h('p', { class: 'muted' }, t().badgeText(totalScore(course), course.lessons.reduce((n, l) => n + l.key.length, 0))))),
    h('ol', { class: 'lessons' },
      course.lessons.map((l, i) => {
        const open = isUnlocked(progress, course.lessons, l.id);
        const inner = [
          h('span', { class: 'lnum' + (progress.done[l.id] ? ' done' : ''), 'aria-hidden': 'true' }, progress.done[l.id] ? '✓' : String(i + 1)),
          h('span', { class: 'ltitle' }, L(l).title),
          h('span', { class: 'muted small' }, progress.done[l.id]
            ? t().scoreShort((progress.scores || {})[l.id] ?? 0, l.key.length)
            : open ? `${l.minutes} ${t().min}` : t().lockedShort),
        ];
        return h('li', {}, open
          ? h('a', { class: 'lesson', href: `#/${cid}/${l.id}` }, inner)
          : h('div', { class: 'lesson off', title: t().locked, 'aria-disabled': 'true' }, inner, h('span', { class: 'sr' }, t().locked)));
      }),
    ),
    mistakes.length > 0 && h('a', { class: 'btn', href: `#/${cid}/review` }, t().review(mistakes.length)),
    isLab && learnedView(course),
  );
}

/** Результат обучения: пройденные направления и словарь терминов из пройденных уроков. */
function learnedView(course) {
  const done = course.lessons.filter((l) => progress.done[l.id]);
  return h('section', { class: 'learned' },
    h('h2', {}, t().learned),
    done.length === 0
      ? h('p', { class: 'muted' }, t().learnedEmpty)
      : [
          h('table', { class: 'terms journal' },
            h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, t().jDate), h('th', { scope: 'col' }, t().jArea), h('th', { scope: 'col' }, t().jLesson), h('th', { scope: 'col' }, t().jScore))),
            h('tbody', {}, done.map((l) => h('tr', {},
              h('td', {}, (progress.when || {})[l.id] || '—'),
              h('td', { lang: 'en' }, h('strong', {}, l.area)),
              h('td', {}, L(l).title),
              h('td', {}, `${(progress.scores || {})[l.id] ?? 0}/${l.key.length}`))))),
          h('h3', {}, t().glossary(done.reduce((n, l) => n + L(l).terms.length, 0))),
          termsTable(done.flatMap((l) => L(l).terms)),
        ]);
}

function termsTable(terms) {
  return h('table', { class: 'terms' },
    h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, t().termEn), h('th', { scope: 'col' }, t().termMeaning), h('th', { scope: 'col' }, t().termSay))),
    h('tbody', {}, terms.map(([en, meaning, say]) => h('tr', {}, h('td', { lang: 'en' }, h('strong', {}, en)), h('td', {}, meaning), h('td', {}, say)))));
}

// ---------- Урок по шагам ----------
function lessonView(cid, lid) {
  const course = COURSE_DATA[cid];
  const lesson = course.lessons.find((l) => l.id === lid);
  if (!lesson || !isUnlocked(progress, course.lessons, lid)) { location.hash = `#/${cid}`; return; }
  progress.last = lid; save();
  const T = L(lesson);
  let step = 0;
  let qi = 0;
  let firstTry = 0;

  // Шаги урока. В уроках «Лаборатории KUBERA» после «Сути» есть шаг «Термины».
  const kinds = T.terms ? ['situation', 'points', 'terms', 'compare', 'try', 'quiz'] : ['situation', 'points', 'compare', 'try', 'quiz'];
  const labels = T.terms ? t().stepsLab : t().steps;
  const draw = () => {
    const bar = h('ol', { class: 'steps', 'aria-label': 'progress', style: `grid-template-columns:repeat(${labels.length},1fr)` },
      labels.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '', 'aria-current': i === step ? 'step' : null }, s)));
    let body;
    const go = (n) => () => { step = n; draw(); };
    const kind = kinds[step];
    if (kind === 'situation') body = situationStep(T, go(step + 1));
    else if (kind === 'points') body = pointsStep(T, go(step + 1));
    else if (kind === 'terms') body = termsStep(T, go(step + 1));
    else if (kind === 'compare') body = compareStep(T, go(step + 1));
    else if (kind === 'try') body = tryStep(T, lesson, go(step + 1));
    else if (kind === 'quiz') body = quizStep(lesson, qi, (wasFirstTryRight) => {
      if (wasFirstTryRight) firstTry++;
      qi++;
      if (qi >= T.quiz.length) { progress = finishLesson(progress, lid, firstTry, T.quiz.length); save(); step = kinds.length; }
      draw();
    });
    else body = resultStep(cid, course, lesson, firstTry, T.quiz.length);
    page(`#/${cid}`, h('p', { class: 'kicker' }, `${t().lessonN(course.lessons.indexOf(lesson) + 1)} · ${T.title}`), bar, body);
  };
  draw();
}

function nextBtn(next) { return h('button', { class: 'btn primary big', type: 'button', onclick: next }, t().next); }

function situationStep(T, next) {
  return h('section', {},
    h('h1', {}, T.title),
    h('div', { class: 'card situation' }, h('p', { class: 'eyebrow' }, t().situation), h('p', {}, T.situation)),
    nextBtn(next));
}

function pointsStep(T, next) {
  return h('section', {},
    h('h1', {}, t().points),
    h('ol', { class: 'points' }, T.points.map(([term, text]) => h('li', {}, h('strong', {}, term), h('p', {}, text)))),
    nextBtn(next));
}

function termsStep(T, next) {
  return h('section', {},
    h('h1', {}, t().terms),
    h('p', { class: 'muted' }, t().termsHint),
    termsTable(T.terms),
    nextBtn(next));
}

function compareStep(T, next) {
  const c = T.compare;
  return h('section', {},
    h('h1', {}, c.title || t().compare),
    h('div', { class: 'cmp' },
      h('div', { class: 'cmp-bad' }, h('p', { class: 'eyebrow' }, t().weak), h('p', { class: 'mono-q' }, c.bad)),
      h('div', { class: 'cmp-good' }, h('p', { class: 'eyebrow' }, t().strong), h('p', { class: 'mono-q' }, c.good))),
    h('div', { class: 'note' }, h('strong', {}, t().why + ' '), c.why),
    nextBtn(next));
}

function tryStep(T, lesson, next) {
  const copyBtn = h('button', {
    class: 'btn', type: 'button',
    onclick: async () => {
      try { await navigator.clipboard.writeText(T.prompt); copyBtn.textContent = t().copied; } catch { selectPrompt(); }
    },
  }, t().copy);
  const promptBox = h('blockquote', { class: 'prompt', tabindex: '0' }, T.prompt);
  function selectPrompt() {
    const r = document.createRange(); r.selectNodeContents(promptBox);
    const s = getSelection(); s.removeAllRanges(); s.addRange(r);
  }
  return h('section', {},
    h('h1', {}, T.terms ? t().task : t().tryIt),
    lesson.sim === 'promptLab' && promptLab(),
    h('p', {}, T.practice),
    promptBox,
    copyBtn,
    nextBtn(next));
}

function promptLab() {
  const lang = progress.lang;
  const chosen = new Set();
  const out = h('div', { class: 'lab-out', 'aria-live': 'polite' });
  const update = () => {
    const r = labResult(lang, [...chosen]);
    out.replaceChildren(
      h('p', { class: 'muted' }, t().labYouAsk),
      h('p', { class: 'bubble me' }, r.prompt),
      h('p', { class: 'muted' }, t().labReply),
      h('p', { class: 'bubble ai' }, r.reply),
      h('div', { class: 'meter', role: 'meter', 'aria-valuemin': '0', 'aria-valuemax': String(r.max), 'aria-valuenow': String(r.score) },
        h('span', { style: `width:${(r.score / r.max) * 100}%` })),
      h('p', {}, t().labScore(r.score, r.max)),
    );
  };
  const chips = LAB_PARTS.map((p) => {
    const b = h('button', {
      class: 'chip', type: 'button', 'aria-pressed': 'false',
      onclick: () => {
        if (chosen.has(p)) chosen.delete(p); else chosen.add(p);
        b.setAttribute('aria-pressed', String(chosen.has(p)));
        update();
      },
    }, h('strong', {}, LAB_TEXT[lang].labels[p] + ' '), LAB_TEXT[lang].parts[p]);
    return b;
  });
  update();
  return h('div', { class: 'lab' },
    h('h2', {}, t().lab),
    h('p', { class: 'honest' }, t().labHonest),
    h('p', {}, t().labHint),
    h('div', { class: 'chips' }, chips),
    out);
}

/** Один вопрос. onDone(trueЕслиВерноСПервогоРаза). Неверный ответ можно исправить. */
function quizStep(lesson, qi, onDone, extraTitle) {
  const T = L(lesson);
  const q = T.quiz[qi];
  const qid = `${lesson.id}:${qi}`;
  let tries = 0;
  const fb = h('div', { class: 'feedback', 'aria-live': 'assertive' });
  const nextBtn = h('button', { class: 'btn primary big', type: 'button', hidden: true, onclick: () => onDone(tries === 1) }, t().next);
  const opts = q.o.map(([text], j) => h('button', {
    class: 'opt', type: 'button',
    onclick: (e) => {
      if (nextBtn.hidden === false) return;
      tries++;
      const r = checkAnswer(T, lesson.key, qi, j);
      // Ошибка → вопрос в список повторения. Верно с первого раза → убираем из списка.
      // Верно, но со второй попытки → вопрос остаётся в списке, чтобы повторить позже.
      if (!r.ok) {
        progress = recordAnswer(progress, qid, false);
        e.currentTarget.classList.add('bad'); e.currentTarget.disabled = true;
        fb.replaceChildren(h('p', { class: 'bad-t' }, h('strong', {}, t().wrong + ' '), r.why));
      } else {
        if (tries === 1) progress = recordAnswer(progress, qid, true);
        e.currentTarget.classList.add('good');
        opts.forEach((o) => { o.disabled = true; });
        fb.replaceChildren(h('p', { class: 'good-t' }, h('strong', {}, t().right + ' '), r.why.replace(/^(Верно|Correct)[.!]\s*/, '')));
        nextBtn.hidden = false; nextBtn.focus();
      }
      save();
    },
  }, String.fromCharCode(65 + j) + '. ' + text));
  return h('section', {},
    h('p', { class: 'muted' }, extraTitle || `${t().question} ${qi + 1} ${t().of} ${T.quiz.length}`),
    h('h1', { class: 'q' }, q.q),
    h('div', { class: 'opts' }, opts),
    fb, nextBtn);
}

function resultStep(cid, course, lesson, firstTry, total) {
  const i = course.lessons.indexOf(lesson);
  const nxt = course.lessons[i + 1];
  return h('section', {},
    h('p', { class: 'eyebrow' }, t().done),
    h('h1', {}, t().takeaways),
    h('ul', { class: 'takeaways' }, L(lesson).takeaways.map((x) => h('li', {}, x))),
    h('p', { class: 'score' }, t().doneText(firstTry, total)),
    nxt
      ? h('a', { class: 'btn primary big', href: `#/${cid}/${nxt.id}` }, t().nextLesson)
      : h('a', { class: 'btn primary big', href: `#/${cid}` }, t().toCourse),
    nxt && h('a', { class: 'btn', href: `#/${cid}` }, t().toCourse));
}

// ---------- Повтор ошибок ----------
function reviewView(cid) {
  const course = COURSE_DATA[cid];
  const queue = progress.mistakes.filter((m) => m.startsWith(cid));
  if (queue.length === 0) {
    page(`#/${cid}`, h('h1', {}, t().reviewTitle), h('p', { class: 'lead' }, t().reviewEmpty),
      h('a', { class: 'btn primary big', href: `#/${cid}` }, t().toCourse));
    return;
  }
  const [lid, qs] = queue[0].split(':');
  const lesson = course.lessons.find((l) => l.id === lid);
  page(`#/${cid}`, h('p', { class: 'kicker' }, t().reviewTitle), h('p', { class: 'muted' }, t().reviewHint),
    quizStep(lesson, Number(qs), () => reviewView(cid), `${L(lesson).title} · ${queue.length}`));
}

// ---------- Маршруты ----------
function render() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts.length === 0) return homeView();
  const [cid, sub] = parts;
  if (!COURSE_DATA[cid]) { location.hash = '#/'; return; }
  if (!sub) return courseView(cid);
  if (sub === 'review') return reviewView(cid);
  return lessonView(cid, sub);
}
window.addEventListener('hashchange', render);
render();
