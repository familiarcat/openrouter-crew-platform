'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { categories } from '../../lib/categories';
import { templateForCategorySlug } from '../../lib/projectTemplates';

// Cyan theme for Create page (per Senior Staff Color Theory)
const theme = {
  accent: '#00c2ff',
  glow: 'rgba(0,194,255,.50)',
};

// Path-specific accents
const pathThemes = {
  conceptualize: { accent: '#a78bfa', glow: 'rgba(167,139,250,.50)', icon: '💡' }, // Purple - creative
  structured: { accent: '#00c2ff', glow: 'rgba(0,194,255,.50)', icon: '🏗️' },     // Cyan - technical
  rapid: { accent: '#f59e0b', glow: 'rgba(245,158,11,.50)', icon: '⚡' },          // Amber - speed
  youtube: { accent: '#ff5c93', glow: 'rgba(255,92,147,.50)', icon: '🎬' },        // Magenta - content
};

const cardStyle = (size: 'large' | 'medium' | 'small' = 'medium', accent = theme.accent, glow = theme.glow) => {
  const ellipseSizes = { large: '900px 450px', medium: '600px 350px', small: '400px 300px' };
  return {
    background: `linear-gradient(180deg, rgba(13,16,34,.88), rgba(11,15,29,.62)), radial-gradient(ellipse ${ellipseSizes[size]} at 0% 0%, ${glow} 0%, transparent 60%)`,
    borderColor: `${accent}50`,
  };
};

// Templates for conceptualize path
const conceptualizeTemplates = [
  { 
    name: 'Creative Product Idea', 
    description: 'Generate a full product concept with target users, workflows, and monetization',
    body: (topic: string) => 
`Create a product concept for creative minds about: ${topic}

## Target User
- Who is this for?
- What problem do they have?

## Core Workflow (3 steps)
1. 
2. 
3. 

## What makes it delightful
- 

## Monetization model
- 

## What makes it defensible
- 

---
💡 This prompt is optimized for vibe coding. Paste into your AI assistant to scaffold the project.` 
  },
  { 
    name: 'RAG Feature Spec', 
    description: 'Define a RAG-backed feature with retrieval sources and quality metrics',
    body: (topic: string) =>
`Write a concise feature spec for a RAG-backed experience about: ${topic}

## User Story
As a [user type], I want to [action] so that [benefit].

## Retrieval Sources
- 
- 

## Quality Metrics
- Relevance score threshold:
- Citation accuracy:
- Response latency:

## Diagnostics Requirements
- Trace visibility:
- Citation display:

## Governance/Refresh Requirements
- Update frequency:
- Audit trail:

---
💡 This prompt is optimized for vibe coding. Paste into your AI assistant to implement the feature.` 
  },
  { 
    name: 'Launch Plan', 
    description: 'Create a 30-day launch strategy with scope, metrics, and outreach',
    body: (topic: string) =>
`Draft a 30-day launch plan for: ${topic}

## MVP Scope (Week 1-2)
- Core features:
- Out of scope:

## Success Metrics
- Primary KPI:
- Secondary metrics:

## Risks & Mitigations
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
|      |            |        |            |

## Outreach Strategy (Week 3-4)
- Channels:
- Messaging:
- Launch assets:

---
💡 This prompt is optimized for vibe coding. Share with your team or AI assistant.` 
  },
  {
    name: 'Vibe Code Scaffold',
    description: 'Generate a complete project scaffold prompt for AI coding assistants',
    body: (topic: string) =>
`Create a complete project scaffold for: ${topic}

## Project Overview
- Name:
- Purpose:
- Tech stack: Next.js 14, TypeScript, Tailwind CSS

## Directory Structure
\`\`\`
/app
  /api
  /components
  /lib
\`\`\`

## Core Components Needed
1. 
2. 
3. 

## Data Models
- 

## API Routes
- 

## Styling Guidelines
- Dark theme with accent colors
- Glassmorphism cards
- Responsive grid layout

---
💡 Paste this entire prompt into Cursor, Copilot, or Claude to scaffold your project.`
  }
];

type CreationPath = 'select' | 'conceptualize' | 'structured' | 'rapid' | 'youtube';

