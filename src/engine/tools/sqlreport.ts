// Course 6 tool: SQL Report Builder. Five real queries on a small relational database (SQLite in the
// browser), each checked on a visible and a hidden dataset, then exported as a .sql file and a Markdown report.
import { gradeSql, type GradeResult, type SqlResult, type SqlRunner } from '../grade.ts';

type L = { en: string; ru: string };
const l = (en: string, ru: string): L => ({ en, ru });

export const REPORT_SCHEMA = `CREATE TABLE areas (area_id INTEGER PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE homes (home_id INTEGER PRIMARY KEY, area_id INTEGER NOT NULL REFERENCES areas(area_id), address TEXT NOT NULL, bedrooms INTEGER);
CREATE TABLE sales (sale_id INTEGER PRIMARY KEY, home_id INTEGER NOT NULL REFERENCES homes(home_id), sale_date TEXT NOT NULL, price INTEGER NOT NULL);`;

/** Visible practice data (synthetic). */
export const REPORT_MAIN = `${REPORT_SCHEMA}
INSERT INTO areas VALUES (1,'Northfield'),(2,'Riverside'),(3,'Hillcrest');
INSERT INTO homes VALUES (1,1,'1 Oak Road',2),(2,1,'4 Oak Road',3),(3,2,'9 Quay Street',1),(4,2,'12 Quay Street',2),(5,3,'3 Summit View',4),(6,1,'22 Elm Close',3);
INSERT INTO sales VALUES (1,1,'2026-01-15',310000),(2,2,'2026-02-03',395000),(3,3,'2026-02-20',240000),(4,4,'2026-03-11',305000),(5,5,'2026-04-02',560000),(6,6,'2026-04-28',372000),(7,1,'2026-06-30',325000);`;

/** Hidden variant: same tables, different rows. A query that types the visible answer by hand fails here. */
export const REPORT_HIDDEN = `${REPORT_SCHEMA}
INSERT INTO areas VALUES (1,'Northfield'),(2,'Riverside'),(3,'Hillcrest'),(4,'Meadow');
INSERT INTO homes VALUES (1,2,'2 Quay Street',2),(2,2,'5 Quay Street',3),(3,4,'7 Meadow Lane',2),(4,1,'8 Oak Road',1),(5,3,'1 Summit View',5),(6,4,'9 Meadow Lane',3),(7,3,'6 Summit View',2);
INSERT INTO sales VALUES (1,1,'2026-01-09',300000),(2,2,'2026-02-14',410000),(3,3,'2026-03-01',280000),(4,4,'2026-03-22',215000),(5,5,'2026-05-05',640000),(6,6,'2026-05-17',345000),(7,7,'2026-07-02',330000),(8,3,'2026-08-19',295000);`;

const DS = [{ id: 'main', setup: REPORT_MAIN }, { id: 'hidden', setup: REPORT_HIDDEN }];

export interface ReportTask {
  id: string;
  skill: 'SELECT' | 'WHERE' | 'JOIN' | 'GROUP BY' | 'AGGREGATE';
  title: L;
  task: L;
  hint: L;
  reference: string;
  orderMatters: boolean;
}

export const REPORT_TASKS: ReportTask[] = [
  {
    id: 'r1', skill: 'SELECT', orderMatters: false,
    title: l('All homes', 'Все дома'),
    task: l('Show the address and bedrooms of every home (columns: address, bedrooms).', 'Покажите адрес и число спален каждого дома (столбцы: address, bedrooms).'),
    hint: l('SELECT column1, column2 FROM table', 'SELECT столбец1, столбец2 FROM таблица'),
    reference: 'SELECT address, bedrooms FROM homes',
  },
  {
    id: 'r2', skill: 'WHERE', orderMatters: false,
    title: l('Sales over £350,000', 'Продажи дороже £350 000'),
    task: l('Show sale_id and price for sales with a price above 350000.', 'Покажите sale_id и price для продаж с ценой выше 350000.'),
    hint: l('Add WHERE price > 350000', 'Добавьте WHERE price > 350000'),
    reference: 'SELECT sale_id, price FROM sales WHERE price > 350000',
  },
  {
    id: 'r3', skill: 'JOIN', orderMatters: false,
    title: l('Homes with their area', 'Дома и их район'),
    task: l('Show each home\'s address and the name of its area (columns: address, name). Use the area_id key.', 'Покажите адрес каждого дома и название его района (столбцы: address, name). Используйте ключ area_id.'),
    hint: l('FROM homes JOIN areas ON homes.area_id = areas.area_id', 'FROM homes JOIN areas ON homes.area_id = areas.area_id'),
    reference: 'SELECT homes.address, areas.name FROM homes JOIN areas ON homes.area_id = areas.area_id',
  },
  {
    id: 'r4', skill: 'GROUP BY', orderMatters: false,
    title: l('Homes per area', 'Домов в каждом районе'),
    task: l('For every area that has homes, show its name and the number of homes (columns: name, homes).', 'Для каждого района, где есть дома, покажите название и число домов (столбцы: name, homes).'),
    hint: l('JOIN, then GROUP BY areas.name and COUNT(*) AS homes', 'JOIN, затем GROUP BY areas.name и COUNT(*) AS homes'),
    reference: 'SELECT areas.name, COUNT(*) AS homes FROM homes JOIN areas ON homes.area_id = areas.area_id GROUP BY areas.name',
  },
  {
    id: 'r5', skill: 'AGGREGATE', orderMatters: true,
    title: l('Average sale price by area', 'Средняя цена продажи по районам'),
    task: l('Show each area name with the number of sales and the average sale price rounded to whole pounds, highest average first (columns: name, sales, avg_price).', 'Покажите название района, число продаж и среднюю цену продажи, округлённую до фунта, сначала самая высокая (столбцы: name, sales, avg_price).'),
    hint: l('Join sales → homes → areas; GROUP BY name; ROUND(AVG(price)); ORDER BY avg_price DESC', 'Соедините sales → homes → areas; GROUP BY name; ROUND(AVG(price)); ORDER BY avg_price DESC'),
    reference: 'SELECT areas.name, COUNT(*) AS sales, ROUND(AVG(sales.price)) AS avg_price FROM sales JOIN homes ON sales.home_id = homes.home_id JOIN areas ON homes.area_id = areas.area_id GROUP BY areas.name ORDER BY avg_price DESC',
  },
];

