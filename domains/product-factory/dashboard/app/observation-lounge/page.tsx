'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface CrewMember {
  id: string;
  name: string;
  title: string;
  icon: string;
  specializations: string[];
  availability: number;
  currentProjects: string[];
  currentProjectNames: string[];
  collaborationStyle: string;
  llmPreference: string;
}

interface CollaborationOpportunity {
  id: string;
  projectIds: string[];
  projectNames: string[];
  type: string;
  priority: string;
  suggestedTeam: CrewMember[];
  expectedAcceleration: {
    timeSaved: number;
    accelerationFactor: number;
  };
  llmRecommendation: {
    model: string;
    reasoning: string;
  };
  rikerNotes: string;
  task: {
    description: string;
    taskType: string;
    requiredSkills: string[];
  };
}

interface CoordinationPlan {
  id: string;
  createdAt: string;
  opportunities: CollaborationOpportunity[];
  totalProjectsAnalyzed: number;
  totalTimeSavings: number;
  rikerBriefing: string;
}

interface Memory {
  id: string;
  crewId: string;
  content: string;
  type: string;
  createdAt: string;
}

interface AutoOptimizeResult {
  success: boolean;
  rikerReport: string;
  sessionsExecuted: number;
  totalProgressGained: number;
  message: string;
  results: Array<{
    opportunity: string;
    projects: string[];
    team: string[];
    progressDelta: number;
    insights: string[];
  }>;
}

