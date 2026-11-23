// Course 1 tool: AI Use-Case Safety Review. A learner describes an AI use case on a short card; fixed,
// published rules give a risk level and the safeguards that must be in place. It is a learning aid,
// not a legal assessment.

export type Level3 = 'none' | 'minor' | 'significant';
export type Data = 'none' | 'personal' | 'sensitive';
export type Mode = 'assist' | 'human_approves' | 'automatic';
export type Impact = 'low' | 'medium' | 'high';

export interface Card {
  title: string;
  affects: Level3;
  data: Data;
  mode: Mode;
  impact: Impact;
  safeguards: string[];
}

export type Safeguard = 'human_review' | 'tell_users' | 'data_minimise' | 'dp_check' | 'source_check' | 'fallback' | 'log_decisions' | 'test_before';

export const SAFEGUARDS: Safeguard[] = ['human_review', 'tell_users', 'data_minimise', 'dp_check', 'source_check', 'fallback', 'log_decisions', 'test_before'];

export type Risk = 'low' | 'medium' | 'high';

/** The rules, in order. Each returns a reason key when it applies. */
export function assess(c: Card): { risk: Risk; reasons: string[]; required: Safeguard[] } {
  const reasons: string[] = [];
  let risk = 'low' as Risk;
  const up = (r: Risk) => { if (r === 'high' || (r === 'medium' && risk === 'low')) risk = r; };
  if (c.affects === 'significant' && c.mode === 'automatic') { up('high'); reasons.push('autoSignificant'); }
  if (c.data === 'sensitive') { up(c.affects === 'none' ? 'medium' : 'high'); reasons.push('sensitive'); }
  if (c.impact === 'high') { up(c.mode === 'automatic' ? 'high' : 'medium'); reasons.push('highImpact'); }
  if (c.affects === 'significant' && c.mode !== 'automatic') { up('medium'); reasons.push('significantReviewed'); }
  if (c.data === 'personal') { up('medium'); reasons.push('personal'); }
  if (c.affects === 'minor' || c.impact === 'medium') { up('medium'); reasons.push('someEffect'); }
  const required = new Set<Safeguard>(['test_before', 'source_check']);
  if (c.affects !== 'none') { required.add('tell_users'); required.add('fallback'); }
  if (c.affects === 'significant' || c.impact === 'high' || c.data === 'sensitive') required.add('human_review');
  if (c.data !== 'none') required.add('data_minimise');
  if (c.data === 'sensitive' || (c.data === 'personal' && c.affects === 'significant')) required.add('dp_check');
  if (risk === 'high' || c.mode === 'automatic') required.add('log_decisions');
  return { risk, reasons, required: SAFEGUARDS.filter((s) => required.has(s)) };
}

export function missingSafeguards(c: Card): Safeguard[] {
  return assess(c).required.filter((s) => !c.safeguards.includes(s));
}

// ---------- practice cases (fictional) ----------
export interface Case { id: string; title: string; story: { en: string; ru: string }; key: Pick<Card, 'affects' | 'data' | 'mode' | 'impact'> }

export const CASES: Case[] = [
  {
    id: 'c1', title: 'Café menu descriptions',
    story: { en: 'A café uses AI to draft short descriptions of new dishes. The owner reads every text before it goes on the menu. No customer data is used. A bad description is easy to fix.', ru: 'Кафе использует ИИ для черновиков описаний новых блюд. Владелец читает каждый текст перед публикацией. Данные клиентов не используются. Плохое описание легко исправить.' },
    key: { affects: 'none', data: 'none', mode: 'human_approves', impact: 'low' },
  },
  {
    id: 'c2', title: 'Tenant screening score',
    story: { en: 'A letting agency wants AI to score rental applications from income, history and references, and to reject low scores automatically with no person looking. A wrong rejection can leave someone without a home.', ru: 'Агентство аренды хочет, чтобы ИИ оценивал заявки по доходу, истории и рекомендациям и автоматически отклонял низкие оценки без участия человека. Ошибочный отказ может оставить человека без жилья.' },
    key: { affects: 'significant', data: 'personal', mode: 'automatic', impact: 'high' },
  },
  {
    id: 'c3', title: 'GP appointment triage helper',
    story: { en: 'A clinic receptionist uses AI to suggest how urgent a patient message is (symptoms are included). The receptionist always decides. A missed urgent case could cause serious harm.', ru: 'Администратор поликлиники использует ИИ, чтобы оценить срочность сообщения пациента (в нём есть симптомы). Решает всегда администратор. Пропущенный срочный случай может навредить серьёзно.' },
    key: { affects: 'significant', data: 'sensitive', mode: 'human_approves', impact: 'high' },
  },
];

export const EXPECTED_RISK: Record<string, Risk> = { c1: 'low', c2: 'high', c3: 'high' };

export const emptyCard = (title: string): Card => ({ title, affects: 'none', data: 'none', mode: 'assist', impact: 'low', safeguards: [] });

/** Lab: each card matches its story, and every required safeguard is ticked. */
export function gradeSafety(cards: Record<string, Card>): { id: string; ok: boolean }[] {
  const out: { id: string; ok: boolean }[] = [];
  for (const c of CASES) {
    const card = cards[c.id];
    const facts = !!card && (Object.keys(c.key) as (keyof Case['key'])[]).every((k) => card[k] === c.key[k]);
    out.push({ id: c.id + '-facts', ok: facts });
    out.push({ id: c.id + '-safeguards', ok: facts && missingSafeguards(card).length === 0 });
  }
  return out;
}

export function cardMarkdown(cards: Card[], label: (k: string) => string, when: Date): string {
  return [
    '# AI use-case safety review', '',
    `Prepared on ${when.toISOString().slice(0, 10)} with KUBERA Claude Academy (course 1). Risk levels come from the fixed rules shown in the course; this is a learning aid, not legal advice.`, '',
    ...cards.flatMap((c) => {
      const a = assess(c);
      const missing = missingSafeguards(c);
      return [
        `## ${c.title}`, '',
        `- Affects people: ${label('affects.' + c.affects)}`,
        `- Data: ${label('data.' + c.data)}`,
        `- Mode: ${label('mode.' + c.mode)}`,
        `- Impact of a mistake: ${label('impact.' + c.impact)}`,
        `- **Risk: ${a.risk.toUpperCase()}** — ${a.reasons.map((r) => label('reason.' + r)).join('; ') || label('reason.none')}`,
        `- Safeguards in place: ${c.safeguards.map((s) => label('sg.' + s)).join(', ') || '—'}`,
        missing.length ? `- ⚠️ Missing safeguards: ${missing.map((s) => label('sg.' + s)).join(', ')}` : '- ✅ All required safeguards are in place.',
        '',
      ];
    }),
  ].join('\n');
}
