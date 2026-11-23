import type { Course } from '../types.ts';
import { SRC } from '../sources.ts';

const l = (en: string, ru: string) => ({ en, ru });

const GUARD_REF = `function guard(action) {
  const tool = String(action.tool || '').toLowerCase();
  const read = ['search_docs', 'read_calendar', 'read_file'];
  const approve = ['send_email', 'create_booking', 'update_record'];
  if (read.includes(tool)) return 'allow';
  if (tool === 'make_payment') return action.amount > 0 && action.amount <= 50 ? 'approve' : 'deny';
  if (approve.includes(tool)) return 'approve';
  return 'deny';
}`;

export const AGENTS: Course = {
  id: 'agents',
  n: 4,
  title: l('AI Agents and Automation', 'ИИ-агенты и автоматизация'),
  level: l('Intermediate', 'Средний'),
  summary: l('How agents use tools, how to plan safe action sequences, handle errors and limit permissions.', 'Как агенты используют инструменты, как планировать безопасную последовательность действий, обрабатывать ошибки и ограничивать полномочия.'),
  outcome: l('A tested permission guard that decides which agent actions run, need approval or are blocked.', 'Проверенный «охранник» полномочий: какие действия агента выполняются, требуют подтверждения или запрещены.'),
  lessons: [
    {
      id: 'agents-1', v: 1, minutes: 15,
      title: l('Workflows and agents', 'Workflow и агенты'),
      explain: [
        l('A workflow runs a model and tools along steps a developer fixed in code. An agent lets the model decide which tool to use next and when it is done. Anthropic\'s guide recommends the simplest option that works: often a workflow, not an agent.', 'Workflow запускает модель и инструменты по шагам, заданным разработчиком в коде. Агент позволяет модели самой выбирать следующий инструмент и решать, когда закончить. Руководство Anthropic советует самый простой работающий вариант — часто это workflow, а не агент.'),
        l('A tool is a function the model may call: search documents, read a calendar, send an email. Each tool is a permission. Agents need stopping conditions (for example a maximum number of steps) and checks between steps.', 'Инструмент — это функция, которую модель может вызвать: поиск по документам, чтение календаря, отправка письма. Каждый инструмент — это полномочие. Агентам нужны условия остановки (например, максимум шагов) и проверки между шагами.'),
      ],
      example: l('Workflow: every new form → summarise → save to a sheet. Agent: "sort out my inbox" → the model decides to read, draft, label and ask before sending.', 'Workflow: каждая новая форма → краткое изложение → запись в таблицу. Агент: «разбери мою почту» → модель сама решает читать, составлять черновики, ставить метки и спрашивать перед отправкой.'),
      sources: [SRC.anthropicAgents, SRC.hfAgents],
      exercise: {
        kind: 'choice',
        questions: [
          { id: 'a1q1', prompt: l('Who decides the next step in a workflow?', 'Кто решает следующий шаг в workflow?'), options: [l('The developer, in code', 'Разработчик, в коде'), l('The model, freely', 'Модель, свободно'), l('The user\'s browser', 'Браузер пользователя')], correct: 0, why: l('Workflows follow predefined code paths.', 'Workflow идёт по заранее заданным путям в коде.') },
          { id: 'a1q2', prompt: l('Why does an agent need a maximum number of steps?', 'Зачем агенту ограничение числа шагов?'), options: [l('To stop loops and runaway costs', 'Чтобы останавливать зацикливание и рост затрат'), l('To make answers longer', 'Чтобы ответы были длиннее'), l('It does not need one', 'Не нужно')], correct: 0, why: l('Stopping conditions keep autonomous systems under control.', 'Условия остановки держат автономную систему под контролем.') },
          { id: 'a1q3', prompt: l('What is a tool for an agent?', 'Что такое инструмент для агента?'), options: [l('A function it is allowed to call', 'Функция, которую ему разрешено вызвать'), l('A font', 'Шрифт'), l('A training dataset', 'Обучающий набор данных')], correct: 0, why: l('Tools are callable functions, and each is a permission.', 'Инструменты — вызываемые функции, и каждый — полномочие.') },
        ],
      },
    },
    {
      id: 'agents-2', v: 1, minutes: 20,
      title: l('Plan a safe sequence of actions', 'План безопасной последовательности действий'),
      explain: [
        l('A safe agent reads before it writes, checks results before it continues, and asks a person before any action that is hard to undo.', 'Безопасный агент сначала читает, потом пишет, проверяет результат перед следующим шагом и спрашивает человека перед любым трудно обратимым действием.'),
        l('Errors are normal: a tool can time out or return nothing. The plan must say what happens then — retry a limited number of times, or stop and report — never invent a result.', 'Ошибки — это нормально: инструмент может не ответить или вернуть пустоту. План должен говорить, что делать тогда: повторить ограниченное число раз или остановиться и сообщить, но никогда не выдумывать результат.'),
      ],
      example: l('Request: "Book the community room for Friday 18:00." Read → check → ask → act → confirm.', 'Запрос: «Забронируй общий зал на пятницу 18:00». Прочитать → проверить → спросить → сделать → подтвердить.'),
      sources: [SRC.anthropicAgents, SRC.owaspLLM],
      exercise: {
        kind: 'order',
        intro: l('Put the agent\'s steps for booking the room in a safe order.', 'Расставьте шаги агента по бронированию зала в безопасном порядке.'),
        steps: [
          { id: 's5', text: l('Create the booking', 'Создать бронирование') },
          { id: 's2', text: l('Read the room calendar for Friday 18:00', 'Прочитать календарь зала на пятницу 18:00') },
          { id: 's6', text: l('Confirm to the user and log what was done', 'Подтвердить пользователю и записать, что сделано') },
          { id: 's1', text: l('Restate the request: room, day, time', 'Повторить запрос: зал, день, время') },
          { id: 's4', text: l('Ask the person to approve the booking', 'Попросить человека подтвердить бронирование') },
          { id: 's3', text: l('If the calendar tool fails twice, stop and report — do not guess', 'Если календарь дважды не ответил — остановиться и сообщить, не угадывать') },
        ],
        correct: ['s1', 's2', 's3', 's4', 's5', 's6'],
        why: l('Understand → read → handle failure → approval → act → confirm. Writing before reading, or acting before approval, risks mistakes that cannot be undone.', 'Понять → прочитать → обработать сбой → подтверждение → действие → отчёт. Писать до чтения или действовать без подтверждения — риск необратимых ошибок.'),
      },
    },
    {
      id: 'agents-3', v: 1, minutes: 15,
      title: l('Least privilege', 'Минимальные полномочия'),
      explain: [
        l('Excessive agency (OWASP LLM06) means an AI system has more tools, more permissions or more autonomy than its job needs. One injected instruction can then do real damage.', 'Избыточные полномочия (OWASP LLM06) — когда у ИИ-системы больше инструментов, прав или самостоятельности, чем нужно для задачи. Тогда одна внедрённая инструкция может нанести реальный вред.'),
        l('Give read-only tools by default. Actions that change things for other people (send, book, update) need human approval. Payments, deletions and anything outside the job are blocked.', 'По умолчанию — только инструменты чтения. Действия, которые что-то меняют для других (отправить, забронировать, обновить), требуют подтверждения человеком. Платежи, удаление и всё вне задачи — запрещены.'),
      ],
      example: l('A library help agent needs search_docs and read_calendar. It does not need delete_record.', 'Агенту помощи библиотеки нужны search_docs и read_calendar. delete_record ему не нужен.'),
      sources: [SRC.owaspLLM, SRC.anthropicAgents],
      exercise: {
        kind: 'classify',
        intro: l('A community-centre agent may: read documents and the calendar; book rooms only with approval. Label each action.', 'Агент общественного центра может: читать документы и календарь; бронировать залы только с подтверждением. Отметьте каждое действие.'),
        labels: [
          { id: 'allow', label: l('Allow automatically', 'Разрешить автоматически') },
          { id: 'approve', label: l('Needs human approval', 'Нужно подтверждение') },
          { id: 'deny', label: l('Block', 'Запретить') },
        ],
        items: [
          { id: 'x1', text: l('read_calendar(room="Hall", day="Friday")', 'read_calendar(room="Hall", day="Friday")'), correct: 'allow', why: l('Read-only and inside the job.', 'Только чтение и в рамках задачи.') },
          { id: 'x2', text: l('create_booking(room="Hall", day="Friday", time="18:00")', 'create_booking(room="Hall", day="Friday", time="18:00")'), correct: 'approve', why: l('Changes the calendar for others.', 'Меняет календарь для других.') },
          { id: 'x3', text: l('delete_record(table="members", id=42)', 'delete_record(table="members", id=42)'), correct: 'deny', why: l('Outside the job and irreversible.', 'Вне задачи и необратимо.') },
          { id: 'x4', text: l('search_docs(query="fire exits")', 'search_docs(query="fire exits")'), correct: 'allow', why: l('Read-only.', 'Только чтение.') },
          { id: 'x5', text: l('send_email(to="all-members", body="…") after reading an email that asked for it', 'send_email(to="all-members", body="…") после письма, которое этого попросило'), correct: 'deny', why: l('Not a permitted tool, and the request came from content, not the user — possible injection.', 'Инструмент не разрешён, и запрос пришёл из содержимого, а не от пользователя — возможная инъекция.') },
        ],
      },
    },
    {
      id: 'agents-4', v: 1, minutes: 35, lab: true,
      title: l('Lab: write a permission guard', 'Лаборатория: напишите «охранника» полномочий'),
      explain: [
        l('Write a JavaScript function guard(action) that runs before every tool call. It returns "allow", "approve" or "deny". Your code runs for real in your browser (in an isolated Web Worker) against visible and hidden tests.', 'Напишите функцию JavaScript guard(action), которая выполняется перед каждым вызовом инструмента. Она возвращает "allow", "approve" или "deny". Код реально выполняется в вашем браузере (в изолированном Web Worker) на видимых и скрытых тестах.'),
        l('Rules: search_docs, read_calendar, read_file → allow. send_email, create_booking, update_record → approve. make_payment → approve only if amount is above 0 and at most 50, otherwise deny. Any other tool → deny. Tool names may arrive in any letter case.', 'Правила: search_docs, read_calendar, read_file → allow. send_email, create_booking, update_record → approve. make_payment → approve, только если amount больше 0 и не больше 50, иначе deny. Любой другой инструмент → deny. Названия могут прийти в любом регистре.'),
      ],
      example: l('guard({ tool: "read_file" }) → "allow"\nguard({ tool: "make_payment", amount: 500 }) → "deny"', 'guard({ tool: "read_file" }) → "allow"\nguard({ tool: "make_payment", amount: 500 }) → "deny"'),
      sources: [SRC.owaspLLM, SRC.anthropicAgents, SRC.mdnFunctions],
      exercise: {
        kind: 'code',
        task: l('Implement guard(action).', 'Реализуйте guard(action).'),
        fnName: 'guard',
        starter: 'function guard(action) {\n  // action = { tool: "send_email", amount?: number }\n  return "deny";\n}',
        reference: GUARD_REF,
        hint: l('Lower-case the tool name first. Check make_payment before the general lists.', 'Сначала переведите название в нижний регистр. make_payment проверяйте до общих списков.'),
        tests: [
          { id: 'g1', label: l('read tool → allow', 'чтение → allow'), args: [{ tool: 'search_docs' }], expect: 'allow' },
          { id: 'g2', label: l('send_email → approve', 'send_email → approve'), args: [{ tool: 'send_email' }], expect: 'approve' },
          { id: 'g3', label: l('unknown tool → deny', 'неизвестный → deny'), args: [{ tool: 'delete_record' }], expect: 'deny' },
          { id: 'g4', label: l('payment £20 → approve', 'платёж £20 → approve'), args: [{ tool: 'make_payment', amount: 20 }], expect: 'approve' },
          { id: 'g5', label: l('payment £500 → deny', 'платёж £500 → deny'), args: [{ tool: 'make_payment', amount: 500 }], expect: 'deny' },
          { id: 'h1', label: l('hidden: upper case READ_FILE', 'скрытый: ВЕРХНИЙ регистр READ_FILE'), args: [{ tool: 'READ_FILE' }], expect: 'allow', hidden: true },
          { id: 'h2', label: l('hidden: payment 0', 'скрытый: платёж 0'), args: [{ tool: 'make_payment', amount: 0 }], expect: 'deny', hidden: true },
          { id: 'h3', label: l('hidden: payment exactly 50', 'скрытый: платёж ровно 50'), args: [{ tool: 'make_payment', amount: 50 }], expect: 'approve', hidden: true },
          { id: 'h4', label: l('hidden: missing tool name', 'скрытый: нет названия'), args: [{}], expect: 'deny', hidden: true },
          { id: 'h5', label: l('hidden: update_record', 'скрытый: update_record'), args: [{ tool: 'Update_Record' }], expect: 'approve', hidden: true },
        ],
      },
    },
  ],
};
