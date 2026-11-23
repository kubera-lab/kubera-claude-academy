// Instruction (system prompt) checker.
// Two layers, both deterministic:
//  - "required": the prompt must contain each element a grounded assistant needs;
//  - "quality": catches text that would pass a keyword search but is nonsense,
//    keyword stuffing, or contradicts itself.
import { matchesUnnegated, normalize, sentences, tokens, wordCount, STOP } from './text.ts';

export type CheckLevel = 'required' | 'quality';
export interface Check {
  id: string;
  level: CheckLevel;
  pass: boolean;
  /** i18n key of the label */
  label: string;
  /** i18n key of the fix / explanation shown when it fails */
  fix: string;
  /** optional detail (e.g. the contradicting phrases found) */
  detail?: string;
}

export interface LintContext {
  /** Words that name the place/subject, all must appear, e.g. ["riverside", "centre|center"] */
  placeTerms: string[];
  minWords?: number;
  maxWords?: number;
}

const has = (t: string, re: RegExp) => re.test(t);

function vowelish(tok: string): boolean {
  if (/^\d+$/.test(tok)) return true;
  if (!/[aeiouy]/.test(tok)) return tok.length <= 2; // "hm", "ok" style short tokens are tolerated
  if (/[bcdfghjklmnpqrstvwxz]{5,}/.test(tok)) return false;
  if (tok.length > 22) return false;
  return true;
}

const CONTRADICTIONS: { id: string; a: RegExp; b: RegExp; fix: string }[] = [
  {
    id: 'ground-vs-guess',
    a: /\bonly\b[^.]{0,60}\b(fact sheet|facts?|information|knowledge base|sources?|price list|menu|timetable|document)\b/,
    b: /\b(you (may|can|should|could)|feel free to|it'?s (ok|okay|fine) to|try to|allowed to)\s+(guess|invent|make (things|something|it|answers?) up|use (your )?((own|general|outside|world) )+knowledge|search the (web|internet))/,
    fix: 'lint.fix.contradictGuess',
  },
  {
    id: 'ground-vs-outside',
    a: /\bonly\b[^.]{0,60}\b(fact sheet|facts?|information|knowledge base|sources?|price list|menu|timetable|document)\b/,
    b: /\buse (your )?((own|general|outside|world|internet) )+knowledge\b|\bsearch the (web|internet)\b|\bif (unsure|you don'?t know)[^.]{0,30}\b(guess|make)\b/,
    fix: 'lint.fix.contradictOutside',
  },
  {
    id: 'unknown-vs-always',
    a: /\b(don'?t|do not) know\b|\bnot sure\b|\bnever guess\b/,
    b: /\bnever say (that )?(you )?(don'?t|do not) know\b|\balways (give|provide|find) an answer\b|\banswer every question\b|\bnever refuse\b/,
    fix: 'lint.fix.contradictUnknown',
  },
  {
    id: 'short-vs-long',
    a: /\b(short|brief|concise)\b/,
    b: /\b(long|lengthy|detailed essay|at least \d{3,} words|as long as possible)\b/,
    fix: 'lint.fix.contradictLength',
  },
];

export function lintInstructions(text: string, ctx: LintContext): Check[] {
  const t = normalize(text);
  const wc = wordCount(text);
  const minW = ctx.minWords ?? 40;
  const maxW = ctx.maxWords ?? 220;
  const checks: Check[] = [];
  const req = (id: string, pass: boolean) =>
    checks.push({ id, level: 'required', pass, label: `lint.${id}.label`, fix: `lint.${id}.fix` });

  // ---------- required elements ----------
  req('role', has(t, /\byou are\b|\byour (job|role|task|goal) is\b|\bact as\b/));
  req('place', ctx.placeTerms.every((p) => new RegExp(`\\b(${p})\\b`).test(t)));
  req('ground', has(t, /\bonly\b[^.]{0,60}\b(fact sheet|facts?|information|knowledge base|sources?|price list|menu|timetable|document)\b|\b(fact sheet|facts?|information|knowledge base|price list|menu|timetable)\b[^.]{0,40}\bonly\b/));
  req(
    'unknown',
    has(
      t,
      /\b(don'?t|do not|doesn'?t) know\b|\bnot (sure|in the fact|on the fact|in the information|in the knowledge)\b|\b(never|do not|don'?t) (guess|invent|make (things|anything|it) up)\b/,
    ),
  );
  req('next', has(t, /\b(phon(e|ing)|call(ing)?|reception|contact(ing)?|e-?mail(ing)?|desk|helpline|ask (a member of )?staff)\b/));
  req('style', has(t, /\b(short|brief|simple|clear|plain|concise|easy)\b/));
  req('length', wc >= minW && wc <= maxW);

  // ---------- quality: nonsense ----------
  const toks = tokens(text);
  const wordLike = toks.filter(vowelish).length;
  const sents = sentences(text).filter((s) => wordCount(s) >= 3);
  const realSentences = sents.filter((s) => {
    const w = tokens(s);
    // a real instruction sentence has at least one function word (articles, pronouns, modal verbs...)
    return w.some((x) => STOP.has(x)) && w.length >= 4;
  });
  const gibberishOk = toks.length > 0 && wordLike / toks.length >= 0.9;
  checks.push({
    id: 'readable',
    level: 'quality',
    pass: gibberishOk && realSentences.length >= 3,
    label: 'lint.readable.label',
    fix: 'lint.readable.fix',
    detail: `${realSentences.length}`,
  });

  // ---------- quality: keyword stuffing / repetition ----------
  const content = toks.filter((x) => !STOP.has(x));
  const uniqueRatio = content.length ? new Set(content).size / content.length : 0;
  const freq = new Map<string, number>();
  content.forEach((w) => freq.set(w, (freq.get(w) ?? 0) + 1));
  const top = [...freq.entries()].sort((a, b) => b[1] - a[1])[0];
  const topShare = top && content.length ? top[1] / content.length : 0;
  const repeatedSentence = (() => {
    const seen = new Set<string>();
    for (const s of sents) {
      const k = normalize(s);
      if (seen.has(k)) return true;
      seen.add(k);
    }
    return false;
  })();
  checks.push({
    id: 'stuffing',
    level: 'quality',
    pass: content.length > 0 && uniqueRatio >= 0.5 && topShare <= 0.12 && !repeatedSentence,
    label: 'lint.stuffing.label',
    fix: 'lint.stuffing.fix',
    detail: top ? top[0] : undefined,
  });

  // ---------- quality: contradictions ----------
  const found: string[] = [];
  let fixKey = 'lint.contradiction.fix';
  for (const c of CONTRADICTIONS) {
    if (has(t, c.a) && matchesUnnegated(t, c.b)) {
      found.push(c.id);
      fixKey = c.fix;
    }
  }
  checks.push({
    id: 'contradiction',
    level: 'quality',
    pass: found.length === 0,
    label: 'lint.contradiction.label',
    fix: fixKey,
    detail: found.join(', ') || undefined,
  });

  // ---------- quality: privacy ----------
  const asksPrivate = matchesUnnegated(
    t,
    /\b(ask|collect|request|store|save|get)\b[^.]{0,40}\b(password|bank (details|account)|card number|passport|national insurance)\b/,
  );
  checks.push({ id: 'privacy', level: 'quality', pass: !asksPrivate, label: 'lint.privacy.label', fix: 'lint.privacy.fix' });

  return checks;
}

export function lintPassed(checks: Check[]): boolean {
  return checks.every((c) => c.pass);
}
