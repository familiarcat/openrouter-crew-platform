// Domain configuration and management for unified dashboard

export interface Domain {
  id: string
  name: string
  description: string
  type: 'event-management' | 'sprint-planning' | 'universal-platform'
  status: 'active' | 'development' | 'planned'
  port: number
  color: string
  icon: string

  features: {
    [key: string]: boolean | number | string
  }

  ui: {
    baseRoute: string
    componentsPath: string
    appPath: string
  }

  metrics: {
    workflows: number
    components: number
    crew: number
    sprints?: number
  }

  health: {
    status: 'healthy' | 'degraded' | 'down'
    lastCheck: string
    uptime?: number
  }
}

export const UNIFIED_DOMAINS: Domain[] = [
  {
    id: 'dj-booking',
    name: 'DJ-Booking',
    description: 'Event management, venue coordination, and artist bookings',
    type: 'event-management',
    status: 'active',
    port: 3001,
    color: '#f59e0b', // amber/gold
    icon: 'Music',

    features: {
      venues: true,
      artists: true,
      events: true,
      mcpAgents: 6,
      calendar: true,
      booking: true
    },

    ui: {
      baseRoute: '/domains/dj-booking',
      componentsPath: 'domains/dj-booking/dashboard/components',
      appPath: 'domains/dj-booking/dashboard/app'
    },

    metrics: {
      workflows: 12,
      components: 15,
      crew: 6,
      sprints: 3
    },

    health: {
      status: 'healthy',
      lastCheck: new Date().toISOString(),
      uptime: 99.9
    }
  },

  {
    id: 'product-factory',
    name: 'Product Factory',
    description: 'Sprint planning, RAG workflows, and product development',
    type: 'sprint-planning',
    status: 'active',
    port: 3002,
    color: '#06b6d4', // cyan
    icon: 'Factory',

    features: {
      sprints: true,
      ragWorkflows: true,
      costOptimization: true,
      workflows: 54,
      architecture: true,
      documentation: true
    },

    ui: {
      baseRoute: '/domains/product-factory',
      componentsPath: 'domains/product-factory/dashboard/components',
      appPath: 'domains/product-factory/dashboard/app'
    },

    metrics: {
      workflows: 54,
      components: 23,
      crew: 10,
      sprints: 12
    },

    health: {
      status: 'healthy',
      lastCheck: new Date().toISOString(),
      uptime: 98.5
    }
  },

  {
    id: 'alex-ai-universal',
    name: 'Alex-AI-Universal',
    description: 'CLI tools, VSCode integration, and universal platform features',
    type: 'universal-platform',
    status: 'development',
    port: 3003,
    color: '#10b981', // green
    icon: 'Sparkles',

    features: {
      cli: true,
      vscode: true,
      themes: true,
      workflows: 36,
      mcp: true,
      extension: true
    },

    ui: {
      baseRoute: '/domains/alex-ai-universal',
      componentsPath: 'domains/alex-ai-universal/dashboard/components',
      appPath: 'domains/alex-ai-universal/dashboard/app'
    },

    metrics: {
      workflows: 36,
      components: 40,
      crew: 12,
      sprints: 8
    },

    health: {
      status: 'degraded',
      lastCheck: new Date().toISOString(),
      uptime: 95.2
    }
  }
]

// Helper functions

export function getDomain(id: string): Domain | undefined {
  return UNIFIED_DOMAINS.find(d => d.id === id)
}

export function getDomainByType(type: Domain['type']): Domain[] {
  return UNIFIED_DOMAINS.filter(d => d.type === type)
}

export function getActiveDomains(): Domain[] {
  return UNIFIED_DOMAINS.filter(d => d.status === 'active')
}

export function getDomainMetrics() {
  return {
    total: UNIFIED_DOMAINS.length,
    active: UNIFIED_DOMAINS.filter(d => d.status === 'active').length,
    totalWorkflows: UNIFIED_DOMAINS.reduce((sum, d) => sum + d.metrics.workflows, 0),
    totalComponents: UNIFIED_DOMAINS.reduce((sum, d) => sum + d.metrics.components, 0),
    totalSprints: UNIFIED_DOMAINS.reduce((sum, d) => sum + (d.metrics.sprints || 0), 0)
  }
}

export function getDomainHealth() {
  const healthy = UNIFIED_DOMAINS.filter(d => d.health.status === 'healthy').length
  const degraded = UNIFIED_DOMAINS.filter(d => d.health.status === 'degraded').length
  const down = UNIFIED_DOMAINS.filter(d => d.health.status === 'down').length

  return { healthy, degraded, down, total: UNIFIED_DOMAINS.length }
}

// Domain status colors
export function getDomainStatusColor(status: Domain['status']): string {
  switch (status) {
    case 'active': return '#10b981' // green
    case 'development': return '#f59e0b' // yellow
    case 'planned': return '#6b7280' // gray
    default: return '#6b7280'
  }
}

export function getHealthStatusColor(status: Domain['health']['status']): string {
  switch (status) {
    case 'healthy': return '#10b981' // green
    case 'degraded': return '#f59e0b' // yellow
    case 'down': return '#ef4444' // red
    default: return '#6b7280'
  }
}

// API functions (for future backend integration)

export async function fetchDomains(): Promise<Domain[]> {
  // TODO: Replace with actual API call
  return UNIFIED_DOMAINS
}

export async function fetchDomainHealth(id: string): Promise<Domain['health']> {
  // TODO: Replace with actual health check API
  const domain = getDomain(id)
  return domain?.health || {
    status: 'down',
    lastCheck: new Date().toISOString()
  }
}

export async function updateDomainStatus(id: string, status: Domain['status']): Promise<void> {
  // TODO: Implement API call
  console.log(`Updating domain ${id} status to ${status}`)
}
