import { readFile } from 'fs/promises';
import path from 'path';
import { getPageTheme, getPageGradientStyle } from '@/lib/pageTheme';

async function loadJSON(name: string) {
  const p = path.join(process.cwd(), 'data', name);
  try {
    const t = await readFile(p, 'utf-8');
    return JSON.parse(t);
  } catch {
    return [];
  }
}

export default async function Diagnostics() {
  const events = await loadJSON('events.json');
  const feedback = await loadJSON('feedback.json');
  const theme = getPageTheme('diagnostics');
  
  return (
    <div className="grid">
      <div className="card span-12" style={getPageGradientStyle(theme, 'large')}>
        <h1 style={{ marginTop: 0, color: theme.accent }}>⚙️ Diagnostics</h1>
        <p className="small">Local JSON "event store" for demo purposes (upgrade to Postgres later).</p>
      </div>

      <div className="card span-6" style={getPageGradientStyle(theme, 'medium')}>
        <h2 style={{ marginTop: 0, color: theme.accent }}>📊 Recent Events</h2>
        <pre className="small" style={{ 
          background: `${theme.accent}10`, 
          padding: 12, 
          borderRadius: 8,
          border: `1px solid ${theme.accent}30`,
          overflow: 'auto',
          maxHeight: 400
        }}>
          {JSON.stringify(events.slice(-25).reverse(), null, 2)}
        </pre>
      </div>

      <div className="card span-6" style={getPageGradientStyle(theme, 'medium')}>
        <h2 style={{ marginTop: 0, color: theme.accent }}>💬 Recent Feedback</h2>
        <pre className="small" style={{ 
          background: `${theme.accent}10`, 
          padding: 12, 
          borderRadius: 8,
          border: `1px solid ${theme.accent}30`,
          overflow: 'auto',
          maxHeight: 400
        }}>
          {JSON.stringify(feedback.slice(-25).reverse(), null, 2)}
        </pre>
      </div>
    </div>
  );
}
