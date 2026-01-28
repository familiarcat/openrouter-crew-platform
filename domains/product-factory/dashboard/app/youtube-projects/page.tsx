'use client';
import { useState } from 'react';

// Crew colors for theming
const crewColors = {
  picard: { accent: '#ffd700', glow: 'rgba(255,215,0,.3)' },
  data: { accent: '#00d4ff', glow: 'rgba(0,212,255,.3)' },
  laforge: { accent: '#ff9500', glow: 'rgba(255,149,0,.3)' },
  troi: { accent: '#9b59b6', glow: 'rgba(155,89,182,.3)' },
  quark: { accent: '#27ae60', glow: 'rgba(39,174,96,.3)' },
};

const mainTheme = {
  accent: '#ff5c93',
  glow: 'rgba(255,92,147,.50)',
};

interface CrewInsight {
  crewMember: string;
  role: string;
  analysis: string;
  recommendation: string;
  concerns?: string[];
  opportunities?: string[];
}

interface Project {
  id: string;
  name: string;
  tagline: string;
  description: string;
  domain: string;
  crewAnalysis: {
    picard: CrewInsight;
    data: CrewInsight;
    laforge: CrewInsight;
    troi: CrewInsight;
    quark: CrewInsight;
    consensus: string;
  };
  techStack: string[];
  estimatedEffort: {
    mvpDays: number;
    fullDays: number;
    teamSize: number;
    complexity: string;
  };
  monetization: {
    primaryModel: string;
    estimatedMRR: string;
    timeToRevenue: string;
    revenueStreams: Array<{ name: string; model: string; pricing: string; targetCustomer: string }>;
  };
  mvpFeatures: string[];
  successMetrics: string[];
}

const cardStyle = (accent: string, glow: string) => ({
  background: `linear-gradient(180deg, rgba(13,16,34,.92), rgba(11,15,29,.75)), radial-gradient(ellipse 600px 350px at 0% 0%, ${glow} 0%, transparent 60%)`,
  borderColor: `${accent}50`,
  border: `1px solid ${accent}40`,
  borderRadius: '16px',
  padding: '20px',
});

