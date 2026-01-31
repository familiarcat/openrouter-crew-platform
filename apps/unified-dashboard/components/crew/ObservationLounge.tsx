'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { CrewMemberData } from './CrewCard';

interface Discussion {
  id: string;
  topic: string;
  urgency: 'low' | 'normal' | 'high' | 'critical';
  attendees: string[];
  status: 'pending' | 'in_progress' | 'completed';
  contributions: {
    crewId: string;
    crewName: string;
    emoji: string;
    recommendation: string;
  }[];
  consensus?: string;
  actionItems: {
    task: string;
    assignee: string;
    priority: string;
  }[];
  timestamp: string;
}

interface ObservationLoungeProps {
  crew: CrewMemberData[];
  discussions?: Discussion[];
}

// Uniform colors for division theming
const uniformColors: Record<string, string> = {
  red: '#c41e3a',
  gold: '#c9a227',
  blue: '#0077b6',
  brown: '#8b7355',
};

// Purple theme for Observation Lounge
const theme = {
  accent: '#7c5cff',
  glow: 'rgba(124,92,255,.50)',
};

const cardStyle = (size: 'large' | 'medium' | 'small' = 'medium') => {
  const ellipseSizes = { large: '900px 450px', medium: '600px 350px', small: '400px 300px' };
  return {
    background: `linear-gradient(180deg, rgba(13,16,34,.88), rgba(11,15,29,.62)), radial-gradient(ellipse ${ellipseSizes[size]} at 0% 0%, ${theme.glow} 0%, transparent 60%)`,
    borderColor: `${theme.accent}50`,
  };
};

