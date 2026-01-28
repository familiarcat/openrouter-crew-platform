import Link from 'next/link';
import { CrewCard, CrewStatusGrid, type CrewMemberData } from '../../components/CrewCard';
import fs from 'fs';
import path from 'path';

// Division configuration with colors and display info
const divisionConfig: Record<string, { name: string; color: string; emoji: string; description: string }> = {
  Command: { 
    name: 'Command Division', 
    color: '#c41e3a', // TNG Command Red
    emoji: '🔴',
    description: 'Strategic leadership and mission coordination'
  },
  Operations: { 
    name: 'Operations Division', 
    color: '#c9a227', // TNG Operations Gold
    emoji: '🟡',
    description: 'Engineering, Security, Tactical, and Communications'
  },
  Sciences: { 
    name: 'Sciences Division', 
    color: '#0077b6', // TNG Sciences Blue
    emoji: '🔵',
    description: 'Medical, Counseling, and Research'
  },
  Civilian: { 
    name: 'Civilian Consultants', 
    color: '#8b7355', // Ferengi Brown
    emoji: '🟤',
    description: 'Non-Starfleet specialists and advisors'
  },
};

// Division display order
const divisionOrder = ['Command', 'Operations', 'Sciences', 'Civilian'];

// Load crew members from JSON files
function loadCrewMembers(): CrewMemberData[] {
  const crewDir = path.join(process.cwd(), 'crew-members');
  const files = fs.readdirSync(crewDir).filter(f => f.endsWith('.json'));
  
  const emojiMap: Record<string, string> = {
    captain_picard: '👨‍✈️',
    commander_data: '🤖',
    commander_riker: '🎺',
    geordi_la_forge: '🔧',
    lieutenant_worf: '⚔️',
    dr_crusher: '👩‍⚕️',
    counselor_troi: '💜',
    chief_obrien: '🛠️',
    lieutenant_uhura: '📡',
    quark: '💰',
  };

  // Sample objectives and worries based on role
  const objectivesMap: Record<string, string> = {
    captain_picard: 'Ensure strategic alignment across all systems',
    commander_data: 'Optimize AI/ML pipeline performance',
    commander_riker: 'Coordinate team execution on current sprint',
    geordi_la_forge: 'Complete infrastructure migration',
    lieutenant_worf: 'Security audit and compliance review',
    dr_crusher: 'System health diagnostics and optimization',
    counselor_troi: 'UX improvements and accessibility review',
    chief_obrien: 'Quick fixes for production issues',
    lieutenant_uhura: 'API documentation and communication protocols',
    quark: 'ROI analysis for Q1 initiatives',
  };

  const worriesMap: Record<string, string[]> = {
    captain_picard: ['Team velocity concerns', 'Strategic pivot risk'],
    commander_data: ['Model accuracy degradation', 'Prompt engineering consistency'],
    commander_riker: ['Sprint deadline pressure', 'Resource allocation'],
    geordi_la_forge: ['Legacy system dependencies', 'Performance bottlenecks'],
    lieutenant_worf: ['Unpatched vulnerabilities', 'Compliance gaps'],
    dr_crusher: ['Memory leak symptoms', 'System fatigue indicators'],
    counselor_troi: ['User friction points', 'Accessibility gaps'],
    chief_obrien: ['Technical debt accumulation', 'Quick fix side effects'],
    lieutenant_uhura: ['Documentation gaps', 'API versioning concerns'],
    quark: ['Budget overruns', 'ROI uncertainty'],
  };

  return files.map(file => {
    const content = fs.readFileSync(path.join(crewDir, file), 'utf-8');
    const data = JSON.parse(content);
    
    return {
      id: data.id,
      name: data.name,
      callName: data.callName || data.name.split(' ').pop() || data.name,
      role: data.role,
      department: data.department,
      division: data.division || 'Operations',
      uniformColor: data.uniformColor || 'gold',
      rankOrder: data.rank?.order || 99,
      rankTitle: data.rank?.title || '',
      status: 'active' as const,
      emoji: emojiMap[data.id] || '🖖',
      specialty: data.specialization || [],
      currentObjective: objectivesMap[data.id],
      worries: worriesMap[data.id],
      recentMemories: Math.floor(Math.random() * 50) + 10,
      catchphrases: data.personality?.catchphrases || [],
    };
  }).sort((a, b) => a.rankOrder - b.rankOrder); // Sort by rank
}

