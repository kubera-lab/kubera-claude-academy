// Small, dependency-free text helpers shared by every grader.

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokens(s: string): string[] {
  return normalize(s).match(/[a-z0-9']+/g) ?? [];
}

export function wordCount(s: string): number {
  return (s.trim().match(/\S+/g) ?? []).length;
}

export function sentences(s: string): string[] {
  return s
    .split(/(?<=[.!?])\s+|\n+/)
    .map((x) => x.trim())
    .filter((x) => x.length > 0);
}

export const STOP = new Set(
  ('a an the and or but if then of to in on at for from by with about as is are was were be been am do does did ' +
    'i you he she it we they me my your our their this that these those there here what when where which who how ' +
    'can could would should will shall may might must have has had not no yes please any some so than too very just ' +
    "it's i'm don't do doesn't can't won't isn't")
    .split(' '),
);

export function contentTokens(s: string): string[] {
  return tokens(s).filter((t) => !STOP.has(t));
}

/** Numbers and clock times in a text, normalised ("9:00" -> "9:00", "09:00" -> "9:00"). */
export function numbersIn(s: string): string[] {
  const out: string[] = [];
  const re = /\b\d{1,2}:\d{2}\b|\b\d+(?:\.\d+)?\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    const v = m[0].includes(':') ? m[0].replace(/^0(\d)/, '$1') : String(Number(m[0]));
    out.push(v);
  }
  return out;
}

/** True if the regex matches somewhere that is NOT preceded by a negation in the same clause. */
export function matchesUnnegated(text: string, re: RegExp): boolean {
  const t = normalize(text);
  const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  let m: RegExpExecArray | null;
  while ((m = g.exec(t))) {
    const before = t.slice(Math.max(0, m.index - 28), m.index);
    const clause = before.split(/[.,;:!?]/).pop() ?? '';
    if (!/\b(not|never|don't|do not|no|without|avoid|refuse to)\b/.test(clause)) return true;
  }
  return false;
}
