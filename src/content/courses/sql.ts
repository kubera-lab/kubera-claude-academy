import type { Course } from '../types.ts';
import { SRC } from '../sources.ts';

const l = (en: string, ru: string) => ({ en, ru });

const SCHEMA = `CREATE TABLE listings (id INTEGER PRIMARY KEY, town TEXT, price INTEGER, bedrooms INTEGER, uprn TEXT);
CREATE TABLE epc (uprn TEXT, rating TEXT);`;

/** Visible practice data (synthetic). */
export const SQL_MAIN = `${SCHEMA}
INSERT INTO listings VALUES
 (1,'Mitcham',350000,2,'100000000101'),(2,'Mitcham',275000,1,'100000000102'),(3,'Morden',420000,3,'100000000103'),
 (4,'Mitcham',390000,3,'100000000104'),(5,'Tooting',510000,2,'100000000105'),(6,'Morden',300000,2,'100000000106'),
 (7,'Mitcham',350000,2,'100000000101');
INSERT INTO epc VALUES ('100000000101','C'),('100000000103','D'),('100000000104','B'),('100000000106','E');`;

/** Hidden variant: same tables, different rows. Catches answers typed in by hand. */
export const SQL_VARIANT = `${SCHEMA}
INSERT INTO listings VALUES
 (1,'Mitcham',360000,2,'100000000201'),(2,'Morden',280000,1,'100000000202'),(3,'Mitcham',410000,4,'100000000203'),
 (4,'Tooting',330000,2,'100000000204'),(5,'Mitcham',295000,2,'100000000205'),(6,'Morden',450000,3,'100000000206'),
 (7,'Tooting',330000,2,'100000000204'),(8,'Mitcham',500000,1,'100000000208');
INSERT INTO epc VALUES ('100000000201','C'),('100000000203','A'),('100000000206','D'),('100000000208','F');`;

const DS = [{ id: 'main', setup: SQL_MAIN }, { id: 'hidden', setup: SQL_VARIANT }];
const schema = l(
  'listings(id, town, price, bedrooms, uprn) — 7 rows · epc(uprn, rating) — 4 rows. All data is synthetic.',
  'listings(id, town, price, bedrooms, uprn) — 7 строк · epc(uprn, rating) — 4 строки. Все данные синтетические.',
);

