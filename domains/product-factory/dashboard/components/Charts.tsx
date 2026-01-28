import { categories } from '../lib/categories';

function clamp(v: number, min=0, max=10){ return Math.max(min, Math.min(max, v)); }

export function ScorecardBars() {
  const metrics = [
    { key: 'demand', label: 'Market demand' },
    { key: 'effort', label: 'Build effort' },
    { key: 'monetization', label: 'Monetization' },
    { key: 'differentiation', label: 'Differentiation' },
    { key: 'risk', label: 'Risk' },
  ] as const;

  const w = 980, h = 420;
  const padL=80, padT=40, padR=30, padB=70;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;
  const groupW = chartW / metrics.length;
  const barW = Math.min(28, groupW / (categories.length + 1));
  const gap = 10;

  const palette = ['var(--accent2)','var(--accent1)','var(--accent3)','var(--accent4)'];

  const y = (v:number) => padT + chartH * (1 - clamp(v)/10);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="100%" role="img" aria-label="Category scorecard">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--accent1)" stopOpacity=".40" />
          <stop offset="1" stopColor="var(--accent2)" stopOpacity=".18" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width={w} height={h} rx="18" fill="url(#bg)" opacity=".25" />
      <line x1={padL} y1={padT} x2={padL} y2={padT+chartH} stroke="rgba(255,255,255,.28)" />
      <line x1={padL} y1={padT+chartH} x2={padL+chartW} y2={padT+chartH} stroke="rgba(255,255,255,.28)" />

      {Array.from({length:6}).map((_,i)=>{
        const v = i*2;
        const yy = y(v);
        return (
          <g key={i}>
            <line x1={padL} y1={yy} x2={padL+chartW} y2={yy} stroke="rgba(255,255,255,.10)" />
            <text x={padL-10} y={yy+4} fontSize="12" textAnchor="end" fill="rgba(255,255,255,.70)">{v}</text>
          </g>
        )
      })}

      {metrics.map((m, mi) => {
        const gx = padL + mi*groupW;
        return (
          <g key={m.key}>
            <text x={gx + groupW/2} y={padT+chartH+40} fontSize="12" textAnchor="middle" fill="rgba(255,255,255,.80)">{m.label}</text>
            {categories.map((c, ci) => {
              const val = (c.scores as any)[m.key] as number;
              const bx = gx + (ci+0.45)*(barW+gap);
              const by = y(val);
              const bh = padT+chartH - by;
              return (
                <rect key={c.slug} x={bx} y={by} width={barW} height={bh} rx="7"
                  fill={palette[ci % palette.length]} fillOpacity="0.90" stroke="rgba(255,255,255,.20)" />
              )
            })}
          </g>
        )
      })}

      {/* legend */}
      {categories.map((c, ci) => (
        <g key={c.slug}>
          <rect x={padL + ci*235} y={18} width="14" height="14" rx="4"
            fill={palette[ci % palette.length]} fillOpacity=".92" stroke="rgba(255,255,255,.22)" />
          <text x={padL + 20 + ci*235} y={30} fontSize="12" fill="rgba(255,255,255,.82)">{c.name}</text>
        </g>
      ))}
    </svg>
  );
}

export function OpportunityMatrix({ demand, effort }: { demand:number; effort:number }){
  const w=520, h=320, pad=42;
  const sx=(v:number)=> pad + (w-2*pad)*(clamp(v)/10);
  const sy=(v:number)=> pad + (h-2*pad)*(1 - clamp(v)/10);
  const x=sx(effort);
  const y=sy(demand);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="100%" role="img" aria-label="Opportunity matrix">
      <rect x="0" y="0" width={w} height={h} rx="18" fill="rgba(255,255,255,.03)" stroke="rgba(255,255,255,.12)" />
      <line x1={w/2} y1={pad} x2={w/2} y2={h-pad} stroke="rgba(255,255,255,.12)" />
      <line x1={pad} y1={h/2} x2={w-pad} y2={h/2} stroke="rgba(255,255,255,.12)" />
      <line x1={pad} y1={pad} x2={pad} y2={h-pad} stroke="rgba(255,255,255,.25)" />
      <line x1={pad} y1={h-pad} x2={w-pad} y2={h-pad} stroke="rgba(255,255,255,.25)" />
      <text x={pad} y={pad-12} fontSize="12" fill="rgba(255,255,255,.78)">Market demand ↑</text>
      <text x={w-pad} y={h-10} fontSize="12" textAnchor="end" fill="rgba(255,255,255,.78)">Build effort →</text>

      <circle cx={x} cy={y} r="9" fill="var(--good)" opacity=".95" />
      <circle cx={x} cy={y} r="18" fill="var(--good)" opacity=".12" />
      <text x={x+14} y={y+4} fontSize="12" fill="rgba(255,255,255,.88)">This category</text>
    </svg>
  )
}
