// Unified project system integrating Supabase with Domain architecture

import { ClientTypes } from '@openrouter-crew/shared-schemas'
import type { Domain } from './domains'
import { UNIFIED_DOMAINS, getDomain } from './domains'

export type Project = ClientTypes.Project

export interface DomainProject extends Project {
  domain_id?: string
  domain?: Domain
  domain_features?: {
    sprints?: boolean
    workflows?: boolean
    crew_assignments?: boolean
    cost_optimization?: boolean
    venues?: boolean
    artists?: boolean
    events?: boolean
    cli?: boolean
    themes?: boolean
  }
}

// Project status colors and utilities (from product-factory)
export function getStatusColor(status: string): string {
  switch (status) {
    case 'active': return '#10b981'
    case 'draft': return '#f59e0b'
    case 'completed': return '#06b6d4'
    case 'archived': return '#6b7280'
    default: return '#6b7280'
  }
}

export function getStatusIcon(status: string): string {
  switch (status) {
    case 'active': return '🟢'
    case 'draft': return '🟡'
    case 'completed': return '✅'
    case 'archived': return '📦'
    default: return '⚪'
  }
}

export function getScoreColor(score: number): string {
  if (score >= 8) return '#10b981'
  if (score >= 5) return '#f59e0b'
  return '#ef4444'
}

// Domain-aware project helpers
export function getProjectDomain(project: DomainProject): Domain | undefined {
  if (project.domain) return project.domain
  if (project.domain_id) return getDomain(project.domain_id)

  // Infer domain from project type
  if (project.type?.includes('event') || project.type?.includes('booking')) {
    return getDomain('dj-booking')
  }
  if (project.type?.includes('sprint') || project.type?.includes('product')) {
    return getDomain('product-factory')
  }
  if (project.type?.includes('universal') || project.type?.includes('cli')) {
    return getDomain('alex-ai-universal')
  }

  return undefined
}

export function getProjectsByDomain(projects: DomainProject[], domainId: string): DomainProject[] {
  return projects.filter(p => {
    const domain = getProjectDomain(p)
    return domain?.id === domainId
  })
}

export function enrichProjectWithDomain(project: Project): DomainProject {
  const domainProject = project as DomainProject
  const domain = getProjectDomain(domainProject)

  if (domain) {
    domainProject.domain = domain
    domainProject.domain_id = domain.id

    // Set domain-specific features based on domain type
    switch (domain.id) {
      case 'dj-booking':
        domainProject.domain_features = {
          venues: true,
          artists: true,
          events: true,
          crew_assignments: true
        }
        break
      case 'product-factory':
        domainProject.domain_features = {
          sprints: true,
          workflows: true,
          cost_optimization: true,
          crew_assignments: true
        }
        break
      case 'alex-ai-universal':
        domainProject.domain_features = {
          cli: true,
          themes: true,
          workflows: true,
          crew_assignments: true
        }
        break
    }
  }

  return domainProject
}

// Project templates by domain
export interface ProjectTemplate {
  name: string
  description: string
  domain_id: string
  type: string
  default_budget?: number
  features: string[]
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    name: 'Event Management Project',
    description: 'Manage venues, artists, and events',
    domain_id: 'dj-booking',
    type: 'event-management',
    default_budget: 5000,
    features: ['Venue Management', 'Artist Booking', 'Event Coordination', 'Calendar Integration']
  },
  {
    name: 'Sprint Planning Project',
    description: 'Agile sprint planning with RAG workflows',
    domain_id: 'product-factory',
    type: 'sprint-planning',
    default_budget: 10000,
    features: ['Sprint Board', 'Story Management', 'RAG Automation', 'Cost Tracking']
  },
  {
    name: 'Universal Platform Project',
    description: 'CLI tools and VSCode integration',
    domain_id: 'alex-ai-universal',
    type: 'universal-platform',
    default_budget: 7500,
    features: ['CLI Development', 'VSCode Extension', 'Theme System', 'MCP Integration']
  },
  {
    name: 'Custom Project',
    description: 'Start from scratch with custom configuration',
    domain_id: 'product-factory', // Default to product-factory
    type: 'custom',
    features: ['Customizable']
  }
]

export function getTemplatesByDomain(domainId: string): ProjectTemplate[] {
  return PROJECT_TEMPLATES.filter(t => t.domain_id === domainId)
}

export function getAllTemplates(): ProjectTemplate[] {
  return PROJECT_TEMPLATES
}

