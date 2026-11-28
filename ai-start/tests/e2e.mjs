// Проверка в настоящем браузере: компьютер и телефон.
// Запуск: node tests/e2e.mjs  (поднимает локальный сервер сам; нужен установленный playwright)
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { COURSE1 } from '../data/course1.js';
import { LAB1 } from '../data/lab1.js';
import { LAB2 } from '../data/lab2.js';

const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8765;
const BASE = `http://127.0.0.1:${PORT}/`;
const shots = process.env.SHOTS_DIR;
if (shots) fs.mkdirSync(shots, { recursive: true });

const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 800));

let failed = 0;
async function check(name, fn) {
  try { await fn(); console.log('ok   ' + name); } catch (e) { failed++; console.log('FAIL ' + name + '\n     ' + e.message); }
}

async function noHorizontalScroll(page) {
  const w = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  assert.ok(w[0] <= w[1], `горизонтальная прокрутка: ${w[0]} > ${w[1]}`);
}

/** Пройти урок: шаги истории/мысли/практики, затем ответы. wrongFirst — сначала неверно ответить на 1-й вопрос. */
async function passLesson(page, lesson, { wrongFirst = false } = {}) {
  const before = lesson.ru.terms ? 5 : 4;
  for (let s = 0; s < before; s++) await page.getByRole('button', { name: /Дальше|Next/ }).first().click();
  for (let i = 0; i < lesson.key.length; i++) {
    const opts = page.locator('.opt');
    if (wrongFirst && i === 0) {
      const wrong = (lesson.key[0] + 1) % (await opts.count());
      await opts.nth(wrong).click();
      await page.locator('.bad-t').waitFor();
    }
    await opts.nth(lesson.key[i]).click();
    await page.locator('.good-t').waitFor();
    await page.getByRole('button', { name: /Дальше|Next/ }).click();
  }
  await page.getByRole('heading', { name: /Главное из урока|Key takeaways/ }).waitFor();
}

const browser = await chromium.launch();
const configs = [
  ['desktop', { viewport: { width: 1280, height: 860 }, locale: 'ru-RU' }],
  ['phone', { ...devices['iPhone 13'], locale: 'ru-RU' }],
];

