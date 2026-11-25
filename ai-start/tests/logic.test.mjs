// Автотесты логики и содержания. Запуск: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COURSE1 } from '../data/course1.js';
import { COURSES } from '../data/courses.js';
import {
  validateLesson, checkAnswer, parseProgress, emptyProgress, recordAnswer,
  finishLesson, nextLesson, isUnlocked, labResult, LAB_PARTS,
} from '../js/logic.js';

test('в курсе 1 пять уроков и 20 вопросов', () => {
  assert.equal(COURSE1.lessons.length, 5);
  const total = COURSE1.lessons.reduce((n, l) => n + l.key.length, 0);
  assert.equal(total, 20);
});

test('каждый урок собран полностью на обоих языках', () => {
  for (const l of COURSE1.lessons) assert.deepEqual(validateLesson(l), [], l.id);
});

test('в RU и EN одинаковое число вариантов ответа', () => {
  for (const l of COURSE1.lessons) {
    l.ru.quiz.forEach((q, i) => assert.equal(q.o.length, l.en.quiz[i].o.length, `${l.id} q${i}`));
  }
});

test('правильные ответы не всегда на одном месте', () => {
  const keys = COURSE1.lessons.flatMap((l) => l.key);
  assert.ok(new Set(keys).size >= 3);
});

test('объяснение верного ответа начинается со слова «Верно» / «Correct»', () => {
  for (const l of COURSE1.lessons) {
    l.key.forEach((k, i) => {
      assert.match(l.ru.quiz[i].o[k][1], /^Верно/, `${l.id} q${i} ru`);
      assert.match(l.en.quiz[i].o[k][1], /^Correct/, `${l.id} q${i} en`);
    });
  }
});

test('уроки без перегрузки: до 10 минут, до 4 тезисов, каждый тезис не длиннее 320 символов', () => {
  for (const l of COURSE1.lessons) {
    assert.ok(l.minutes <= 10);
    assert.ok(l.ru.points.length <= 4);
    for (const [, text] of l.ru.points) assert.ok(text.length <= 320, `${l.id}: ${text.length}`);
  }
});

test('в каждом вопросе 4 варианта', () => {
  for (const l of COURSE1.lessons) for (const lang of ['ru', 'en']) l[lang].quiz.forEach((q) => assert.equal(q.o.length, 4));
});

test('8 курсов на главной, открыт только первый', () => {
  assert.equal(COURSES.length, 8);
  assert.deepEqual(COURSES.filter((c) => c.open).map((c) => c.id), ['c1']);
});

test('checkAnswer отличает верный ответ и отдаёт объяснение', () => {
  const l = COURSE1.lessons[0];
  const good = checkAnswer(l.ru, l.key, 0, l.key[0]);
  assert.equal(good.ok, true);
  const badChoice = (l.key[0] + 1) % l.ru.quiz[0].o.length;
  const bad = checkAnswer(l.ru, l.key, 0, badChoice);
  assert.equal(bad.ok, false);
  assert.ok(bad.why.length > 10);
});

test('испорченный прогресс не ломает сайт', () => {
  assert.deepEqual(parseProgress('{oops'), emptyProgress());
  assert.deepEqual(parseProgress('null'), emptyProgress());
  assert.deepEqual(parseProgress(null), emptyProgress());
  const p = parseProgress(JSON.stringify({ lang: 'xx', mistakes: [1, 'a:1'] }));
  assert.equal(p.lang, null);
  assert.deepEqual(p.mistakes, ['a:1']);
});

test('ошибка попадает в повтор, верный ответ убирает её', () => {
  let p = emptyProgress();
  p = recordAnswer(p, 'c1l1:0', false);
  p = recordAnswer(p, 'c1l1:0', false);
  assert.deepEqual(p.mistakes, ['c1l1:0']);
  p = recordAnswer(p, 'c1l1:0', true);
  assert.deepEqual(p.mistakes, []);
});

test('результат урока: сохраняется лучший счёт', () => {
  let p = finishLesson(emptyProgress(), 'c1l1', 4, 4);
  assert.equal(p.stars.c1l1, 3);
  assert.equal(p.scores.c1l1, 4);
  p = finishLesson(p, 'c1l1', 1, 4);
  assert.equal(p.stars.c1l1, 3);
  assert.equal(p.scores.c1l1, 4);
  assert.equal(finishLesson(emptyProgress(), 'x', 2, 4).stars.x, 2);
  assert.equal(finishLesson(emptyProgress(), 'x', 0, 4).stars.x, 1);
});

test('уроки открываются по порядку, «Продолжить» ведёт на первый непройденный', () => {
  const ls = COURSE1.lessons;
  let p = emptyProgress();
  assert.equal(isUnlocked(p, ls, 'c1l1'), true);
  assert.equal(isUnlocked(p, ls, 'c1l2'), false);
  assert.equal(nextLesson(p, ls), 'c1l1');
  p = finishLesson(p, 'c1l1', 4, 4);
  assert.equal(isUnlocked(p, ls, 'c1l2'), true);
  assert.equal(nextLesson(p, ls), 'c1l2');
});

test('лаборатория запросов: чем больше частей, тем понятнее', () => {
  for (const lang of ['ru', 'en']) {
    assert.equal(labResult(lang, []).score, 0);
    const full = labResult(lang, LAB_PARTS);
    assert.equal(full.score, 3);
    assert.equal(labResult(lang, ['context']).reply, labResult(lang, ['context', 'reqs']).reply, 'без задачи письмо остаётся общим');
    assert.notEqual(full.reply, labResult(lang, []).reply);
    assert.ok(full.prompt.length > labResult(lang, []).prompt.length);
  }
});
