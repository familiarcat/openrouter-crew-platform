'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Project, 
  ProjectDomain,
  ProjectSummary,
  getScoreColor, 
  getScoreLabel,
  getStatusColor, 
  getStatusIcon,
  FACTORY_PROJECT_ID,
  createFactoryProject,
} from '../../../../lib/projects';
import { 
  DomainStatusBar, 
  ScoreBar, 
  DomainProgressList,
  DomainSummaryStrip,
} from '../../../../components/DomainStatusBar';

export default function ProjectDomainsPage() {
  const params = useParams();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [childProjects, setChildProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      loadData();
    }
  }, [projectId]);

  async function loadData() {
    setLoading(true);
    try {
      // Load project
      if (projectId === FACTORY_PROJECT_ID) {
        setProject(createFactoryProject());
      } else {
        const res = await fetch(`/api/projects?id=${projectId}`);
        const data = await res.json();
        if (data.project) {
          setProject(data.project);
        }
      }
      
      // Load child projects
      const childRes = await fetch(`/api/projects`);
      const childData = await childRes.json();
      const children = (childData.projects || []).filter(
        (p: ProjectSummary) => p.parentId === projectId
      );
      setChildProjects(children);
    } catch (error) {
      console.error('Failed to load:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 48 }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
        <p style={{ color: 'var(--muted)' }}>Loading domains...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 48 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>❓</div>
        <h2>Project Not Found</h2>
        <Link href="/projects">
          <button style={{
            marginTop: 16,
            padding: '12px 24px',
            background: 'var(--accent)',
            border: 'none',
            borderRadius: 8,
            color: 'white',
            cursor: 'pointer',
          }}>
            ← Back to Projects
          </button>
        </Link>
      </div>
    );
  }

  const overallProgress = project.domains.length > 0
    ? Math.round(project.domains.reduce((sum, d) => sum + d.progress, 0) / project.domains.length)
    : 0;

  function DomainCard({ domain, index }: { domain: ProjectDomain; index: number }) {
    const statusColors = {
      'planned': '#6b7280',
      'in-progress': '#3b82f6',
      'completed': '#10b981',
    };

    return (
      <div 
        className="card"
        style={{ 
          borderLeft: `4px solid ${getScoreColor(domain.scores.demand)}`,
          background: `linear-gradient(135deg, var(--surface) 0%, ${getScoreColor(domain.scores.demand)}08 100%)`,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ 
                width: 24, 
                height: 24, 
                borderRadius: '50%', 
                background: 'var(--accent)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 'bold',
              }}>
                {index + 1}
              </span>
              {domain.name}
            </h3>
            <p className="small" style={{ margin: '4px 0 0', color: 'var(--muted)' }}>
              {domain.description}
            </p>
          </div>
          <span 
            style={{ 
              padding: '4px 10px', 
              borderRadius: 6, 
              fontSize: 11,
              background: `${statusColors[domain.status]}20`,
              color: statusColors[domain.status],
              textTransform: 'capitalize',
              fontWeight: 500,
            }}
          >
            {domain.status}
          </span>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
            <span style={{ color: 'var(--muted)' }}>Progress</span>
            <span style={{ fontWeight: 'bold' }}>{domain.progress}%</span>
          </div>
          <div style={{ 
            height: 8, 
            background: 'var(--bg)', 
            borderRadius: 4,
            overflow: 'hidden'
          }}>
            <div style={{ 
              width: `${domain.progress}%`, 
              height: '100%', 
              background: `linear-gradient(90deg, ${statusColors[domain.status]}, ${getScoreColor(domain.scores.demand)})`,
              borderRadius: 4,
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>

        {/* Scores Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(5, 1fr)', 
          gap: 8,
          padding: 12,
          background: 'var(--bg)',
          borderRadius: 8,
          marginBottom: 12,
        }}>
          {[
            { key: 'demand', label: 'Demand', icon: '📈' },
            { key: 'effort', label: 'Effort', icon: '💪' },
            { key: 'monetization', label: 'Revenue', icon: '💰' },
            { key: 'differentiation', label: 'Unique', icon: '✨' },
            { key: 'risk', label: 'Risk', icon: '⚠️' },
          ].map(({ key, label, icon }) => (
            <div key={key} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 16, marginBottom: 2 }}>{icon}</div>
              <div style={{ 
                fontSize: 18, 
                fontWeight: 'bold', 
                color: getScoreColor(domain.scores[key as keyof typeof domain.scores]),
              }}>
                {domain.scores[key as keyof typeof domain.scores]}
              </div>
              <div style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase' }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Features */}
        {domain.features.length > 0 && (
          <div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6, fontWeight: 500 }}>
              Features / Buyers
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {domain.features.map((f, i) => (
                <span key={i} style={{
                  padding: '3px 8px',
                  background: 'var(--surface)',
                  borderRadius: 4,
                  fontSize: 11,
                  border: '1px solid var(--border)',
                }}>
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div className="card" style={{ 
        background: project.isFactory 
          ? 'linear-gradient(135deg, var(--surface) 0%, rgba(16, 185, 129, 0.15) 100%)'
          : 'linear-gradient(135deg, var(--surface) 0%, rgba(59, 130, 246, 0.1) 100%)',
        borderLeft: `4px solid ${project.isFactory ? '#10b981' : 'var(--accent)'}`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Link href={`/projects/${projectId}`} style={{ color: 'var(--muted)', fontSize: 12 }}>
                ← {project.name}
              </Link>
            </div>
            <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
              🏗️ {project.isFactory ? 'Factory Domains' : 'Project Domains'}
              <span style={{ 
                fontSize: 14, 
                fontWeight: 'normal',
                padding: '4px 12px',
                background: 'var(--accent)',
                borderRadius: 12,
              }}>
                {project.domains.length}
              </span>
            </h1>
            <p style={{ margin: '8px 0 0', color: 'var(--muted)' }}>
              {project.isFactory 
                ? 'Core categories that define project templates' 
                : 'Bounded contexts within this project'}
            </p>
          </div>
          
          {/* Overall Progress */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 32, fontWeight: 'bold', color: 'var(--accent)' }}>
              {overallProgress}%
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Overall Progress</div>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div style={{ marginTop: 16 }}>
          <div style={{ 
            height: 12, 
            background: 'var(--bg)', 
            borderRadius: 6,
            overflow: 'hidden'
          }}>
            <div style={{ 
              width: `${overallProgress}%`, 
              height: '100%', 
              background: `linear-gradient(90deg, var(--accent), ${project.isFactory ? '#10b981' : '#3b82f6'})`,
              borderRadius: 6,
            }} />
          </div>
        </div>
      </div>

      {/* Domain Status Summary - Horizontal Bar */}
      <div className="card">
        <h3 style={{ margin: '0 0 16px', fontSize: 14 }}>Domain Progress Overview</h3>
        <DomainStatusBar domains={project.domains} height={56} />
      </div>

      {/* Status Counts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <div className="card" style={{ textAlign: 'center', padding: 16 }}>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: '#6b7280' }}>
            {project.domains.filter(d => d.status === 'planned').length}
          </div>
          <div className="small" style={{ color: 'var(--muted)' }}>📋 Planned</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: 16 }}>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: '#3b82f6' }}>
            {project.domains.filter(d => d.status === 'in-progress').length}
          </div>
          <div className="small" style={{ color: 'var(--muted)' }}>🔄 In Progress</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: 16 }}>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: '#10b981' }}>
            {project.domains.filter(d => d.status === 'completed').length}
          </div>
          <div className="small" style={{ color: 'var(--muted)' }}>✅ Completed</div>
        </div>
      </div>

      {/* Project Scorecard */}
      <div className="card">
        <h3 style={{ margin: '0 0 16px', fontSize: 14 }}>📊 Aggregated Scores</h3>
        <ScoreBar scores={project.scores} />
      </div>

      {/* Domains List with Progress Bars */}
      <div className="card">
        <h3 style={{ margin: '0 0 16px', fontSize: 14 }}>🏗️ All Domains</h3>
        <DomainProgressList domains={project.domains} />
      </div>

      {/* Child Projects */}
      {childProjects.length > 0 && (
        <div className="card">
          <h2 style={{ margin: '0 0 16px', fontSize: 16 }}>
            📦 Child Projects
            <span style={{ 
              marginLeft: 8,
              fontSize: 12, 
              fontWeight: 'normal',
              padding: '2px 8px',
              background: 'var(--surface)',
              borderRadius: 8,
            }}>
              {childProjects.length}
            </span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
            {childProjects.map(child => (
              <Link 
                key={child.id} 
                href={`/projects/${child.id}/domains`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div style={{ 
                  padding: 12, 
                  background: 'var(--surface)', 
                  borderRadius: 8,
                  borderLeft: `3px solid ${getStatusColor(child.status)}`,
                  cursor: 'pointer',
                }}>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>
                    {getStatusIcon(child.status)} {child.name}
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    fontSize: 11,
                    color: 'var(--muted)',
                  }}>
                    <span>{child.domainCount} domains</span>
                    <span>{child.progress}%</span>
                  </div>
                  <div style={{ 
                    marginTop: 8,
                    height: 4, 
                    background: 'var(--bg)', 
                    borderRadius: 2,
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      width: `${child.progress}%`, 
                      height: '100%', 
                      background: getStatusColor(child.status),
                    }} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Hierarchy Info */}
      <div className="card" style={{ 
        background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.1) 0%, var(--surface) 100%)',
        borderLeft: '3px solid #a78bfa',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ fontSize: 32 }}>🌳</div>
          <div>
            <h3 style={{ margin: 0, color: '#a78bfa' }}>Domain Hierarchy</h3>
            <p className="small" style={{ margin: '8px 0 0', color: 'var(--muted)' }}>
              {project.isFactory ? (
                <>
                  <strong>Factory domains</strong> define the templates for new projects. 
                  Each generated project inherits these categories as its initial domains, 
                  which can then be customized for the specific project context.
                </>
              ) : (
                <>
                  <strong>Project domains</strong> represent bounded contexts within this project. 
                  Progress here rolls up to the parent project and ultimately to the factory.
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}





