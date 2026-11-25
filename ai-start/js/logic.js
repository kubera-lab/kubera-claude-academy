// Чистая логика без DOM: тесты, прогресс, симулятор. Проверяется автотестами (tests/logic.test.mjs).

// ---------- Тесты ----------

/** Проверить ответ. Возвращает {ok, why}. */
export function checkAnswer(lessonLang, key, qIndex, choice) {
  const q = lessonLang.quiz[qIndex];
  const ok = key[qIndex] === choice;
  return { ok, why: q.o[choice][1], correct: key[qIndex] };
}

/** Проверка, что урок собран правильно: 4 вопроса, у каждого есть объяснение, ключ в пределах. */
export function validateLesson(lesson) {
  const errors = [];
  for (const lang of ['ru', 'en']) {
    const L = lesson[lang];
    if (!L) { errors.push(`${lesson.id}: нет языка ${lang}`); continue; }
    for (const f of ['title', 'situation', 'practice', 'prompt']) {
      if (!L[f] || typeof L[f] !== 'string') errors.push(`${lesson.id}/${lang}: пустое поле ${f}`);
    }
    if (!Array.isArray(L.points) || L.points.length < 3) errors.push(`${lesson.id}/${lang}: мало тезисов`);
    else L.points.forEach((pt, i) => { if (!pt[0] || !pt[1]) errors.push(`${lesson.id}/${lang}: пустой тезис ${i}`); });
    if (!L.compare || !L.compare.bad || !L.compare.good || !L.compare.why) errors.push(`${lesson.id}/${lang}: нет разбора`);
    if (!Array.isArray(L.takeaways) || L.takeaways.length < 2) errors.push(`${lesson.id}/${lang}: нет итогов`);
    if (!Array.isArray(L.quiz) || L.quiz.length !== lesson.key.length) {
      errors.push(`${lesson.id}/${lang}: число вопросов не совпадает с ключом`);
      continue;
    }
    L.quiz.forEach((q, i) => {
      if (!q.q) errors.push(`${lesson.id}/${lang}/q${i}: нет текста вопроса`);
      if (!Array.isArray(q.o) || q.o.length < 2) errors.push(`${lesson.id}/${lang}/q${i}: мало вариантов`);
      q.o.forEach((opt, j) => {
        if (!opt[0] || !opt[1]) errors.push(`${lesson.id}/${lang}/q${i}/o${j}: нет текста или объяснения`);
      });
      const k = lesson.key[i];
      if (!(k >= 0 && k < q.o.length)) errors.push(`${lesson.id}/${lang}/q${i}: ключ вне вариантов`);
    });
  }
  return errors;
}

// ---------- Прогресс ----------

export const STORE_KEY = 'kubera-ai-start.v1';

export function emptyProgress() {
  return { lang: null, done: {}, mistakes: [], last: null, stars: {}, scores: {} };
}

/** Безопасно разобрать сохранённый прогресс. Любой мусор → пустой прогресс. */
export function parseProgress(raw) {
  try {
    const p = JSON.parse(raw);
    if (!p || typeof p !== 'object') return emptyProgress();
    const e = emptyProgress();
    return {
      lang: p.lang === 'ru' || p.lang === 'en' ? p.lang : null,
      done: p.done && typeof p.done === 'object' ? p.done : e.done,
      mistakes: Array.isArray(p.mistakes) ? p.mistakes.filter((m) => typeof m === 'string') : e.mistakes,
      last: typeof p.last === 'string' ? p.last : null,
      stars: p.stars && typeof p.stars === 'object' ? p.stars : e.stars,
      scores: p.scores && typeof p.scores === 'object' ? p.scores : e.scores,
    };
  } catch {
    return emptyProgress();
  }
}

/** Записать результат вопроса. id вопроса: "c1l2:3". Ошибка попадает в список повторения, верный ответ убирает её оттуда. */
export function recordAnswer(progress, qid, ok) {
  const set = new Set(progress.mistakes);
  if (ok) set.delete(qid); else set.add(qid);
  return { ...progress, mistakes: [...set] };
}

/** Урок пройден: сохраняем звёзды (1–3 по числу верных ответов с первого раза). */
export function finishLesson(progress, lessonId, firstTryCorrect, total) {
  const stars = firstTryCorrect === total ? 3 : firstTryCorrect >= total / 2 ? 2 : 1;
  const prev = progress.stars[lessonId] || 0;
  return {
    ...progress,
    done: { ...progress.done, [lessonId]: true },
    stars: { ...progress.stars, [lessonId]: Math.max(prev, stars) },
    scores: { ...(progress.scores || {}), [lessonId]: Math.max((progress.scores || {})[lessonId] || 0, firstTryCorrect) },
  };
}

