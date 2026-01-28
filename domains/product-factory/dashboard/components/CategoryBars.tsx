import Link from 'next/link';
import type { Category } from '../lib/categories';

export function CategoryBars({ c }: { c: Category }) {
  const items = [
    { k: 'Demand', v: c.scores.demand, cls: 'good' },
    { k: 'Effort', v: c.scores.effort, cls: 'warn' },
    { k: 'Monetize', v: c.scores.monetization, cls: 'good' },
    { k: 'Differentiate', v: c.scores.differentiation, cls: 'good' },
    { k: 'Risk', v: c.scores.risk, cls: 'risk' },
  ];

  return (
    <div className="catCard">
      <div className="catTop">
        <div>
          <div className="catName">{c.name}</div>
          <div className="small">{c.tagline}</div>
        </div>
        <div className="catActions">
          <Link className="btn" href={`/categories/${c.slug}`}>View</Link>
          <Link className="btnPrimary" href={`/projects/new?category=${encodeURIComponent(c.slug)}`}>New project</Link>
        </div>
      </div>

      <div className="barRow">
        {items.map((it) => (
          <div key={it.k} className="barItem">
            <div className="barLabel">{it.k}</div>
            <div className="barTrack" aria-label={`${it.k} ${it.v} out of 10`}>
              <div className={`barFill ${it.cls}`} style={{ width: `${Math.min(10, Math.max(0, it.v)) * 10}%` }} />
            </div>
            <div className={`barValue ${it.cls}`}>{it.v}/10</div>
          </div>
        ))}
      </div>
    </div>
  );
}
