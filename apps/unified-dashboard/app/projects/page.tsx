'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { enrichProjectWithDomain, calculateProjectAnalytics, getProjectsByDomain, type DomainProject } from '@/lib/unified-projects'
import { UNIFIED_DOMAINS } from '@/lib/domains'
import { ClientTypes } from '@openrouter-crew/shared-schemas'
import { FolderKanban, Plus, Filter, ArrowLeft } from 'lucide-react'
import { formatCurrency, formatRelativeTime } from '@/lib/utils'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<DomainProject[]>([])
  const [filteredProjects, setFilteredProjects] = useState<DomainProject[]>([])
  const [loading, setLoading] = useState(true)
  const [filterDomain, setFilterDomain] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    loadProjects()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [projects, filterDomain, filterStatus])

  async function loadProjects() {
    try {
      const { data } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false }) as { data: any[] | null; error: any }

      if (data) {
        const enriched = data.map(enrichProjectWithDomain)
        setProjects(enriched)
      }
    } catch (error) {
      console.error('Error loading projects:', error)
    } finally {
      setLoading(false)
    }
  }

  function applyFilters() {
    let filtered = [...projects]

    if (filterDomain !== 'all') {
      filtered = getProjectsByDomain(filtered, filterDomain)
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter((p: any) => p.status === filterStatus)
    }

    setFilteredProjects(filtered)
  }

  const analytics = calculateProjectAnalytics(projects)
  const statusCounts = analytics.projects_by_status.reduce((acc, s) => {
    acc[s.status] = s.count
    return acc
  }, {} as Record<string, number>)

  if (loading) {
    return (
      <div className="grid">
        <div className="card span-12" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <FolderKanban size={48} style={{ margin: '0 auto 16px', color: 'var(--accent)' }} className="animate-spin" />
          <p>Loading projects...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid">
      {/* Header */}
      <div className="card span-12" style={{
        background: 'linear-gradient(180deg, rgba(13,16,34,.9), rgba(11,15,29,.7)), radial-gradient(ellipse 800px 400px at 50% 0%, #f59e0b30 0%, transparent 60%)',
        borderColor: '#f59e0b30'
      }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--muted)', marginBottom: 16, textDecoration: 'none' }}>
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div>
            <h1 style={{ marginTop: 0, color: '#f59e0b' }}>📁 All Projects</h1>
            <p className="small">
              {analytics.total_projects} total projects • {analytics.active_projects} active • {formatCurrency(analytics.total_cost)} total cost
            </p>
          </div>
          <Link href="/projects/new">
            <button style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              background: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600
            }}>
              <Plus size={16} />
              New Project
            </button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card span-12">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Filter size={20} style={{ color: 'var(--muted)' }} />

          <div style={{ flex: 1, display: 'flex', gap: 12 }}>
            {/* Domain Filter */}
            <div style={{ flex: 1 }}>
              <label className="small" style={{ display: 'block', marginBottom: 4, color: 'var(--muted)' }}>
                Domain
              </label>
              <select
                value={filterDomain}
                onChange={(e) => setFilterDomain(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  fontSize: 13
                }}
              >
                <option value="all">All Domains ({projects.length})</option>
                {UNIFIED_DOMAINS.map((domain) => {
                  const count = getProjectsByDomain(projects, domain.id).length
                  return (
                    <option key={domain.id} value={domain.id}>
                      {domain.name} ({count})
                    </option>
                  )
                })}
              </select>
            </div>

            {/* Status Filter */}
            <div style={{ flex: 1 }}>
              <label className="small" style={{ display: 'block', marginBottom: 4, color: 'var(--muted)' }}>
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  fontSize: 13
                }}
              >
                <option value="all">All Status ({projects.length})</option>
                <option value="active">Active ({statusCounts.active || 0})</option>
                <option value="draft">Draft ({statusCounts.draft || 0})</option>
                <option value="completed">Completed ({statusCounts.completed || 0})</option>
                <option value="archived">Archived ({statusCounts.archived || 0})</option>
              </select>
            </div>
          </div>

          <div style={{ fontSize: 13, color: 'var(--muted)' }}>
            {filteredProjects.length} projects
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="card span-12" style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--surface)' }}>
          <FolderKanban size={64} style={{ margin: '0 auto 20px', color: 'var(--muted)' }} />
          <h3 style={{ marginTop: 0, marginBottom: 8 }}>No projects found</h3>
          <p className="small" style={{ marginBottom: 20, color: 'var(--muted)' }}>
            {filterDomain !== 'all' || filterStatus !== 'all'
              ? 'Try adjusting your filters or create a new project'
              : 'Get started by creating your first project'}
          </p>
          {filterDomain === 'all' && filterStatus === 'all' && (
            <Link href="/projects/new">
              <button style={{
                padding: '12px 24px',
                background: '#06b6d4',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600
              }}>
                <Plus size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                Create Project
              </button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid" style={{ gridColumn: 'span 12' }}>
          {filteredProjects.map((project: any) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
              className="span-4"
            >
              <div className="card" style={{
                cursor: 'pointer',
                borderLeft: `3px solid ${project.domain?.color || '#6b7280'}`,
                background: `linear-gradient(180deg, rgba(13,16,34,.9), rgba(11,15,29,.7)), radial-gradient(ellipse 300px 200px at 0% 0%, ${project.domain?.color}30 0%, transparent 60%)`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                  <h3 style={{ margin: 0 }}>{project.name}</h3>
                  <span className="badge" style={{
                    background: `${project.domain?.color}20`,
                    border: `1px solid ${project.domain?.color}40`,
                    color: project.domain?.color
                  }}>
                    {project.status}
                  </span>
                </div>

                {project.domain && (
                  <div className="small" style={{ marginBottom: 8, color: project.domain.color }}>
                    {project.domain.name}
                  </div>
                )}

                <p className="small" style={{ marginBottom: 12, color: 'var(--muted)' }}>
                  {project.description || 'No description'}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)' }}>
                  <span>{project.type}</span>
                  <span>{formatRelativeTime(project.created_at)}</span>
                </div>

                {project.budget_usd && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: 'var(--muted)' }}>Budget</span>
                      <span>{formatCurrency(project.budget_usd)}</span>
                    </div>
                    {project.total_cost_usd !== null && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 4 }}>
                        <span style={{ color: 'var(--muted)' }}>Spent</span>
                        <span style={{ color: project.domain?.color || '#06b6d4' }}>
                          {formatCurrency(project.total_cost_usd)}
                        </span>
                      </div>
                    )}
                    {project.budget_usd && project.total_cost_usd !== null && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>
                          {Math.round((project.total_cost_usd / project.budget_usd) * 100)}% used
                        </div>
                        <div style={{
                          width: '100%',
                          height: 4,
                          background: 'var(--surface)',
                          borderRadius: 2,
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${Math.min((project.total_cost_usd / project.budget_usd) * 100, 100)}%`,
                            height: '100%',
                            background: project.domain?.color || '#06b6d4',
                            borderRadius: 2
                          }} />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
