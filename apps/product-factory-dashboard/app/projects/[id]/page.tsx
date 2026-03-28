/**
 * Project Detail Page
 * Shows detailed information about a specific project
 */

import { notFound } from 'next/navigation';
import { readFile } from 'fs/promises';
import path from 'path';
import Link from 'next/link';
import { ProjectTimeline, Milestone } from '@/components/ProjectTimeline';
import HorizontalSprintTimeline from '@/components/HorizontalSprintTimeline';

interface Project {
  id: string;
  name: string;
  tagline?: string;
  description?: string;
  status: string;
  progress: number;
  scores: {
    demand: number;
    monetization: number;
    differentiation: number;
  };
  primaryCategory?: string;
  createdAt: string;
  updatedAt: string;
  domainCount?: number;
  domains?: Array<{ name: string; progress: number; status?: string }>;
  crew?: Array<{ memberId: string; role: string; assignment?: string }>;
  milestones?: Milestone[];
}

interface ProjectsData {
  projects: Project[];
  meta?: Record<string, unknown>;
}

async function getProject(id: string): Promise<Project | null> {
  try {
    const projectsFile = path.join(process.cwd(), 'data', 'projects.json');
    const content = await readFile(projectsFile, 'utf-8');
    const data: ProjectsData = JSON.parse(content);
    return data.projects.find((p) => p.id === id) || null;
  } catch (error) {
    console.error('Error loading project:', error);
    return null;
  }
}

function getScoreColor(score: number): string {
  if (score >= 8) return '#10b981';
  if (score >= 6) return '#3b82f6';
  if (score >= 4) return '#f59e0b';
  return '#ef4444';
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: '#10b981',
    draft: '#6b7280',
    paused: '#f59e0b',
    completed: '#8b5cf6',
    archived: '#64748b',
  };
  return colors[status] || '#6b7280';
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    notFound();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: 14, color: 'var(--muted)' }}>
        <Link href="/projects" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
          ← Back to Projects
        </Link>
      </div>

      {/* Header Card */}
      <div
        className="card"
        style={{
          background: `linear-gradient(135deg, var(--surface) 0%, ${getStatusColor(project.status)}20 100%)`,
          borderLeft: `4px solid ${getStatusColor(project.status)}`,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <h1 style={{ margin: 0, fontSize: 28 }}>{project.name}</h1>
              <span
                style={{
                  padding: '4px 12px',
                  borderRadius: 6,
                  fontSize: 12,
                  background: `${getStatusColor(project.status)}20`,
                  color: getStatusColor(project.status),
                  textTransform: 'capitalize',
                }}
              >
                {project.status}
              </span>
            </div>
            <p style={{ margin: '8px 0 0', fontSize: 16, color: 'var(--muted)' }}>
              {project.tagline || project.description}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 8 }}>
            <span style={{ color: 'var(--muted)' }}>Overall Progress</span>
            <span style={{ fontWeight: 'bold' }}>{project.progress}%</span>
          </div>
          <div
            style={{
              height: 8,
              background: 'var(--surface)',
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${project.progress}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${getStatusColor(project.status)}, var(--accent))`,
                borderRadius: 4,
              }}
            />
          </div>
        </div>
      </div>

      {/* Timeline Visualization */}
      {project.milestones && project.milestones.length > 0 && (
        <ProjectTimeline
          projectName={project.name}
          projectProgress={project.progress}
          milestones={project.milestones.map((m) => ({
            ...m,
            progress: m.status === 'completed' ? 100 : m.status === 'in-progress' ? 50 : 0,
            assignees: project.crew?.map((c) => c.memberId) || [],
          }))}
          mode="detailed"
          zoomLevel="all"
          interactive={true}
        />
      )}

      {/* Sprint Management Section */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--line)',
          background: 'linear-gradient(135deg, var(--accent1), var(--accent2))',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: 18 }}>🚀 Sprint Timeline</h2>
            <p style={{ margin: 0, fontSize: 13, opacity: 0.9 }}>
              Current sprint progress and story management
            </p>
          </div>
          <Link
            href={`/projects/${project.id}/sprints`}
            style={{
              color: 'white',
              textDecoration: 'none',
              padding: '8px 16px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '6px',
              fontSize: '14px',
              transition: 'background 0.2s'
            }}
          >
            Full View →
          </Link>
        </div>
        <div style={{ padding: '24px' }}>
          <HorizontalSprintTimeline projectId={project.id} />
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <div className="card" style={{ textAlign: 'center', padding: 24 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: getScoreColor(project.scores.demand) }}>
            {project.scores.demand}/10
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>Demand Score</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: 24 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>💰</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: getScoreColor(project.scores.monetization) }}>
            {project.scores.monetization}/10
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>Monetization</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: 24 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⚡</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: getScoreColor(project.scores.differentiation) }}>
            {project.scores.differentiation}/10
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>Differentiation</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
        <Link href={`/projects/${project.id}/sitemap`} style={{ textDecoration: 'none' }}>
          <div
            className="card"
            style={{
              cursor: 'pointer',
              transition: 'transform 0.2s',
              borderLeft: '3px solid var(--accent1)',
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>🗺️</div>
            <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>Project Sitemap</h3>
            <p className="small" style={{ margin: 0, color: 'var(--muted)' }}>
              Visualize domain dependencies
            </p>
          </div>
        </Link>

        <Link href={`/projects/${project.id}/domains`} style={{ textDecoration: 'none' }}>
          <div
            className="card"
            style={{
              cursor: 'pointer',
              transition: 'transform 0.2s',
              borderLeft: '3px solid var(--accent)',
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>🏗️</div>
            <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>View Domains</h3>
            <p className="small" style={{ margin: 0, color: 'var(--muted)' }}>
              Explore {project.domainCount || 0} domain{project.domainCount !== 1 ? 's' : ''}
            </p>
          </div>
        </Link>

        <Link href={`/projects/${project.id}/architecture`} style={{ textDecoration: 'none' }}>
          <div
            className="card"
            style={{
              cursor: 'pointer',
              transition: 'transform 0.2s',
              borderLeft: '3px solid #8b5cf6',
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>🎨</div>
            <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>Architecture</h3>
            <p className="small" style={{ margin: 0, color: 'var(--muted)' }}>
              Visualize project structure
            </p>
          </div>
        </Link>

        <Link href={`/projects/${project.id}/sprints`} style={{ textDecoration: 'none' }}>
          <div
            className="card"
            style={{
              cursor: 'pointer',
              transition: 'transform 0.2s',
              borderLeft: '3px solid #3b82f6',
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>🚀</div>
            <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>Sprint Management</h3>
            <p className="small" style={{ margin: 0, color: 'var(--muted)' }}>
              View sprints and story timeline
            </p>
          </div>
        </Link>
      </div>

      {/* Description */}
      {project.description && (
        <div className="card">
          <h2 style={{ margin: '0 0 12px', fontSize: 18 }}>Description</h2>
          <p style={{ margin: 0, lineHeight: 1.6, color: 'var(--muted)' }}>
            {project.description}
          </p>
        </div>
      )}

      {/* Metadata */}
      <div className="card">
        <h2 style={{ margin: '0 0 16px', fontSize: 18 }}>Project Information</h2>
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--muted)' }}>Project ID</span>
            <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{project.id}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--muted)' }}>Created</span>
            <span>{new Date(project.createdAt).toLocaleDateString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--muted)' }}>Last Updated</span>
            <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
          </div>
          {project.primaryCategory && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)' }}>Category</span>
              <span style={{ textTransform: 'capitalize' }}>{project.primaryCategory}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
