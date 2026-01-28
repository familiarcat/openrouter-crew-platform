import Link from 'next/link';
import Image from 'next/image';
import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';

interface CrewMember {
  id: string;
  name: string;
  callName?: string;
  role: string;
  department: string;
  division?: string;
  uniformColor?: string;
  specialization: string[];
  personality: {
    archetype: string;
    traits: string[];
    catchphrases: string[];
    decisionMaking: string;
    responseStyle: string;
  };
  expertise: {
    primary: string;
    secondary: string[];
    yearsOfExperience: string;
    knownFor: string[];
  };
  responsibilities: string[];
  worksWith: string[];
  typicalUseCases: string[];
  memoryAlpha?: {
    fullName?: string;
    species?: string;
    birthYear?: number;
    birthPlace?: string;
    assignments?: string[];
    notableEvents?: string[];
    keyRelationships?: { name: string; relation: string }[];
    personalTraits?: string[];
    source?: string;
  };
}

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

const uniformColors: Record<string, string> = {
  red: '#c41e3a',
  gold: '#c9a227',
  blue: '#0077b6',
  brown: '#8b7355',
};

function loadCrewMember(id: string): CrewMember | null {
  const crewDir = path.join(process.cwd(), 'crew-members');
  const files = fs.readdirSync(crewDir).filter(f => f.endsWith('.json'));
  
  for (const file of files) {
    const content = fs.readFileSync(path.join(crewDir, file), 'utf-8');
    const data = JSON.parse(content);
    if (data.id === id) {
      return data;
    }
  }
  return null;
}

