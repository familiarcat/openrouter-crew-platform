import Link from 'next/link';
import { ScorecardBars } from '../components/Charts';
import { categories } from '../lib/categories';
import { getPageTheme, getPageGradientStyle } from '@/lib/pageTheme';

export default function Home() {
  const theme = getPageTheme('home');
  
  return (
    <div className="grid">
      <div className="card span-12" style={getPageGradientStyle(theme, 'large')}>
        <h1 style={{ marginTop: 0, color: theme.accent }}>🏠 Home</h1>
        <p className="small">
          This app is the "product spine": a review-pack you can read, plus a working RAG endpoint and a safe self-learning loop
          (save structured notes → notes become searchable).
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
          <span className="badge good">Opportunity</span>
          <span className="badge warn">Tradeoffs</span>
          <span className="badge risk">Risk</span>
        </div>
      </div>

      <div className="card span-8" style={getPageGradientStyle(theme, 'medium')}>
        <div className="small" style={{ marginBottom: 8, color: theme.accent }}>Infographic</div>
        <h2 style={{ marginTop: 0, color: theme.accent }}>📊 Category Scorecard</h2>
        <div className="card" style={{ 
          padding: 12, 
          background: `${theme.accent}08`,
          border: `1px solid ${theme.accent}25`,
          borderRadius: 12
        }}>
          <ScorecardBars />
        </div>
      </div>

      <div className="card span-4" style={getPageGradientStyle(theme, 'small')}>
        <div className="small" style={{ marginBottom: 8, color: theme.accent }}>CTAs</div>
        <h2 style={{ marginTop: 0, color: theme.accent }}>🚀 Start here</h2>
        <p className="small"><b>1) Browse Categories</b><br/>Pick a monetization lane and see the cost/benefit analysis.</p>
        <p><Link href="/categories" style={{ color: theme.accent }}>Open Categories →</Link></p>
        <p className="small"><b>2) Try Ask</b><br/>See citations + trace.</p>
        <p><Link href="/ask" style={{ color: '#ff5c93' }}>Go to Ask →</Link></p>
        <p className="small"><b>3) Generate & Save</b><br/>Create structured artifacts and save them as notes.</p>
        <p><Link href="/create" style={{ color: '#00c2ff' }}>Go to Create →</Link></p>
        <p className="small"><b>4) Read the overview</b></p>
        <p><Link href="/docs/overview" style={{ color: '#0077b6' }}>Open Overview →</Link></p>
      </div>

      <div className="card span-12" style={getPageGradientStyle(theme, 'large')}>
        <h2 style={{ marginTop: 0, color: theme.accent }}>📂 All Categories</h2>
        <div className="grid">
          {categories.map(c => (
            <div 
              key={c.slug} 
              className="card span-6"
              style={{
                background: `linear-gradient(180deg, rgba(13,16,34,.9), rgba(11,15,29,.7)), radial-gradient(ellipse 400px 250px at 0% 0%, ${theme.accent}30 0%, transparent 60%)`,
                borderColor: `${theme.accent}30`
              }}
            >
              <h3 style={{ marginTop: 0 }}>{c.name}</h3>
              <p className="small">{c.tagline}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span className="badge good">Demand {c.scores.demand}/10</span>
                <span className="badge warn">Effort {c.scores.effort}/10</span>
                <span className="badge risk">Risk {c.scores.risk}/10</span>
              </div>
              <div style={{ marginTop: 10 }}>
                <Link href={`/categories/${c.slug}`} style={{ color: theme.accent }}>Open analysis →</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
