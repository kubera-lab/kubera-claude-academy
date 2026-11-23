import type { Course, Lang } from '../content/types.ts';
import { tx } from '../content/types.ts';

/** Key terms of a course for absolute beginners (EN/RU). */
export function Glossary({ items, lang }: { items: Course['glossary']; lang: Lang }) {
  if (!items?.length) return null;
  return (
    <details className="card subtle" data-testid="glossary">
      <summary><b>{lang === 'ru' ? `Словарь терминов (${items.length})` : `Glossary (${items.length} terms)`}</b></summary>
      <dl className="glossary">
        {items.map((g) => (
          <div key={g.term.en} style={{ display: 'contents' }}>
            <dt>{tx(g.term, lang)}{lang === 'ru' && g.term.ru !== g.term.en ? <span className="small muted"> · {g.term.en}</span> : null}</dt>
            <dd>{tx(g.def, lang)}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