export default function CrewPage() {
  const crew = loadCrewMembers();
  
  // Calculate stats
  const activeCrew = crew.filter(c => c.status === 'active').length;
  const totalWorries = crew.reduce((sum, c) => sum + (c.worries?.length || 0), 0);
  const totalMemories = crew.reduce((sum, c) => sum + (c.recentMemories || 0), 0);

  return (
    <div className="grid">
      {/* Header */}
      <div className="card span-12">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ marginTop: 0 }}>🖖 Crew Roster</h1>
            <p className="small">
              The Alex AI crew - 10 specialized agents organized by Starfleet division colors
            </p>
          </div>
          <Link href="/observation-lounge" className="btnPrimary">
            🖖 Observation Lounge
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="card span-3">
        <div className="statCard">
          <div className="statValue">{crew.length}</div>
          <div className="statLabel">Crew Members</div>
        </div>
      </div>
      <div className="card span-3">
        <div className="statCard">
          <div className="statValue good">{activeCrew}</div>
          <div className="statLabel">Active</div>
        </div>
      </div>
      <div className="card span-3">
        <div className="statCard">
          <div className="statValue warn">{totalWorries}</div>
          <div className="statLabel">Current Concerns</div>
        </div>
      </div>
      <div className="card span-3">
        <div className="statCard">
          <div className="statValue">{totalMemories}</div>
          <div className="statLabel">RAG Memories</div>
        </div>
      </div>

      {/* Quick Status Grid */}
      <div className="card span-12">
        <h2 style={{ marginTop: 0 }}>Crew Status</h2>
        <CrewStatusGrid crew={crew} />
      </div>

      {/* Crew Cards by Division (Uniform Color) */}
      {divisionOrder.map(division => {
        const divisionCrew = crew.filter(c => c.division === division);
        if (divisionCrew.length === 0) return null;
        
        const config = divisionConfig[division];
        
        return (
          <div key={division} className="card span-12 divisionCard" style={{
            background: `linear-gradient(180deg, rgba(13,16,34,.88), rgba(11,15,29,.62)), radial-gradient(ellipse 800px 400px at 0% 0%, ${config.color}55 0%, transparent 60%)`,
            borderColor: `${config.color}50`,
            marginTop: 16
          }}>
            <div className="divisionHeader" style={{ 
              marginBottom: 16,
              paddingBottom: 12,
              borderBottom: `2px solid ${config.color}40`
            }}>
              <h2 style={{ margin: 0, color: config.color }}>{config.name}</h2>
              <p className="small" style={{ margin: '4px 0 0 0', opacity: 0.7 }}>{config.description}</p>
            </div>
            <div className="grid">
              {divisionCrew.map(c => (
                <div key={c.id} className="span-6">
                  <CrewCard crew={c} />
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Division Legend */}
      <div className="card span-12">
        <h3 style={{ marginTop: 0 }}>Starfleet Division Colors (TNG Era)</h3>
        <div className="grid">
          {divisionOrder.map(division => {
            const config = divisionConfig[division];
            return (
              <div 
                key={division} 
                className="span-3" 
                style={{ 
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: `linear-gradient(180deg, rgba(13,16,34,.9), rgba(11,15,29,.7)), radial-gradient(ellipse 300px 200px at 0% 0%, ${config.color}55 0%, transparent 70%)`,
                  border: `1px solid ${config.color}50`
                }}
              >
                <strong style={{ color: config.color }}>{division}</strong>
                <p className="small" style={{ margin: '4px 0 0 0', opacity: 0.8 }}>{config.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Understanding Section */}
      <div className="card span-12">
        <h3 style={{ marginTop: 0 }}>Understanding the Crew</h3>
        <div className="grid">
          <div className="span-4">
            <h4>🎯 Objectives</h4>
            <p className="small">Current focus areas and tasks each crew member is prioritizing.</p>
          </div>
          <div className="span-4">
            <h4>⚠️ Concerns</h4>
            <p className="small">Issues and risks identified from RAG memories and analysis.</p>
          </div>
          <div className="span-4">
            <h4>🧠 RAG Memories</h4>
            <p className="small">Accumulated knowledge from past conversations and decisions.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
