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
    for (const f of ['title', 'idea', 'example', 'practice', 'prompt']) {
      if (!L[f] || typeof L[f] !== 'string') errors.push(`${lesson.id}/${lang}: пустое поле ${f}`);
    }
    if (!Array.isArray(L.story) || L.story.length < 2) errors.push(`${lesson.id}/${lang}: короткая история`);
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
  return { lang: null, done: {}, mistakes: [], last: null, stars: {} };
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

export const LAB_PARTS = ['who', 'what', 'how'];

export const LAB_TEXT = {
  ru: {
    base: 'Напиши письмо.',
    parts: {
      who: 'Начальнику, Ирине Петровне.',
      what: 'Прошу отпуск с 10 по 14 марта.',
      how: 'Коротко и вежливо.',
    },
    labels: { who: 'Кому?', what: 'О чём?', how: 'Каким?' },
    replies: {
      0: 'Конечно! Кому вы хотите написать письмо и о чём?',
      1: 'Хорошо. А о чём должно быть письмо? И каким тоном его написать?',
      2: 'Здравствуйте!\n\nПишу вам по поводу… (не знаю, кому именно и каким тоном писать, поэтому получилось общо)\n\nС уважением.',
      3: 'Здравствуйте, Ирина Петровна!\n\nПрошу предоставить мне отпуск с 10 по 14 марта. Все текущие задачи завершу заранее.\n\nСпасибо!\nС уважением, Аня',
    },
  },
  en: {
    base: 'Write a letter.',
    parts: {
      who: 'To my manager, Irina.',
      what: 'I am asking for leave from 10 to 14 March.',
      how: 'Short and polite.',
    },
    labels: { who: 'Who to?', what: 'About what?', how: 'How?' },
    replies: {
      0: 'Of course! Who do you want to write to, and what about?',
      1: 'Sure. What should the letter be about? And what tone should it have?',
      2: 'Hello,\n\nI am writing regarding… (I do not know exactly who it is for or what tone to use, so it came out vague)\n\nKind regards.',
      3: 'Dear Irina,\n\nI would like to request leave from 10 to 14 March. I will finish my current tasks beforehand.\n\nThank you!\nKind regards,\nAnya',
    },
  },
};

/** Собрать запрос и учебный ответ по выбранным частям. */
export function labResult(lang, chosen) {
  const T = LAB_TEXT[lang];
  const used = LAB_PARTS.filter((p) => chosen.includes(p));
  const prompt = [T.base, ...used.map((p) => T.parts[p])].join(' ');
  return { prompt, reply: T.replies[used.length], score: used.length, max: LAB_PARTS.length };
}
