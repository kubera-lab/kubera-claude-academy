// Course 1 final project: AI Use-Case Safety Review (risk card by fixed rules).
import { useState } from 'react';
import type { Lang } from '../../content/types.ts';
import type { GradeResult } from '../../engine/grade.ts';
import { CASES, SAFEGUARDS, assess, cardMarkdown, emptyCard, gradeSafety, missingSafeguards, type Card } from '../../engine/tools/safety.ts';
import { downloadText } from '../download.ts';
import { COMMON, LabChecks, l, toGrade, tr, type L } from './common.tsx';

const T: Record<string, L> = {
  'affects.none': l('No one', 'Никого'), 'affects.minor': l('A little (easy to undo)', 'Немного (легко исправить)'), 'affects.significant': l('Significantly (home, job, health, money, rights)', 'Существенно (жильё, работа, здоровье, деньги, права)'),
  'data.none': l('No personal data', 'Нет персональных данных'), 'data.personal': l('Personal data (names, income, history)', 'Персональные данные (имена, доход, история)'), 'data.sensitive': l('Sensitive data (health, ethnicity, religion…)', 'Особые данные (здоровье, национальность, религия…)'),
  'mode.assist': l('AI only suggests; people work as before', 'ИИ только подсказывает; люди работают как раньше'), 'mode.human_approves': l('A person approves every result', 'Человек утверждает каждый результат'), 'mode.automatic': l('Fully automatic, no person checks', 'Полностью автоматически, без проверки человеком'),
  'impact.low': l('Low', 'Низкое'), 'impact.medium': l('Medium', 'Среднее'), 'impact.high': l('High (serious harm possible)', 'Высокое (возможен серьёзный вред)'),
  'reason.autoSignificant': l('automatic decision that significantly affects people', 'автоматическое решение, существенно влияющее на людей'),
  'reason.sensitive': l('sensitive personal data', 'особые персональные данные'),
  'reason.highImpact': l('a mistake can cause serious harm', 'ошибка может причинить серьёзный вред'),
  'reason.significantReviewed': l('significant effect on people, with a person deciding', 'существенное влияние на людей, решает человек'),
  'reason.personal': l('personal data', 'персональные данные'),
  'reason.someEffect': l('some effect on people', 'некоторое влияние на людей'),
  'reason.none': l('no risk factors from the rules', 'по правилам факторов риска нет'),
  'sg.human_review': l('A person reviews before any decision', 'Человек проверяет перед любым решением'),
  'sg.tell_users': l('People are told AI is used', 'Людям сообщают, что используется ИИ'),
  'sg.data_minimise': l('Only the data really needed is used', 'Используются только действительно нужные данные'),
  'sg.dp_check': l('Data protection check done (UK GDPR; ask the data protection lead)', 'Проверка защиты данных (UK GDPR; спросить ответственного)'),
  'sg.source_check': l('Facts are checked against sources', 'Факты сверяются с источниками'),
  'sg.fallback': l('People can reach a human or appeal', 'Можно обратиться к человеку или обжаловать'),
  'sg.log_decisions': l('Every AI result and decision is logged', 'Каждый результат ИИ и решение записываются'),
  'sg.test_before': l('Tested on real examples before use', 'Проверено на реальных примерах до запуска'),
};
const tl = (k: string, lang: Lang) => tr(T[k] ?? l(k, k), lang);

const LAB: Record<string, L> = Object.fromEntries(CASES.flatMap((c) => [
  [c.id + '-facts', l(`${c.title}: the card matches the story`, `${c.title}: карточка соответствует описанию`)],
  [c.id + '-safeguards', l(`${c.title}: every required safeguard is in place`, `${c.title}: все нужные меры защиты на месте`)],
]));

function Radio<K extends string>({ name, label, value, opts, onChange, lang }: { name: string; label: string; value: K; opts: K[]; onChange: (v: K) => void; lang: Lang }) {
  return (
    <fieldset className="qa">
      <legend>{label}</legend>
      <div className="chips" role="radiogroup">
        {opts.map((o) => (
          <label key={o} className="chip"><input type="radio" name={name} checked={value === o} onChange={() => onChange(o)} />{tl(name.split('-')[1] + '.' + o, lang)}</label>
        ))}
      </div>
    </fieldset>
  );
}

export interface SafetyAnswer { cards: Record<string, Card>; own: Card }

