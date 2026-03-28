import { getPageTheme, getPageGradientStyle } from '@/lib/pageTheme';

export default function EnvPage() {
  const keys = ['N8N_WEBHOOK_URL', 'N8N_PROJECT_WEBHOOK_URL'] as const;
  const theme = getPageTheme('env');
  
  return (
    <div className="grid">
      <div className="card span-12" style={getPageGradientStyle(theme, 'large')}>
        <h1 style={{ marginTop: 0, color: theme.accent }}>⚙️ Environment</h1>
        <p className="small">
          Next.js reads <code>.env.local</code> at startup. If you change env vars, you must restart <code>npm run dev</code>.
        </p>
        <div className="card" style={{ 
          padding: 16, 
          background: `${theme.accent}08`,
          border: `1px solid ${theme.accent}30`,
          borderRadius: 12
        }}>
          {keys.map(k => (
            <div 
              key={k} 
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                padding: '12px 0',
                borderBottom: `1px solid ${theme.accent}20`
              }}
            >
              <div style={{ 
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New',
                color: theme.accent
              }}>
                {k}
              </div>
              <div className={process.env[k] ? 'badge good' : 'badge risk'}>
                {process.env[k] ? '✓ set' : '✗ missing'}
              </div>
            </div>
          ))}
          <div className="small" style={{ marginTop: 14, opacity: 0.8 }}>
            💡 Tip: create <code>.env.local</code> from <code>.env.local.example</code>.
          </div>
        </div>
      </div>
    </div>
  );
}
