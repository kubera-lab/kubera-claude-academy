import type { Course } from '../types.ts';
import { SRC } from '../sources.ts';

const l = (en: string, ru: string) => ({ en, ru });

const PRICE_REF = `function formatPrice(pence) {
  if (!Number.isInteger(pence) || pence < 0) return null;
  const pounds = Math.floor(pence / 100);
  const p = String(pence % 100).padStart(2, '0');
  return '£' + pounds.toLocaleString('en-GB') + '.' + p;
}`;

const ESCAPE_REF = `function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}`;

const FILTER_REF = `function filterListings(listings, opts) {
  if (!Array.isArray(listings)) return [];
  const max = typeof opts?.maxPrice === 'number' ? opts.maxPrice : Infinity;
  const beds = typeof opts?.minBeds === 'number' ? opts.minBeds : 0;
  return listings
    .filter((x) => typeof x.price === 'number' && typeof x.beds === 'number' && x.price <= max && x.beds >= beds)
    .sort((a, b) => a.price - b.price || a.id - b.id)
    .map((x) => x.id);
}`;

const L1 = [
  { id: 1, price: 350000, beds: 2 },
  { id: 2, price: 275000, beds: 1 },
  { id: 3, price: 420000, beds: 3 },
  { id: 4, price: 390000, beds: 3 },
];