export default function SafetyTool({ lang, answer, onAnswer, onGraded }: { lang: Lang; answer: SafetyAnswer | null; onAnswer: (a: SafetyAnswer) => void; onGraded: (r: GradeResult) => void }) {
  const a: SafetyAnswer = answer ?? { cards: Object.fromEntries(CASES.map((c) => [c.id, emptyCard(c.title)])), own: emptyCard(lang === 'ru' ? 'Мой случай' : 'My use case') };
  const [msg, setMsg] = useState('');
  const set = (id: string, card: Card) => onAnswer(id === 'own' ? { ...a, own: card } : { ...a, cards: { ...a.cards, [id]: card } });
  const checks = gradeSafety(a.cards);
  const CardEditor = ({ id, card, story }: { id: string; card: Card; story?: L }) => {
    const r = assess(card);
    const miss = missingSafeguards(card);
    return (
      <section className="card subtle" data-testid={'card-' + id}>
        {id === 'own' ? (
          <div className="field"><label htmlFor={'own-title'}>{lang === 'ru' ? 'Название вашего случая' : 'Your use case'}</label><input id="own-title" value={card.title} onChange={(e) => set(id, { ...card, title: e.target.value })} /></div>
        ) : <h3>{card.title}</h3>}
        {story && <p className="example">{tr(story, lang)}</p>}
        <Radio name={id + '-affects'} label={lang === 'ru' ? 'Насколько затрагивает людей?' : 'How much does it affect people?'} value={card.affects} opts={['none', 'minor', 'significant']} onChange={(v) => set(id, { ...card, affects: v })} lang={lang} />
        <Radio name={id + '-data'} label={lang === 'ru' ? 'Какие данные используются?' : 'What data is used?'} value={card.data} opts={['none', 'personal', 'sensitive']} onChange={(v) => set(id, { ...card, data: v })} lang={lang} />
        <Radio name={id + '-mode'} label={lang === 'ru' ? 'Кто принимает решение?' : 'Who makes the decision?'} value={card.mode} opts={['assist', 'human_approves', 'automatic']} onChange={(v) => set(id, { ...card, mode: v })} lang={lang} />
        <Radio name={id + '-impact'} label={lang === 'ru' ? 'Насколько вредна ошибка?' : 'How harmful is a mistake?'} value={card.impact} opts={['low', 'medium', 'high']} onChange={(v) => set(id, { ...card, impact: v })} lang={lang} />
        <fieldset className="qa">
          <legend>{lang === 'ru' ? 'Какие меры защиты есть?' : 'Which safeguards are in place?'}</legend>
          {SAFEGUARDS.map((s) => (
            <label key={s} className="opt"><input type="checkbox" checked={card.safeguards.includes(s)} onChange={(e) => set(id, { ...card, safeguards: e.target.checked ? [...card.safeguards, s] : card.safeguards.filter((x) => x !== s) })} /><span>{tl('sg.' + s, lang)}</span></label>
          ))}
        </fieldset>
        <p className={'fbline ' + (r.risk === 'high' ? 'bad' : r.risk === 'medium' ? '' : 'good')} role="status">
          <b>{lang === 'ru' ? 'Риск по правилам' : 'Risk by the rules'}: {r.risk === 'high' ? (lang === 'ru' ? 'ВЫСОКИЙ' : 'HIGH') : r.risk === 'medium' ? (lang === 'ru' ? 'СРЕДНИЙ' : 'MEDIUM') : (lang === 'ru' ? 'НИЗКИЙ' : 'LOW')}</b>
          {' — '}{r.reasons.map((x) => tl('reason.' + x, lang)).join('; ') || tl('reason.none', lang)}
        </p>
        {miss.length > 0 ? <p className="fbline bad">{lang === 'ru' ? 'Не хватает мер: ' : 'Missing safeguards: '}{miss.map((s) => tl('sg.' + s, lang)).join('; ')}</p> : <p className="fbline good">{lang === 'ru' ? 'Все нужные меры на месте.' : 'All required safeguards are in place.'}</p>}
      </section>
    );
  };
  return (
    <div className="tool" data-testid="tool-safety">
      <p className="note small">{lang === 'ru' ? 'Учебный инструмент по фиксированным правилам курса. Это не юридическая оценка: для реальных проектов обращайтесь к специалисту по защите данных.' : 'A learning tool based on the course\'s fixed rules. It is not a legal assessment: for real projects ask a data protection specialist.'}</p>
      {CASES.map((c) => <CardEditor key={c.id} id={c.id} card={a.cards[c.id] ?? emptyCard(c.title)} story={c.story} />)}
      <h3>{lang === 'ru' ? 'Ваш собственный случай (не оценивается)' : 'Your own use case (not graded)'}</h3>
      <CardEditor id="own" card={a.own} />
      <div className="row">
        <button className="primary" onClick={() => { onAnswer(a); onGraded(toGrade(checks, a)); }}>{tr(COMMON.check, lang)}</button>
        <button onClick={() => setMsg(tr(downloadText('ai-safety-review.md', cardMarkdown([...CASES.map((c) => a.cards[c.id] ?? emptyCard(c.title)), a.own], (k) => tl(k, 'en'), new Date()), 'text/markdown') ? COMMON.exported : COMMON.exportFail, lang))}>{lang === 'ru' ? 'Скачать карточки .md' : 'Download cards .md'}</button>
      </div>
      <span className="small" aria-live="polite">{msg}</span>
      <h3>{tr(COMMON.labChecks, lang)}</h3>
      <LabChecks checks={checks} labels={LAB} lang={lang} />
    </div>
  );
}
