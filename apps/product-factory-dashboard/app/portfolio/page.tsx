'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Project,
  ProjectSummary,
  getScoreColor, 
  getStatusColor, 
  getStatusIcon,
  FACTORY_PROJECT_ID,
  createFactoryProject,
  toProjectSummary,
} from '../../lib/projects';

interface ProjectWithChildren extends ProjectSummary {
  children: ProjectWithChildren[];
}

export default function PortfolioPage() {
  const [factory, setFactory] = useState<Project | null>(null);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set([FACTORY_PROJECT_ID]));

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Create factory project
      setFactory(createFactoryProject());
      
      // Load all projects
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(data.projects || []);
    } catch (error) {
      console.error('Failed to load:', error);
    } finally {
      setLoading(false);
    }
  }

  function toggleExpand(id: string) {
    const newSet = new Set(expandedProjects);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedProjects(newSet);
  }

  // Build tree structure
  function buildTree(): ProjectWithChildren | null {
    if (!factory) return null;
    
    const factorySummary = toProjectSummary(factory);
    
    const rootChildren = projects
      .filter(p => !p.parentId || p.parentId === FACTORY_PROJECT_ID)
      .map(p => buildSubTree(p));
    
    return {
      ...factorySummary,
      children: rootChildren,
    };
  }

  function buildSubTree(project: ProjectSummary): ProjectWithChildren {
    const children = projects
      .filter(p => p.parentId === project.id)
      .map(p => buildSubTree(p));
    
    return {
      ...project,
      children,
    };
  }

  const tree = buildTree();

  // Calculate totals
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const totalDomains = (factory?.domains.length || 0) + projects.reduce((sum, p) => sum + (p.domainCount || 0), 0);
  const avgProgress = projects.length > 0
    ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length)
    : 0;

  function ProjectTreeNode({ node, depth = 0 }: { node: ProjectWithChildren; depth?: number }) {
    const isExpanded = expandedProjects.has(node.id);
    const hasChildren = node.children.length > 0;
    const isFactory = node.id === FACTORY_PROJECT_ID;

    return (
      <div style={{ marginLeft: depth * 24 }}>
        <div 
          className="card"
          style={{ 
            marginBottom: 8,
            borderLeft: `4px solid ${isFactory ? '#10b981' : getStatusColor(node.status)}`,
            background: isFactory 
              ? 'linear-gradient(135deg, var(--surface) 0%, rgba(16, 185, 129, 0.1) 100%)'
              : undefined,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Expand/Collapse */}
            {hasChildren && (
              <button
                onClick={() => toggleExpand(node.id)}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 4,
                  border: 'none',
                  background: 'var(--surface)',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >
                {isExpanded ? '▼' : '▶'}
              </button>
            )}
            {!hasChildren && <div style={{ width: 24 }} />}

            {/* Project Info */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>
                  {isFactory ? '🏭' : getStatusIcon(node.status)}
                </span>
                <Link 
                  href={`/projects/${node.id}`}
                  style={{ 
                    fontWeight: 600, 
                    fontSize: 15,
                    color: isFactory ? '#10b981' : 'inherit',
                    textDecoration: 'none',
                  }}
                >
                  {node.name}
                </Link>
                <span style={{ 
                  padding: '2px 8px', 
                  borderRadius: 4, 
                  fontSize: 10,
                  background: `${getStatusColor(node.status)}20`,
                  color: getStatusColor(node.status),
                  textTransform: 'capitalize',
                }}>
                  {node.status}
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                {node.tagline}
              </div>
            </div>

            {/* Domains Count */}
            <Link 
              href={`/projects/${node.id}/domains`}
              style={{ 
                textAlign: 'center',
                textDecoration: 'none',
                color: 'inherit',
                padding: '8px 12px',
                borderRadius: 6,
                background: 'var(--surface)',
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 'bold' }}>{node.domainCount}</div>
              <div style={{ fontSize: 10, color: 'var(--muted)' }}>Domains</div>
            </Link>

            {/* Progress */}
            <div style={{ width: 100 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                <span style={{ color: 'var(--muted)' }}>Progress</span>
                <span style={{ fontWeight: 'bold' }}>{node.progress}%</span>
              </div>
              <div style={{ 
                height: 6, 
                background: 'var(--bg)', 
                borderRadius: 3,
                overflow: 'hidden'
              }}>
                <div style={{ 
                  width: `${node.progress}%`, 
                  height: '100%', 
                  background: isFactory ? '#10b981' : getStatusColor(node.status),
                  borderRadius: 3,
                }} />
              </div>
            </div>

            {/* Score Indicators */}
            <div style={{ display: 'flex', gap: 4 }}>
              {['demand', 'monetization', 'differentiation'].map(key => (
                <div 
                  key={key}
                  style={{ 
                    width: 24, 
                    height: 24, 
                    borderRadius: 4,
                    background: getScoreColor(node.scores[key as keyof typeof node.scores]),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 'bold',
                    color: 'white',
                  }}
                  title={`${key}: ${node.scores[key as keyof typeof node.scores]}`}
                >
                  {node.scores[key as keyof typeof node.scores]}
                </div>
              ))}
            </div>

            {/* Children Count */}
            {hasChildren && (
              <div style={{ 
                padding: '4px 8px', 
                borderRadius: 12, 
                background: 'var(--accent)20',
                fontSize: 11,
                color: 'var(--accent)',
              }}>
                {node.children.length} {node.children.length === 1 ? 'child' : 'children'}
              </div>
            )}
          </div>
        </div>

        {/* Children */}
        {isExpanded && hasChildren && (
          <div style={{ 
            borderLeft: '2px dashed var(--border)', 
            marginLeft: 12,
            paddingLeft: 12,
          }}>
            {node.children.map(child => (
              <ProjectTreeNode key={child.id} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 48 }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
        <p style={{ color: 'var(--muted)' }}>Loading portfolio...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div className="card" style={{ 
        background: 'linear-gradient(135deg, var(--surface) 0%, rgba(167, 139, 250, 0.1) 100%)',
        border: '1px solid #a78bfa50',
      }}>
        <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          🌳 Project Portfolio
        </h1>
        <p style={{ margin: '8px 0 0', color: 'var(--muted)' }}>
          Hierarchical view of all projects and their domain progress
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <div className="card" style={{ textAlign: 'center', padding: 16 }}>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: 'var(--accent)' }}>
            {totalProjects + 1}
          </div>
          <div className="small" style={{ color: 'var(--muted)' }}>Total Projects</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: 16 }}>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: '#10b981' }}>
            {activeProjects}
          </div>
          <div className="small" style={{ color: 'var(--muted)' }}>Active</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: 16 }}>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: '#3b82f6' }}>
            {totalDomains}
          </div>
          <div className="small" style={{ color: 'var(--muted)' }}>Total Domains</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: 16 }}>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: '#f59e0b' }}>
            {avgProgress}%
          </div>
          <div className="small" style={{ color: 'var(--muted)' }}>Avg Progress</div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => setExpandedProjects(new Set([FACTORY_PROJECT_ID, ...projects.map(p => p.id)]))}
          style={{
            padding: '6px 12px',
            border: 'none',
            borderRadius: 6,
            background: 'var(--surface)',
            color: 'var(--muted)',
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          Expand All
        </button>
        <button
          onClick={() => setExpandedProjects(new Set([FACTORY_PROJECT_ID]))}
          style={{
            padding: '6px 12px',
            border: 'none',
            borderRadius: 6,
            background: 'var(--surface)',
            color: 'var(--muted)',
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          Collapse All
        </button>
      </div>

      {/* Project Tree */}
      {tree && <ProjectTreeNode node={tree} />}

      {/* Legend */}
      <div className="card" style={{ padding: 12 }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Score Legend (Demand, Monetization, Differentiation)</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { score: 9, label: 'Excellent (8-10)' },
            { score: 7, label: 'Good (6-7)' },
            { score: 5, label: 'Moderate (4-5)' },
            { score: 3, label: 'Low (2-3)' },
            { score: 1, label: 'Minimal (1)' },
          ].map(({ score, label }) => (
            <div key={score} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ 
                width: 16, 
                height: 16, 
                borderRadius: 3, 
                background: getScoreColor(score),
              }} />
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}