export function ObservationLounge({ crew, discussions = [] }: ObservationLoungeProps) {
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedCrew, setSelectedCrew] = useState<string[]>([]);

  const urgencyColors = {
    low: 'var(--muted)',
    normal: 'var(--good)',
    high: 'var(--warn)',
    critical: 'var(--risk)',
  };

  const getCrewDivisionColor = (crewMember: CrewMemberData) => {
    return uniformColors[crewMember.uniformColor || 'gold'] || uniformColors.gold;
  };

  return (
    <div className="grid">
      {/* Header */}
      <div className="card span-12" style={cardStyle('large')}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ marginTop: 0, color: theme.accent }}>🖖 Observation Lounge</h1>
            <p className="small">Collaborative crew discussions for complex problem-solving</p>
          </div>
          <Link href="/" className="btnPrimary">👥 Dashboard</Link>
        </div>
      </div>

      {/* Crew Concerns Overview */}
      <div className="card span-12" style={cardStyle('medium')}>
        <h2 style={{ marginTop: 0, color: theme.accent }}>⚠️ Current Crew Concerns</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {crew.filter(c => c.worries && c.worries.length > 0).map(c => {
            const divColor = getCrewDivisionColor(c);
            return (
              <div 
                key={c.id} 
                style={{
                  display: 'flex',
                  gap: 12,
                  padding: 12,
                  borderRadius: 12,
                  background: `linear-gradient(180deg, rgba(13,16,34,.9), rgba(11,15,29,.7)), radial-gradient(ellipse 250px 150px at 0% 0%, ${divColor}40 0%, transparent 70%)`,
                  border: `1px solid ${divColor}40`
                }}
              >
                <Link href={`/crew/${c.id}`} style={{ flexShrink: 0 }}>
                  <div style={{ 
                    position: 'relative', 
                    width: 48, 
                    height: 48, 
                    borderRadius: 10, 
                    overflow: 'hidden',
                    border: `2px solid ${divColor}60`
                  }}>
                    <Image 
                      src={`/crew-avatars/${c.id}.jpg`}
                      alt={c.name}
                      fill
                      sizes="48px"
                      className="avatarImage"
                    />
                  </div>
                </Link>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: divColor, marginBottom: 4 }}>
                    {c.callName || c.name}
                  </div>
                  <div className="small" style={{ opacity: 0.8 }}>
                    {c.worries?.slice(0, 2).map((w, i) => (
                      <div key={i} style={{ 
                        padding: '2px 0',
                        borderLeft: `2px solid ${divColor}60`,
                        paddingLeft: 8,
                        marginBottom: 4
                      }}>
                        {w}
                      </div>
                    ))}
                    {(c.worries?.length || 0) > 2 && (
                      <div style={{ opacity: 0.6, fontSize: 11 }}>+{(c.worries?.length || 0) - 2} more concerns</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Convene New Discussion */}
      <div className="card span-8" style={cardStyle('medium')}>
        <h2 style={{ marginTop: 0, color: theme.accent }}>📋 Convene Discussion</h2>
        <div style={{ marginBottom: 16 }}>
          <input
            type="text"
            placeholder="Enter discussion topic..."
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            style={{
              width: '100%',
              padding: 12,
              borderRadius: 12,
              border: `1px solid ${theme.accent}40`,
              background: `${theme.accent}10`,
              color: 'var(--text)',
              fontSize: 14
            }}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <div className="small" style={{ marginBottom: 8, color: theme.accent }}>Select Attendees:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {crew.map(c => {
              const isSelected = selectedCrew.includes(c.id);
              const divColor = getCrewDivisionColor(c);
              return (
                <label 
                  key={c.id} 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    borderRadius: 10,
                    cursor: 'pointer',
                    background: isSelected ? `${divColor}25` : 'rgba(255,255,255,.05)',
                    border: `1px solid ${isSelected ? divColor : 'rgba(255,255,255,.1)'}`,
                    transition: 'all 0.2s'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCrew([...selectedCrew, c.id]);
                      } else {
                        setSelectedCrew(selectedCrew.filter(id => id !== c.id));
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                  <div style={{ 
                    position: 'relative', 
                    width: 28, 
                    height: 28, 
                    borderRadius: 6, 
                    overflow: 'hidden',
                    border: `2px solid ${isSelected ? divColor : 'transparent'}`
                  }}>
                    <Image 
                      src={`/crew-avatars/${c.id}.jpg`}
                      alt={c.name}
                      fill
                      sizes="28px"
                      className="avatarImage"
                    />
                  </div>
                  <span style={{ 
                    fontSize: 12, 
                    color: isSelected ? divColor : 'var(--text)',
                    fontWeight: isSelected ? 600 : 400
                  }}>
                    {c.callName || c.name.split(' ').pop()}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
        <button 
          disabled={!selectedTopic || selectedCrew.length === 0}
          style={{
            padding: '12px 20px',
            borderRadius: 12,
            border: `1px solid ${theme.accent}60`,
            background: selectedTopic && selectedCrew.length > 0 ? `${theme.accent}30` : 'rgba(255,255,255,.05)',
            color: selectedTopic && selectedCrew.length > 0 ? theme.accent : 'var(--muted)',
            fontWeight: 600,
            cursor: selectedTopic && selectedCrew.length > 0 ? 'pointer' : 'not-allowed'
          }}
        >
          🖖 Convene Senior Staff
        </button>
      </div>

      {/* Crew Status Sidebar */}
      <div className="card span-4" style={cardStyle('small')}>
        <h2 style={{ marginTop: 0, color: theme.accent }}>👥 Crew Status</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {crew.map(c => {
            const divColor = getCrewDivisionColor(c);
            return (
              <Link 
                key={c.id} 
                href={`/crew/${c.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 10px',
                  borderRadius: 8,
                  background: `${divColor}10`,
                  border: `1px solid ${divColor}25`,
                  textDecoration: 'none',
                  color: 'var(--text)'
                }}
              >
                <div style={{ 
                  position: 'relative', 
                  width: 32, 
                  height: 32, 
                  borderRadius: 8, 
                  overflow: 'hidden',
                  border: `2px solid ${divColor}50`
                }}>
                  <Image 
                    src={`/crew-avatars/${c.id}.jpg`}
                    alt={c.name}
                    fill
                    sizes="32px"
                    className="avatarImage"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: divColor }}>
                    {c.callName || c.name.split(' ').pop()}
                  </div>
                  <div style={{ fontSize: 10, opacity: 0.7 }}>{c.role}</div>
                </div>
                <div 
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: c.status === 'active' ? 'var(--good)' : 
                               c.status === 'busy' ? 'var(--warn)' : 'var(--muted)'
                  }}
                />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Discussions */}
      {discussions.length > 0 && (
        <div className="card span-12" style={cardStyle('large')}>
          <h2 style={{ marginTop: 0, color: theme.accent }}>📝 Recent Discussions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {discussions.map(d => (
              <div 
                key={d.id} 
                style={{
                  padding: 16,
                  borderRadius: 12,
                  background: 'rgba(0,0,0,.2)',
                  border: `1px solid ${urgencyColors[d.urgency]}30`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <span 
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      background: `${urgencyColors[d.urgency]}20`,
                      color: urgencyColors[d.urgency]
                    }}
                  >
                    {d.urgency}
                  </span>
                  <span style={{ fontWeight: 600, flex: 1 }}>{d.topic}</span>
                  <span className="small" style={{ opacity: 0.6 }}>
                    {new Date(d.timestamp).toLocaleDateString()}
                  </span>
                </div>
                
                {/* Attendees with avatars */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                  {d.attendees.map(id => {
                    const member = crew.find(c => c.id === id);
                    if (!member) return null;
                    const divColor = getCrewDivisionColor(member);
                    return (
                      <Link 
                        key={id} 
                        href={`/crew/${id}`}
                        title={member.name}
                        style={{
                          position: 'relative',
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          overflow: 'hidden',
                          border: `2px solid ${divColor}60`
                        }}
                      >
                        <Image 
                          src={`/crew-avatars/${id}.jpg`}
                          alt={member.name}
                          fill
                          sizes="36px"
                          className="avatarImage"
                        />
                      </Link>
                    );
                  })}
                </div>

                {/* Contributions with avatars */}
                {d.contributions.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                    {d.contributions.map((c, i) => {
                      const member = crew.find(m => m.id === c.crewId);
                      const divColor = member ? getCrewDivisionColor(member) : theme.accent;
                      return (
                        <div 
                          key={i} 
                          style={{
                            display: 'flex',
                            gap: 10,
                            padding: '8px 12px',
                            borderRadius: 8,
                            background: `${divColor}10`,
                            borderLeft: `3px solid ${divColor}`
                          }}
                        >
                          {member && (
                            <Link href={`/crew/${c.crewId}`} style={{ flexShrink: 0 }}>
                              <div style={{ 
                                position: 'relative', 
                                width: 28, 
                                height: 28, 
                                borderRadius: 6, 
                                overflow: 'hidden',
                                border: `1px solid ${divColor}50`
                              }}>
                                <Image 
                                  src={`/crew-avatars/${c.crewId}.jpg`}
                                  alt={c.crewName}
                                  fill
                                  sizes="28px"
                                  className="avatarImage"
                                />
                              </div>
                            </Link>
                          )}
                          <div style={{ flex: 1 }}>
                            <span style={{ fontWeight: 600, color: divColor, fontSize: 12 }}>
                              {member?.callName || c.crewName.split(' ').pop()}:
                            </span>
                            <span className="small" style={{ marginLeft: 6 }}>{c.recommendation}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {d.consensus && (
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'rgba(40,217,154,.1)',
                    border: '1px solid rgba(40,217,154,.3)',
                    marginBottom: 12
                  }}>
                    <span style={{ color: 'var(--ok)', fontWeight: 600 }}>✅ Consensus:</span>
                    <span className="small" style={{ marginLeft: 8 }}>{d.consensus}</span>
                  </div>
                )}

                {d.actionItems.length > 0 && (
                  <div>
                    <div className="small" style={{ fontWeight: 600, marginBottom: 6, opacity: 0.7 }}>
                      Action Items:
                    </div>
                    {d.actionItems.map((a, i) => (
                      <div 
                        key={i} 
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '6px 0',
                          borderBottom: '1px solid rgba(255,255,255,.08)'
                        }}
                      >
                        <span className="small">{a.task}</span>
                        <span className="small" style={{ color: theme.accent }}>→ {a.assignee}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Discussion Protocol */}
      <div className="card span-12" style={cardStyle('medium')}>
        <h2 style={{ marginTop: 0, color: theme.accent }}>📜 Discussion Protocol</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {[
            { step: 1, text: 'Captain chairs the meeting', icon: '👨‍✈️' },
            { step: 2, text: 'Topic experts speak first', icon: '🎯' },
            { step: 3, text: 'Each crew contributes expertise', icon: '💡' },
            { step: 4, text: 'Counselor monitors dynamics', icon: '💜' },
            { step: 5, text: 'Riker summarizes actions', icon: '🎺' },
            { step: 6, text: 'Captain makes final decision', icon: '⚖️' },
          ].map(p => (
            <div 
              key={p.step}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                borderRadius: 10,
                background: `${theme.accent}10`,
                border: `1px solid ${theme.accent}25`
              }}
            >
              <span style={{ fontSize: 20 }}>{p.icon}</span>
              <div>
                <div style={{ fontSize: 11, opacity: 0.6 }}>Step {p.step}</div>
                <div className="small">{p.text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