export default function YouTubeProjectsPage() {
  const [url, setUrl] = useState('https://www.youtube.com/watch?v=S8a7gkFhoBA');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [selectedProject, setSelectedProject] = useState<number>(0);
  const [showCrewDetails, setShowCrewDetails] = useState(false);

  async function generateProjects() {
    setLoading(true);
    setResult(null);
    
    try {
      const res = await fetch('/api/youtube-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      
      const data = await res.json();
      setResult(data);
      setSelectedProject(0);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  const currentProject: Project | null = result?.projects?.[selectedProject] || null;

  return (
    <div className="grid" style={{ gap: 20 }}>
      {/* Header */}
      <div className="card span-12" style={cardStyle(mainTheme.accent, mainTheme.glow)}>
        <h1 style={{ marginTop: 0, color: mainTheme.accent }}>
          🎬 YouTube → Projects
        </h1>
        <p className="small" style={{ opacity: 0.8, marginBottom: 16 }}>
          Transform YouTube content into actionable project proposals using crew collaboration
        </p>
        
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="Paste YouTube URL..."
            style={{
              flex: 1,
              minWidth: 300,
              padding: 14,
              borderRadius: 12,
              border: `1px solid ${mainTheme.accent}40`,
              background: `${mainTheme.accent}10`,
              color: 'var(--text)',
              fontSize: 14,
            }}
          />
          <button
            onClick={generateProjects}
            disabled={loading}
            style={{
              padding: '14px 24px',
              borderRadius: 12,
              border: `1px solid ${mainTheme.accent}60`,
              background: loading ? `${mainTheme.accent}10` : `${mainTheme.accent}25`,
              color: mainTheme.accent,
              fontWeight: 600,
              cursor: loading ? 'wait' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {loading ? '🔄 Analyzing...' : '🚀 Generate Projects'}
          </button>
        </div>
      </div>

      {/* Crew Participants */}
      {result && (
        <div className="card span-12" style={cardStyle('#7c5cff', 'rgba(124,92,255,.3)')}>
          <h2 style={{ marginTop: 0, color: '#7c5cff' }}>👥 Crew Collaboration</h2>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {result.crewParticipants.map((crew: any) => (
              <div
                key={crew.id}
                style={{
                  padding: '12px 16px',
                  background: 'rgba(255,255,255,.05)',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,.1)',
                }}
              >
                <span style={{ fontSize: 20 }}>{crew.emoji}</span>
                <span style={{ marginLeft: 8, fontWeight: 500 }}>{crew.name}</span>
                <span style={{ marginLeft: 8, opacity: 0.6, fontSize: 12 }}>{crew.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Project Selection */}
      {result?.projects && (
        <div className="card span-12" style={cardStyle('#00d4ff', 'rgba(0,212,255,.3)')}>
          <h2 style={{ marginTop: 0, color: '#00d4ff' }}>📊 Generated Projects</h2>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {result.projects.map((project: Project, idx: number) => (
              <button
                key={project.id}
                onClick={() => setSelectedProject(idx)}
                style={{
                  padding: '16px 20px',
                  borderRadius: 12,
                  border: selectedProject === idx 
                    ? '2px solid #00d4ff' 
                    : '1px solid rgba(255,255,255,.2)',
                  background: selectedProject === idx 
                    ? 'rgba(0,212,255,.2)' 
                    : 'rgba(255,255,255,.05)',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  flex: '1 1 250px',
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{project.name}</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>{project.tagline}</div>
                <div style={{ 
                  marginTop: 8, 
                  fontSize: 11, 
                  padding: '4px 8px', 
                  background: 'rgba(0,212,255,.2)', 
                  borderRadius: 6,
                  display: 'inline-block',
                }}>
                  {project.domain}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Project Details */}
      {currentProject && (
        <>
          {/* Overview */}
          <div className="card span-8" style={cardStyle('#27ae60', 'rgba(39,174,96,.3)')}>
            <h2 style={{ marginTop: 0, color: '#27ae60' }}>
              💡 {currentProject.name}
            </h2>
            <p style={{ fontSize: 18, fontStyle: 'italic', color: '#27ae60', marginBottom: 16 }}>
              "{currentProject.tagline}"
            </p>
            <p className="small" style={{ lineHeight: 1.7 }}>{currentProject.description}</p>
            
            <h3 style={{ color: '#27ae60', marginTop: 24 }}>Tech Stack</h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {currentProject.techStack.map((tech, i) => (
                <span
                  key={i}
                  style={{
                    padding: '6px 12px',
                    background: 'rgba(39,174,96,.2)',
                    borderRadius: 8,
                    fontSize: 12,
                    border: '1px solid rgba(39,174,96,.3)',
                  }}
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Effort & Metrics */}
          <div className="card span-4" style={cardStyle('#ff9500', 'rgba(255,149,0,.3)')}>
            <h3 style={{ marginTop: 0, color: '#ff9500' }}>⏱️ Effort Estimate</h3>
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ padding: 12, background: 'rgba(255,149,0,.1)', borderRadius: 8 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#ff9500' }}>
                  {currentProject.estimatedEffort.mvpDays} days
                </div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>MVP Timeline</div>
              </div>
              <div style={{ padding: 12, background: 'rgba(255,149,0,.1)', borderRadius: 8 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#ff9500' }}>
                  {currentProject.estimatedEffort.teamSize} people
                </div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Team Size</div>
              </div>
              <div style={{ padding: 12, background: 'rgba(255,149,0,.1)', borderRadius: 8 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#ff9500', textTransform: 'capitalize' }}>
                  {currentProject.estimatedEffort.complexity}
                </div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Complexity</div>
              </div>
            </div>
          </div>

          {/* Monetization */}
          <div className="card span-6" style={cardStyle(crewColors.quark.accent, crewColors.quark.glow)}>
            <h3 style={{ marginTop: 0, color: crewColors.quark.accent }}>
              💰 Monetization Strategy
            </h3>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, opacity: 0.7 }}>Primary Model</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{currentProject.monetization.primaryModel}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ padding: 12, background: 'rgba(39,174,96,.1)', borderRadius: 8 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: crewColors.quark.accent }}>
                  {currentProject.monetization.estimatedMRR}
                </div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>Estimated MRR</div>
              </div>
              <div style={{ padding: 12, background: 'rgba(39,174,96,.1)', borderRadius: 8 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: crewColors.quark.accent }}>
                  {currentProject.monetization.timeToRevenue}
                </div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>Time to Revenue</div>
              </div>
            </div>
            
            <h4 style={{ marginTop: 16, color: crewColors.quark.accent }}>Revenue Streams</h4>
            {currentProject.monetization.revenueStreams.map((stream, i) => (
              <div 
                key={i} 
                style={{ 
                  padding: 10, 
                  background: 'rgba(39,174,96,.08)', 
                  borderRadius: 8, 
                  marginBottom: 8,
                  fontSize: 13,
                }}
              >
                <div style={{ fontWeight: 600 }}>{stream.name}</div>
                <div style={{ opacity: 0.7 }}>{stream.pricing} • {stream.targetCustomer}</div>
              </div>
            ))}
          </div>

          {/* Features */}
          <div className="card span-6" style={cardStyle('#9b59b6', 'rgba(155,89,182,.3)')}>
            <h3 style={{ marginTop: 0, color: '#9b59b6' }}>✨ MVP Features</h3>
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              {currentProject.mvpFeatures.map((feature, i) => (
                <li key={i} style={{ marginBottom: 8, lineHeight: 1.5 }}>{feature}</li>
              ))}
            </ul>
            
            <h3 style={{ marginTop: 20, color: '#9b59b6' }}>🎯 Success Metrics</h3>
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              {currentProject.successMetrics.map((metric, i) => (
                <li key={i} style={{ marginBottom: 8, lineHeight: 1.5 }}>{metric}</li>
              ))}
            </ul>
          </div>

          {/* Crew Analysis Toggle */}
          <div className="card span-12" style={cardStyle('#ffd700', 'rgba(255,215,0,.2)')}>
            <div 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                cursor: 'pointer',
              }}
              onClick={() => setShowCrewDetails(!showCrewDetails)}
            >
              <h3 style={{ margin: 0, color: '#ffd700' }}>
                🖖 Crew Analysis Details
              </h3>
              <span style={{ fontSize: 20 }}>{showCrewDetails ? '▼' : '▶'}</span>
            </div>
            
            {showCrewDetails && (
              <div style={{ marginTop: 20, display: 'grid', gap: 16 }}>
                {/* Consensus */}
                <div style={{ 
                  padding: 16, 
                  background: 'rgba(255,215,0,.1)', 
                  borderRadius: 12,
                  borderLeft: '4px solid #ffd700',
                }}>
                  <h4 style={{ marginTop: 0, color: '#ffd700' }}>📋 Crew Consensus</h4>
                  <p style={{ margin: 0, lineHeight: 1.7 }}>{currentProject.crewAnalysis.consensus}</p>
                </div>
                
                {/* Individual Analysis */}
                {Object.entries(currentProject.crewAnalysis)
                  .filter(([key]) => key !== 'consensus')
                  .map(([key, insight]: [string, any]) => (
                    <div 
                      key={key}
                      style={{ 
                        padding: 16, 
                        background: 'rgba(255,255,255,.03)', 
                        borderRadius: 12,
                        borderLeft: `4px solid ${crewColors[key as keyof typeof crewColors]?.accent || '#7c5cff'}`,
                      }}
                    >
                      <h4 style={{ 
                        marginTop: 0, 
                        color: crewColors[key as keyof typeof crewColors]?.accent || '#7c5cff' 
                      }}>
                        {insight.crewMember} • {insight.role}
                      </h4>
                      <p style={{ marginBottom: 12 }}><strong>Analysis:</strong> {insight.analysis}</p>
                      <p style={{ marginBottom: 12 }}><strong>Recommendation:</strong> {insight.recommendation}</p>
                      {insight.opportunities && (
                        <p style={{ marginBottom: 0, color: '#27ae60' }}>
                          <strong>Opportunities:</strong> {insight.opportunities.join(', ')}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}





