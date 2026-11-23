// Verified sources. Every URL below was opened on the date in `checked`.
// Lessons link to these and explain the ideas in their own words; no text is copied.
import { CHECKED, type L, type Source } from './types.ts';

const s = (title: string, url: string, org: string, en: string, ru: string, license: string): Source => ({
  title, url, org, purpose: { en, ru }, license, checked: CHECKED,
});

export const SRC = {
  msIntroAI: s('Introduction to AI concepts', 'https://learn.microsoft.com/en-us/training/modules/get-started-ai-fundamentals/', 'Microsoft Learn',
    'Beginner module on what AI solutions can do and responsible AI.', 'Модуль для начинающих: что умеют ИИ-решения и ответственный ИИ.', 'Microsoft Learn terms; linked only'),
  msAIBeginners: s('AI for Beginners (curriculum)', 'https://github.com/microsoft/AI-For-Beginners', 'Microsoft',
    '24-lesson open curriculum with notebooks and quizzes, for further study.', 'Открытая программа из 24 уроков с ноутбуками и тестами — для углубления.', 'MIT'),
  msGenAI: s('Generative AI for Beginners', 'https://github.com/microsoft/generative-ai-for-beginners', 'Microsoft',
    'Open course with "Learn" and "Build" lessons on generative AI apps.', 'Открытый курс с уроками «Learn» и «Build» по генеративному ИИ.', 'MIT'),
  anthropicPrompt: s('Prompt engineering overview', 'https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview', 'Anthropic',
    'When prompt engineering helps and how to define success criteria first.', 'Когда помогает промпт-инжиниринг и почему сначала задают критерии успеха.', 'Anthropic documentation; linked only'),
  googlePrompt: s('Prompt design strategies', 'https://ai.google.dev/gemini-api/docs/prompting-strategies', 'Google AI for Developers',
    'Clear instructions, examples, context and output format.', 'Ясные инструкции, примеры, контекст и формат ответа.', 'Google developer docs; linked only'),
  openaiPrompt: s('Prompt engineering', 'https://developers.openai.com/api/docs/guides/prompt-engineering', 'OpenAI',
    'Message roles, few-shot examples and formatting.', 'Роли сообщений, примеры (few-shot) и форматирование.', 'OpenAI documentation; linked only'),
  anthropicAgents: s('Building effective agents', 'https://www.anthropic.com/engineering/building-effective-agents', 'Anthropic',
    'Workflows versus agents, tools, guardrails and stopping conditions.', 'Workflow и агенты, инструменты, ограничители и условия остановки.', 'Anthropic article; linked only'),
  owaspLLM: s('OWASP Top 10 for LLM Applications 2025', 'https://genai.owasp.org/llm-top-10/', 'OWASP GenAI Security Project',
    'Prompt injection (LLM01), sensitive data (LLM02), output handling (LLM05), excessive agency (LLM06), misinformation (LLM09).',
    'Инъекции в промпт (LLM01), чувствительные данные (LLM02), обработка вывода (LLM05), избыточные полномочия (LLM06), дезинформация (LLM09).', 'CC BY-SA 4.0'),
  hfAgents: s('Hugging Face Agents Course', 'https://github.com/huggingface/agents-course', 'Hugging Face',
    'Free course on agents ending in an automatically evaluated final project.', 'Бесплатный курс об агентах с автоматически оцениваемым итоговым проектом.', 'Apache-2.0'),
  govDQF: s('The Government Data Quality Framework', 'https://www.gov.uk/government/publications/the-government-data-quality-framework/the-government-data-quality-framework', 'UK Government (GOV.UK)',
    'Six data quality dimensions: completeness, uniqueness, consistency, timeliness, validity, accuracy.',
    'Шесть измерений качества данных: полнота, уникальность, согласованность, своевременность, валидность, точность.', 'Open Government Licence v3.0'),
  sqliteSelect: s('SQLite: SELECT', 'https://www.sqlite.org/lang_select.html', 'SQLite',
    'Reference for SELECT, WHERE, GROUP BY and JOIN in the engine this page runs.', 'Справочник по SELECT, WHERE, GROUP BY и JOIN в движке, который работает на странице.', 'Public domain'),
  pgJoin: s('PostgreSQL tutorial: Joins Between Tables', 'https://www.postgresql.org/docs/current/tutorial-join.html', 'PostgreSQL Global Development Group',
    'Inner and left outer joins explained with examples.', 'Внутренние и левые внешние соединения с примерами.', 'PostgreSQL Licence; linked only'),
  sqljs: s('sql.js', 'https://github.com/sql-js/sql.js', 'sql.js contributors',
    'SQLite compiled to WebAssembly; runs the SQL lab inside your browser.', 'SQLite, скомпилированный в WebAssembly; выполняет SQL-лабораторию в браузере.', 'MIT (used as a dependency)'),
  osCoords: s('A guide to coordinate systems in Great Britain', 'https://docs.os.uk/more-than-maps/a-guide-to-coordinate-systems-in-great-britain', 'Ordnance Survey',
    'WGS84 latitude/longitude and the British National Grid.', 'Широта/долгота WGS84 и Британская национальная сетка.', 'Ordnance Survey documentation; linked only'),
  osUPRN: s('OS Open UPRN', 'https://www.ordnancesurvey.co.uk/products/os-open-uprn', 'Ordnance Survey',
    'Open dataset of UPRNs (unique property reference numbers) with coordinates.', 'Открытый набор UPRN (уникальных номеров объектов) с координатами.', 'Free to use — see OS licence terms'),
  epcData: s('Get energy performance of buildings data', 'https://get-energy-performance-data.communities.gov.uk/', 'MHCLG (GOV.UK)',
    'Official EPC bulk data for England and Wales.', 'Официальные массовые данные EPC по Англии и Уэльсу.', 'Open Government Licence v3.0, except where stated'),
  mdnFunctions: s('MDN: Functions', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions', 'Mozilla (MDN)',
    'How JavaScript functions take input and return output.', 'Как функции JavaScript принимают данные и возвращают результат.', 'CC BY-SA 2.5 (prose); linked only'),
  mdnInnerHTML: s('MDN: Element.innerHTML — security considerations', 'https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML', 'Mozilla (MDN)',
    'Why inserting user text with innerHTML enables XSS; use textContent for plain text.', 'Почему вставка текста пользователя через innerHTML ведёт к XSS; для простого текста — textContent.', 'CC BY-SA 2.5 (prose); linked only'),
  jdla: s('Japan Deep Learning Association (JDLA)', 'https://www.jdla.org/', 'JDLA (Japan)',
    'G検定 (generalist) and E資格 (engineer) exams: an example of separating literacy from implementation skills.',
    'Экзамены G検定 (общий) и E資格 (инженер): пример разделения грамотности и практических навыков.', 'Linked only'),
};

