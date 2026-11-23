import type { Course, Lang, Lesson } from './types.ts';
import { tx } from './types.ts';
import { FUNDAMENTALS } from './courses/fundamentals.ts';
import { PROMPTING } from './courses/prompting.ts';
import { AGENTS } from './courses/agents.ts';
import { DATAQUALITY } from './courses/dataquality.ts';
import { SQL } from './courses/sql.ts';
import { GIS } from './courses/gis.ts';
import { WEBDEV } from './courses/webdev.ts';
import { withExtras } from './extras.ts';

const l = (en: string, ru: string) => ({ en, ru });

/** Course 3 keeps its own pages (#m1–#m5 and #project) from v0.2.2. */
export const ASSISTANT: Course = {
  id: 'assistant',
  n: 3,
  legacy: true,
  title: l('Build Your First AI Assistant', 'Создай первого ИИ-помощника'),
  level: l('Beginner', 'Начальный'),
  summary: l('Design, build, test and fix a grounded assistant, then build your own on any subject.', 'Спроектируйте, соберите, протестируйте и исправьте помощника с опорой на факты, затем создайте своего на любую тему.'),
  outcome: l('A tested assistant on your own subject, exported for GitHub.', 'Протестированный помощник на вашу тему, экспортированный для GitHub.'),
  lessons: [],
};

export const COURSES: Course[] = [FUNDAMENTALS, PROMPTING, ASSISTANT, AGENTS, DATAQUALITY, SQL, GIS, WEBDEV].map(withExtras);

export const ALL_LESSONS: (Lesson & { courseId: string })[] = COURSES.flatMap((c) => c.lessons.map((ls) => ({ ...ls, courseId: c.id })));

export const lessonById = (id: string) => ALL_LESSONS.find((x) => x.id === id);
export const courseById = (id: string) => COURSES.find((c) => c.id === id);

export interface SearchHit {
  kind: 'course' | 'lesson' | 'module';
  id: string;
  href: string;
  title: string;
  course: string;
  snippet: string;
}

/** Plain text search over titles, explanations and examples in the chosen language. */
export function searchContent(q: string, lang: Lang, legacyModules: { id: string; title: string; text: string }[]): SearchHit[] {
  const terms = q.toLowerCase().split(/\s+/).filter((w) => w.length > 1);
  if (!terms.length) return [];
  const hits: (SearchHit & { score: number })[] = [];
  const score = (hay: string) => terms.reduce((a, t) => a + (hay.includes(t) ? 1 : 0), 0);
  const snip = (text: string) => {
    const low = text.toLowerCase();
    const i = Math.max(0, ...terms.map((t) => low.indexOf(t)).filter((i) => i >= 0).slice(0, 1));
    return (i > 40 ? '…' : '') + text.slice(Math.max(0, i - 40), i + 120).trim() + '…';
  };
  for (const c of COURSES) {
    const hay = (tx(c.title, lang) + ' ' + tx(c.summary, lang)).toLowerCase();
    const s = score(hay);
    if (s) hits.push({ kind: 'course', id: c.id, href: '#c/' + c.id, title: tx(c.title, lang), course: tx(c.title, lang), snippet: tx(c.summary, lang), score: s + 1 });
    for (const ls of c.lessons) {
      const body = [tx(ls.title, lang), ...ls.explain.map((p) => tx(p, lang)), tx(ls.example, lang)].join(' ');
      const s2 = score(body.toLowerCase());
      if (s2) hits.push({ kind: 'lesson', id: ls.id, href: '#l/' + ls.id, title: tx(ls.title, lang), course: tx(c.title, lang), snippet: snip(body), score: s2 });
    }
  }
  for (const m of legacyModules) {
    const s3 = score((m.title + ' ' + m.text).toLowerCase());
    if (s3) hits.push({ kind: 'module', id: m.id, href: '#' + m.id, title: m.title, course: tx(ASSISTANT.title, lang), snippet: snip(m.text), score: s3 });
  }
  return hits.sort((a, b) => b.score - a.score).map(({ score: _s, ...h }) => h);
}
