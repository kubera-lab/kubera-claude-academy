import type { Course } from '../types.ts';
import { SRC } from '../sources.ts';

const l = (en: string, ru: string) => ({ en, ru });

const POSTCODE_REF = `function normalisePostcode(s) {
  if (typeof s !== 'string') return null;
  const t = s.toUpperCase().replace(/\\s+/g, '');
  if (!/^[A-Z]{1,2}[0-9][A-Z0-9]?[0-9][A-Z]{2}$/.test(t)) return null;
  return t.slice(0, -3) + ' ' + t.slice(-3);
}`;

const EV = (anyOf: string[]) => ({ minWords: 6, anyOf });
const KEYS = ['uprn', 'postcode', 'address', 'flat', 'number', 'street', 'адрес', 'индекс', 'квартир', 'номер', 'улиц'];

export const DATAQUALITY: Course = {
  id: 'dq',
  n: 5,
  title: l('Data Quality with AI', 'Качество данных с ИИ'),
  level: l('Intermediate', 'Средний'),
  summary: l('Find missing, duplicate, invalid and inconsistent records, normalise identifiers and record where data came from.', 'Находите пропуски, дубликаты, невалидные и противоречивые записи, нормализуйте идентификаторы и фиксируйте происхождение данных.'),
  outcome: l('A record-matching review with written evidence for every decision.', 'Проверка сопоставления записей с письменным обоснованием каждого решения.'),
  lessons: [
    {
      id: 'dq-1', v: 1, minutes: 15,
      title: l('Six dimensions of data quality', 'Шесть измерений качества данных'),
      explain: [
        l('The UK Government Data Quality Framework names six core dimensions: completeness (expected values present), uniqueness (one record per thing), consistency (values do not contradict each other), timeliness (up to date for its use), validity (right format and range) and accuracy (matches reality).', 'Рамочный документ правительства Великобритании по качеству данных называет шесть измерений: полнота (нужные значения есть), уникальность (одна запись на объект), согласованность (значения не противоречат друг другу), своевременность (данные достаточно свежие), валидность (правильный формат и диапазон) и точность (соответствие реальности).'),
        l('Naming the dimension tells you how to fix the problem: fill a gap, merge duplicates, correct a format, or go back to the source.', 'Название измерения подсказывает, как исправить проблему: заполнить пропуск, объединить дубликаты, исправить формат или вернуться к источнику.'),
      ],
      example: l('Postcode "CR4 3XX9" → validity. Two rows for the same UPRN → uniqueness. Price £0 for a sold house → accuracy.', 'Индекс «CR4 3XX9» → валидность. Две строки с одним UPRN → уникальность. Цена £0 за проданный дом → точность.'),
      sources: [SRC.govDQF],
      exercise: {
        kind: 'classify',
        intro: l('Which dimension does each problem break?', 'Какое измерение нарушает каждая проблема?'),
        labels: [
          { id: 'completeness', label: l('Completeness', 'Полнота') },
          { id: 'uniqueness', label: l('Uniqueness', 'Уникальность') },
          { id: 'validity', label: l('Validity', 'Валидность') },
          { id: 'consistency', label: l('Consistency', 'Согласованность') },
          { id: 'timeliness', label: l('Timeliness', 'Своевременность') },
        ],
        items: [
          { id: 'q1', text: l('The postcode field is empty in 12% of rows.', 'Поле индекса пустое в 12% строк.'), correct: 'completeness', why: l('Expected values are missing.', 'Нет ожидаемых значений.') },
          { id: 'q2', text: l('The same property appears three times with the same UPRN.', 'Один и тот же объект трижды с одним UPRN.'), correct: 'uniqueness', why: l('One thing, many records.', 'Один объект — много записей.') },
          { id: 'q3', text: l('A date is written as 31/02/2025.', 'Дата записана как 31/02/2025.'), correct: 'validity', why: l('Not a real date: outside the valid range.', 'Такой даты нет: вне допустимого диапазона.') },
          { id: 'q4', text: l('Bedrooms = 0 but property type = "3-bed house".', 'Спален = 0, но тип объекта = «дом с 3 спальнями».'), correct: 'consistency', why: l('Two values contradict each other.', 'Два значения противоречат друг другу.') },
          { id: 'q5', text: l('Rental prices from 2015 used to set rents today.', 'Цены аренды 2015 года используются для сегодняшних ставок.'), correct: 'timeliness', why: l('Too old for the intended use.', 'Слишком старые для этой цели.') },
        ],
      },
    },
    {
      id: 'dq-2', v: 1, minutes: 25,
      title: l('Normalise before you compare', 'Нормализуйте перед сравнением'),
      explain: [
        l('"cr4 3ab", "CR43AB" and "CR4  3AB" are the same postcode written three ways. Comparing raw text would call them different and hide duplicates. Normalising means converting every value to one standard form first.', '«cr4 3ab», «CR43AB» и «CR4  3AB» — один индекс, записанный тремя способами. Сравнение «как есть» сочтёт их разными и спрячет дубликаты. Нормализация — приведение каждого значения к одной стандартной форме перед сравнением.'),
        l('A UK postcode ends with an inward code of one digit and two letters (for example "3AB"); a single space separates it from the outward code ("CR4"). Values that do not fit the pattern should be flagged, not silently changed.', 'Британский индекс заканчивается «внутренней» частью из цифры и двух букв (например «3AB»); одним пробелом она отделена от «внешней» части («CR4»). Значения, которые не подходят под шаблон, нужно помечать, а не молча менять.'),
      ],
      example: l('normalisePostcode(" sw1a1aa ") → "SW1A 1AA"\nnormalisePostcode("HELLO") → null', 'normalisePostcode(" sw1a1aa ") → "SW1A 1AA"\nnormalisePostcode("HELLO") → null'),
      sources: [SRC.govDQF, SRC.mdnFunctions],
      exercise: {
        kind: 'code',
        task: l('Write normalisePostcode(s): upper case, remove all spaces, check the pattern (1–2 letters, digit, optional letter or digit, then digit + 2 letters), return with one space before the last 3 characters, or null if invalid or not a string.', 'Напишите normalisePostcode(s): верхний регистр, убрать все пробелы, проверить шаблон (1–2 буквы, цифра, необязательная буква или цифра, затем цифра + 2 буквы), вернуть с одним пробелом перед последними 3 символами, или null, если неверно или не строка.'),
        fnName: 'normalisePostcode',
        starter: 'function normalisePostcode(s) {\n  return null;\n}',
        reference: POSTCODE_REF,
        hint: l('A regular expression like /^[A-Z]{1,2}[0-9][A-Z0-9]?[0-9][A-Z]{2}$/ checks the pattern after spaces are removed.', 'Регулярное выражение /^[A-Z]{1,2}[0-9][A-Z0-9]?[0-9][A-Z]{2}$/ проверяет шаблон после удаления пробелов.'),
        tests: [
          { id: 'n1', label: l('lower case with space', 'строчные с пробелом'), args: ['cr4 3ab'], expect: 'CR4 3AB' },
          { id: 'n2', label: l('no space', 'без пробела'), args: ['SW1A1AA'], expect: 'SW1A 1AA' },
          { id: 'n3', label: l('extra spaces', 'лишние пробелы'), args: ['  e1   6an '], expect: 'E1 6AN' },
          { id: 'n4', label: l('not a postcode', 'не индекс'), args: ['HELLO'], expect: null },
          { id: 'h1', label: l('hidden: number instead of text', 'скрытый: число вместо текста'), args: [12345], expect: null, hidden: true },
          { id: 'h2', label: l('hidden: too long', 'скрытый: слишком длинный'), args: ['CR4 3XX9'], expect: null, hidden: true },
          { id: 'h3', label: l('hidden: empty string', 'скрытый: пустая строка'), args: [''], expect: null, hidden: true },
          { id: 'h4', label: l('hidden: M1 1AE', 'скрытый: M1 1AE'), args: ['m11ae'], expect: 'M1 1AE', hidden: true },
        ],
      },
    },
    {
      id: 'dq-3', v: 1, minutes: 15,
      title: l('Provenance: where did this come from?', 'Происхождение: откуда эти данные?'),
      explain: [
        l('Provenance is the record of where data came from, when it was taken, under which licence, and what was done to it. Without it nobody can check or repeat your work.', 'Происхождение (provenance) — это запись о том, откуда данные, когда получены, по какой лицензии и что с ними делали. Без неё никто не сможет проверить или повторить вашу работу.'),
        l('AI tools can clean and summarise data, but they can also change values silently. Keep the original, log every transformation, and never present an AI-generated value as if it came from the official source.', 'ИИ-инструменты умеют чистить и обобщать данные, но могут и незаметно менять значения. Сохраняйте оригинал, записывайте каждое преобразование и никогда не выдавайте значение, созданное ИИ, за взятое из официального источника.'),
      ],
      example: l('Source: EPC bulk data (GOV.UK), downloaded 2026-11-16, Open Government Licence v3.0. Steps: filtered to Merton; postcodes normalised; 14 duplicates removed (list attached).', 'Источник: массовые данные EPC (GOV.UK), загружены 2026-11-16, Open Government Licence v3.0. Шаги: отфильтровано по Мертону; индексы нормализованы; удалено 14 дубликатов (список приложен).'),
      sources: [SRC.epcData, SRC.govDQF],
      exercise: {
        kind: 'choice',
        questions: [
          { id: 'd3q1', prompt: l('Which is NOT part of provenance?', 'Что НЕ относится к происхождению данных?'), options: [l('The source and download date', 'Источник и дата загрузки'), l('The licence', 'Лицензия'), l('Your favourite colour', 'Ваш любимый цвет')], correct: 2, why: l('Provenance covers source, time, licence and transformations.', 'Происхождение — это источник, время, лицензия и преобразования.') },
          { id: 'd3q2', prompt: l('An AI tool "fixed" 40 missing prices by estimating them. What must you do?', 'ИИ «исправил» 40 пропущенных цен, оценив их. Что нужно сделать?'), options: [l('Mark them as estimated and keep the originals', 'Пометить как оценки и сохранить оригиналы'), l('Present them as official prices', 'Выдать за официальные цены'), l('Delete the log', 'Удалить журнал')], correct: 0, why: l('Generated values must never look like source values.', 'Созданные значения не должны выглядеть как исходные.') },
          { id: 'd3q3', prompt: l('Why keep the original file?', 'Зачем хранить исходный файл?'), options: [l('So the work can be checked and repeated', 'Чтобы работу можно было проверить и повторить'), l('It is not needed', 'Не нужно'), l('To use more disk space', 'Чтобы занять место')], correct: 0, why: l('Reproducibility needs the starting point.', 'Для воспроизводимости нужна исходная точка.') },
        ],
      },
    },
    {
      id: 'dq-4', v: 1, minutes: 30, lab: true,
      title: l('Lab: match property records with evidence', 'Лаборатория: сопоставление объектов с обоснованием'),
      explain: [
        l('Two fictional lists describe properties: A (sales) and B (energy certificates). For each pair decide Match, Needs review or No match, and write one line of evidence that names the field you compared (UPRN, postcode, address, flat number).', 'Два выдуманных списка описывают объекты: A (продажи) и B (энергосертификаты). Для каждой пары выберите «Совпадает», «Нужна проверка» или «Не совпадает» и напишите строку обоснования с названием поля, которое вы сравнили (UPRN, индекс, адрес, номер квартиры).'),
        l('Rule of thumb: same UPRN → match. No UPRN on one side but same address → needs review (a person checks). Different UPRN or different flat → no match. Evidence like "x" or "same same same" is rejected.', 'Правило: одинаковый UPRN → совпадает. На одной стороне нет UPRN, но адрес тот же → нужна проверка (смотрит человек). Разные UPRN или разные квартиры → не совпадает. Обоснования вроде «x» или «same same same» не принимаются.'),
      ],
      example: l('All addresses, postcodes and UPRNs in this lab are synthetic.', 'Все адреса, индексы и UPRN в этой лаборатории — синтетические.'),
      sources: [SRC.osUPRN, SRC.epcData, SRC.govDQF],
      exercise: {
        kind: 'classify',
        intro: l('A = sales list, B = energy certificate list (synthetic data).', 'A — список продаж, B — список энергосертификатов (синтетические данные).'),
        labels: [
          { id: 'match', label: l('Match', 'Совпадает') },
          { id: 'review', label: l('Needs review', 'Нужна проверка') },
          { id: 'nomatch', label: l('No match', 'Не совпадает') },
        ],
        items: [
          { id: 'r1', text: l('A: 12 Example Road, AB1 2CD, UPRN 100000000001 | B: 12 Example Road, AB1 2CD, UPRN 100000000001', 'A: 12 Example Road, AB1 2CD, UPRN 100000000001 | B: 12 Example Road, AB1 2CD, UPRN 100000000001'), correct: 'match', why: l('Same UPRN and address.', 'Одинаковые UPRN и адрес.'), evidence: EV(KEYS) },
          { id: 'r2', text: l('A: Flat 3, 8 Sample Street, AB1 3EF, no UPRN | B: Flat 3, 8 Sample Street, AB1 3EF, UPRN 100000000002', 'A: Flat 3, 8 Sample Street, AB1 3EF, нет UPRN | B: Flat 3, 8 Sample Street, AB1 3EF, UPRN 100000000002'), correct: 'review', why: l('Address agrees but A has no UPRN: a person must confirm.', 'Адрес совпадает, но у A нет UPRN: нужно подтверждение человека.'), evidence: EV(KEYS) },
          { id: 'r3', text: l('A: Flat 1, 5 Test Lane, AB2 1GH, UPRN 100000000003 | B: Flat 2, 5 Test Lane, AB2 1GH, UPRN 100000000004', 'A: Flat 1, 5 Test Lane, AB2 1GH, UPRN 100000000003 | B: Flat 2, 5 Test Lane, AB2 1GH, UPRN 100000000004'), correct: 'nomatch', why: l('Different flats and different UPRNs.', 'Разные квартиры и разные UPRN.'), evidence: EV(KEYS) },
          { id: 'r4', text: l('A: 7 Demo Close, ab3 4jk, UPRN 100000000005 | B: 7 Demo Close, AB3 4JK, UPRN 100000000005', 'A: 7 Demo Close, ab3 4jk, UPRN 100000000005 | B: 7 Demo Close, AB3 4JK, UPRN 100000000005'), correct: 'match', why: l('Same UPRN; postcode differs only in letter case.', 'UPRN одинаковый; индекс отличается только регистром.'), evidence: EV(KEYS) },
          { id: 'r5', text: l('A: 20 Mock Avenue, AB4 5LM, UPRN 100000000006 | B: 20 Mock Avenue, AB4 5LN, UPRN 100000000007', 'A: 20 Mock Avenue, AB4 5LM, UPRN 100000000006 | B: 20 Mock Avenue, AB4 5LN, UPRN 100000000007'), correct: 'nomatch', why: l('Different UPRNs and postcodes: likely two streets with the same name in different areas.', 'Разные UPRN и индексы: вероятно, две одноимённые улицы в разных районах.'), evidence: EV(KEYS) },
        ],
      },
    },
  ],
};