for (const [label, ctxOpts] of configs) {
  const ctx = await browser.newContext(ctxOpts);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  await check(`${label}: главная открывается на русском, 8 курсов`, async () => {
    await page.goto(BASE);
    await page.getByRole('heading', { level: 1 }).waitFor();
    assert.equal(await page.locator('.grid li').count(), 8);
    assert.equal(await page.locator('.grid a.card').count(), 1);
    assert.equal(await page.locator('.labgrid a.card').count(), 2);
    await noHorizontalScroll(page);
    if (shots) await page.screenshot({ path: `${shots}/${label}-home.png`, fullPage: true });
  });

  await check(`${label}: урок 1 целиком, с ошибкой и объяснением`, async () => {
    await page.getByRole('link', { name: /Начать первый урок/ }).click();
    if (shots) await page.screenshot({ path: `${shots}/${label}-situation.png`, fullPage: true });
    await page.getByRole('button', { name: /Дальше/ }).click();
    if (shots) await page.screenshot({ path: `${shots}/${label}-points.png`, fullPage: true });
    await page.getByRole('button', { name: /Дальше/ }).click();
    if (shots) await page.screenshot({ path: `${shots}/${label}-compare.png`, fullPage: true });
    await page.goto(BASE + '#/c1'); await page.goto(BASE + '#/c1/c1l1');
    await passLesson(page, COURSE1.lessons[0], { wrongFirst: true });
    await noHorizontalScroll(page);
    if (shots) await page.screenshot({ path: `${shots}/${label}-result.png`, fullPage: true });
  });

  await check(`${label}: ошибка попала в повтор и исчезает после верного ответа`, async () => {
    await page.getByRole('link', { name: /К списку уроков/ }).click();
    const review = page.getByRole('link', { name: /Повторить ошибки \(1\)/ });
    await review.waitFor();
    await review.click();
    await page.locator('.opt').nth(COURSE1.lessons[0].key[0]).click();
    await page.getByRole('button', { name: /Дальше/ }).click();
    await page.getByText(/Ошибок для повторения нет/).waitFor();
  });

  await check(`${label}: прогресс сохраняется после перезагрузки, урок 2 открыт`, async () => {
    await page.goto(BASE + '#/c1');
    await page.reload();
    assert.equal(await page.locator('a.lesson').count(), 2);
    await page.goto(BASE);
    await page.getByRole('link', { name: /Продолжить обучение/ }).click();
    await page.getByText(/Как модель составляет ответ/).first().waitFor();
  });

  await check(`${label}: закрытый урок по прямой ссылке не открывается`, async () => {
    await page.goto(BASE + '#/c1/c1l4');
    await page.waitForFunction(() => location.hash === '#/c1');
  });

  await check(`${label}: все 5 уроков и значок курса`, async () => {
    for (const l of COURSE1.lessons.slice(1)) {
      await page.goto(BASE + `#/c1/${l.id}`);
      if (l.sim === 'promptLab') {
        for (let s = 0; s < 3; s++) await page.getByRole('button', { name: /Дальше/ }).first().click();
        await page.getByText(/Учебная симуляция/).waitFor();
        assert.match(await page.locator('.bubble.ai').innerText(), /Уточните/);
        for (const chip of await page.locator('.chip').all()) await chip.click();
        assert.match(await page.locator('.bubble.ai').innerText(), /скидку 5%/);
        await noHorizontalScroll(page);
        if (shots) await page.screenshot({ path: `${shots}/${label}-lab.png`, fullPage: true });
        await page.goto(BASE + `#/c1`);
        await page.goto(BASE + `#/c1/${l.id}`);
      }
      await passLesson(page, l);
    }
    await page.goto(BASE + '#/c1');
    await page.getByText(/Курс пройден/).waitFor();
    if (shots) await page.screenshot({ path: `${shots}/${label}-badge.png`, fullPage: true });
  });

  await check(`${label}: переключение на английский`, async () => {
    await page.getByRole('button', { name: 'English' }).click();
    await page.getByText('Course complete').waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.lang), 'en');
    await page.goto(BASE + '#/c1/c1l1');
    await page.getByRole('heading', { name: 'What generative AI is' }).waitFor();
  });

  await check(`${label}: кнопки не меньше 44 пикселей`, async () => {
    const small = await page.evaluate(() => [...document.querySelectorAll('button, a.btn')]
      .filter((b) => b.offsetParent && b.getBoundingClientRect().height < 44).map((b) => b.textContent));
    assert.deepEqual(small, []);
  });

  await check(`${label}: без ошибок в консоли`, async () => { assert.deepEqual(errors, []); });
  await ctx.close();
}

