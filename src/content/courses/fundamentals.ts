import type { Course } from '../types.ts';
import { SRC } from '../sources.ts';

const l = (en: string, ru: string) => ({ en, ru });

const BUS = `Fictional fact sheet — Greenway Bus 42:
1. Runs Monday to Saturday, every 20 minutes, 06:00 to 23:00.
2. No service on Sunday.
3. Single adult fare: £1.75. Children under 11 travel free.
4. Low-floor buses; space for one wheelchair.`;

export const FUNDAMENTALS: Course = {
  id: 'fund',
  n: 1,
  title: l('AI Fundamentals', 'Основы ИИ'),
  level: l('Beginner', 'Начальный'),
  summary: l('What AI is, how language models produce text, where they fail and how to use them safely.', 'Что такое ИИ, как языковые модели пишут текст, где ошибаются и как ими пользоваться безопасно.'),
  outcome: l('You can judge when an AI answer can be trusted and when a human must check it.', 'Вы умеете решать, когда ответу ИИ можно доверять, а когда его должен проверить человек.'),
  lessons: [
    {
      id: 'fund-1', v: 1, minutes: 15,
      title: l('What AI is — and is not', 'Что такое ИИ — и чем он не является'),
      explain: [
        l('Artificial intelligence is software that finds patterns in data and uses them to make predictions: a label for a photo, the next word in a sentence, the likely price of a flat.', 'Искусственный интеллект — это программы, которые находят закономерности в данных и делают по ним прогнозы: подпись к фото, следующее слово в предложении, вероятную цену квартиры.'),
        l('Machine learning is the main way to build AI today: instead of writing every rule by hand, we show the system many examples. Generative AI is the part of machine learning that produces new text, images or code.', 'Машинное обучение — основной способ создавать ИИ сегодня: вместо того чтобы писать каждое правило вручную, системе показывают много примеров. Генеративный ИИ — часть машинного обучения, которая создаёт новый текст, изображения или код.'),
        l('AI does not "understand" or "know" in the human sense. It is very good at likely-looking output, which is why its answers must be checked against real sources when the result matters.', 'ИИ не «понимает» и не «знает» в человеческом смысле. Он очень хорошо создаёт правдоподобный результат — поэтому ответы нужно сверять с настоящими источниками, когда от них что-то зависит.'),
      ],
      example: l('A spam filter learned from millions of labelled emails. Nobody wrote a rule for every spam trick; the model learned the patterns. It still makes mistakes, so you can mark "not spam".', 'Спам-фильтр обучен на миллионах размеченных писем. Никто не писал правило для каждого трюка спамеров — модель выучила закономерности. Но она ошибается, поэтому есть кнопка «не спам».'),
      sources: [SRC.msIntroAI, SRC.msAIBeginners],
      exercise: {
        kind: 'choice',
        questions: [
          { id: 'f1q1', prompt: l('What does machine learning do?', 'Что делает машинное обучение?'), options: [l('Learns patterns from examples', 'Выучивает закономерности на примерах'), l('Follows only rules a programmer wrote one by one', 'Выполняет только правила, написанные программистом по одному'), l('Searches the internet for every answer', 'Ищет каждый ответ в интернете')], correct: 0, why: l('ML builds a model from examples instead of hand-written rules.', 'Машинное обучение строит модель по примерам, а не по правилам вручную.') },
          { id: 'f1q2', prompt: l('Which is generative AI?', 'Что относится к генеративному ИИ?'), options: [l('A model that labels photos as cat or dog', 'Модель, которая подписывает фото «кошка» или «собака»'), l('A model that writes a new paragraph of text', 'Модель, которая пишет новый абзац текста'), l('A calculator', 'Калькулятор')], correct: 1, why: l('Generative AI produces new content such as text or images.', 'Генеративный ИИ создаёт новое содержимое: текст или изображения.') },
          { id: 'f1q3', prompt: l('An AI answer sounds very confident. What does that tell you?', 'Ответ ИИ звучит очень уверенно. Что это значит?'), options: [l('It is correct', 'Он верный'), l('Nothing about correctness — check the source', 'Ничего о правильности — проверьте источник'), l('The model searched a database', 'Модель искала в базе данных')], correct: 1, why: l('Fluency and confidence are not evidence.', 'Гладкость и уверенность — не доказательство.') },
          { id: 'f1q4', prompt: l('When must a human check AI output?', 'Когда человек обязан проверить результат ИИ?'), options: [l('Never', 'Никогда'), l('When the result affects money, health, law or people', 'Когда результат влияет на деньги, здоровье, закон или людей'), l('Only on weekends', 'Только по выходным')], correct: 1, why: l('High-impact decisions need human review.', 'Важные решения требуют проверки человеком.') },
        ],
      },
    },
    {
      id: 'fund-2', v: 1, minutes: 20,
      title: l('How language models write — and why they invent', 'Как языковые модели пишут — и почему выдумывают'),
      explain: [
        l('A large language model (LLM) writes one small piece of text (a token) at a time, choosing what is likely to come next. It has no built-in list of true facts.', 'Большая языковая модель (LLM) пишет по одному маленькому кусочку текста (токену), выбирая наиболее вероятное продолжение. Встроенного списка правдивых фактов у неё нет.'),
        l('When the right answer is not in what it was given, a model can still produce a fluent, confident answer. This is called a hallucination. OWASP lists misinformation from models as a top risk (LLM09).', 'Если правильного ответа нет в том, что ей дали, модель всё равно может выдать гладкий уверенный ответ. Это называется галлюцинацией. OWASP относит дезинформацию от моделей к главным рискам (LLM09).'),
        l('The defence is grounding: give the model a fixed set of facts, tell it to answer only from them, and check each answer against those facts.', 'Защита — «заземление»: дать модели фиксированный набор фактов, велеть отвечать только по ним и сверять каждый ответ с этими фактами.'),
      ],
      example: l(BUS, BUS),
      sources: [SRC.owaspLLM, SRC.googlePrompt],
      exercise: {
        kind: 'classify',
        intro: l('An assistant answered questions about the Greenway Bus 42 fact sheet above (fictional). Label each answer.', 'Помощник ответил на вопросы по карточке фактов об автобусе Greenway 42 (выдуманной). Отметьте каждый ответ.'),
        labels: [
          { id: 'ok', label: l('Supported by the facts', 'Подтверждается фактами') },
          { id: 'invented', label: l('Invented', 'Выдумано') },
          { id: 'refusal', label: l('Good refusal', 'Правильный отказ') },
        ],
        items: [
          { id: 'b1', text: l('Q: Does it run on Sunday? A: Yes, every 30 minutes.', 'В: Ходит ли в воскресенье? О: Да, каждые 30 минут.'), correct: 'invented', why: l('Fact 2: no service on Sunday.', 'Факт 2: в воскресенье не ходит.') },
          { id: 'b2', text: l('Q: How much is an adult ticket? A: A single adult fare is £1.75.', 'В: Сколько стоит взрослый билет? О: Разовый взрослый билет — £1.75.'), correct: 'ok', why: l('Matches fact 3.', 'Совпадает с фактом 3.') },
          { id: 'b3', text: l('Q: Can I pay by card? A: I don\'t know — payment methods are not in my information. Please ask the driver or the bus company.', 'В: Можно платить картой? О: Не знаю — способов оплаты нет в моих данных. Спросите водителя или компанию.'), correct: 'refusal', why: l('Payment is not in the facts; refusing with a next step is right.', 'Оплаты нет в фактах; отказ с подсказкой, куда обратиться, — верно.') },
          { id: 'b4', text: l('Q: Do children pay? A: Children under 16 travel free.', 'В: Платят ли дети? О: Дети до 16 лет ездят бесплатно.'), correct: 'invented', why: l('Fact 3 says under 11, not under 16.', 'Факт 3: до 11, а не до 16 лет.') },
          { id: 'b5', text: l('Q: How often does it run? A: Every 20 minutes, Monday to Saturday, 06:00 to 23:00.', 'В: Как часто ходит? О: Каждые 20 минут, понедельник–суббота, 06:00–23:00.'), correct: 'ok', why: l('Matches fact 1.', 'Совпадает с фактом 1.') },
        ],
      },
    },
    {
      id: 'fund-3', v: 1, minutes: 15,
      title: l('Safe and responsible use', 'Безопасное и ответственное использование'),
      explain: [
        l('Anything you paste into an online AI tool leaves your computer. Treat it like sending an email to a company you do not control.', 'Всё, что вы вставляете в онлайн-ИИ, уходит с вашего компьютера. Относитесь к этому как к письму в компанию, которую вы не контролируете.'),
        l('Never paste passwords, bank or card numbers, ID numbers, health details or other people\'s private information. OWASP calls this risk sensitive information disclosure (LLM02).', 'Никогда не вставляйте пароли, номера банковских карт и счетов, номера документов, данные о здоровье и личную информацию других людей. OWASP называет этот риск раскрытием чувствительной информации (LLM02).'),
        l('Public facts, your own non-private drafts and fictional practice data are fine. When in doubt, remove names and numbers first.', 'Публичные факты, ваши черновики без личных данных и выдуманные учебные данные — можно. Если сомневаетесь — сначала уберите имена и номера.'),
      ],
      example: l('Instead of pasting "Customer Jane Smith, card 4929…, complained about…", paste "A customer complained that the delivery was two days late. Draft a polite reply."', 'Вместо «Клиентка Джейн Смит, карта 4929…, пожаловалась…» вставьте «Клиент пожаловался, что доставка опоздала на два дня. Напиши вежливый ответ».'),
      sources: [SRC.owaspLLM, SRC.msIntroAI],
      exercise: {
        kind: 'classify',
        intro: l('Is it safe to paste this into a public AI chat tool?', 'Безопасно ли вставить это в публичный ИИ-чат?'),
        labels: [
          { id: 'safe', label: l('Safe', 'Безопасно') },
          { id: 'unsafe', label: l('Not safe', 'Небезопасно') },
        ],
        items: [
          { id: 'p1', text: l('The opening hours from a museum\'s public website', 'Часы работы музея с его публичного сайта'), correct: 'safe', why: l('Public information.', 'Публичная информация.') },
          { id: 'p2', text: l('Your online banking password, to "check if it is strong"', 'Ваш пароль от онлайн-банка, чтобы «проверить, надёжный ли он»'), correct: 'unsafe', why: l('Never share passwords with any tool.', 'Пароли нельзя передавать никаким инструментам.') },
          { id: 'p3', text: l('A colleague\'s medical note, to summarise it', 'Медицинская справка коллеги — чтобы сделать краткое изложение'), correct: 'unsafe', why: l('Another person\'s health data is private.', 'Данные о здоровье другого человека — личные.') },
          { id: 'p4', text: l('A fictional fact sheet you wrote for practice', 'Выдуманная учебная карточка фактов, которую вы написали сами'), correct: 'safe', why: l('Fictional practice data is fine.', 'Выдуманные учебные данные — можно.') },
          { id: 'p5', text: l('A photo of your passport, to fill a form faster', 'Фото вашего паспорта — чтобы быстрее заполнить форму'), correct: 'unsafe', why: l('ID documents are sensitive.', 'Документы, удостоверяющие личность, — чувствительные данные.') },
          { id: 'p6', text: l('Your own CV with the phone number and address removed', 'Ваше резюме без телефона и адреса'), correct: 'safe', why: l('Your own text with personal identifiers removed.', 'Ваш собственный текст без личных идентификаторов.') },
        ],
      },
    },
    {
      id: 'fund-4', v: 1, minutes: 25, lab: true,
      title: l('Lab: is AI the right tool?', 'Лаборатория: подходит ли здесь ИИ?'),
      explain: [
        l('In this lab you decide, for real tasks, whether AI can do the job alone, whether a human must check the result, or whether AI should not be used at all.', 'В этой лаборатории вы решаете для реальных задач: может ли ИИ сделать работу сам, должен ли человек проверить результат или ИИ здесь вообще не нужен.'),
        l('For each decision write one line of evidence: name the risk (people, money, health, law, private data) or the reason it is low-risk. The checker requires a real sentence that names the risk; it cannot judge your reasoning fully, so the official answer and explanation are shown after you check.', 'К каждому решению напишите одну строку обоснования: назовите риск (люди, деньги, здоровье, закон, личные данные) или причину, почему риск низкий. Проверка требует настоящего предложения с названием риска; полностью оценить рассуждение она не может, поэтому после проверки показывается правильный ответ с объяснением.'),
      ],
      example: l('"Draft three subject lines for a newsletter" → AI alone is fine: low risk, a person picks one anyway.', '«Придумай три темы для рассылки» → ИИ справится сам: риск низкий, человек всё равно выберет одну.'),
      sources: [SRC.msIntroAI, SRC.owaspLLM],
      exercise: {
        kind: 'classify',
        intro: l('Choose a decision and write one line of evidence for each task.', 'Выберите решение и напишите одну строку обоснования для каждой задачи.'),
        labels: [
          { id: 'ai', label: l('AI alone is fine', 'ИИ справится сам') },
          { id: 'human', label: l('AI + human check', 'ИИ + проверка человеком') },
          { id: 'no', label: l('Do not use AI', 'Не использовать ИИ') },
        ],
        items: [
          { id: 'u1', text: l('Suggest five names for a community garden club.', 'Предложить пять названий для клуба общественного сада.'), correct: 'ai', why: l('Creative, low risk, easy to judge.', 'Творческая задача, риск низкий, результат легко оценить.'), evidence: { minWords: 6, anyOf: ['risk', 'low', 'creative', 'harm', 'риск', 'низк', 'творч', 'вред'] } },
          { id: 'u2', text: l('Translate a tenancy agreement before signing it.', 'Перевести договор аренды перед подписанием.'), correct: 'human', why: l('Legal and money consequences: a qualified person must check.', 'Юридические и денежные последствия: нужен проверяющий специалист.'), evidence: { minWords: 6, anyOf: ['legal', 'law', 'contract', 'money', 'rent', 'юрид', 'закон', 'договор', 'деньг', 'аренд'] } },
          { id: 'u3', text: l('Decide automatically which job applicants get rejected.', 'Автоматически решать, каким кандидатам на работу отказать.'), correct: 'no', why: l('Decisions about people\'s lives need accountable humans; bias risk.', 'Решения о судьбах людей должен принимать ответственный человек; риск предвзятости.'), evidence: { minWords: 6, anyOf: ['people', 'bias', 'fair', 'human', 'discrimin', 'job', 'люд', 'предвзят', 'справедл', 'человек', 'дискрим', 'работ'] } },
          { id: 'u4', text: l('Summarise a long public council report into five bullet points.', 'Кратко изложить длинный публичный отчёт совета в пяти пунктах.'), correct: 'human', why: l('Useful, but summaries can drop or invent points — check against the report.', 'Полезно, но пересказ может потерять или выдумать пункты — сверить с отчётом.'), evidence: { minWords: 6, anyOf: ['check', 'invent', 'miss', 'source', 'report', 'accura', 'провер', 'выдум', 'пропус', 'источник', 'отчёт', 'отчет', 'точн'] } },
          { id: 'u5', text: l('Tell a patient which medicine dose to take.', 'Сказать пациенту, какую дозу лекарства принимать.'), correct: 'no', why: l('Health decisions belong to doctors and pharmacists.', 'Решения о здоровье принимают врачи и фармацевты.'), evidence: { minWords: 6, anyOf: ['health', 'doctor', 'medic', 'pharmac', 'harm', 'здоров', 'врач', 'медиц', 'фармац', 'вред'] } },
        ],
      },
    },
  ],
};