export const WEBDEV: Course = {
  id: 'web',
  n: 8,
  title: l('AI-Assisted Web Development', 'Веб-разработка с помощью ИИ'),
  level: l('Beginner', 'Начальный'),
  summary: l('Write small JavaScript functions, test them, review AI-generated code and avoid the most common security bug.', 'Пишите небольшие функции на JavaScript, тестируйте их, проверяйте код, написанный ИИ, и избегайте самой частой уязвимости.'),
  outcome: l('A tested listing filter for a small property app, written and verified by you.', 'Проверенный фильтр объявлений для небольшого приложения, написанный и проверенный вами.'),
  lessons: [
    {
      id: 'web-1', v: 1, minutes: 20,
      title: l('Functions and tests', 'Функции и тесты'),
      explain: [
        l('A function takes input and returns output. A test calls the function with a known input and checks the output. Tests let you change code — or accept code from an AI tool — and know at once whether it still works.', 'Функция принимает данные и возвращает результат. Тест вызывает функцию с известными данными и проверяет результат. Тесты позволяют менять код — или принимать код от ИИ — и сразу видеть, работает ли он.'),
        l('Good tests include edge cases: zero, empty input, wrong types. Money is safest in whole pence (integers), because decimal fractions like 0.1 cannot be stored exactly as numbers.', 'Хорошие тесты включают крайние случаи: ноль, пустой ввод, неправильный тип. Деньги безопаснее хранить в целых пенсах, потому что дроби вроде 0.1 нельзя точно хранить в числах.'),
      ],
      example: l('formatPrice(1250) → "£12.50"\nformatPrice(5) → "£0.05"', 'formatPrice(1250) → "£12.50"\nformatPrice(5) → "£0.05"'),
      sources: [SRC.mdnFunctions],
      exercise: {
        kind: 'code',
        task: l('Write formatPrice(pence): for a whole, non-negative number of pence return "£" + pounds with thousands separators + "." + two-digit pence. Anything else returns null.', 'Напишите formatPrice(pence): для целого неотрицательного числа пенсов верните "£" + фунты с разделителями тысяч + "." + двузначные пенсы. В остальных случаях — null.'),
        fnName: 'formatPrice',
        starter: 'function formatPrice(pence) {\n  return null;\n}',
        reference: PRICE_REF,
        hint: l('Number.isInteger, Math.floor(pence / 100), pence % 100, padStart(2, "0"), toLocaleString("en-GB").', 'Number.isInteger, Math.floor(pence / 100), pence % 100, padStart(2, "0"), toLocaleString("en-GB").'),
        tests: [
          { id: 'p1', label: l('1250 → £12.50', '1250 → £12.50'), args: [1250], expect: '£12.50' },
          { id: 'p2', label: l('5 → £0.05', '5 → £0.05'), args: [5], expect: '£0.05' },
          { id: 'p3', label: l('35000000 → £350,000.00', '35000000 → £350,000.00'), args: [35000000], expect: '£350,000.00' },
          { id: 'h1', label: l('hidden: 0 → £0.00', 'скрытый: 0 → £0.00'), args: [0], expect: '£0.00', hidden: true },
          { id: 'h2', label: l('hidden: negative → null', 'скрытый: отрицательное → null'), args: [-100], expect: null, hidden: true },
          { id: 'h3', label: l('hidden: 12.5 → null', 'скрытый: 12.5 → null'), args: [12.5], expect: null, hidden: true },
          { id: 'h4', label: l('hidden: text → null', 'скрытый: текст → null'), args: ['100'], expect: null, hidden: true },
        ],
      },
    },
    {
      id: 'web-2', v: 1, minutes: 20,
      title: l('Review code an AI wrote', 'Проверка кода, написанного ИИ'),
      explain: [
        l('AI coding tools are fast and often right, but they also produce code that looks fine and is wrong, or works and is unsafe. Treat AI code like code from a new colleague: read it, test it, and never paste it into production unchecked.', 'ИИ-инструменты для кода быстрые и часто правы, но они же выдают код, который выглядит нормально и ошибочен, или работает, но небезопасен. Относитесь к нему как к коду нового коллеги: прочитайте, протестируйте и никогда не вставляйте в рабочую систему без проверки.'),
        l('OWASP calls passing model output into other systems without checking "improper output handling" (LLM05). The classic web example: putting text into a page with innerHTML, which MDN warns is a common route to cross-site scripting (XSS).', 'OWASP называет передачу вывода модели в другие системы без проверки «неправильной обработкой вывода» (LLM05). Классический веб-пример — вставка текста на страницу через innerHTML, которую MDN называет частым путём к межсайтовому скриптингу (XSS).'),
      ],
      example: l('Unsafe: el.innerHTML = userComment\nSafe for plain text: el.textContent = userComment', 'Небезопасно: el.innerHTML = userComment\nБезопасно для простого текста: el.textContent = userComment'),
      sources: [SRC.owaspLLM, SRC.mdnInnerHTML],
      exercise: {
        kind: 'classify',
        intro: l('An AI tool suggested these lines. Label each one.', 'ИИ-инструмент предложил эти строки. Отметьте каждую.'),
        labels: [
          { id: 'ok', label: l('Fine', 'Нормально') },
          { id: 'bug', label: l('Bug', 'Ошибка') },
          { id: 'security', label: l('Security risk', 'Риск безопасности') },
        ],
        items: [
          { id: 'w1', text: l('commentBox.innerHTML = comment.text; // comment from any visitor', 'commentBox.innerHTML = comment.text; // комментарий любого посетителя'), correct: 'security', why: l('User text parsed as HTML → XSS. Use textContent.', 'Текст пользователя разбирается как HTML → XSS. Используйте textContent.') },
          { id: 'w2', text: l('const total = prices.reduce((a, b) => a + b, 0);', 'const total = prices.reduce((a, b) => a + b, 0);'), correct: 'ok', why: l('Correct sum with a start value.', 'Верная сумма с начальным значением.') },
          { id: 'w3', text: l('if (user.age = 18) { allow(); }', 'if (user.age = 18) { allow(); }'), correct: 'bug', why: l('Assignment instead of comparison: always true.', 'Присваивание вместо сравнения: всегда true.') },
          { id: 'w4', text: l('const API_KEY = "sk-live-…"; // in the browser bundle', 'const API_KEY = "sk-live-…"; // в браузерном коде'), correct: 'security', why: l('Secrets in front-end code are public.', 'Секреты во фронтенд-коде видны всем.') },
          { id: 'w5', text: l('for (let i = 0; i <= items.length; i++) show(items[i]);', 'for (let i = 0; i <= items.length; i++) show(items[i]);'), correct: 'bug', why: l('<= reads one past the end (undefined).', '<= читает элемент за концом массива (undefined).') },
        ],
      },
    },
    {
      id: 'web-3', v: 1, minutes: 20,
      title: l('Escape text before it becomes HTML', 'Экранируйте текст перед вставкой в HTML'),
      explain: [
        l('When you must build HTML as a string, replace the five special characters with entities so text stays text: & → &amp;  < → &lt;  > → &gt;  " → &quot;  \' → &#39;. Replace & first, or you will double-escape the others.', 'Если HTML приходится собирать строкой, замените пять особых символов сущностями, чтобы текст оставался текстом: & → &amp;  < → &lt;  > → &gt;  " → &quot;  \' → &#39;. Сначала заменяйте &, иначе остальные экранируются дважды.'),
        l('In real apps prefer textContent or a framework that escapes for you; React escapes text in JSX by default. Escaping by hand is for the cases where you cannot.', 'В реальных приложениях лучше использовать textContent или фреймворк, который экранирует сам; React по умолчанию экранирует текст в JSX. Ручное экранирование — для случаев, когда иначе нельзя.'),
      ],
      example: l('escapeHtml("<b>Hi</b>") → "&lt;b&gt;Hi&lt;/b&gt;"', 'escapeHtml("<b>Hi</b>") → "&lt;b&gt;Hi&lt;/b&gt;"'),
      sources: [SRC.mdnInnerHTML, SRC.owaspLLM],
      exercise: {
        kind: 'code',
        task: l('Write escapeHtml(s) that replaces & < > " \' with their HTML entities (& first). Non-strings are converted with String(s).', 'Напишите escapeHtml(s), которая заменяет & < > " \' на HTML-сущности (& — первым). Нестроковые значения приводятся через String(s).'),
        fnName: 'escapeHtml',
        starter: 'function escapeHtml(s) {\n  return String(s);\n}',
        reference: ESCAPE_REF,
        hint: l('Chain .replace(/&/g, "&amp;") first, then the other four.', 'Сначала .replace(/&/g, "&amp;"), затем остальные четыре.'),
        tests: [
          { id: 'e1', label: l('tags', 'теги'), args: ['<b>Hi</b>'], expect: '&lt;b&gt;Hi&lt;/b&gt;' },
          { id: 'e2', label: l('ampersand', 'амперсанд'), args: ['Fish & Chips'], expect: 'Fish &amp; Chips' },
          { id: 'e3', label: l('quotes', 'кавычки'), args: ['"a" \'b\''], expect: '&quot;a&quot; &#39;b&#39;' },
          { id: 'h1', label: l('hidden: XSS payload', 'скрытый: XSS-нагрузка'), args: ["<img src=x onerror='alert(1)'>"], expect: '&lt;img src=x onerror=&#39;alert(1)&#39;&gt;', hidden: true },
          { id: 'h2', label: l('hidden: no double escape', 'скрытый: без двойного экранирования'), args: ['&lt;'], expect: '&amp;lt;', hidden: true },
          { id: 'h3', label: l('hidden: number', 'скрытый: число'), args: [42], expect: '42', hidden: true },
        ],
      },
    },
    {
      id: 'web-4', v: 1, minutes: 40, lab: true,
      title: l('Lab: the listing filter for a small app', 'Лаборатория: фильтр объявлений для небольшого приложения'),
      explain: [
        l('A small property app shows listings a visitor can afford. Write filterListings(listings, opts) that returns the ids of listings with price ≤ opts.maxPrice and beds ≥ opts.minBeds, cheapest first (equal price: smaller id first). Missing options mean "no limit". Skip records whose price or beds is not a number. If listings is not an array, return [].', 'Небольшое приложение показывает объявления, которые посетитель может себе позволить. Напишите filterListings(listings, opts), которая возвращает id объявлений с price ≤ opts.maxPrice и beds ≥ opts.minBeds, сначала дешёвые (при равной цене — меньший id). Отсутствующие параметры означают «без ограничения». Пропускайте записи, где price или beds — не число. Если listings — не массив, верните [].'),
        l('You may ask an AI tool for a draft — then make the hidden tests pass yourself. Passing all tests is the objective result; it does not prove the code is perfect.', 'Можете попросить у ИИ черновик — а затем сами добейтесь прохождения скрытых тестов. Прохождение всех тестов — объективный результат, но не доказательство, что код идеален.'),
      ],
      example: l('filterListings(list, { maxPrice: 380000, minBeds: 2 }) → [1]', 'filterListings(list, { maxPrice: 380000, minBeds: 2 }) → [1]'),
      sources: [SRC.mdnFunctions, SRC.owaspLLM],
      exercise: {
        kind: 'code',
        task: l('Implement filterListings(listings, opts).', 'Реализуйте filterListings(listings, opts).'),
        fnName: 'filterListings',
        starter: 'function filterListings(listings, opts) {\n  return [];\n}',
        reference: FILTER_REF,
        hint: l('filter → sort((a, b) => a.price - b.price || a.id - b.id) → map(x => x.id)', 'filter → sort((a, b) => a.price - b.price || a.id - b.id) → map(x => x.id)'),
        tests: [
          { id: 'f1', label: l('budget 380k, 2+ beds', 'бюджет 380k, от 2 спален'), args: [L1, { maxPrice: 380000, minBeds: 2 }], expect: [1] },
          { id: 'f2', label: l('no options → all, cheapest first', 'без параметров → все, сначала дешёвые'), args: [L1, {}], expect: [2, 1, 4, 3] },
          { id: 'f3', label: l('3+ beds', 'от 3 спален'), args: [L1, { minBeds: 3 }], expect: [4, 3] },
          { id: 'h1', label: l('hidden: not an array → []', 'скрытый: не массив → []'), args: [null, {}], expect: [], hidden: true },
          { id: 'h2', label: l('hidden: skip broken records', 'скрытый: пропуск испорченных записей'), args: [[{ id: 9, price: 'n/a', beds: 2 }, ...L1], { maxPrice: 300000 }], expect: [2], hidden: true },
          { id: 'h3', label: l('hidden: equal price → smaller id first', 'скрытый: равная цена → меньший id'), args: [[{ id: 5, price: 100, beds: 1 }, { id: 3, price: 100, beds: 1 }], {}], expect: [3, 5], hidden: true },
          { id: 'h4', label: l('hidden: opts missing entirely', 'скрытый: opts отсутствует'), args: [L1], expect: [2, 1, 4, 3], hidden: true },
        ],
      },
    },
  ],
};
