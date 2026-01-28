import Link from 'next/link';
import { redirect } from 'next/navigation';
import { categories } from '../../lib/categories';
import { CategoryBars } from '../../components/CategoryBars';
import { FACTORY_PROJECT_ID } from '../../lib/projects';

export default function CategoriesPage() {
  return (
    <div className="grid">
      <div className="card span-12" style={{
        background: 'linear-gradient(135deg, var(--surface) 0%, rgba(16, 185, 129, 0.1) 100%)',
        borderLeft: '4px solid #10b981',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 32 }}>🏭</span>
          <div>
            <h1 style={{margin: 0}}>Factory Domains</h1>
            <p className="small" style={{ margin: '4px 0 0', color: 'var(--muted)' }}>
              Core categories that define project templates
            </p>
          </div>
        </div>
        
        <p className="small" style={{ marginTop: 12 }}>
          Each category is a <strong>domain template</strong> that projects can inherit. 
          These define the monetization lanes, cost/benefit profiles, and buyer personas 
          for generated projects.
        </p>
        
        <div style={{display:'flex', gap:10, flexWrap:'wrap', marginTop: 16}}>
          <Link className="btnPrimary" href="/create">🚀 Create New Project →</Link>
          <Link className="btn" href={`/projects/${FACTORY_PROJECT_ID}/domains`}>📊 Factory Dashboard →</Link>
          <Link className="btn" href="/portfolio">🌳 Portfolio View →</Link>
        </div>
      </div>

      {/* Category Cards */}
      <div className="span-12">
        <div style={{ display: 'grid', gap: 16 }}>
          {categories.map((c, idx) => (
            <div key={c.slug} className="card" style={{
              borderLeft: `4px solid var(--accent)`,
              background: 'linear-gradient(135deg, var(--surface) 0%, rgba(59, 130, 246, 0.05) 100%)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ 
                      width: 24, 
                      height: 24, 
                      borderRadius: '50%', 
                      background: 'var(--accent)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 'bold',
                    }}>
                      {idx + 1}
                    </span>
                    <h3 style={{ margin: 0, fontSize: 16 }}>{c.name}</h3>
                  </div>
                  <p className="small" style={{ margin: 0, color: 'var(--muted)' }}>{c.tagline}</p>
                </div>
                <Link 
                  href={`/categories/${c.slug}`}
                  style={{
                    padding: '6px 12px',
                    background: 'var(--accent)',
                    borderRadius: 6,
                    fontSize: 12,
                    color: 'white',
                    textDecoration: 'none',
                  }}
                >
                  Details →
                </Link>
              </div>
              
              <CategoryBars c={c} />
              
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>Target Buyers</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {c.buyers.map((b, i) => (
                    <span key={i} style={{
                      padding: '3px 8px',
                      background: 'var(--surface)',
                      borderRadius: 4,
                      fontSize: 11,
                      border: '1px solid var(--border)',
                    }}>
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hierarchy Info */}
      <div className="card span-12" style={{ 
        background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.1) 0%, var(--surface) 100%)',
        borderLeft: '3px solid #a78bfa',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ fontSize: 32 }}>🌳</div>
          <div>
            <h3 style={{ margin: 0, color: '#a78bfa' }}>Domain Hierarchy</h3>
            <p className="small" style={{ margin: '8px 0 0', color: 'var(--muted)' }}>
              <strong>Factory → Projects → Domains</strong>
              <br />
              The factory&apos;s categories become domain templates for generated projects. 
              Each project can customize its domains while inheriting the scoring framework. 
              Progress rolls up from domains → projects → factory.
            </p>
            <div style={{ marginTop: 12 }}>
              <Link 
                href="/portfolio"
                style={{
                  padding: '8px 16px',
                  background: '#a78bfa',
                  borderRadius: 6,
                  fontSize: 12,
                  color: 'white',
                  textDecoration: 'none',
                }}
              >
                View Full Portfolio Hierarchy →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