export default async function CrewMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const crew = loadCrewMember(id);
  
  if (!crew) {
    notFound();
  }

  const emoji = emojiMap[crew.id] || '🖖';
  const divisionColor = uniformColors[crew.uniformColor || 'gold'] || uniformColors.gold;

  return (
    <div className="grid">
      {/* Header */}
      <div className="card span-12" style={{
        background: `linear-gradient(180deg, rgba(13,16,34,.88), rgba(11,15,29,.62)), radial-gradient(ellipse 900px 450px at 0% 0%, ${divisionColor}55 0%, transparent 60%)`,
        borderColor: `${divisionColor}50`
      }}>
        <Link href="/crew" className="small" style={{ display: 'inline-block', marginBottom: 12 }}>
          ← Back to Crew Roster
        </Link>
        <div className="crewProfileHeader">
          <div className="profileAvatar">
            <Image 
              src={`/crew-avatars/${crew.id}.jpg`} 
              alt={crew.name}
              fill
              sizes="100px"
              className="avatarImage"
              priority
            />
          </div>
          <div className="profileInfo">
            <h1 style={{ marginTop: 0, marginBottom: 4 }}>{crew.name}</h1>
            <div className="profileRole" style={{ color: divisionColor }}>{crew.role}</div>
            <div className="profileDept">{crew.department}</div>
          </div>
          <div className="profileActions">
            <Link href={`/ask?crew=${crew.id}`} className="btnPrimary">
              💬 Ask {crew.callName || crew.name}
            </Link>
          </div>
        </div>
      </div>

      {/* Personality */}
      <div className="card span-8" style={{
        background: `linear-gradient(180deg, rgba(13,16,34,.88), rgba(11,15,29,.62)), radial-gradient(ellipse 600px 350px at 0% 0%, ${divisionColor}50 0%, transparent 60%)`,
        borderColor: `${divisionColor}40`
      }}>
        <h2 style={{ marginTop: 0, color: divisionColor }}>Personality</h2>
        <div className="profileSection">
          <div className="archetype">
            <span className="archetypeLabel">Archetype:</span>
            <span className="archetypeValue" style={{ color: divisionColor }}>{crew.personality.archetype}</span>
          </div>
          <div className="traits">
            {crew.personality.traits.map((t, i) => (
              <span key={i} className="traitTag" style={{ borderColor: `${divisionColor}40` }}>{t}</span>
            ))}
          </div>
        </div>
        
        <h3>Catchphrases</h3>
        <div className="catchphrases">
          {crew.personality.catchphrases.map((c, i) => (
            <div key={i} className="catchphrase" style={{ borderLeftColor: divisionColor }}>"{c}"</div>
          ))}
        </div>

        <h3>Decision Making</h3>
        <p className="small">{crew.personality.decisionMaking}</p>

        <h3>Response Style</h3>
        <p className="small">{crew.personality.responseStyle}</p>
      </div>

      {/* Expertise */}
      <div className="card span-4" style={{
        background: `linear-gradient(180deg, rgba(13,16,34,.88), rgba(11,15,29,.62)), radial-gradient(ellipse 400px 300px at 0% 0%, ${divisionColor}50 0%, transparent 60%)`,
        borderColor: `${divisionColor}40`
      }}>
        <h2 style={{ marginTop: 0, color: divisionColor }}>Expertise</h2>
        <div className="expertiseSection">
          <div className="expertisePrimary">
            <div className="expLabel">Primary</div>
            <div className="expValue">{crew.expertise.primary}</div>
          </div>
          <div className="expertiseSecondary">
            <div className="expLabel">Secondary</div>
            {crew.expertise.secondary.map((s, i) => (
              <span key={i} className="expTag" style={{ 
                background: `${divisionColor}20`, 
                color: divisionColor 
              }}>{s}</span>
            ))}
          </div>
          <div className="expertiseExp">
            <div className="expLabel">Experience</div>
            <div className="expValue">{crew.expertise.yearsOfExperience}</div>
          </div>
        </div>
      </div>

      {/* Specializations */}
      <div className="card span-6" style={{
        background: `linear-gradient(180deg, rgba(13,16,34,.88), rgba(11,15,29,.62)), radial-gradient(ellipse 500px 300px at 0% 0%, ${divisionColor}50 0%, transparent 60%)`,
        borderColor: `${divisionColor}40`
      }}>
        <h2 style={{ marginTop: 0, color: divisionColor }}>Specializations</h2>
        <div className="specList">
          {crew.specialization.map((s, i) => (
            <div key={i} className="specItem">
              <span className="specIcon" style={{ color: divisionColor }}>✦</span>
              <span>{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Responsibilities */}
      <div className="card span-6" style={{
        background: `linear-gradient(180deg, rgba(13,16,34,.88), rgba(11,15,29,.62)), radial-gradient(ellipse 500px 300px at 0% 0%, ${divisionColor}50 0%, transparent 60%)`,
        borderColor: `${divisionColor}40`
      }}>
        <h2 style={{ marginTop: 0, color: divisionColor }}>Responsibilities</h2>
        <ul className="respList">
          {crew.responsibilities.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </div>

      {/* Known For */}
      <div className="card span-12" style={{
        background: `linear-gradient(180deg, rgba(13,16,34,.88), rgba(11,15,29,.62)), radial-gradient(ellipse 800px 400px at 0% 0%, ${divisionColor}50 0%, transparent 60%)`,
        borderColor: `${divisionColor}40`
      }}>
        <h2 style={{ marginTop: 0, color: divisionColor }}>Known For</h2>
        <div className="knownForGrid">
          {crew.expertise.knownFor.map((k, i) => (
            <div key={i} className="knownForItem">
              <span className="kfIcon" style={{ color: divisionColor }}>⭐</span>
              <span>{k}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Use Cases */}
      <div className="card span-8" style={{
        background: `linear-gradient(180deg, rgba(13,16,34,.88), rgba(11,15,29,.62)), radial-gradient(ellipse 600px 350px at 0% 0%, ${divisionColor}50 0%, transparent 60%)`,
        borderColor: `${divisionColor}40`
      }}>
        <h2 style={{ marginTop: 0, color: divisionColor }}>When to Consult</h2>
        <div className="useCases">
          {crew.typicalUseCases.map((u, i) => (
            <div key={i} className="useCase">
              <span className="ucIcon" style={{ color: divisionColor }}>→</span>
              <span>{u}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Works With */}
      <div className="card span-4" style={{
        background: `linear-gradient(180deg, rgba(13,16,34,.88), rgba(11,15,29,.62)), radial-gradient(ellipse 400px 300px at 0% 0%, ${divisionColor}50 0%, transparent 60%)`,
        borderColor: `${divisionColor}40`
      }}>
        <h2 style={{ marginTop: 0, color: divisionColor }}>Collaborates With</h2>
        <div className="collabList">
          {crew.worksWith.filter(w => w !== 'all_crew_members').map((w, i) => (
            <Link key={i} href={`/crew/${w}`} className="collabItem">
              <div className="collabAvatar">
                <Image 
                  src={`/crew-avatars/${w}.jpg`} 
                  alt={w}
                  fill
                  sizes="32px"
                  className="avatarImage"
                />
              </div>
              <span className="collabName">{w.replace(/_/g, ' ')}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Memory Alpha */}
      {crew.memoryAlpha && (
        <div className="card span-12" style={{
          background: `linear-gradient(180deg, rgba(13,16,34,.88), rgba(11,15,29,.62)), radial-gradient(ellipse 800px 400px at 0% 0%, ${divisionColor}50 0%, transparent 60%)`,
          borderColor: `${divisionColor}40`
        }}>
          <h2 style={{ marginTop: 0, color: divisionColor }}>
            📚 Memory Alpha Data
            {crew.memoryAlpha.source && (
              <a href={crew.memoryAlpha.source} target="_blank" rel="noopener noreferrer" className="sourceLink">
                View Source ↗
              </a>
            )}
          </h2>
          <div className="memoryAlphaGrid">
            {crew.memoryAlpha.fullName && (
              <div className="maItem">
                <div className="maLabel">Full Name</div>
                <div className="maValue">{crew.memoryAlpha.fullName}</div>
              </div>
            )}
            {crew.memoryAlpha.species && (
              <div className="maItem">
                <div className="maLabel">Species</div>
                <div className="maValue">{crew.memoryAlpha.species}</div>
              </div>
            )}
            {crew.memoryAlpha.birthYear && (
              <div className="maItem">
                <div className="maLabel">Birth Year</div>
                <div className="maValue">{crew.memoryAlpha.birthYear}</div>
              </div>
            )}
            {crew.memoryAlpha.birthPlace && (
              <div className="maItem span-2">
                <div className="maLabel">Birth Place</div>
                <div className="maValue">{crew.memoryAlpha.birthPlace}</div>
              </div>
            )}
          </div>

          {crew.memoryAlpha.assignments && crew.memoryAlpha.assignments.length > 0 && (
            <div className="maSection">
              <h3>Assignments</h3>
              <ul>
                {crew.memoryAlpha.assignments.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}

          {crew.memoryAlpha.notableEvents && crew.memoryAlpha.notableEvents.length > 0 && (
            <div className="maSection">
              <h3>Notable Events</h3>
              <ul>
                {crew.memoryAlpha.notableEvents.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          {crew.memoryAlpha.keyRelationships && crew.memoryAlpha.keyRelationships.length > 0 && (
            <div className="maSection">
              <h3>Key Relationships</h3>
              <div className="relationshipGrid">
                {crew.memoryAlpha.keyRelationships.map((r, i) => (
                  <div key={i} className="relationship">
                    <div className="relName">{r.name}</div>
                    <div className="relType">{r.relation}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
