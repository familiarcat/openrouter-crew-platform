import { categories } from '../../../lib/categories';
import { OpportunityMatrix } from '../../../components/Charts';
import Link from 'next/link';

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cat = categories.find(c => c.slug === slug);
  if (!cat) {
    return (
      <div className="card">
        <div className="badge risk">Missing category</div>
        <p className="small" style={{marginTop:10}}>No category found for <code>{slug}</code>.</p>
        <p><Link href="/categories">Back to Categories →</Link></p>
      </div>
    );
  }

  return (
    <div className="grid">
      <div className="card span-12">
        <div style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
          <div>
            <h1 style={{marginTop:0}}>{cat.name}</h1>
            <p className="small">{cat.tagline}</p>
          </div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'flex-start'}}>
            <span className="badge good">Demand {cat.scores.demand}/10</span>
            <span className="badge warn">Effort {cat.scores.effort}/10</span>
            <span className="badge risk">Risk {cat.scores.risk}/10</span>
          </div>
        </div>
        <p className="small" style={{marginTop:10}}><b>Opportunity:</b> {cat.opportunity}</p>
      </div>

      <div className="card span-6">
        <div className="small" style={{marginBottom:8}}>Infographic</div>
        <h2 style={{marginTop:0}}>Opportunity Matrix</h2>
        <p className="small">Higher demand is better; higher effort costs more to build/deliver.</p>
        <div className="card" style={{padding:12, background:'rgba(0,0,0,.15)'}}>
          <OpportunityMatrix demand={cat.scores.demand} effort={cat.scores.effort} />
        </div>
      </div>

      <div className="card span-6">
        <h2 style={{marginTop:0}}>Who buys it</h2>
        <ul className="small">
          {cat.buyers.map(b => <li key={b}>{b}</li>)}
        </ul>
        <h2>Monetization models</h2>
        <ul className="small">
          {cat.priceModels.map(m => <li key={m}>{m}</li>)}
        </ul>
        <h2>CTA</h2>
        <p className="small">Want to validate this lane quickly? Use <b>Ask</b> to explore positioning, then use <b>Create</b> to generate a spec and save it as a note.</p>
        <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
          <Link href="/ask">Go to Ask →</Link>
          <Link href="/create">Go to Create →</Link>
          <Link href={`/projects/new?category=${cat.slug}`}>New project (this category) →</Link>
        </div>
      </div>

      <div className="card span-12">
        <h2 style={{marginTop:0}}>Suggested Minimum Lovable Product</h2>
        <ul className="small">
          <li>Reference architecture + repo template</li>
          <li>Deployable environment (IaC)</li>
          <li>Measurable loop (baseline eval + tracing)</li>
          <li>Known failure modes + runbooks</li>
        </ul>
      </div>
    </div>
  );
}
