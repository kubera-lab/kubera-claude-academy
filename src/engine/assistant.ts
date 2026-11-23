// Offline, rule-based assistant. It is NOT a language model: it answers only
// from the learner's knowledge base, by keyword matching, so every reply can be
// traced to one entry. This is what lets us test behaviour without a paid API.
import { contentTokens, normalize, numbersIn, wordCount, STOP } from './text.ts';

export interface Fact {
  n: number;
  text: string;
}
export interface KBEntry {
  id: string;
  /** a typical question, for the learner's own reference */
  question: string;
  /** comma-separated keywords; multi-word phrases allowed */
  keywords: string;
  answer: string;
  /** fact number this answer is based on */
  source: number;
}
export interface AssistantConfig {
  name: string;
  purpose: string;
  instructions: string;
  facts: string; // one fact per line
  kb: KBEntry[];
  unknownReply: string;
  outOfScopeTopics: string; // comma-separated
  outOfScopeReply: string;
  maxWords: number;
}

export type ReplyKind = 'answer' | 'unknown' | 'out_of_scope' | 'clarify';
export interface Reply {
  kind: ReplyKind;
  text: string;
  entryIds: string[];
  source?: number;
  trace: string[];
}

export function parseFacts(text: string): Fact[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !/^#/.test(l))
    .map((l, i) => {
      const m = l.match(/^(\d+)[.)]\s*(.*)$/);
      return m ? { n: Number(m[1]), text: m[2] } : { n: i + 1, text: l };
    });
}

export function splitList(s: string): string[] {
  return s
    .split(/[,;\n]/)
    .map((x) => normalize(x))
    .filter((x) => x.length > 0);
}

