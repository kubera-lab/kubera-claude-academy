import { en } from './en.ts';
import { ru } from './ru.ts';

export type UiLang = 'en' | 'ru';
const dictionaries: Record<UiLang, Record<string, string>> = { en, ru };
let lang: UiLang = 'en';

export function setLang(l: string) {
  if (l === 'en' || l === 'ru') lang = l;
  if (typeof document !== 'undefined') document.documentElement.lang = lang;
}
export const getLang = (): UiLang => lang;

/** t('kb.issues', { n: 3 }) → "3 issues to fix". Missing keys fall back to English, then to the key itself. */
export function t(key: string, vars: Record<string, string | number> = {}): string {
  const s = dictionaries[lang][key] ?? en[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

/** Translate an engine reason like "test.missingText:wednesday", "test.wrongKind:answer|unknown" or "g.sqlRows:5|3". */
export function tReason(r: string): string {
  const i = r.indexOf(':');
  if (i < 0) return t(r);
  const key = r.slice(0, i);
  const d = r.slice(i + 1);
  if (key === 'test.wrongKind') {
    const [a, b] = d.split('|');
    return t(key, { a: t('kind.' + a), b: t('kind.' + b) });
  }
  const [a, b] = d.split('|');
  return t(key, { d, a: a ?? '', b: b ?? '' });
}

/** Keys that exist in English but not in Russian (used by a unit test to block untranslated UI). */
export function missingTranslations(): string[] {
  return Object.keys(en).filter((k) => !(k in ru));
}