export const SQL: Course = {
  id: 'sql',
  n: 6,
  title: l('SQL and Data Analytics', 'SQL и анализ данных'),
  level: l('Beginner', 'Начальный'),
  summary: l('Write real SQL queries against a database running in your browser: filter, sort, group, join and find duplicates.', 'Пишите настоящие SQL-запросы к базе данных, которая работает у вас в браузере: фильтр, сортировка, группировка, соединение, поиск дубликатов.'),
  outcome: l('Working queries checked against a visible and a hidden dataset.', 'Рабочие запросы, проверенные на видимых и скрытых данных.'),
  lessons: [
    {
      id: 'sql-1', v: 1, minutes: 20,
      title: l('SELECT, WHERE and ORDER BY', 'SELECT, WHERE и ORDER BY'),
      explain: [
        l('A query asks a database for rows. SELECT lists the columns you want, FROM names the table, WHERE keeps only rows that meet a condition, ORDER BY sorts the result.', 'Запрос просит у базы данных строки. SELECT перечисляет нужные столбцы, FROM называет таблицу, WHERE оставляет только строки, которые подходят под условие, ORDER BY сортирует результат.'),
        l('This lab runs SQLite (via sql.js) inside your browser. Your query really runs; nothing is sent anywhere. The checker compares your result with the reference query on the visible data and on a hidden second dataset, so typing the answer by hand does not pass.', 'Эта лаборатория запускает SQLite (через sql.js) прямо в браузере. Ваш запрос реально выполняется; ничего никуда не отправляется. Проверка сравнивает ваш результат с эталонным запросом на видимых данных и на скрытом втором наборе, поэтому ввести ответ вручную не получится.'),
      ],
      example: l("SELECT id, town FROM listings WHERE price < 300000 ORDER BY price;", "SELECT id, town FROM listings WHERE price < 300000 ORDER BY price;"),
      sources: [SRC.sqliteSelect, SRC.sqljs],
      exercise: {
        kind: 'sql', datasets: DS, schema, orderMatters: true,
        task: l('Show id and price of listings in Mitcham with at least 2 bedrooms, cheapest first (equal prices: smaller id first).', 'Покажите id и price объектов в Mitcham с не менее чем 2 спальнями, сначала дешёвые (при равной цене — меньший id первым).'),
        reference: "SELECT id, price FROM listings WHERE town = 'Mitcham' AND bedrooms >= 2 ORDER BY price, id",
        starter: 'SELECT id, price\nFROM listings\n',
        hint: l("Combine two conditions with AND. Sort with ORDER BY price, id.", 'Объедините два условия через AND. Сортируйте ORDER BY price, id.'),
      },
    },
    {
      id: 'sql-2', v: 1, minutes: 20,
      title: l('GROUP BY and aggregates', 'GROUP BY и агрегатные функции'),
      explain: [
        l('GROUP BY puts rows with the same value together. Aggregate functions then summarise each group: COUNT(*) counts rows, MIN and MAX find extremes, AVG averages.', 'GROUP BY собирает строки с одинаковым значением вместе. Агрегатные функции затем обобщают каждую группу: COUNT(*) считает строки, MIN и MAX находят крайние значения, AVG — среднее.'),
        l('Every column in SELECT must either be in GROUP BY or inside an aggregate function; otherwise the result is ambiguous.', 'Каждый столбец в SELECT должен быть либо в GROUP BY, либо внутри агрегатной функции; иначе результат неоднозначен.'),
      ],
      example: l('SELECT bedrooms, COUNT(*) FROM listings GROUP BY bedrooms;', 'SELECT bedrooms, COUNT(*) FROM listings GROUP BY bedrooms;'),
      sources: [SRC.sqliteSelect],
      exercise: {
        kind: 'sql', datasets: DS, schema, orderMatters: true,
        task: l('For each town show: town, number of listings, lowest price. Sort by town A→Z.', 'Для каждого города покажите: город, число объектов, минимальную цену. Сортировка по городу от A до Z.'),
        reference: 'SELECT town, COUNT(*), MIN(price) FROM listings GROUP BY town ORDER BY town',
        starter: 'SELECT town, COUNT(*), MIN(price)\nFROM listings\n',
        hint: l('GROUP BY town, then ORDER BY town.', 'GROUP BY town, затем ORDER BY town.'),
      },
    },
    {
      id: 'sql-3', v: 1, minutes: 25,
      title: l('JOIN two tables', 'Соединение двух таблиц (JOIN)'),
      explain: [
        l('A JOIN pairs rows from two tables using a condition, here the shared UPRN. An inner JOIN keeps only rows that have a partner in both tables; a LEFT JOIN keeps every row of the left table and fills missing partners with NULL.', 'JOIN соединяет строки двух таблиц по условию, здесь — по общему UPRN. Внутренний JOIN оставляет только строки, у которых есть пара в обеих таблицах; LEFT JOIN оставляет все строки левой таблицы и заполняет отсутствующие пары значением NULL.'),
        l('Qualify column names with the table (listings.id, epc.rating) or short aliases (l.id, e.rating) so the query stays clear.', 'Указывайте таблицу у столбцов (listings.id, epc.rating) или короткие псевдонимы (l.id, e.rating), чтобы запрос был понятным.'),
      ],
      example: l('SELECT l.id, e.rating FROM listings l LEFT JOIN epc e ON l.uprn = e.uprn;', 'SELECT l.id, e.rating FROM listings l LEFT JOIN epc e ON l.uprn = e.uprn;'),
      sources: [SRC.pgJoin, SRC.sqliteSelect],
      exercise: {
        kind: 'sql', datasets: DS, schema, orderMatters: false,
        task: l('Show the listing id and EPC rating for every listing that has an energy certificate (inner join on uprn).', 'Покажите id объекта и рейтинг EPC для каждого объекта, у которого есть энергосертификат (внутренний JOIN по uprn).'),
        reference: 'SELECT l.id, e.rating FROM listings l JOIN epc e ON l.uprn = e.uprn',
        starter: 'SELECT l.id, e.rating\nFROM listings l\n',
        hint: l('JOIN epc e ON l.uprn = e.uprn', 'JOIN epc e ON l.uprn = e.uprn'),
      },
    },
    {
      id: 'sql-4', v: 1, minutes: 30, lab: true,
      title: l('Lab: find duplicate records with SQL', 'Лаборатория: поиск дубликатов через SQL'),
      explain: [
        l('Duplicates break uniqueness and inflate counts. Group by the identifier and keep only groups with more than one row using HAVING, which filters groups the way WHERE filters rows.', 'Дубликаты нарушают уникальность и завышают подсчёты. Сгруппируйте по идентификатору и оставьте только группы больше одной строки с помощью HAVING — он фильтрует группы так же, как WHERE фильтрует строки.'),
        l('Write the query, run it, read the rows. The hidden dataset has a different duplicate, so the query must find duplicates in general, not one known UPRN.', 'Напишите запрос, выполните его, посмотрите строки. В скрытом наборе другой дубликат, поэтому запрос должен находить дубликаты в целом, а не один известный UPRN.'),
      ],
      example: l('SELECT town, COUNT(*) FROM listings GROUP BY town HAVING COUNT(*) > 2;', 'SELECT town, COUNT(*) FROM listings GROUP BY town HAVING COUNT(*) > 2;'),
      sources: [SRC.sqliteSelect, SRC.govDQF],
      exercise: {
        kind: 'sql', datasets: DS, schema, orderMatters: false,
        task: l('List every UPRN that appears more than once in listings, with how many times it appears.', 'Выведите каждый UPRN, который встречается в listings больше одного раза, и сколько раз он встречается.'),
        reference: 'SELECT uprn, COUNT(*) FROM listings GROUP BY uprn HAVING COUNT(*) > 1',
        starter: 'SELECT uprn, COUNT(*)\nFROM listings\n',
        hint: l('GROUP BY uprn HAVING COUNT(*) > 1', 'GROUP BY uprn HAVING COUNT(*) > 1'),
      },
    },
  ],
};