/** Research register shown on the "Sources" page. Checked on CHECKED. */
export interface PlatformNote {
  name: string;
  url: string;
  country: string;
  developer: string;
  implemented: L;
  assessment: L;
  labs: L;
  license: string;
  reuse: L;
  status: 'VERIFIED' | 'PARTLY VERIFIED' | 'NOT VERIFIED';
}

const l = (en: string, ru: string) => ({ en, ru });
export const REGISTER: PlatformNote[] = [
  { name: 'JDLA — G検定 / E資格', url: 'https://www.jdla.org/', country: 'Japan', developer: 'Japan Deep Learning Association',
    implemented: l('Two certification levels: generalist (G検定) and engineer (E資格, requires a certified programme); sample questions, study guides, free "AI For Everyone" course.', 'Два уровня сертификации: общий (G検定) и инженерный (E資格, требует аккредитованной программы); примеры вопросов, гиды, бесплатный курс «AI For Everyone».'),
    assessment: l('Online/venue exams; formats and pass marks not stated on the home page.', 'Экзамены онлайн и в центрах; формат и проходной балл на главной не указаны.'),
    labs: l('Not stated.', 'Не указано.'), license: 'Proprietary',
    reuse: l('Idea only: separate knowledge score from practical skills. No content reused.', 'Только идея: отдельная оценка знаний и практики. Контент не используется.'), status: 'PARTLY VERIFIED' },
  { name: 'JSAI (人工知能学会)', url: 'https://www.ai-gakkai.or.jp/', country: 'Japan', developer: 'Japanese Society for Artificial Intelligence',
    implemented: l('Seminars, an AI tool introductory course, an AI map, comics series and video archive.', 'Семинары, вводный курс по ИИ-инструментам, «карта ИИ», комиксы, видеоархив.'),
    assessment: l('Not stated.', 'Не указано.'), labs: l('Not stated.', 'Не указано.'), license: 'Proprietary',
    reuse: l('Idea only: short visual explainers for beginners.', 'Только идея: короткие наглядные объяснения для новичков.'), status: 'PARTLY VERIFIED' },
  { name: 'ModelScope (魔搭)', url: 'https://www.modelscope.cn/', country: 'China', developer: 'NOT VERIFIED on the page',
    implemented: l('Open model community: models, datasets, online demos.', 'Открытое сообщество моделей: модели, датасеты, онлайн-демо.'),
    assessment: l('NOT VERIFIED', 'NOT VERIFIED'), labs: l('Online demos (details NOT VERIFIED).', 'Онлайн-демо (подробности NOT VERIFIED).'), license: 'Per model',
    reuse: l('Idea only: let learners try things in the browser.', 'Только идея: пробовать прямо в браузере.'), status: 'PARTLY VERIFIED' },
  { name: 'OpenXLab', url: 'https://www.openxlab.org.cn/', country: 'China', developer: 'NOT VERIFIED',
    implemented: l('NOT VERIFIED — the site blocks automated access.', 'NOT VERIFIED — сайт блокирует автоматический доступ.'),
    assessment: l('NOT VERIFIED', 'NOT VERIFIED'), labs: l('NOT VERIFIED', 'NOT VERIFIED'), license: 'NOT VERIFIED', reuse: l('Nothing used.', 'Ничего не используется.'), status: 'NOT VERIFIED' },
  { name: 'DeepSeek', url: 'https://www.deepseek.com/', country: 'China', developer: 'DeepSeek',
    implemented: l('Open-weight models (V4, R1 and others), paid API, docs in Chinese. No courses listed.', 'Модели с открытыми весами (V4, R1 и др.), платный API, документация на китайском. Курсов нет.'),
    assessment: l('Not applicable.', 'Не применимо.'), labs: l('No.', 'Нет.'), license: 'Not named on the home page',
    reuse: l('Not used: paid API conflicts with the free-only rule.', 'Не используется: платный API противоречит правилу «только бесплатно».'), status: 'PARTLY VERIFIED' },
  { name: 'Microsoft AI for Beginners', url: 'https://github.com/microsoft/AI-For-Beginners', country: 'USA', developer: 'Microsoft',
    implemented: l('12 weeks, 24 lessons, Jupyter notebooks, labs, quiz app.', '12 недель, 24 урока, ноутбуки Jupyter, лабораторные, приложение с тестами.'),
    assessment: l('Pre/post-lesson quizzes.', 'Тесты до и после урока.'), labs: l('Notebooks (Binder, Codespaces).', 'Ноутбуки (Binder, Codespaces).'), license: 'MIT',
    reuse: l('Linked as further reading; structure idea (quiz before and after). No text copied.', 'Ссылка для углубления; идея структуры (тест до и после). Текст не копируется.'), status: 'VERIFIED' },
  { name: 'Microsoft Generative AI for Beginners', url: 'https://github.com/microsoft/generative-ai-for-beginners', country: 'USA', developer: 'Microsoft',
    implemented: l('21 lessons split into "Learn" and "Build" lessons with Python/TypeScript samples.', '21 урок: «Learn» и «Build», примеры на Python/TypeScript.'),
    assessment: l('Not described on the README.', 'В README не описано.'), labs: l('Build lessons; needs paid APIs.', 'Уроки Build; нужны платные API.'), license: 'MIT',
    reuse: l('Idea: alternate learn and build. Linked only.', 'Идея: чередовать «учись» и «делай». Только ссылка.'), status: 'VERIFIED' },
  { name: 'fast.ai fastbook', url: 'https://github.com/fastai/fastbook', country: 'Australia/USA', developer: 'Jeremy Howard, Sylvain Gugger',
    implemented: l('20 chapter notebooks on deep learning.', '20 глав-ноутбуков по глубокому обучению.'),
    assessment: l('NOT VERIFIED on the README.', 'NOT VERIFIED в README.'), labs: l('Notebooks.', 'Ноутбуки.'), license: 'Code GPL-3.0; prose no redistribution; no commercial use',
    reuse: l('Not reused — licence forbids redistributing the text.', 'Не используется — лицензия запрещает распространять текст.'), status: 'VERIFIED' },
  { name: 'OSSU Computer Science', url: 'https://github.com/ossu/computer-science', country: 'International', developer: 'OSSU community',
    implemented: l('Free path: Intro CS, Core CS, Advanced CS, final project.', 'Бесплатный путь: Intro CS, Core CS, Advanced CS, итоговый проект.'),
    assessment: l('No central grading; learners track progress themselves; peers review final projects.', 'Центральной оценки нет; ученик сам отмечает прогресс; проекты смотрят другие.'),
    labs: l('Via linked courses.', 'Через внешние курсы.'), license: 'MIT',
    reuse: l('Idea: a final project per track and a visible progress board.', 'Идея: итоговый проект в каждом направлении и доска прогресса.'), status: 'VERIFIED' },
  { name: 'Hugging Face Learn', url: 'https://huggingface.co/learn', country: 'France/USA', developer: 'Hugging Face',
    implemented: l('12 free courses (LLM, Agents, Deep RL, Audio, Computer Vision, Cookbook…).', '12 бесплатных курсов (LLM, Agents, Deep RL, Audio, CV, Cookbook…).'),
    assessment: l('Agents course: final project with automated evaluation and leaderboard.', 'Курс Agents: итоговый проект с автоматической оценкой и рейтингом.'),
    labs: l('Notebooks and Spaces.', 'Ноутбуки и Spaces.'), license: 'Agents course: Apache-2.0',
    reuse: l('Idea: automated evaluation of the final project. Linked only.', 'Идея: автоматическая проверка итогового проекта. Только ссылка.'), status: 'VERIFIED' },
  { name: 'Coursera', url: 'https://www.coursera.org/', country: 'USA', developer: 'Coursera',
    implemented: l('NOT VERIFIED in this check.', 'NOT VERIFIED в этой проверке.'), assessment: l('NOT VERIFIED', 'NOT VERIFIED'), labs: l('NOT VERIFIED', 'NOT VERIFIED'),
    license: 'Proprietary', reuse: l('Nothing used.', 'Ничего не используется.'), status: 'NOT VERIFIED' },
];