export function gradeReportTask(run: SqlRunner, task: ReportTask, query: string): GradeResult & { preview?: SqlResult; error?: string } {
  return gradeSql(run, DS, task.reference, query, task.orderMatters);
}

/** SQLite error text → plain explanation for a beginner. Unknown errors are shown as they are. */
export function explainSqlError(message: string): { code: string; text: L } {
  const m = message.toLowerCase();
  const pick = (code: string, en: string, ru: string) => ({ code, text: l(en, ru) });
  let x: RegExpExecArray | null;
  if ((x = /no such table: (\S+)/.exec(m))) return pick('table', `There is no table called "${x[1]}". The tables are areas, homes and sales.`, `Таблицы «${x[1]}» нет. Есть таблицы areas, homes и sales.`);
  if ((x = /no such column: (\S+)/.exec(m))) return pick('column', `There is no column called "${x[1]}". Check the spelling and which table the column belongs to.`, `Столбца «${x[1]}» нет. Проверьте написание и в какой таблице этот столбец.`);
  if ((x = /ambiguous column name: (\S+)/.exec(m))) return pick('ambiguous', `"${x[1]}" exists in more than one joined table. Write table.column, for example homes.${x[1].split('.').pop()}.`, `«${x[1]}» есть в нескольких соединённых таблицах. Пишите таблица.столбец, например homes.${x[1].split('.').pop()}.`);
  if ((x = /near "([^"]*)": syntax error/.exec(m))) return pick('syntax', `SQL could not read the query near "${x[1]}". Look for a missing comma, a typo in a keyword or a missing bracket there.`, `SQL не смог прочитать запрос рядом с «${x[1]}». Проверьте пропущенную запятую, опечатку в ключевом слове или скобку.`);
  if (/incomplete input/.test(m)) return pick('incomplete', 'The query ends too early — for example a bracket or a quote is not closed.', 'Запрос обрывается — например, не закрыта скобка или кавычка.');
  if (/misuse of aggregate/.test(m)) return pick('aggregate', 'COUNT, SUM or AVG was used in WHERE. Filter groups with HAVING instead.', 'COUNT, SUM или AVG использованы в WHERE. Для фильтра групп используйте HAVING.');
  if (/not an aggregate|must appear in the group by/.test(m)) return pick('groupby', 'Every column that is not inside COUNT/SUM/AVG must be listed in GROUP BY.', 'Каждый столбец вне COUNT/SUM/AVG должен быть указан в GROUP BY.');
  return pick('other', message, message);
}

export interface ReportEntry { task: ReportTask; query: string; passed: boolean; result?: SqlResult }

const mdTable = (r: SqlResult) => {
  if (!r.columns.length) return '_(no rows)_';
  const esc = (v: unknown) => String(v ?? 'NULL').replace(/\|/g, '\\|');
  return [`| ${r.columns.map(esc).join(' | ')} |`, `| ${r.columns.map(() => '---').join(' | ')} |`, ...r.rows.map((row) => `| ${row.map(esc).join(' | ')} |`)].join('\n');
};

export function buildSqlFile(entries: ReportEntry[], title: string, when: Date): string {
  const head = [`-- ${title}`, `-- KUBERA Claude Academy — SQL Report Builder · ${when.toISOString().slice(0, 10)}`, '-- Tables: areas(area_id PK, name) · homes(home_id PK, area_id FK → areas) · sales(sale_id PK, home_id FK → homes). Synthetic data.', ''];
  const body = entries.map((e) => [`-- ${e.task.id} · ${e.task.skill} · ${e.task.title.en} · ${e.passed ? 'checked: passed (visible + hidden data)' : 'not passed yet'}`, e.query.trim().replace(/;?\s*$/, ';'), ''].join('\n'));
  return head.join('\n') + body.join('\n');
}

export function buildSqlMarkdown(entries: ReportEntry[], title: string, note: string, when: Date): string {
  const passed = entries.filter((e) => e.passed).length;
  return [
    `# ${title}`,
    '',
    `Built in KUBERA Claude Academy (course 6) on ${when.toISOString().slice(0, 10)}. Queries ran in SQLite (sql.js) in the browser. Every result below is the real output on the visible practice data; each query was also checked on a hidden dataset. Data is synthetic.`,
    '',
    `**Checked: ${passed} of ${entries.length} queries passed.**`,
    note.trim() ? `\n## Analyst note\n\n${note.trim()}\n` : '',
    ...entries.flatMap((e, i) => [
      `## ${i + 1}. ${e.task.title.en} (${e.task.skill})`,
      '',
      '```sql',
      e.query.trim(),
      '```',
      '',
      e.passed ? '✅ Passed on visible and hidden data.' : '⚠️ Not passed yet.',
      '',
      e.result ? mdTable(e.result) : '_(not run)_',
      '',
    ]),
  ].join('\n');
}
