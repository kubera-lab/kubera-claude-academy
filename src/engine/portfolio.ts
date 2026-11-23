// Portfolio export: a Markdown record of what the learner actually did, with honest limits.
import { COURSES } from '../content/catalog.ts';
import { CONTENT_VERSION, tx, type Lang } from '../content/types.ts';
import { lessonPassed, type AppState } from '../state.ts';

export interface CourseSummary {
  id: string;
  title: string;
  passed: number;
  total: number;
  manual: number;
}

export function courseSummaries(s: AppState, lang: Lang, legacy: { passed: number; total: number }): CourseSummary[] {
  return COURSES.map((c) => {
    if (c.legacy) return { id: c.id, title: tx(c.title, lang), passed: legacy.passed, total: legacy.total, manual: 0 };
    const passed = c.lessons.filter((l) => lessonPassed(s.lessons[l.id], l.v)).length;
    const manual = c.lessons.filter((l) => s.lessons[l.id]?.result?.outcome === 'manual').length;
    return { id: c.id, title: tx(c.title, lang), passed, total: c.lessons.length, manual };
  });
}

export function buildPortfolio(s: AppState, lang: Lang, legacy: { passed: number; total: number; knowledge: string; project: string }, when: Date): string {
  const L = (en: string, ru: string) => (lang === 'ru' ? ru : en);
  const lines: string[] = [];
  lines.push(`# KUBERA Claude Academy — ${L('learning record', 'учебный отчёт')}`);
  lines.push('');
  lines.push(`${L('Generated', 'Создан')}: ${when.toISOString().slice(0, 10)} · ${L('content version', 'версия контента')} ${CONTENT_VERSION}`);
  lines.push('');
  lines.push(L(
    'This record lists exercises graded automatically in the browser by fixed rules. It is not a certificate and was not issued or checked by a person.',
    'Здесь перечислены упражнения, автоматически проверенные в браузере по фиксированным правилам. Это не сертификат; он не выдан и не проверен человеком.',
  ));
  lines.push('');
  lines.push(`| ${L('Course', 'Курс')} | ${L('Passed', 'Зачтено')} |`);
  lines.push('|---|---|');
  for (const c of courseSummaries(s, lang, legacy)) lines.push(`| ${c.title} | ${c.passed} / ${c.total}${c.manual ? ` (+${c.manual} ${L('awaiting human review', 'ждут проверки человеком')})` : ''} |`);
  lines.push('');
  lines.push(`## ${L('Build Your First AI Assistant', 'Создай первого ИИ-помощника')}`);
  lines.push(`- ${L('Knowledge score', 'Баллы знаний')}: ${legacy.knowledge}`);
  lines.push(`- ${L('Final project', 'Итоговый проект')}: ${legacy.project}`);
  lines.push('');
  lines.push(`## ${L('Labs and practical work', 'Лаборатории и практика')}`);
  for (const c of COURSES) {
    for (const l of c.lessons) {
      const p = s.lessons[l.id];
      if (!p?.result) continue;
      const ok = lessonPassed(p, l.v);
      const status = p.result.outcome === 'manual' ? L('submitted, needs human review', 'отправлено, нужна проверка человеком') : ok ? L('passed', 'зачтено') : L('not passed yet', 'пока не зачтено');
      lines.push(`- **${tx(c.title, lang)} — ${tx(l.title, lang)}**: ${status}; ${L('last score', 'последний результат')} ${p.result.score}/${p.result.total}; ${L('attempts', 'попыток')} ${p.attempts}; ${p.result.at.slice(0, 10)}`);
      if (l.lab && ok && (l.exercise.kind === 'code' || l.exercise.kind === 'sql' || l.exercise.kind === 'prompt')) {
        const lang2 = l.exercise.kind === 'code' ? 'js' : l.exercise.kind === 'sql' ? 'sql' : 'text';
        lines.push('');
        lines.push('```' + lang2);
        lines.push(String(p.answer).trim());
        lines.push('```');
        lines.push('');
      }
      if (ok && l.exercise.kind === 'tool') {
        if (l.exercise.tool === 'sqlreport') {
          const a = (p.answer ?? {}) as { title?: string; queries?: Record<string, string> };
          lines.push('');
          lines.push('```sql');
          lines.push(`-- ${a.title ?? 'SQL report'}`);
          for (const [id, q] of Object.entries(a.queries ?? {})) lines.push(`-- ${id}`, String(q).trim().replace(/;?$/, ';'));
          lines.push('```');
          lines.push('');
        } else {
          lines.push(`  - ${L('Final project: the practice file was fixed until every lab check passed; the tool\'s report and fixed file are downloaded separately.', 'Итоговый проект: учебный файл исправлен до прохождения всех проверок; отчёт и исправленный файл скачиваются отдельно.')}`);
        }
      }
    }
  }
  lines.push('');
  lines.push(`## ${L('How results were checked', 'Как проверялись результаты')}`);
  lines.push(`- ${L('Multiple choice and labelling: fixed answer keys.', 'Тесты и разметка: фиксированные ключи ответов.')}`);
  lines.push(`- ${L('JavaScript labs: the code was executed in a browser Web Worker against visible and hidden tests.', 'Лаборатории JavaScript: код выполнялся в Web Worker браузера на видимых и скрытых тестах.')}`);
  lines.push(`- ${L('SQL labs: queries ran in SQLite (sql.js) on a visible and a hidden dataset.', 'SQL-лаборатории: запросы выполнялись в SQLite (sql.js) на видимом и скрытом наборе данных.')}`);
  lines.push(`- ${L('Final-project tools (courses 5–8): fixed rules check the practice file; deleting broken records does not count as a fix.', 'Инструменты итоговых проектов (курсы 5–8): фиксированные правила проверяют учебный файл; удаление сломанных записей исправлением не считается.')}`);
  lines.push(`- ${L('Written evidence: checked for length, real words and a named field; meaning is not fully understood by the checker.', 'Письменные обоснования: проверяются длина, настоящие слова и названное поле; полностью смысл проверка не понимает.')}`);
  lines.push('');
  lines.push(`## ${L('Limitations', 'Ограничения')}`);
  lines.push(`- ${L('No live AI model was used for grading.', 'Для оценки не использовалась живая ИИ-модель.')}`);
  lines.push(`- ${L('Progress is stored in one browser; this file is the learner\'s own export.', 'Прогресс хранится в одном браузере; этот файл — собственный экспорт ученика.')}`);
  lines.push('');
  return lines.join('\n');
}
