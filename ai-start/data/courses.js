// Список курсов школы. Открыт только курс 1, остальные помечены «скоро».
export const COURSES = [
  { id: 'c1', icon: '👋', open: true,
    title: { ru: 'Основы ИИ', en: 'AI fundamentals' },
    sub: { ru: 'Как устроен ИИ, где ему можно доверять и как ставить задачу', en: 'How AI works, when to trust it and how to ask' } },
  { id: 'c2', icon: '💬', open: false,
    title: { ru: 'Работа с запросами', en: 'Working with prompts' },
    sub: { ru: 'Запросы, которые дают результат', en: 'Requests that get results' } },
  { id: 'c3', icon: '🏠', open: false,
    title: { ru: 'ИИ в повседневных задачах', en: 'AI for everyday tasks' },
    sub: { ru: 'Планы, покупки, обучение, переводы', en: 'Plans, shopping, learning, translation' } },
  { id: 'c4', icon: '🔍', open: false,
    title: { ru: 'Проверка фактов', en: 'Fact-checking' },
    sub: { ru: 'Галлюцинации, источники, фейки', en: 'Hallucinations, sources, fakes' } },
  { id: 'c5', icon: '🛡️', open: false,
    title: { ru: 'Цифровая безопасность', en: 'Digital safety' },
    sub: { ru: 'Личные данные, мошенничество, дипфейки', en: 'Personal data, scams, deepfakes' } },
  { id: 'c6', icon: '💼', open: false,
    title: { ru: 'ИИ для работы', en: 'AI for work' },
    sub: { ru: 'Письма, документы, таблицы', en: 'Emails, documents, tables' } },
  { id: 'c7', icon: '🎨', open: false,
    title: { ru: 'ИИ для творчества', en: 'AI for creative work' },
    sub: { ru: 'Тексты, картинки и идеи', en: 'Texts, pictures and ideas' } },
  { id: 'c8', icon: '🤝', open: false,
    title: { ru: 'Личный ИИ-ассистент', en: 'Your own AI assistant' },
    sub: { ru: 'Постоянные инструкции под ваши задачи', en: 'Standing instructions for your tasks' } },
];

// «Лаборатория KUBERA»: отдельный раздел. Технологии на примере собственных проектов KUBERA (RIDGE и другие).
// Программа раздела: docs/KUBERA-LAB.md.
export const LAB_COURSES = [
  { id: 'k1', icon: '🧪', open: true,
    title: { ru: 'Технологии RIDGE', en: 'RIDGE technologies' },
    sub: { ru: 'Проверка цифр, документы, безопасность, GitHub и облако на примере RIDGE', en: 'Number checks, documents, security, GitHub and the cloud, using RIDGE as the example' } },
];
