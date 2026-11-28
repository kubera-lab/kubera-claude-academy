// Автотесты раздела «Лаборатория KUBERA». Запуск: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LAB1 } from '../data/lab1.js';
import { LAB2 } from '../data/lab2.js';
const LABS = [LAB1, LAB2];
const ALL = LABS.flatMap((c) => c.lessons);
import { LAB_COURSES, COURSES } from '../data/courses.js';
import { validateLesson, checkAnswer, finishLesson, emptyProgress, parseProgress } from '../js/logic.js';

test('лаборатория: отдельный раздел, курсы k1 и k2 открыты, основные 8 курсов не тронуты', () => {
  assert.deepEqual(LAB_COURSES.map((c) => c.id), ['k1', 'k2']);
  assert.equal(COURSES.length, 8);
  assert.ok(LAB_COURSES.every((c) => c.title.ru && c.title.en && c.sub.ru && c.sub.en));
});

test('лаборатория: 8 уроков по 4 вопроса, у каждого направление', () => {
  assert.equal(LAB1.lessons.length, 8);
  for (const l of LAB1.lessons) {
    assert.equal(l.key.length, 4, l.id);
    assert.ok(l.area, l.id);
    assert.match(l.id, /^k1l\d$/);
  }
  assert.equal(new Set(LAB1.lessons.map((l) => l.id)).size, 8);
  assert.equal(LAB2.lessons.length, 7);
  for (const l of LAB2.lessons) { assert.equal(l.key.length, 4, l.id); assert.ok(l.area); assert.match(l.id, /^k2l\d$/); }
  assert.equal(new Set(ALL.map((l) => l.id)).size, ALL.length);
});

test('лаборатория: каждый урок собран полностью на обоих языках, включая термины', () => {
  for (const l of ALL) {
    assert.deepEqual(validateLesson(l), [], l.id);
    for (const lang of ['ru', 'en']) assert.ok(Array.isArray(l[lang].terms) && l[lang].terms.length >= 3, `${l.id} ${lang}`);
    assert.equal(l.ru.terms.length, l.en.terms.length, `${l.id}: одинаковое число терминов`);
    l.ru.terms.forEach((tm, i) => assert.equal(tm[0], l.en.terms[i][0], `${l.id}: английский термин ${i} совпадает в RU и EN`));
  }
});

test('лаборатория: произношение в RU-версии записано русскими буквами', () => {
  for (const l of ALL) for (const [, , say] of l.ru.terms) assert.match(say, /[а-яё]/i, `${l.id}: ${say}`);
});

test('лаборатория: верный ответ начинается со «Верно» / «Correct», 4 варианта, ответы на разных местах', () => {
  for (const l of ALL) {
    for (const lang of ['ru', 'en']) l[lang].quiz.forEach((q) => assert.equal(q.o.length, 4));
    l.key.forEach((k, i) => {
      assert.match(l.ru.quiz[i].o[k][1], /^Верно/, `${l.id} q${i} ru`);
      assert.match(l.en.quiz[i].o[k][1], /^Correct/, `${l.id} q${i} en`);
      l.ru.quiz[i].o.forEach((o, j) => { if (j !== k) assert.doesNotMatch(o[1], /^Верно/, `${l.id} q${i} o${j}`); });
    });
    assert.equal(new Set(l.key).size, 4, `${l.id}: все правильные ответы на разных местах`);
  }
});

test('лаборатория: уроки короткие (до 10 минут, до 4 тезисов по 320 символов)', () => {
  for (const l of ALL) {
    assert.ok(l.minutes <= 10);
    for (const lang of ['ru', 'en']) {
      assert.ok(l[lang].points.length <= 4);
      for (const [, text] of l[lang].points) assert.ok(text.length <= 320, `${l.id}/${lang}: ${text.length}`);
    }
  }
});

test('лаборатория: цифры в примерах сходятся', () => {
  const r2 = (x) => Math.round(x * 100) / 100;
  // EM-2207 и счёт за электричество из проверок учебной фабрики (учебные данные).
  assert.equal(r2(513 * 0.2), 102.6); assert.equal(r2(513 + 102.6), 615.6);
  assert.equal(r2(312.4 * 0.2), 62.48); assert.equal(r2(312.4 + 62.48), 374.88);
  // 10 000 нейронов в день, задача около 163 нейронов → около 60 задач.
  assert.equal(Math.floor(10000 / 163), 61);
  const all = JSON.stringify(LAB1);
  for (const s of ['615,60', '615.60', '374,88', '374.88', '10 000', '10,000']) assert.ok(all.includes(s), s);
});

