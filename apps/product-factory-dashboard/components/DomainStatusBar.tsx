'use client';

import { ProjectDomain, DomainScores, getScoreColor, getScoreLabel } from '../lib/projects';

interface DomainStatusBarProps {
  domains: ProjectDomain[];
  showLabels?: boolean;
  height?: number;
}

/**
 * Horizontal bar showing all domains with their progress
 * LCARS-inspired segmented display
 */
export function DomainStatusBar({ domains, showLabels = true, height = 32 }: DomainStatusBarProps) {
  if (domains.length === 0) {
    return (
      <div style={{
        height,
        background: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--muted)',
        fontSize: 12,
      }}>
        No domains defined
      </div>
    );
  }

  const statusColors = {
    'planned': '#6b7280',
    'in-progress': '#3b82f6',
    'completed': '#10b981',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Segmented Bar */}
      <div style={{
        display: 'flex',
        height,
        borderRadius: 8,
        overflow: 'hidden',
        background: 'rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
        {domains.map((domain, i) => (
          <div
            key={domain.slug}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              borderRight: i < domains.length - 1 ? '2px solid rgba(0,0,0,0.5)' : 'none',
            }}
          >
            {/* Progress Fill */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: `${domain.progress}%`,
              background: `linear-gradient(180deg, ${statusColors[domain.status]}cc, ${statusColors[domain.status]}50)`,
              transition: 'height 0.3s ease',
            }} />
            
            {/* Domain Label */}
            {showLabels && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: 10,
                fontWeight: 600,
                color: 'white',
                textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '90%',
                textAlign: 'center',
              }}>
                {domain.progress}%
              </div>
            )}
            
            {/* Status Indicator Dot */}
            <div style={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: statusColors[domain.status],
              boxShadow: `0 0 4px ${statusColors[domain.status]}`,
            }} />
          </div>
        ))}
      </div>
      
      {/* Legend */}
      {showLabels && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 10,
          color: 'var(--muted)',
        }}>
          {domains.map(domain => (
            <div 
              key={domain.slug} 
              style={{ 
                flex: 1, 
                textAlign: 'center',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                padding: '0 2px',
              }}
            >
              {domain.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface ScoreBarProps {
  scores: DomainScores;
  compact?: boolean;
}

/**
 * Horizontal bars showing all score dimensions
 */
export function ScoreBar({ scores, compact = false }: ScoreBarProps) {
  const dimensions = [
    { key: 'demand', label: 'Demand', icon: '📈', description: 'Market need' },
    { key: 'effort', label: 'Effort', icon: '💪', description: 'Build complexity' },
    { key: 'monetization', label: 'Revenue', icon: '💰', description: 'Revenue potential' },
    { key: 'differentiation', label: 'Unique', icon: '✨', description: 'Competitive edge' },
    { key: 'risk', label: 'Risk', icon: '⚠️', description: 'Uncertainty' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 6 : 10 }}>
      {dimensions.map(({ key, label, icon, description }) => {
        const value = scores[key as keyof DomainScores];
        const color = getScoreColor(value);
        
        return (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Label */}
            <div style={{ 
              width: compact ? 70 : 100, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 6,
              fontSize: compact ? 11 : 12,
            }}>
              <span>{icon}</span>
              <span style={{ color: 'var(--muted)' }}>{label}</span>
            </div>
            
            {/* Bar Container */}
            <div style={{ 
              flex: 1, 
              height: compact ? 12 : 16,
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 4,
              overflow: 'hidden',
              position: 'relative',
            }}>
              {/* Fill */}
              <div style={{
                width: `${value * 10}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${color}99, ${color})`,
                borderRadius: 4,
                transition: 'width 0.3s ease',
              }} />
              
              {/* Value Label */}
              <div style={{
                position: 'absolute',
                top: '50%',
                right: 8,
                transform: 'translateY(-50%)',
                fontSize: compact ? 9 : 10,
                fontWeight: 600,
                color: value >= 5 ? 'white' : color,
                textShadow: value >= 5 ? '0 1px 2px rgba(0,0,0,0.5)' : 'none',
              }}>
                {value}/10
              </div>
            </div>
            
            {/* Score Label */}
            {!compact && (
              <div style={{ 
                width: 60, 
                fontSize: 10, 
                color,
                fontWeight: 500,
              }}>
                {getScoreLabel(value)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface DomainProgressListProps {
  domains: ProjectDomain[];
  onDomainClick?: (domain: ProjectDomain) => void;
}

/**
 * List of domains with horizontal progress bars and scores
 */
export function DomainProgressList({ domains, onDomainClick }: DomainProgressListProps) {
  const statusColors = {
    'planned': { bg: '#6b728020', text: '#6b7280', label: 'Planned' },
    'in-progress': { bg: '#3b82f620', text: '#3b82f6', label: 'In Progress' },
    'completed': { bg: '#10b98120', text: '#10b981', label: 'Complete' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {domains.map((domain, index) => {
        const status = statusColors[domain.status];
        const avgScore = Math.round(
          (domain.scores.demand + domain.scores.effort + domain.scores.monetization + 
           domain.scores.differentiation + domain.scores.risk) / 5
        );
        
        return (
          <div
            key={domain.slug}
            onClick={() => onDomainClick?.(domain)}
            style={{
              background: 'rgba(0,0,0,0.2)',
              borderRadius: 12,
              padding: 16,
              cursor: onDomainClick ? 'pointer' : 'default',
              border: '1px solid rgba(255,255,255,0.05)',
              transition: 'all 0.2s',
            }}
          >
            {/* Header Row */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: `linear-gradient(135deg, ${getScoreColor(avgScore)}, ${getScoreColor(domain.scores.demand)})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'white',
                }}>
                  {index + 1}
                </span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{domain.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                    {domain.description}
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Status Badge */}
                <span style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 10,
                  fontWeight: 600,
                  background: status.bg,
                  color: status.text,
                }}>
                  {status.label}
                </span>
                
                {/* Progress Percentage */}
                <div style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: getScoreColor(domain.progress / 10),
                }}>
                  {domain.progress}%
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div style={{
              height: 8,
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 4,
              overflow: 'hidden',
              marginBottom: 12,
            }}>
              <div style={{
                width: `${domain.progress}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${status.text}, ${getScoreColor(avgScore)})`,
                borderRadius: 4,
                transition: 'width 0.3s ease',
              }} />
            </div>
            
            {/* Mini Score Bars */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(5, 1fr)', 
              gap: 8,
            }}>
              {[
                { key: 'demand', label: 'DEM', icon: '📈' },
                { key: 'effort', label: 'EFF', icon: '💪' },
                { key: 'monetization', label: 'REV', icon: '💰' },
                { key: 'differentiation', label: 'UNQ', icon: '✨' },
                { key: 'risk', label: 'RSK', icon: '⚠️' },
              ].map(({ key, label, icon }) => {
                const value = domain.scores[key as keyof DomainScores];
                const color = getScoreColor(value);
                
                return (
                  <div key={key} style={{ textAlign: 'center' }}>
                    <div style={{ 
                      fontSize: 9, 
                      color: 'var(--muted)', 
                      marginBottom: 4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 2,
                    }}>
                      <span style={{ fontSize: 10 }}>{icon}</span>
                      <span>{label}</span>
                    </div>
                    <div style={{
                      height: 6,
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: 3,
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${value * 10}%`,
                        height: '100%',
                        background: color,
                        borderRadius: 3,
                      }} />
                    </div>
                    <div style={{ 
                      fontSize: 11, 
                      fontWeight: 600, 
                      color,
                      marginTop: 2,
                    }}>
                      {value}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Features (if any) */}
            {domain.features.length > 0 && (
              <div style={{ 
                marginTop: 12, 
                paddingTop: 12, 
                borderTop: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 4,
              }}>
                {domain.features.slice(0, 5).map((f, i) => (
                  <span key={i} style={{
                    padding: '2px 8px',
                    background: 'rgba(124, 92, 255, 0.15)',
                    borderRadius: 4,
                    fontSize: 10,
                    color: '#a78bfa',
                  }}>
                    {f}
                  </span>
                ))}
                {domain.features.length > 5 && (
                  <span style={{
                    padding: '2px 8px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: 4,
                    fontSize: 10,
                    color: 'var(--muted)',
                  }}>
                    +{domain.features.length - 5} more
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface DomainSummaryStripProps {
  domains: ProjectDomain[];
}

/**
 * Compact horizontal strip showing domain status overview
 * Perfect for cards and headers
 */
export function DomainSummaryStrip({ domains }: DomainSummaryStripProps) {
  if (domains.length === 0) return null;
  
  const completed = domains.filter(d => d.status === 'completed').length;
  const inProgress = domains.filter(d => d.status === 'in-progress').length;
  const planned = domains.filter(d => d.status === 'planned').length;
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {/* Visual Bar */}
      <div style={{
        display: 'flex',
        height: 8,
        flex: 1,
        borderRadius: 4,
        overflow: 'hidden',
        background: 'rgba(0,0,0,0.2)',
      }}>
        {completed > 0 && (
          <div style={{
            width: `${(completed / domains.length) * 100}%`,
            background: '#10b981',
          }} />
        )}
        {inProgress > 0 && (
          <div style={{
            width: `${(inProgress / domains.length) * 100}%`,
            background: '#3b82f6',
          }} />
        )}
        {planned > 0 && (
          <div style={{
            width: `${(planned / domains.length) * 100}%`,
            background: '#6b7280',
          }} />
        )}
      </div>
      
      {/* Stats */}
      <div style={{ 
        display: 'flex', 
        gap: 8, 
        fontSize: 10,
        flexShrink: 0,
      }}>
        {completed > 0 && (
          <span style={{ color: '#10b981' }}>✓ {completed}</span>
        )}
        {inProgress > 0 && (
          <span style={{ color: '#3b82f6' }}>● {inProgress}</span>
        )}
        {planned > 0 && (
          <span style={{ color: '#6b7280' }}>○ {planned}</span>
        )}
      </div>
    </div>
  );
}