// Project analytics
export interface ProjectAnalytics {
  total_projects: number
  active_projects: number
  total_cost: number
  average_cost_per_project: number
  projects_by_domain: {
    domain_id: string
    domain_name: string
    count: number
    total_cost: number
  }[]
  projects_by_status: {
    status: string
    count: number
  }[]
  recent_activity: {
    project_id: string
    project_name: string
    action: string
    timestamp: string
  }[]
}

export function calculateProjectAnalytics(projects: DomainProject[]): ProjectAnalytics {
  const analytics: ProjectAnalytics = {
    total_projects: projects.length,
    active_projects: projects.filter(p => p.status === 'active').length,
    total_cost: projects.reduce((sum, p) => sum + (p.total_cost_usd || 0), 0),
    average_cost_per_project: 0,
    projects_by_domain: [],
    projects_by_status: [],
    recent_activity: []
  }

  if (projects.length > 0) {
    analytics.average_cost_per_project = analytics.total_cost / projects.length
  }

  // Group by domain
  const domainMap = new Map<string, { count: number; total_cost: number; name: string }>()
  projects.forEach(p => {
    const domain = getProjectDomain(p)
    if (domain) {
      const existing = domainMap.get(domain.id) || { count: 0, total_cost: 0, name: domain.name }
      existing.count++
      existing.total_cost += p.total_cost_usd || 0
      domainMap.set(domain.id, existing)
    }
  })

  analytics.projects_by_domain = Array.from(domainMap.entries()).map(([id, data]) => ({
    domain_id: id,
    domain_name: data.name,
    count: data.count,
    total_cost: data.total_cost
  }))

  // Group by status
  const statusMap = new Map<string, number>()
  projects.forEach(p => {
    const status = p.status || 'unknown'
    statusMap.set(status, (statusMap.get(status) || 0) + 1)
  })

  analytics.projects_by_status = Array.from(statusMap.entries()).map(([status, count]) => ({
    status,
    count
  }))

  return analytics
}

// Domain-specific project goals and optimization
export interface DomainGoals {
  domain_id: string
  goals: {
    metric: string
    target: number
    current: number
    unit: string
  }[]
  optimization_tips: string[]
}

export function getDomainGoals(domainId: string, projects: DomainProject[]): DomainGoals {
  const domainProjects = getProjectsByDomain(projects, domainId)

  switch (domainId) {
    case 'dj-booking':
      return {
        domain_id: domainId,
        goals: [
          {
            metric: 'Events Booked',
            target: 50,
            current: domainProjects.length * 5, // Mock: 5 events per project
            unit: 'events'
          },
          {
            metric: 'Venue Utilization',
            target: 80,
            current: 65,
            unit: '%'
          },
          {
            metric: 'Artist Satisfaction',
            target: 90,
            current: 85,
            unit: '%'
          }
        ],
        optimization_tips: [
          'Increase venue availability during peak hours',
          'Optimize artist scheduling to reduce conflicts',
          'Implement automated booking confirmations'
        ]
      }

    case 'product-factory':
      return {
        domain_id: domainId,
        goals: [
          {
            metric: 'Sprint Velocity',
            target: 40,
            current: 32,
            unit: 'points'
          },
          {
            metric: 'Cost Efficiency',
            target: 95,
            current: 88,
            unit: '%'
          },
          {
            metric: 'Story Completion',
            target: 90,
            current: 85,
            unit: '%'
          }
        ],
        optimization_tips: [
          'Use RAG workflows to automate repetitive tasks',
          'Optimize LLM model selection for cost savings',
          'Implement sprint retrospectives for continuous improvement'
        ]
      }

    case 'alex-ai-universal':
      return {
        domain_id: domainId,
        goals: [
          {
            metric: 'CLI Adoption',
            target: 100,
            current: 75,
            unit: 'users'
          },
          {
            metric: 'VSCode Extensions',
            target: 500,
            current: 342,
            unit: 'installs'
          },
          {
            metric: 'Theme Satisfaction',
            target: 95,
            current: 92,
            unit: '%'
          }
        ],
        optimization_tips: [
          'Publish CLI to npm for easier distribution',
          'Create video tutorials for VSCode extension',
          'Gather user feedback on theme preferences'
        ]
      }

    default:
      return {
        domain_id: domainId,
        goals: [],
        optimization_tips: []
      }
  }
}
