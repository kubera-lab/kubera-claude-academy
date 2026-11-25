// Интерфейс школы: главная, список уроков, урок по шагам, повтор ошибок.
import { COURSES } from '../data/courses.js';
import { COURSE1 } from '../data/course1.js';
import { UI } from './i18n.js';
import {
  STORE_KEY, parseProgress, emptyProgress, recordAnswer, finishLesson,
  nextLesson, isUnlocked, checkAnswer, labResult, LAB_PARTS, LAB_TEXT,
} from './logic.js';

const COURSE_DATA = { c1: COURSE1 };
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

function stars(n) {
  return h('span', { class: 'stars', 'aria-label': `${n}/3` }, '★'.repeat(n) + '☆'.repeat(3 - n));
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
          h('span', { class: 'icon', 'aria-hidden': 'true' }, c.icon),
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
  );
}
function countDone(cid) { return COURSE_DATA[cid].lessons.filter((l) => progress.done[l.id]).length; }

// ---------- Список уроков курса ----------
function courseView(cid) {
  const course = COURSE_DATA[cid];
  const meta = COURSES.find((c) => c.id === cid);
  const all = course.lessons.every((l) => progress.done[l.id]);
  const mistakes = progress.mistakes.filter((m) => m.startsWith(cid));
  page('#/',
    h('h1', {}, h('span', { 'aria-hidden': 'true' }, meta.icon + ' '), meta.title[progress.lang]),
    all && h('div', { class: 'badge', role: 'status' },
      h('span', { class: 'badge-icon', 'aria-hidden': 'true' }, course.badge),
      h('div', {}, h('p', {}, t().badge), h('strong', {}, t().badgeName))),
    h('ol', { class: 'lessons' },
      course.lessons.map((l, i) => {
        const open = isUnlocked(progress, course.lessons, l.id);
        const inner = [
          h('span', { class: 'icon', 'aria-hidden': 'true' }, progress.done[l.id] ? '✅' : open ? l.icon : '🔒'),
          h('span', { class: 'ltitle' }, `${i + 1}. ${L(l).title}`),
          h('span', { class: 'muted' }, progress.done[l.id] ? stars(progress.stars[l.id] || 1) : `${l.minutes} ${t().min}`),
        ];
        return h('li', {}, open
          ? h('a', { class: 'lesson', href: `#/${cid}/${l.id}` }, inner)
          : h('div', { class: 'lesson off', title: t().locked, 'aria-disabled': 'true' }, inner, h('span', { class: 'sr' }, t().locked)));
      }),
    ),
    mistakes.length > 0 && h('a', { class: 'btn', href: `#/${cid}/review` }, t().review(mistakes.length)),
  );
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

  const draw = () => {
    const bar = h('ol', { class: 'steps', 'aria-label': 'progress' },
      t().steps.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '', 'aria-current': i === step ? 'step' : null }, s)));
    let body;
    if (step === 0) body = storyStep(T, () => { step = 1; draw(); });
    else if (step === 1) body = ideaStep(T, () => { step = 2; draw(); });
    else if (step === 2) body = tryStep(T, lesson, () => { step = 3; draw(); });
    else if (step === 3) body = quizStep(lesson, qi, (wasFirstTryRight) => {
      if (wasFirstTryRight) firstTry++;
      qi++;
      if (qi >= T.quiz.length) { progress = finishLesson(progress, lid, firstTry, T.quiz.length); save(); step = 4; }
      draw();
    });
    else body = resultStep(cid, course, lesson, firstTry, T.quiz.length);
    page(`#/${cid}`, h('p', { class: 'kicker' }, `${course.lessons.indexOf(lesson) + 1}. ${T.title}`), bar, body);
  };
  draw();
}

function storyStep(T, next) {
  return h('section', {},
    h('h1', {}, t().story),
    h('div', { class: 'comic' }, T.story.map(([who, text]) =>
      h('div', { class: 'panel' }, h('span', { class: 'face', 'aria-hidden': 'true' }, who), h('p', {}, text)))),
    h('button', { class: 'btn primary big', type: 'button', onclick: next }, t().next));
}

function ideaStep(T, next) {
  return h('section', {},
    h('h1', {}, t().idea),
    h('p', { class: 'idea' }, T.idea),
    h('div', { class: 'example' }, h('h2', {}, '💡 ' + t().example), h('p', {}, T.example)),
    h('button', { class: 'btn primary big', type: 'button', onclick: next }, t().next));
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
    h('h1', {}, t().tryIt),
    lesson.sim === 'promptLab' && promptLab(),
    h('p', {}, T.practice),
    promptBox,
    copyBtn,
    h('button', { class: 'btn primary big', type: 'button', onclick: next }, t().next));
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
    h('h2', {}, '🧪 ' + t().lab),
    h('p', { class: 'honest' }, '⚠️ ' + t().labHonest),
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
        fb.replaceChildren(h('p', { class: 'bad-t' }, '❌ ' + t().wrong + ' ', r.why));
      } else {
        if (tries === 1) progress = recordAnswer(progress, qid, true);
        e.currentTarget.classList.add('good');
        opts.forEach((o) => { o.disabled = true; });
        fb.replaceChildren(h('p', { class: 'good-t' }, '✅ ' + t().right + ' ', r.why));
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
  return h('section', { class: 'result' },
    h('p', { class: 'big-emoji', 'aria-hidden': 'true' }, '🎉'),
    h('h1', {}, t().done),
    stars(progress.stars[lesson.id] || 1),
    h('p', {}, t().doneText(firstTry, total)),
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