function keywordHits(input: string, keywords: string[]): string[] {
  const n = ' ' + normalize(input).replace(/[^a-z0-9': ]/g, ' ') + ' ';
  return keywords.filter((k) => {
    const kk = k.replace(/[^a-z0-9': ]/g, ' ').trim();
    if (!kk) return false;
    // singular/plural tolerant whole-phrase match
    return n.includes(' ' + kk + ' ') || n.includes(' ' + kk + 's ') || (kk.endsWith('s') && n.includes(' ' + kk.slice(0, -1) + ' '));
  });
}

export function respond(cfg: AssistantConfig, input: string): Reply {
  const trace: string[] = [];
  if (!input.trim()) return { kind: 'clarify', text: 'Please type a question.', entryIds: [], trace: ['empty input'] };

  const scored = cfg.kb
    .map((e) => ({ e, hits: keywordHits(input, splitList(e.keywords)) }))
    .filter((x) => x.hits.length > 0)
    .sort((a, b) => b.hits.length - a.hits.length);
  scored.forEach((s) => trace.push(`entry "${s.e.id}" matched: ${s.hits.join(', ')}`));

  if (scored.length > 0) {
    const best = scored[0].hits.length;
    const top = scored.filter((s) => s.hits.length === best);
    if (top.length > 1) {
      trace.push(`tie between ${top.map((t) => t.e.id).join(' and ')} → ask to clarify`);
      return {
        kind: 'clarify',
        text: `Do you mean: ${top.map((t) => t.e.question).join(' or ')}?`,
        entryIds: top.map((t) => t.e.id),
        trace,
      };
    }
    const e = top[0].e;
    return { kind: 'answer', text: e.answer, entryIds: [e.id], source: e.source, trace };
  }

  const oos = keywordHits(input, splitList(cfg.outOfScopeTopics));
  if (oos.length > 0) {
    trace.push(`out-of-scope topic: ${oos.join(', ')}`);
    return { kind: 'out_of_scope', text: cfg.outOfScopeReply, entryIds: [], trace };
  }
  trace.push('no knowledge entry matched → unknown reply');
  return { kind: 'unknown', text: cfg.unknownReply, entryIds: [], trace };
}

// ---------------- knowledge base validation ----------------
const ABSOLUTES = ['every day', 'always', 'unlimited', 'any time', 'anytime', 'as long as you like', 'all day', '24 hours', '24/7', 'no limit', 'everyone', 'everything', 'never closed', 'guaranteed'];
const NEG = /\b(no|not|never|closed|cannot|can't|without|only)\b/;

/** Words that the fact puts under a negation: "No lift" -> lift; "closed on Sunday" -> sunday. */
export function negatedTerms(fact: string): string[] {
  const toks = normalize(fact).match(/[a-z0-9'-]+/g) ?? [];
  const out: string[] = [];
  toks.forEach((tk, i) => {
    if (!NEG.test(tk)) return;
    for (let j = i + 1; j < Math.min(toks.length, i + 4); j++) {
      const w = toks[j];
      if (STOP.has(w) || NEG.test(w)) continue;
      out.push(w);
      break;
    }
  });
  return [...new Set(out)];
}

/** True if the answer mentions the term but has no negation in the 4 words before it. */
export function mentionsWithoutNegation(answer: string, term: string): boolean {
  const toks = normalize(answer).match(/[a-z0-9'-]+/g) ?? [];
  let mentioned = false;
  for (let i = 0; i < toks.length; i++) {
    if (toks[i] !== term && toks[i] !== term + 's') continue;
    mentioned = true;
    const before = toks.slice(Math.max(0, i - 4), i);
    if (before.some((w) => NEG.test(w))) return false;
  }
  return mentioned;
}

export interface KBIssue {
  entryId: string;
  key: string; // i18n key
  detail?: string;
}

export function validateKB(cfg: AssistantConfig): KBIssue[] {
  const facts = parseFacts(cfg.facts);
  const byN = new Map(facts.map((f) => [f.n, f]));
  const issues: KBIssue[] = [];
  const seenKw = new Map<string, string>();
  cfg.kb.forEach((e) => {
    if (!e.question.trim()) issues.push({ entryId: e.id, key: 'kb.noQuestion' });
    const kws = splitList(e.keywords);
    if (kws.length === 0) issues.push({ entryId: e.id, key: 'kb.noKeywords' });
    if (!e.answer.trim()) issues.push({ entryId: e.id, key: 'kb.noAnswer' });
    const f = byN.get(Number(e.source));
    if (!f) {
      issues.push({ entryId: e.id, key: 'kb.badSource', detail: String(e.source) });
    } else {
      const factNums = new Set(numbersIn(f.text));
      const extra = numbersIn(e.answer).filter((x) => !factNums.has(x));
      if (extra.length) issues.push({ entryId: e.id, key: 'kb.unsupportedNumber', detail: extra.join(', ') });
      // content overlap: the answer must re-use words of its fact (grounding signal)
      const fw = new Set(contentTokens(f.text));
      const aw = contentTokens(e.answer);
      const overlap = aw.length ? aw.filter((w) => fw.has(w)).length / aw.length : 0;
      if (aw.length && overlap < 0.35) issues.push({ entryId: e.id, key: 'kb.lowOverlap', detail: `${Math.round(overlap * 100)}%` });
    }
    if (f) {
      const fn = normalize(f.text);
      const an = normalize(e.answer);
      // absolute claims ("every day", "unlimited") that the fact does not make
      const abs = ABSOLUTES.filter((a) => an.includes(a) && !fn.includes(a));
      if (abs.length) issues.push({ entryId: e.id, key: 'kb.absoluteClaim', detail: abs.join(', ') });
      // a negation in the fact ("no lift", "closed on Sunday") must not disappear in the answer
      const lost = negatedTerms(f.text).filter((term) => mentionsWithoutNegation(e.answer, term));
      if (lost.length) issues.push({ entryId: e.id, key: 'kb.negationLost', detail: lost.join(', ') });
    }
    if (wordCount(e.answer) > cfg.maxWords) issues.push({ entryId: e.id, key: 'kb.tooLong', detail: String(cfg.maxWords) });
    kws.forEach((k) => {
      const other = seenKw.get(k);
      if (other && other !== e.id) issues.push({ entryId: e.id, key: 'kb.duplicateKeyword', detail: `${k} (${other})` });
      else seenKw.set(k, e.id);
    });
  });
  return issues;
}