// Лаборатория KUBERA: отдельный раздел, шаг «Термины», словарь пройденных терминов.
for (const [label, ctxOpts] of configs) {
  const ctx = await browser.newContext(ctxOpts);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  await check(`${label}: лаборатория открывается с главной, словарь пока пуст`, async () => {
    await page.goto(BASE);
    await page.getByRole('heading', { name: 'Лаборатория KUBERA' }).waitFor();
    await page.locator('.labgrid a.card').first().click();
    await page.getByRole('heading', { name: 'Технологии мебельной фабрики' }).waitFor();
    assert.equal(await page.locator('a.lesson').count(), 1);
    await page.getByText(/Пройдите первый урок/).waitFor();
    await page.getByRole('heading', { name: 'Журнал навыков' }).waitFor();
    await noHorizontalScroll(page);
    if (shots) await page.screenshot({ path: `${shots}/${label}-lab-course.png`, fullPage: true });
  });

  await check(`${label}: урок лаборатории с шагом «Термины» и произношением`, async () => {
    await page.goto(BASE + '#/k1/k1l1');
    assert.equal(await page.locator('.steps li').count(), 6);
    await page.getByRole('button', { name: /Дальше/ }).click();
    await page.getByRole('button', { name: /Дальше/ }).click();
    await page.getByRole('heading', { name: 'Термины' }).waitFor();
    assert.equal(await page.locator('.terms tbody tr').count(), LAB1.lessons[0].ru.terms.length);
    await page.getByText('мисинг вэлью').waitFor();
    await noHorizontalScroll(page);
    if (shots) await page.screenshot({ path: `${shots}/${label}-lab-terms.png`, fullPage: true });
    await page.getByRole('button', { name: /Дальше/ }).click();
    await page.getByRole('heading', { name: /как неправильно и как правильно/ }).waitFor();
    await page.getByRole('button', { name: /Дальше/ }).click();
    await page.getByRole('heading', { name: 'Задание' }).waitFor();
    if (shots) await page.screenshot({ path: `${shots}/${label}-lab-task.png`, fullPage: true });
    await page.goto(BASE + '#/k1'); await page.goto(BASE + '#/k1/k1l1');
    await passLesson(page, LAB1.lessons[0], { wrongFirst: true });
    await noHorizontalScroll(page);
  });

  await check(`${label}: результат урока: словарь, направление и повтор ошибки`, async () => {
    await page.goto(BASE + '#/k1');
    await page.reload();
    await page.getByText(/Мой словарь: 5 терминов/).waitFor();
    await page.locator('.journal tbody tr').first().waitFor();
    assert.equal(await page.locator('.journal tbody tr').count(), 1);
    assert.match(await page.locator('.journal tbody tr').first().innerText(), /\d{4}-\d{2}-\d{2}[\s\S]*Data Quality/);
    assert.equal(await page.locator('a.lesson').count(), 2);
    await page.getByRole('link', { name: /Повторить ошибки \(1\)/ }).waitFor();
    await noHorizontalScroll(page);
    if (shots) await page.screenshot({ path: `${shots}/${label}-lab-results.png`, fullPage: true });
  });

  await check(`${label}: все уроки лаборатории, значок и полный журнал`, async () => {
    for (const l of LAB1.lessons.slice(1)) { await page.goto(BASE + `#/k1/${l.id}`); await passLesson(page, l); }
    await page.goto(BASE + '#/k1');
    await page.getByText(/Курс пройден/).waitFor();
    const n = LAB1.lessons.reduce((a, l) => a + l.ru.terms.length, 0);
    await page.getByText(`Мой словарь: ${n} терминов`).waitFor();
    assert.equal(await page.locator('.journal tbody tr').count(), LAB1.lessons.length);
    if (shots) await page.screenshot({ path: `${shots}/${label}-lab-journal.png`, fullPage: true });
  });

  await check(`${label}: лаборатория на английском`, async () => {
    await page.getByRole('button', { name: 'English' }).click();
    await page.getByText(/My glossary/).waitFor();
    await page.getByRole('heading', { name: 'Skills log' }).waitFor();
    await page.goto(BASE + '#/k1/k1l3');
    await page.getByRole('heading', { name: 'Two-step sign-in and access rights' }).waitFor();
  });

  await check(`${label}: курс 2 «Локальный ИИ и агенты»: все уроки, термины, журнал`, async () => {
    await page.getByRole('button', { name: 'Русский' }).click();
    await page.goto(BASE);
    await page.locator('.labgrid a.card').nth(1).click();
    await page.getByRole('heading', { name: 'Локальный ИИ и агенты' }).waitFor();
    await page.goto(BASE + '#/k2/k2l1');
    await page.getByRole('button', { name: /Дальше/ }).click();
    await page.getByRole('button', { name: /Дальше/ }).click();
    await page.getByRole('heading', { name: 'Термины' }).waitFor();
    await page.getByText('ло́кал мо́дел').waitFor();
    await noHorizontalScroll(page);
    if (shots) await page.screenshot({ path: `${shots}/${label}-lab2-terms.png`, fullPage: true });
    await page.goto(BASE + '#/k2');
    for (const l of LAB2.lessons) { await page.goto(BASE + `#/k2/${l.id}`); await passLesson(page, l); }
    await page.goto(BASE + '#/k2');
    await page.getByText(/Курс пройден/).waitFor();
    assert.equal(await page.locator('.journal tbody tr').count(), LAB2.lessons.length);
    const n = LAB2.lessons.reduce((a, l) => a + l.ru.terms.length, 0);
    await page.getByText(`Мой словарь: ${n} терминов`).waitFor();
    await noHorizontalScroll(page);
    if (shots) await page.screenshot({ path: `${shots}/${label}-lab2-journal.png`, fullPage: true });
  });

  await check(`${label}: лаборатория без ошибок в консоли`, async () => { assert.deepEqual(errors, []); });
  await ctx.close();
}

// Без localStorage (строгий приватный режим) сайт всё равно работает.
await check('без localStorage сайт работает', async () => {
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } });
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(BASE);
  await page.locator('.grid li').first().waitFor();
  assert.deepEqual(errors, []);
  await ctx.close();
});

await browser.close();
server.kill();
console.log(failed ? `\n${failed} проверок не прошло` : '\nВсе проверки прошли');
process.exit(failed ? 1 : 0);