// YouTube project types
interface YouTubeProject {
  id: string;
  name: string;
  tagline: string;
  description: string;
  domain: string;
  crewAnalysis: {
    consensus: string;
    [key: string]: any;
  };
  techStack: string[];
  estimatedEffort: { mvpDays: number; fullDays: number; teamSize: number; complexity: string };
  monetization: { primaryModel: string; estimatedMRR: string; timeToRevenue: string; revenueStreams: any[] };
  mvpFeatures: string[];
  successMetrics: string[];
}

export default function CreatePage() {
  const router = useRouter();
  const [path, setPath] = useState<CreationPath>('select');

  // Conceptualize state
  const [topic, setTopic] = useState('a Next.js AI studio for DJs');
  const [tpl, setTpl] = useState(conceptualizeTemplates[0].name);
  const [draft, setDraft] = useState(conceptualizeTemplates[0].body('a Next.js AI studio for DJs'));
  
  // Structured state
  const [category, setCategory] = useState<string>('');
  const [projectName, setProjectName] = useState<string>('');
  const [projectDraft, setProjectDraft] = useState<string>('');
  
  // YouTube state
  const [youtubeUrl, setYoutubeUrl] = useState('https://www.youtube.com/watch?v=S8a7gkFhoBA');
  const [youtubeLoading, setYoutubeLoading] = useState(false);
  const [youtubeProjects, setYoutubeProjects] = useState<YouTubeProject[]>([]);
  const [selectedYoutubeProject, setSelectedYoutubeProject] = useState(0);
  const [showCrewDetails, setShowCrewDetails] = useState(false);
  
  const [saving, setSaving] = useState(false);

  // Update conceptualize draft when template or topic changes
  function regenerateConceptualize(nextTopic?: string, nextTpl?: string) {
    const t = conceptualizeTemplates.find(x => x.name === (nextTpl || tpl)) || conceptualizeTemplates[0];
    const top = nextTopic ?? topic;
    setDraft(t.body(top));
  }

  // Structured project template
  const tmpl = useMemo(() => templateForCategorySlug(category || undefined), [category]);

  useEffect(() => {
    if (path === 'structured') {
      setProjectName(tmpl.title);
      const body = [
        `# ${tmpl.title}`,
        ``,
        `**Category:** ${category || 'none selected'}`,
        `**Summary:** ${tmpl.summary}`,
        ``,
        `## Sections`,
        ...tmpl.sections.map(s => `- ${s}`),
        ``,
        `## Notes`,
        `- `,
      ].join('\n');
      setProjectDraft(body);
    }
  }, [tmpl, category, path]);

  async function saveNote() {
    setSaving(true);
    await fetch('/api/notes', { 
      method:'POST', 
      headers:{'Content-Type':'application/json'}, 
      body: JSON.stringify({ title: `${tpl}: ${topic}`, text: draft }) 
    });
    setSaving(false);
    alert('Saved to user_notes.json (and becomes searchable by RAG).');
  }

  async function createProject() {
    if (!projectName.trim()) {
      alert('Please enter a project name');
      return;
    }
    
    setSaving(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName,
          category: category || 'ai-observability-diagnostics',
          source: 'structured',
          tagline: `A ${categories.find(c => c.slug === category)?.name || 'new'} project`,
          description: projectDraft,
          status: 'draft',
        }),
      });
      const data = await res.json();
      setSaving(false);
      
      if (data.ok && data.id) {
        router.push(`/projects/${data.id}`);
      } else {
        alert('Project creation failed: ' + (data.error || 'unknown'));
      }
    } catch (error) {
      setSaving(false);
      alert('Project creation failed: ' + (error instanceof Error ? error.message : 'unknown'));
    }
  }
  
  async function createConceptualizeProject() {
    if (!topic.trim()) {
      alert('Please enter a topic');
      return;
    }
    
    setSaving(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: topic,
          source: 'conceptualize',
          tagline: `Conceptualized: ${tpl}`,
          description: draft,
          status: 'draft',
        }),
      });
      const data = await res.json();
      setSaving(false);
      
      if (data.ok && data.id) {
        // Also save to RAG
        await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: `${tpl}: ${topic}`, text: draft }),
        });
        router.push(`/projects/${data.id}`);
      } else {
        alert('Project creation failed: ' + (data.error || 'unknown'));
      }
    } catch (error) {
      setSaving(false);
      alert('Project creation failed: ' + (error instanceof Error ? error.message : 'unknown'));
    }
  }
  
  async function createYoutubeProject(projectIndex: number) {
    const project = youtubeProjects[projectIndex];
    if (!project) return;
    
    setSaving(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: project.name,
          source: 'youtube',
          sourceUrl: youtubeUrl,
          tagline: project.tagline,
          description: project.description,
          techStack: {
            frontend: project.techStack.filter((t: string) => ['React', 'Next.js', 'Vue', 'Angular', 'TypeScript'].some(f => t.includes(f))),
            backend: project.techStack.filter((t: string) => ['Node', 'Python', 'API', 'Server'].some(f => t.includes(f))),
            infrastructure: project.techStack.filter((t: string) => ['AWS', 'Docker', 'Cloud', 'Deploy'].some(f => t.includes(f))),
            ai: project.techStack.filter((t: string) => ['AI', 'ML', 'OpenAI', 'GPT', 'LLM', 'RAG'].some(f => t.includes(f))),
            other: project.techStack.filter((t: string) => !['React', 'Next.js', 'Node', 'AWS', 'AI', 'ML'].some(f => t.includes(f))),
          },
          monetization: {
            model: project.monetization?.primaryModel || 'saas',
            targetPrice: project.monetization?.estimatedMRR || 'TBD',
            revenueStreams: project.monetization?.revenueStreams?.map((r: { name: string }) => r.name) || [],
            timeline: project.monetization?.timeToRevenue || 'TBD',
          },
          mvpFeatures: project.mvpFeatures || [],
          successMetrics: project.successMetrics || [],
          crew: project.crewAnalysis ? Object.entries(project.crewAnalysis).map(([id, analysis]) => ({
            crewMemberId: id,
            role: (analysis as { role?: string }).role || 'Advisor',
            assignedAt: new Date().toISOString(),
            contributions: [(analysis as { insight?: string }).insight || ''],
          })) : [],
          status: 'draft',
        }),
      });
      const data = await res.json();
      setSaving(false);
      
      if (data.ok && data.id) {
        router.push(`/projects/${data.id}`);
      } else {
        alert('Project creation failed: ' + (data.error || 'unknown'));
      }
    } catch (error) {
      setSaving(false);
      alert('Project creation failed: ' + (error instanceof Error ? error.message : 'unknown'));
    }
  }

  async function generateYoutubeProjects() {
    setYoutubeLoading(true);
    setYoutubeProjects([]);
    try {
      const res = await fetch('/api/youtube-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: youtubeUrl }),
      });
      const data = await res.json();
      if (data.projects) {
        setYoutubeProjects(data.projects);
        setSelectedYoutubeProject(0);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setYoutubeLoading(false);
    }
  }

  // Path selection screen
  if (path === 'select') {
    // Bento card style with flex grow for equal heights
    const bentoCardStyle = (pathKey: keyof typeof pathThemes, disabled = false) => ({
      ...cardStyle('medium', pathThemes[pathKey].accent, pathThemes[pathKey].glow),
      display: 'flex',
      flexDirection: 'column' as const,
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s',
      opacity: disabled ? 0.6 : 1,
      flex: '1 1 0',
      minWidth: 220,
    });

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Header */}
        <div className="card" style={cardStyle('large')}>
          <h1 style={{ marginTop: 0, color: theme.accent }}>🚀 Create New Project</h1>
          <p style={{ fontSize: 16, color: 'var(--muted)', maxWidth: 700, margin: 0 }}>
            Choose your creation path. Each approach is designed for different workflows and preferences.
          </p>
        </div>

        {/* Path Selection Cards - Bento Grid */}
        <div style={{ 
          display: 'flex', 
          gap: 16, 
          alignItems: 'stretch',
          flexWrap: 'wrap',
        }}>
          {/* Conceptualize */}
          <div 
            style={bentoCardStyle('conceptualize')}
            onClick={() => setPath('conceptualize')}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>💡</div>
            <h2 style={{ marginTop: 0, marginBottom: 8, color: pathThemes.conceptualize.accent }}>Conceptualize</h2>
            <p className="small" style={{ color: 'var(--muted)', margin: '0 0 8px' }}>
              <strong>Best for:</strong> Ideation, vibe coding
            </p>
            <p className="small" style={{ flex: 1, margin: 0 }}>
              Generate structured prompts for AI coding assistants. Perfect for articulating ideas.
            </p>
            <div style={{ 
              marginTop: 16, 
              padding: '8px 12px', 
              background: `${pathThemes.conceptualize.accent}20`,
              borderRadius: 8,
              fontSize: 12,
              color: pathThemes.conceptualize.accent,
              textAlign: 'center',
            }}>
              ✨ 4 templates
            </div>
          </div>

          {/* Structured */}
          <div 
            style={bentoCardStyle('structured')}
            onClick={() => setPath('structured')}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>🏗️</div>
            <h2 style={{ marginTop: 0, marginBottom: 8, color: pathThemes.structured.accent }}>Structured</h2>
            <p className="small" style={{ color: 'var(--muted)', margin: '0 0 8px' }}>
              <strong>Best for:</strong> Category-based, n8n
            </p>
            <p className="small" style={{ flex: 1, margin: 0 }}>
              Select a category for templated briefs. Triggers n8n crew scaffolding.
            </p>
            <div style={{ 
              marginTop: 16, 
              padding: '8px 12px', 
              background: `${pathThemes.structured.accent}20`,
              borderRadius: 8,
              fontSize: 12,
              color: pathThemes.structured.accent,
              textAlign: 'center',
            }}>
              🔧 {categories.length} categories
            </div>
          </div>

          {/* Rapid Prototype */}
          <div 
            style={bentoCardStyle('rapid', true)}
            title="Coming soon"
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚡</div>
            <h2 style={{ marginTop: 0, marginBottom: 8, color: pathThemes.rapid.accent }}>Rapid Prototype</h2>
            <p className="small" style={{ color: 'var(--muted)', margin: '0 0 8px' }}>
              <strong>Best for:</strong> Quick experiments, MVPs
            </p>
            <p className="small" style={{ flex: 1, margin: 0 }}>
              One-click project generation with sensible defaults. Get a working prototype in minutes.
            </p>
            <div style={{ 
              marginTop: 16, 
              padding: '8px 12px', 
              background: `${pathThemes.rapid.accent}20`,
              borderRadius: 8,
              fontSize: 12,
              color: pathThemes.rapid.accent,
              textAlign: 'center',
            }}>
              🔜 Coming soon
            </div>
          </div>

          {/* Content-Driven */}
          <div 
            style={bentoCardStyle('youtube')}
            onClick={() => setPath('youtube')}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎬</div>
            <h2 style={{ marginTop: 0, marginBottom: 8, color: pathThemes.youtube.accent }}>Content-Driven</h2>
            <p className="small" style={{ color: 'var(--muted)', margin: '0 0 8px' }}>
              <strong>Best for:</strong> Learning from content
            </p>
            <p className="small" style={{ flex: 1, margin: 0 }}>
              Paste a YouTube URL and let the crew analyze content to generate project proposals.
            </p>
            <div style={{ 
              marginTop: 16, 
              padding: '8px 12px', 
              background: `${pathThemes.youtube.accent}20`,
              borderRadius: 8,
              fontSize: 12,
              color: pathThemes.youtube.accent,
              textAlign: 'center',
            }}>
              🖖 Full crew collaboration
            </div>
          </div>
        </div>

        {/* Troi's Insight */}
        <div className="card" style={cardStyle('small')}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ fontSize: 32 }}>🧠</div>
            <div>
              <h3 style={{ margin: 0, color: theme.accent }}>Troi&apos;s UX Insight</h3>
              <p className="small" style={{ margin: '8px 0 0', color: 'var(--muted)' }}>
                Research shows that <strong>choice architecture</strong> significantly impacts creative outcomes. 
                Users who consciously select their workflow path report 40% higher satisfaction with their results.
                The act of choosing creates psychological commitment to the process.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Conceptualize Path
  if (path === 'conceptualize') {
    const currentTheme = pathThemes.conceptualize;
    return (
      <div className="grid">
        <div className="card span-12" style={cardStyle('large', currentTheme.accent, currentTheme.glow)}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <button 
                onClick={() => setPath('select')} 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: currentTheme.accent, 
                  cursor: 'pointer',
                  fontSize: 14,
                  marginBottom: 8,
                  padding: 0,
                }}
              >
                ← Back to paths
              </button>
              <h1 style={{ marginTop: 0, color: currentTheme.accent }}>💡 Conceptualize</h1>
            </div>
            <div style={{ 
              padding: '8px 16px', 
              background: `${currentTheme.accent}15`, 
              borderRadius: 20,
              border: `1px solid ${currentTheme.accent}40`,
              fontSize: 13,
              color: currentTheme.accent
            }}>
              Vibe Coding Mode
            </div>
          </div>
          <p className="small">
            Transform your ideas into structured prompts optimized for AI coding assistants.
            These become part of your RAG knowledge base for future retrieval.
          </p>
          
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
            <input 
              value={topic} 
              onChange={e => setTopic(e.target.value)} 
              onBlur={() => regenerateConceptualize()} 
              placeholder="Describe your project idea..."
              style={{
                flex: 1,
                minWidth: 260,
                padding: 12,
                borderRadius: 12,
                border: `1px solid ${currentTheme.accent}40`,
                background: `${currentTheme.accent}10`,
                color: 'var(--text)'
              }}
            />
            <select 
              value={tpl} 
              onChange={e => { setTpl(e.target.value); regenerateConceptualize(topic, e.target.value); }} 
              style={{
                padding: 12,
                borderRadius: 12,
                border: `1px solid ${currentTheme.accent}40`,
                background: `${currentTheme.accent}10`,
                color: 'var(--text)'
              }}
            >
              {conceptualizeTemplates.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
            </select>
            <button 
              onClick={() => regenerateConceptualize()} 
              style={{
                padding: '12px 16px',
                borderRadius: 12,
                border: `1px solid ${currentTheme.accent}50`,
                background: `${currentTheme.accent}15`,
                color: currentTheme.accent,
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              🔄 Regenerate
            </button>
          </div>
        </div>

        {/* Template Pills */}
        <div className="card span-12" style={cardStyle('small', currentTheme.accent, currentTheme.glow)}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {conceptualizeTemplates.map(t => (
              <button
                key={t.name}
                onClick={() => { setTpl(t.name); regenerateConceptualize(topic, t.name); }}
                style={{
                  padding: '8px 14px',
                  borderRadius: 20,
                  border: `1px solid ${tpl === t.name ? currentTheme.accent : 'rgba(255,255,255,.15)'}`,
                  background: tpl === t.name ? `${currentTheme.accent}25` : 'rgba(255,255,255,.05)',
                  color: tpl === t.name ? currentTheme.accent : 'var(--muted)',
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {t.name}
              </button>
            ))}
          </div>
          <p className="small" style={{ margin: '12px 0 0', color: 'var(--muted)' }}>
            {conceptualizeTemplates.find(t => t.name === tpl)?.description}
          </p>
        </div>

        <div className="card span-12" style={cardStyle('large', currentTheme.accent, currentTheme.glow)}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ marginTop: 0, color: currentTheme.accent }}>📝 Generated Prompt</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                onClick={() => navigator.clipboard.writeText(draft)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: `1px solid ${currentTheme.accent}40`,
                  background: `${currentTheme.accent}10`,
                  color: currentTheme.accent,
                  fontSize: 13,
                  cursor: 'pointer'
                }}
              >
                📋 Copy
              </button>
              <button 
                onClick={saveNote} 
                disabled={saving} 
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: '1px solid rgba(40,217,154,.45)',
                  background: 'rgba(40,217,154,.15)',
                  color: 'var(--ok)',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer'
                }}
              >
                {saving ? 'Saving…' : '💾 Save to RAG'}
              </button>
              <button 
                onClick={createConceptualizeProject} 
                disabled={saving} 
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: `1px solid ${currentTheme.accent}`,
                  background: currentTheme.accent,
                  color: 'white',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer'
                }}
              >
                {saving ? 'Creating…' : '🚀 Create Project'}
              </button>
            </div>
          </div>
          <textarea 
            value={draft} 
            onChange={e => setDraft(e.target.value)} 
            style={{
              width: '100%',
              minHeight: 400,
              padding: 16,
              borderRadius: 12,
              border: `1px solid ${currentTheme.accent}30`,
              background: `${currentTheme.accent}08`,
              color: 'var(--text)',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New',
              lineHeight: 1.7,
              fontSize: 14
            }}
          />
        </div>
      </div>
    );
  }

  // Structured Path
  if (path === 'structured') {
    const currentTheme = pathThemes.structured;
    return (
      <div className="grid">
        <div className="card span-12" style={cardStyle('large', currentTheme.accent, currentTheme.glow)}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <button 
                onClick={() => setPath('select')} 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: currentTheme.accent, 
                  cursor: 'pointer',
                  fontSize: 14,
                  marginBottom: 8,
                  padding: 0,
                }}
              >
                ← Back to paths
              </button>
              <h1 style={{ marginTop: 0, color: currentTheme.accent }}>🏗️ Structured Project</h1>
            </div>
            <div style={{ 
              padding: '8px 16px', 
              background: `${currentTheme.accent}15`, 
              borderRadius: 20,
              border: `1px solid ${currentTheme.accent}40`,
              fontSize: 13,
              color: currentTheme.accent
            }}>
              n8n Integration
            </div>
          </div>
          <p className="small">
            Pick a category → get a templated project brief → trigger your n8n &quot;crew&quot; to scaffold a new project repo.
          </p>
          
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16, alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label className="small" style={{ fontWeight: 600, color: currentTheme.accent }}>Category</label>
              <select 
                value={category} 
                onChange={e => setCategory(e.target.value)} 
                style={{
                  padding: 12,
                  borderRadius: 12,
                  border: `1px solid ${currentTheme.accent}40`,
                  background: `${currentTheme.accent}10`,
                  color: 'var(--text)',
                  minWidth: 200
                }}
              >
                <option value="">(select category)</option>
                {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
              <label className="small" style={{ fontWeight: 600, color: currentTheme.accent }}>Project Name</label>
              <input 
                value={projectName} 
                onChange={e => setProjectName(e.target.value)} 
                style={{
                  padding: 12,
                  borderRadius: 12,
                  border: `1px solid ${currentTheme.accent}40`,
                  background: `${currentTheme.accent}10`,
                  color: 'var(--text)',
                  minWidth: 260
                }}
              />
            </div>

            <button 
              className="btnPrimary" 
              onClick={createProject} 
              disabled={saving}
              style={{
                padding: '12px 20px',
                borderRadius: 12,
                border: `1px solid ${currentTheme.accent}`,
                background: currentTheme.accent,
                color: '#0d1022',
                fontWeight: 600,
                cursor: 'pointer',
                alignSelf: 'flex-end'
              }}
            >
              {saving ? 'Creating…' : '🚀 Create Project'}
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="card span-12" style={cardStyle('small', currentTheme.accent, currentTheme.glow)}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {categories.slice(0, 8).map(c => (
              <button
                key={c.slug}
                onClick={() => setCategory(c.slug)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 20,
                  border: `1px solid ${category === c.slug ? currentTheme.accent : 'rgba(255,255,255,.15)'}`,
                  background: category === c.slug ? `${currentTheme.accent}25` : 'rgba(255,255,255,.05)',
                  color: category === c.slug ? currentTheme.accent : 'var(--muted)',
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {c.name}
              </button>
            ))}
            {categories.length > 8 && (
              <span style={{ padding: '8px 14px', fontSize: 13, color: 'var(--muted)' }}>
                +{categories.length - 8} more
              </span>
            )}
          </div>
        </div>

        <div className="card span-12" style={cardStyle('large', currentTheme.accent, currentTheme.glow)}>
          <h2 style={{ marginTop: 0, color: currentTheme.accent }}>📝 Generated Brief (editable)</h2>
          <textarea 
            value={projectDraft} 
            onChange={e => setProjectDraft(e.target.value)} 
            style={{
              width: '100%',
              minHeight: 360,
              padding: 16,
              borderRadius: 12,
              border: `1px solid ${currentTheme.accent}30`,
              background: `${currentTheme.accent}08`,
              color: 'var(--text)',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New',
              lineHeight: 1.7,
              fontSize: 14
            }}
          />
        </div>

        <div className="card span-12" style={cardStyle('small', currentTheme.accent, currentTheme.glow)}>
          <p className="small" style={{ margin: 0, color: 'var(--muted)' }}>
            <strong>🔐 Secure credentials note:</strong> This app does <u>not</u> read <code>~/.zshrc</code>. 
            Export secrets in your shell and run <code>npm run dev</code> so Next.js receives them via <code>process.env</code>, 
            or copy them into <code>.env.local</code> (not committed).
          </p>
        </div>
      </div>
    );
  }

  // YouTube → Projects Path
  if (path === 'youtube') {
    const currentTheme = pathThemes.youtube;
    const currentProject = youtubeProjects[selectedYoutubeProject];
    
    return (
      <div className="grid">
        <div className="card span-12" style={cardStyle('large', currentTheme.accent, currentTheme.glow)}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <button 
                onClick={() => setPath('select')} 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: currentTheme.accent, 
                  cursor: 'pointer',
                  fontSize: 14,
                  marginBottom: 8,
                  padding: 0,
                }}
              >
                ← Back to paths
              </button>
              <h1 style={{ marginTop: 0, color: currentTheme.accent }}>🎬 Content-Driven Projects</h1>
            </div>
            <div style={{ 
              padding: '8px 16px', 
              background: `${currentTheme.accent}15`, 
              borderRadius: 20,
              border: `1px solid ${currentTheme.accent}40`,
              fontSize: 13,
              color: currentTheme.accent
            }}>
              🖖 Full Crew Collaboration
            </div>
          </div>
          <p className="small">
            Paste a YouTube URL and the crew will analyze the content to generate actionable project proposals with monetization strategies.
          </p>
          
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
            <input
              value={youtubeUrl}
              onChange={e => setYoutubeUrl(e.target.value)}
              placeholder="Paste YouTube URL..."
              style={{
                flex: 1,
                minWidth: 300,
                padding: 14,
                borderRadius: 12,
                border: `1px solid ${currentTheme.accent}40`,
                background: `${currentTheme.accent}10`,
                color: 'var(--text)',
                fontSize: 14,
              }}
            />
            <button
              onClick={generateYoutubeProjects}
              disabled={youtubeLoading}
              style={{
                padding: '14px 24px',
                borderRadius: 12,
                border: `1px solid ${currentTheme.accent}60`,
                background: youtubeLoading ? `${currentTheme.accent}10` : `${currentTheme.accent}25`,
                color: currentTheme.accent,
                fontWeight: 600,
                cursor: youtubeLoading ? 'wait' : 'pointer',
              }}
            >
              {youtubeLoading ? '🔄 Analyzing...' : '🚀 Generate Projects'}
            </button>
          </div>
        </div>

        {/* Crew Participants */}
        {youtubeProjects.length > 0 && (
          <div className="card span-12" style={cardStyle('small', '#7c5cff', 'rgba(124,92,255,.3)')}>
            <h3 style={{ marginTop: 0, color: '#7c5cff' }}>👥 Crew Analysis Complete</h3>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[
                { emoji: '👨‍✈️', name: 'Picard', role: 'Strategy' },
                { emoji: '🤖', name: 'Data', role: 'Analytics' },
                { emoji: '🔧', name: 'La Forge', role: 'Infrastructure' },
                { emoji: '💜', name: 'Troi', role: 'UX' },
                { emoji: '💰', name: 'Quark', role: 'Business' },
              ].map(crew => (
                <div
                  key={crew.name}
                  style={{
                    padding: '10px 14px',
                    background: 'rgba(255,255,255,.05)',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,.1)',
                    fontSize: 13,
                  }}
                >
                  <span>{crew.emoji}</span>
                  <span style={{ marginLeft: 6, fontWeight: 500 }}>{crew.name}</span>
                  <span style={{ marginLeft: 6, opacity: 0.6, fontSize: 11 }}>{crew.role}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Project Selection */}
        {youtubeProjects.length > 0 && (
          <div className="card span-12" style={cardStyle('small', '#00d4ff', 'rgba(0,212,255,.3)')}>
            <h3 style={{ marginTop: 0, color: '#00d4ff' }}>📊 Generated Projects</h3>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {youtubeProjects.map((project, idx) => (
                <button
                  key={project.id}
                  onClick={() => setSelectedYoutubeProject(idx)}
                  style={{
                    padding: '14px 18px',
                    borderRadius: 12,
                    border: selectedYoutubeProject === idx 
                      ? '2px solid #00d4ff' 
                      : '1px solid rgba(255,255,255,.2)',
                    background: selectedYoutubeProject === idx 
                      ? 'rgba(0,212,255,.2)' 
                      : 'rgba(255,255,255,.05)',
                    color: 'var(--text)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    flex: '1 1 220px',
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{project.name}</div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>{project.tagline}</div>
                  <div style={{ 
                    marginTop: 8, 
                    fontSize: 11, 
                    padding: '3px 8px', 
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
            {/* Overview + Effort */}
            <div className="card span-8" style={cardStyle('medium', '#27ae60', 'rgba(39,174,96,.3)')}>
              <h2 style={{ marginTop: 0, color: '#27ae60' }}>💡 {currentProject.name}</h2>
              <p style={{ fontSize: 16, fontStyle: 'italic', color: '#27ae60', marginBottom: 12 }}>
                &quot;{currentProject.tagline}&quot;
              </p>
              <p className="small" style={{ lineHeight: 1.7 }}>{currentProject.description}</p>
              
              <h4 style={{ color: '#27ae60', marginTop: 20 }}>Tech Stack</h4>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {currentProject.techStack.map((tech, i) => (
                  <span
                    key={i}
                    style={{
                      padding: '5px 10px',
                      background: 'rgba(39,174,96,.2)',
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div className="card span-4" style={cardStyle('small', '#ff9500', 'rgba(255,149,0,.3)')}>
              <h3 style={{ marginTop: 0, color: '#ff9500' }}>⏱️ Effort</h3>
              <div style={{ display: 'grid', gap: 10 }}>
                <div style={{ padding: 10, background: 'rgba(255,149,0,.1)', borderRadius: 8 }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#ff9500' }}>
                    {currentProject.estimatedEffort.mvpDays} days
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.7 }}>MVP Timeline</div>
                </div>
                <div style={{ padding: 10, background: 'rgba(255,149,0,.1)', borderRadius: 8 }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#ff9500' }}>
                    {currentProject.estimatedEffort.teamSize} people
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.7 }}>Team Size</div>
                </div>
              </div>
            </div>

            {/* Monetization + Features */}
            <div className="card span-6" style={cardStyle('medium', '#27ae60', 'rgba(39,174,96,.3)')}>
              <h3 style={{ marginTop: 0, color: '#27ae60' }}>💰 Monetization</h3>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, opacity: 0.7 }}>Model</div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{currentProject.monetization.primaryModel}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ padding: 10, background: 'rgba(39,174,96,.1)', borderRadius: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#27ae60' }}>
                    {currentProject.monetization.estimatedMRR}
                  </div>
                  <div style={{ fontSize: 10, opacity: 0.7 }}>Est. MRR</div>
                </div>
                <div style={{ padding: 10, background: 'rgba(39,174,96,.1)', borderRadius: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#27ae60' }}>
                    {currentProject.monetization.timeToRevenue}
                  </div>
                  <div style={{ fontSize: 10, opacity: 0.7 }}>Time to Revenue</div>
                </div>
              </div>
            </div>

            <div className="card span-6" style={cardStyle('medium', '#9b59b6', 'rgba(155,89,182,.3)')}>
              <h3 style={{ marginTop: 0, color: '#9b59b6' }}>✨ MVP Features</h3>
              <ul style={{ paddingLeft: 18, margin: 0, fontSize: 13 }}>
                {currentProject.mvpFeatures.map((feature, i) => (
                  <li key={i} style={{ marginBottom: 6 }}>{feature}</li>
                ))}
              </ul>
              
              <h4 style={{ marginTop: 16, color: '#9b59b6' }}>🎯 Success Metrics</h4>
              <ul style={{ paddingLeft: 18, margin: 0, fontSize: 13 }}>
                {currentProject.successMetrics.map((metric, i) => (
                  <li key={i} style={{ marginBottom: 6 }}>{metric}</li>
                ))}
              </ul>
            </div>

            {/* Crew Consensus */}
            <div className="card span-12" style={cardStyle('small', '#ffd700', 'rgba(255,215,0,.2)')}>
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
                  🖖 Crew Consensus
                </h3>
                <span>{showCrewDetails ? '▼' : '▶'}</span>
              </div>
              <p style={{ marginTop: 12, marginBottom: 0, lineHeight: 1.7, fontSize: 14 }}>
                {currentProject.crewAnalysis.consensus}
              </p>
            </div>

            {/* Create Project Button */}
            <div className="card span-12" style={{ 
              ...cardStyle('small', '#00c2ff', 'rgba(0,194,255,.3)'),
              textAlign: 'center',
              padding: '24px',
            }}>
              <h3 style={{ margin: '0 0 12px', color: '#00c2ff' }}>
                Ready to start this project?
              </h3>
              <p style={{ margin: '0 0 16px', color: 'var(--muted)', fontSize: 14 }}>
                Add &quot;{currentProject.name}&quot; to your active projects and begin development.
              </p>
              <button
                onClick={() => createYoutubeProject(selectedYoutubeProject)}
                disabled={saving}
                style={{
                  padding: '14px 28px',
                  borderRadius: 10,
                  border: 'none',
                  background: '#00c2ff',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: 'pointer',
                }}
              >
                {saving ? 'Creating Project...' : '🚀 Create Project'}
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return null;
}