export default function ObservationLounge() {
  const [plan, setPlan] = useState<CoordinationPlan | null>(null);
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [activeTab, setActiveTab] = useState<'plan' | 'crew' | 'memories' | 'history'>('plan');
  const [lastResult, setLastResult] = useState<AutoOptimizeResult | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [planRes, crewRes, memRes] = await Promise.all([
        fetch('/api/crew/collaborate'),
        fetch('/api/crew/collaborate?action=roster'),
        fetch('/api/crew/collaborate?action=memories'),
      ]);

      if (planRes.ok) {
        const planData = await planRes.json();
        setPlan(planData.plan);
      }

      if (crewRes.ok) {
        const crewData = await crewRes.json();
        setCrew(crewData.crew);
      }

      if (memRes.ok) {
        const memData = await memRes.json();
        setMemories(memData.memories);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
    setLoading(false);
  };

  const executeAutoOptimize = async () => {
    setExecuting(true);
    try {
      const res = await fetch('/api/crew/collaborate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'auto-optimize' }),
      });

      if (res.ok) {
        const result = await res.json();
        setLastResult(result);
        // Reload plan to see updated progress
        await loadData();
      }
    } catch (error) {
      console.error('Auto-optimize failed:', error);
    }
    setExecuting(false);
  };

  const executeOpportunity = async (opportunityId: string) => {
    setExecuting(true);
    try {
      const res = await fetch('/api/crew/collaborate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'execute', opportunityId }),
      });

      if (res.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Execute failed:', error);
    }
    setExecuting(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'medium': return '#3b82f6';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'skill-share': return '🎓';
      case 'parallel-work': return '⚡';
      case 'mentor-pair': return '👥';
      case 'cross-pollinate': return '🔗';
      default: return '🤝';
    }
  };

  if (loading) {
    return (
      <main style={{ padding: 32 }}>
        <h1 style={{ marginBottom: 24 }}>🖖 Observation Lounge</h1>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: 300,
          background: 'rgba(0,0,0,0.2)',
          borderRadius: 12,
        }}>
          <div style={{ textAlign: 'center', opacity: 0.7 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
            <div>Commander Riker is analyzing projects...</div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ padding: 32, maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: 32,
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div>
          <h1 style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
            🖖 Observation Lounge
          </h1>
          <p style={{ opacity: 0.7, maxWidth: 600 }}>
            Commander Riker coordinates crew collaboration across all projects,
            optimizing team synergy and accelerating development through shared knowledge.
          </p>
        </div>
        
        <button
          onClick={executeAutoOptimize}
          disabled={executing}
          style={{
            background: executing ? '#4b5563' : 'linear-gradient(135deg, #7c5cff, #00d4ff)',
            border: 'none',
            padding: '14px 28px',
            borderRadius: 12,
            color: 'white',
            fontWeight: 600,
            fontSize: 16,
            cursor: executing ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: '0 4px 20px rgba(124, 92, 255, 0.3)',
          }}
        >
          {executing ? '⚡ Coordinating...' : '⚡ Riker: Auto-Optimize All'}
        </button>
      </div>

      {/* Last Result Banner */}
      {lastResult && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(124, 92, 255, 0.2))',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 12,
          padding: 20,
          marginBottom: 24,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0, color: '#10b981' }}>✅ Collaboration Complete</h3>
            <button
              onClick={() => setLastResult(null)}
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.7 }}
            >
              ✕
            </button>
          </div>
          <p style={{ margin: 0, marginBottom: 12 }}>{lastResult.message}</p>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div>
              <span style={{ opacity: 0.7 }}>Sessions:</span>{' '}
              <strong>{lastResult.sessionsExecuted}</strong>
            </div>
            <div>
              <span style={{ opacity: 0.7 }}>Progress Gained:</span>{' '}
              <strong>+{lastResult.totalProgressGained}%</strong>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: 8, 
        marginBottom: 24,
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        paddingBottom: 8,
      }}>
        {(['plan', 'crew', 'memories'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: activeTab === tab ? 'rgba(124, 92, 255, 0.2)' : 'transparent',
              border: activeTab === tab ? '1px solid #7c5cff' : '1px solid transparent',
              padding: '10px 20px',
              borderRadius: 8,
              color: activeTab === tab ? '#7c5cff' : 'white',
              cursor: 'pointer',
              fontWeight: activeTab === tab ? 600 : 400,
            }}
          >
            {tab === 'plan' && '📋 Coordination Plan'}
            {tab === 'crew' && '👥 Crew Roster'}
            {tab === 'memories' && '🧠 RAG Memories'}
          </button>
        ))}
      </div>

      {/* Plan Tab */}
      {activeTab === 'plan' && plan && (
        <div>
          {/* Stats */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
            marginBottom: 32,
          }}>
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 12,
              padding: 20,
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <div style={{ opacity: 0.7, fontSize: 12, marginBottom: 4 }}>PROJECTS ANALYZED</div>
              <div style={{ fontSize: 32, fontWeight: 700 }}>{plan.totalProjectsAnalyzed}</div>
            </div>
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 12,
              padding: 20,
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <div style={{ opacity: 0.7, fontSize: 12, marginBottom: 4 }}>OPPORTUNITIES</div>
              <div style={{ fontSize: 32, fontWeight: 700 }}>{plan.opportunities.length}</div>
            </div>
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 12,
              padding: 20,
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <div style={{ opacity: 0.7, fontSize: 12, marginBottom: 4 }}>POTENTIAL TIME SAVED</div>
              <div style={{ fontSize: 32, fontWeight: 700 }}>{plan.totalTimeSavings}h</div>
            </div>
          </div>

          {/* Riker's Briefing */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(124, 92, 255, 0.1), rgba(0, 212, 255, 0.1))',
            border: '1px solid rgba(124, 92, 255, 0.3)',
            borderRadius: 12,
            padding: 24,
            marginBottom: 32,
          }}>
            <h3 style={{ margin: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              ⚡ Commander Riker&apos;s Briefing
            </h3>
            <pre style={{ 
              margin: 0, 
              whiteSpace: 'pre-wrap', 
              fontFamily: 'inherit',
              fontSize: 14,
              lineHeight: 1.6,
              opacity: 0.9,
            }}>
              {plan.rikerBriefing}
            </pre>
          </div>

          {/* Opportunities */}
          <h2 style={{ marginBottom: 16 }}>Collaboration Opportunities</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {plan.opportunities.map(opp => (
              <div
                key={opp.id}
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.1)',
                  overflow: 'hidden',
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 16,
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 24 }}>{getTypeIcon(opp.type)}</span>
                    <div>
                      <div style={{ fontWeight: 600 }}>{opp.task.description}</div>
                      <div style={{ fontSize: 12, opacity: 0.7 }}>
                        {opp.projectNames.join(' ↔ ')} • {opp.type.replace('-', ' ')}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 600,
                      background: `${getPriorityColor(opp.priority)}20`,
                      color: getPriorityColor(opp.priority),
                      textTransform: 'uppercase',
                    }}>
                      {opp.priority}
                    </span>
                    <button
                      onClick={() => executeOpportunity(opp.id)}
                      disabled={executing}
                      style={{
                        background: '#7c5cff',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: 8,
                        color: 'white',
                        cursor: executing ? 'not-allowed' : 'pointer',
                        fontWeight: 500,
                        fontSize: 13,
                      }}
                    >
                      Execute
                    </button>
                  </div>
                </div>
                
                <div style={{ padding: 16 }}>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 16,
                    marginBottom: 16,
                  }}>
                    <div>
                      <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 4 }}>TEAM</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {opp.suggestedTeam.map(m => (
                          <span key={m.id} style={{
                            background: 'rgba(124, 92, 255, 0.2)',
                            padding: '4px 10px',
                            borderRadius: 20,
                            fontSize: 12,
                          }}>
                            {m.icon} {m.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 4 }}>ACCELERATION</div>
                      <div style={{ color: '#10b981', fontWeight: 600 }}>
                        {opp.expectedAcceleration.timeSaved}h saved ({Math.round((opp.expectedAcceleration.accelerationFactor - 1) * 100)}% faster)
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 4 }}>LLM</div>
                      <div style={{ fontSize: 13 }}>
                        {opp.llmRecommendation.model.split('/')[1]}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ 
                    background: 'rgba(0,0,0,0.2)', 
                    padding: 12, 
                    borderRadius: 8,
                    fontSize: 13,
                    fontStyle: 'italic',
                  }}>
                    <strong>Riker:</strong> {opp.rikerNotes}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Crew Tab */}
      {activeTab === 'crew' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 16,
        }}>
          {crew.map(member => (
            <div
              key={member.id}
              style={{
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.1)',
                padding: 20,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ fontSize: 36 }}>{member.icon}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 16 }}>{member.name}</div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>{member.title}</div>
                </div>
                <div style={{
                  marginLeft: 'auto',
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  background: `conic-gradient(#10b981 ${member.availability * 3.6}deg, rgba(255,255,255,0.1) 0deg)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 600,
                }}>
                  {member.availability}%
                </div>
              </div>
              
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 4 }}>SPECIALIZATIONS</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {member.specializations.map(spec => (
                    <span key={spec} style={{
                      background: 'rgba(0, 212, 255, 0.2)',
                      padding: '3px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                    }}>
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
              
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 4 }}>CURRENT PROJECTS</div>
                <div style={{ fontSize: 13 }}>
                  {member.currentProjectNames.length > 0 
                    ? member.currentProjectNames.join(', ')
                    : <span style={{ opacity: 0.5 }}>Available for assignment</span>
                  }
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, opacity: 0.7 }}>
                <span>Style: {member.collaborationStyle}</span>
                <span>LLM: {member.llmPreference.split('/')[1]}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Memories Tab */}
      {activeTab === 'memories' && (
        <div>
          <p style={{ marginBottom: 24, opacity: 0.7 }}>
            Crew RAG memories store lessons learned, patterns, and solutions discovered during collaboration.
            These memories accelerate future work by providing contextual insights.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {memories.map(mem => {
              const member = crew.find(c => c.id === mem.crewId);
              return (
                <div
                  key={mem.id}
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.1)',
                    padding: 16,
                    display: 'flex',
                    gap: 16,
                  }}
                >
                  <span style={{ fontSize: 24 }}>{member?.icon || '🧠'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8,
                    }}>
                      <span style={{ fontWeight: 600 }}>{member?.name || 'Unknown'}</span>
                      <span style={{
                        fontSize: 10,
                        padding: '3px 8px',
                        borderRadius: 4,
                        background: mem.type === 'warning' ? 'rgba(239, 68, 68, 0.2)' :
                                   mem.type === 'solution' ? 'rgba(16, 185, 129, 0.2)' :
                                   'rgba(124, 92, 255, 0.2)',
                        color: mem.type === 'warning' ? '#ef4444' :
                               mem.type === 'solution' ? '#10b981' :
                               '#7c5cff',
                        textTransform: 'uppercase',
                      }}>
                        {mem.type}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>{mem.content}</p>
                    <div style={{ fontSize: 11, opacity: 0.5, marginTop: 8 }}>
                      {new Date(mem.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer Navigation */}
      <div style={{ 
        marginTop: 48, 
        paddingTop: 24, 
        borderTop: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        gap: 16,
      }}>
        <Link
          href="/projects"
          style={{
            padding: '10px 20px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 8,
            color: 'white',
            textDecoration: 'none',
          }}
        >
          ← Back to Projects
        </Link>
        <Link
          href="/create"
          style={{
            padding: '10px 20px',
            background: 'rgba(124, 92, 255, 0.2)',
            borderRadius: 8,
            color: '#7c5cff',
            textDecoration: 'none',
          }}
        >
          🚀 Create New Project
        </Link>
      </div>
    </main>
  );
}