/** Какой урок открыть по кнопке «Продолжить»: первый непройденный, иначе последний открытый. */
export function nextLesson(progress, lessons) {
  const firstUndone = lessons.find((l) => !progress.done[l.id]);
  return firstUndone ? firstUndone.id : (progress.last || lessons[0].id);
}

/** Урок открыт, если это первый урок или предыдущий пройден. */
export function isUnlocked(progress, lessons, lessonId) {
  const i = lessons.findIndex((l) => l.id === lessonId);
  if (i <= 0) return i === 0;
  return !!progress.done[lessons[i - 1].id];
}

// ---------- Симулятор «Лаборатория запросов» ----------
// Это заранее написанные ответы, а не настоящая нейросеть. На экране это сказано прямо.

export const LAB_PARTS = ['context', 'task', 'reqs'];

export const LAB_TEXT = {
  ru: {
    base: 'Напиши письмо.',
    parts: {
      context: 'Я менеджер компании по поставке офисной мебели.',
      task: 'Клиенту ООО «Вектор»: поставка задерживается на 7 дней из-за поставщика, новый срок 12 декабря.',
      reqs: 'Тон вежливый и деловой, 5–7 предложений, предложи скидку 5% на следующий заказ.',
    },
    labels: { context: 'Контекст', task: 'Задача', reqs: 'Требования' },
    replies: {
      0: 'Конечно. Уточните, пожалуйста: кому адресовано письмо, о чём оно и каким должен быть тон?',
      1: 'Уважаемый клиент!\n\nОбращаемся к вам по вопросу вашего заказа. [Тема письма не указана, поэтому текст получился общим.]\n\nС уважением,\nОтдел продаж',
      2: 'Уважаемые коллеги из ООО «Вектор»!\n\nСообщаем, что поставка по вашему заказу задерживается на 7 дней. Новый срок: 12 декабря. Приносим извинения за неудобства.\n\nС уважением,\n[Имя]',
      3: 'Уважаемые коллеги из ООО «Вектор»!\n\nК сожалению, поставка по вашему заказу задерживается на 7 дней из-за задержки у нашего поставщика. Новый срок доставки: 12 декабря. Мы понимаем, что это неудобно, и приносим извинения. В качестве компенсации предлагаем скидку 5% на ваш следующий заказ. Если новый срок вам не подходит, напишите нам, и мы предложим варианты.\n\nС уважением,\n[Имя], менеджер по работе с клиентами',
    },
  },
  en: {
    base: 'Write a letter.',
    parts: {
      context: 'I am a manager at an office furniture supplier.',
      task: 'To our client Vector Ltd: the delivery is delayed by 7 days because of our supplier; new date 12 December.',
      reqs: 'Polite, businesslike tone, 5–7 sentences, offer a 5% discount on the next order.',
    },
    labels: { context: 'Context', task: 'Task', reqs: 'Requirements' },
    replies: {
      0: 'Of course. Could you tell me who the letter is for, what it is about and what tone it should have?',
      1: 'Dear client,\n\nWe are writing to you regarding your order. [No subject was given, so the text is generic.]\n\nKind regards,\nSales team',
      2: 'Dear colleagues at Vector Ltd,\n\nWe would like to inform you that delivery of your order is delayed by 7 days. The new date is 12 December. We apologise for the inconvenience.\n\nKind regards,\n[Name]',
      3: 'Dear colleagues at Vector Ltd,\n\nUnfortunately, delivery of your order is delayed by 7 days because of a delay at our supplier. The new delivery date is 12 December. We understand this is inconvenient and apologise. To make up for it, we would like to offer you a 5% discount on your next order. If the new date does not work for you, please let us know and we will suggest alternatives.\n\nKind regards,\n[Name], Account Manager',
    },
  },
};

/** Ответ зависит от того, какие части добавлены. Без задачи письмо остаётся общим, даже с контекстом. */
function labLevel(used) {
  const has = (p) => used.includes(p);
  if (!has('task')) return used.length === 0 ? 0 : 1;
  return has('context') && has('reqs') ? 3 : 2;
}

/** Собрать запрос и учебный ответ по выбранным частям. */
export function labResult(lang, chosen) {
  const T = LAB_TEXT[lang];
  const used = LAB_PARTS.filter((p) => chosen.includes(p));
  const prompt = [T.base, ...used.map((p) => T.parts[p])].join(' ');
  return { prompt, reply: T.replies[labLevel(used)], score: used.length, max: LAB_PARTS.length };
}