test('лаборатория: в уроках нет настоящих данных и секретов', () => {
  const all = JSON.stringify(LAB1);
  assert.doesNotMatch(all, /@(?!ridge-demo\.example)[a-z0-9-]+\.[a-z]{2,}/i, 'нет адресов почты');
  assert.doesNotMatch(all, /(api[_-]?key|token|secret)\s*[:=]/i, 'нет ключей');
  assert.doesNotMatch(all, /\b\d{6}\b(?![\s\S]{0,3}(значн|digit))/, 'нет 6-значных кодов');
});

test('лаборатория: checkAnswer работает на уроках лаборатории', () => {
  const l = LAB1.lessons[2];
  assert.equal(checkAnswer(l.ru, l.key, 1, l.key[1]).ok, true);
  assert.equal(checkAnswer(l.ru, l.key, 1, (l.key[1] + 1) % 4).ok, false);
});

test('лаборатория: 12 технологий из плана владельца есть в словаре', () => {
  const terms = new Set(LAB1.lessons.flatMap((l) => l.en.terms.map(([t]) => t.split(' (')[0])));
  for (const t of ['Cloud computing', 'Database', 'Authentication', 'Access control', 'Data validation', 'OCR', 'Backup', 'Recovery',
    'Deployment', 'Workflow', 'AI inference', 'API']) assert.ok(terms.has(t), t);
});

test('лаборатория: про выключенный Mini PC урок не утверждает, что это уже проверено', () => {
  const l5 = LAB1.lessons.find((l) => l.id === 'k1l5');
  const k = l5.key[0];
  assert.match(l5.ru.quiz[0].o[k][0], /ещё не проведена/);
});

test('журнал навыков: сохраняется дата первого прохождения', () => {
  let p = finishLesson(emptyProgress(), 'k1l1', 3, 4, '2026-11-28');
  assert.equal(p.when.k1l1, '2026-11-28');
  p = finishLesson(p, 'k1l1', 4, 4, '2026-12-01');
  assert.equal(p.when.k1l1, '2026-11-28');
  assert.equal(p.scores.k1l1, 4);
  assert.deepEqual(parseProgress(JSON.stringify(p)).when, { k1l1: '2026-11-28' });
});

test('лаборатория: публичные материалы не раскрывают название и внутренние данные реального проекта', async () => {
  const fs = await import('node:fs');
  const files = ['data/lab1.js', 'data/lab2.js', 'data/courses.js', 'js/i18n.js', 'docs/KUBERA-LAB.md', 'docs/ROUTE-KUBERA.md', 'SOURCES.md', 'README.md'];
  const banned = [/RIDGE/i, /Rebecca|Ребекк/i, /kubera-ridge-ai/i, /ridge-office/i, /ridgefactory/i, /ridge-workplace/i, /pages\.dev/i,
    /\/api\//, /PR #2\b/, /RIDGE-0\d{3}/, /задача #3/, /\b[0-9a-f]{7,40}\b(?=.*commit)/i, /site\/vendor/];
  for (const f of files) {
    const text = fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
    for (const re of banned) assert.doesNotMatch(text, re, f + ': ' + re);
  }
});

test('лаборатория: уроки 2 и 8 отражают актуальную версию программы фабрики', () => {
  const all = JSON.stringify(LAB1);
  assert.doesNotMatch(all, /ещё не выложен|not yet released|not on the sites yet/);
});

test('курс 2: в уроках нет имён компьютеров, путей и адресов почты', () => {
  const all = JSON.stringify(LAB2);
  assert.doesNotMatch(all, /WIN-[A-Z0-9]{5,}|[A-Z]:\\\\|C:\\|Users\\|\bcc22|@[a-z0-9-]+\.[a-z]{2,}/i);
  assert.doesNotMatch(all, /(api[_-]?key|token|secret)\s*[:=]/i);
});

test('курс 2: непроверенное названо непроверенным', () => {
  const all = JSON.stringify(LAB2);
  for (const s of ['ещё не проверен', 'NOT TESTED', 'not been tested', 'not tested']) assert.ok(all.includes(s), s);
  // Модель 7–8B ещё не запускали: урок не должен говорить, что она проверена.
  const l1 = LAB2.lessons[0];
  assert.match(l1.ru.quiz[3].o[l1.key[3]][0], /7–8B на новом компьютере ещё нет/);
});

test('курс 2: факты из проверенных источников записаны точно', () => {
  const all = JSON.stringify(LAB2);
  for (const s of ['127.0.0.1', 'Apache-2.0', 'MIT', 'cc-by-nc-sa-4.0', '397 МБ', '21 с']) assert.ok(all.includes(s), s);
});
