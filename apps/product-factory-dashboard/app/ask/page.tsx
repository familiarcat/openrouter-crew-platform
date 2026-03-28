'use client';
import { useState } from 'react';

// Magenta theme for Ask page (per Senior Staff Color Theory)
const theme = {
  accent: '#ff5c93',
  glow: 'rgba(255,92,147,.50)',
};

const cardStyle = (size: 'large' | 'medium' | 'small' = 'medium') => {
  const ellipseSizes = { large: '900px 450px', medium: '600px 350px', small: '400px 300px' };
  return {
    background: `linear-gradient(180deg, rgba(13,16,34,.88), rgba(11,15,29,.62)), radial-gradient(ellipse ${ellipseSizes[size]} at 0% 0%, ${theme.glow} 0%, transparent 60%)`,
    borderColor: `${theme.accent}50`,
  };
};

export default function AskPage() {
  const [q, setQ] = useState('What is the fastest path to monetization?');
  const [res, setRes] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function ask() {
    setLoading(true);
    setRes(null);
    const r = await fetch('/api/ask', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ question: q })});
    const j = await r.json();
    setRes(j);
    setLoading(false);
  }

  async function sendFeedback(helpful: boolean) {
    await fetch('/api/feedback', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ question:q, answer: res?.answer, helpful, citations: res?.citations })});
    alert('Saved feedback.');
  }

  return (
    <div className="grid">
      <div className="card span-12" style={cardStyle('large')}>
        <h1 style={{ marginTop: 0, color: theme.accent }}>💬 Ask</h1>
        <p className="small">Uses local TF‑IDF retrieval against <code>content/</code> and user notes.</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
          <input 
            value={q} 
            onChange={e => setQ(e.target.value)} 
            style={{
              flex: 1,
              minWidth: 260,
              padding: 12,
              borderRadius: 12,
              border: `1px solid ${theme.accent}40`,
              background: `${theme.accent}10`,
              color: 'var(--text)'
            }}
          />
          <button 
            onClick={ask} 
            disabled={loading} 
            style={{
              padding: '12px 20px',
              borderRadius: 12,
              border: `1px solid ${theme.accent}60`,
              background: `${theme.accent}20`,
              color: theme.accent,
              fontWeight: 600,
              cursor: loading ? 'wait' : 'pointer'
            }}
          >
            {loading ? 'Asking…' : '🚀 Ask'}
          </button>
        </div>
      </div>

      {res && (
        <>
          <div className="card span-8" style={cardStyle('medium')}>
            <h2 style={{ marginTop: 0, color: theme.accent }}>📝 Answer</h2>
            <p className="small" style={{ lineHeight: 1.6 }}>{res.answer}</p>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button 
                onClick={() => sendFeedback(true)} 
                style={{
                  padding: '10px 16px',
                  borderRadius: 12,
                  border: '1px solid rgba(40,217,154,.45)',
                  background: 'rgba(40,217,154,.15)',
                  color: 'var(--ok)',
                  fontWeight: 500
                }}
              >
                ✅ Helpful
              </button>
              <button 
                onClick={() => sendFeedback(false)} 
                style={{
                  padding: '10px 16px',
                  borderRadius: 12,
                  border: `1px solid ${theme.accent}45`,
                  background: `${theme.accent}15`,
                  color: theme.accent,
                  fontWeight: 500
                }}
              >
                ❌ Not helpful
              </button>
            </div>
          </div>
          <div className="card span-4" style={cardStyle('small')}>
            <h2 style={{ marginTop: 0, color: theme.accent }}>📚 Citations</h2>
            <ol className="small" style={{ paddingLeft: 20 }}>
              {(res.citations || []).map((c: any, i: number) => (
                <li key={i} style={{ marginBottom: 12, borderLeft: `2px solid ${theme.accent}40`, paddingLeft: 10 }}>
                  <b style={{ color: theme.accent }}>{c.source}</b>
                  <br />
                  <span style={{ opacity: 0.8 }}>{c.snippet}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="card span-12" style={cardStyle('large')}>
            <h2 style={{ marginTop: 0, color: theme.accent }}>🔍 Trace</h2>
            <pre className="small" style={{ 
              background: `${theme.accent}10`, 
              padding: 12, 
              borderRadius: 8,
              border: `1px solid ${theme.accent}30`,
              overflow: 'auto'
            }}>
              {JSON.stringify(res.trace, null, 2)}
            </pre>
          </div>
        </>
      )}
    </div>
  );
}
