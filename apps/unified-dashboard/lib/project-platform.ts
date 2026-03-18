import type { ProjectStatus, ProjectType, Tables } from '@openrouter-crew/shared-schemas'
import { DOMAINS, MOCK_PROJECTS, type DomainId } from './unified-mock-data'

type ProjectRow = Tables<'projects'>

export interface ProjectDomainSummary {
  id: string
  name: string
  color: string
  description: string
}

export interface ProjectPlatformRecord {
  id: string
  name: string
  description: string
  tagline?: string
  status: string
  progress: number
  updatedAt: string
  createdAt: string
  type: string
  domainId: string
  domain?: ProjectDomainSummary
  budgetAllocated: number
  budgetSpent: number
  teamSize: number
  metadata: Record<string, unknown>
}

export interface CreateProjectPayload {
  name: string
  description?: string
  domainId?: string
  type?: string
  template?: string
  budgetUsd?: number
  status?: string
}

const DOMAIN_COLOR_MAP: Record<string, string> = {
  'dj-booking': '#8b5cf6',
  'product-factory': '#06b6d4',
  'alex-ai-universal': '#10b981',
}

const DOMAIN_NAME_MAP: Record<string, string> = Object.fromEntries(
  DOMAINS.map((domain) => [domain.id, domain.name]),
)

const DOMAIN_DESCRIPTION_MAP: Record<string, string> = Object.fromEntries(
  DOMAINS.map((domain) => [domain.id, domain.description]),
)

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

export function inferDomainId(type: string, metadata?: unknown): string {
  const metadataRecord = asRecord(metadata)
  const metadataDomainId = metadataRecord.domainId
  if (typeof metadataDomainId === 'string' && metadataDomainId.length > 0) {
    return metadataDomainId
  }

  if (type === 'dj-booking') {
    return 'dj-booking'
  }
  if (type === 'product-factory') {
    return 'product-factory'
  }
  if (type === 'ai-assistant') {
    return 'alex-ai-universal'
  }
  return 'product-factory'
}

export function resolveProjectType(
  domainId?: string,
  requestedType?: string,
): ProjectType {
  if (
    requestedType === 'dj-booking' ||
    requestedType === 'product-factory' ||
    requestedType === 'ai-assistant' ||
    requestedType === 'custom'
  ) {
    return requestedType
  }

  if (domainId === 'dj-booking') {
    return 'dj-booking'
  }
  if (domainId === 'alex-ai-universal') {
    return 'ai-assistant'
  }
  if (domainId === 'product-factory') {
    return 'product-factory'
  }
  return 'custom'
}

export function normalizeProjectRecord(row: ProjectRow): ProjectPlatformRecord {
  const metadata = asRecord(row.metadata)
  const domainId = inferDomainId(row.type, row.metadata)
  const domainName = DOMAIN_NAME_MAP[domainId] || domainId
  const domain = {
    id: domainId,
    name: domainName,
    color: DOMAIN_COLOR_MAP[domainId] || '#6b7280',
    description: DOMAIN_DESCRIPTION_MAP[domainId] || `${domainName} initiatives`,
  }
  const rawProgress = metadata.progress
  const progress =
    typeof rawProgress === 'number'
      ? Math.max(0, Math.min(100, rawProgress))
      : row.status === 'completed'
        ? 100
        : row.status === 'active'
          ? 65
          : row.status === 'paused'
            ? 40
            : row.status === 'archived'
              ? 100
              : 10

  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    tagline: typeof metadata.tagline === 'string' ? metadata.tagline : undefined,
    status: row.status,
    progress,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
    type: row.type,
    domainId,
    domain,
    budgetAllocated: row.budget_usd || 0,
    budgetSpent: row.total_cost_usd || 0,
    teamSize: Array.isArray(row.team_members) ? row.team_members.length : 0,
    metadata,
  }
}

export function getMockProjectRecords(): ProjectPlatformRecord[] {
  return MOCK_PROJECTS.map((project) => ({
    id: project.id,
    name: project.name,
    description: project.description,
    tagline: `${DOMAIN_NAME_MAP[project.domainId]} workstream`,
    status: project.status === 'maintenance' ? 'paused' : project.status,
    progress:
      project.status === 'completed'
        ? 100
        : project.status === 'draft'
          ? 10
          : project.status === 'maintenance'
            ? 75
            : 60,
    updatedAt: project.updatedAt,
    createdAt: project.updatedAt,
    type: resolveProjectType(project.domainId),
    domainId: project.domainId,
    domain: {
      id: project.domainId,
      name: DOMAIN_NAME_MAP[project.domainId] || project.domainId,
      color: DOMAIN_COLOR_MAP[project.domainId] || '#6b7280',
      description: DOMAIN_DESCRIPTION_MAP[project.domainId] || '',
    },
    budgetAllocated: project.budget.allocated,
    budgetSpent: project.budget.spent,
    teamSize: project.team.size,
    metadata: {
      domainId: project.domainId,
      source: 'mock',
    },
  }))
}

export function buildProjectInsertPayload(
  input: CreateProjectPayload,
): Pick<ProjectRow, 'name' | 'description' | 'type' | 'status' | 'budget_usd' | 'total_cost_usd' | 'metadata' | 'team_members'> {
  const domainId = input.domainId || 'product-factory'
  const type = resolveProjectType(domainId, input.type)
  const metadata = {
    domainId,
    template: input.template || 'standard',
    createdFrom: 'project-platform-api',
  }

  return {
    name: input.name.trim(),
    description: input.description?.trim() || null,
    type,
    status: ((input.status as ProjectStatus | undefined) || 'draft'),
    budget_usd: typeof input.budgetUsd === 'number' ? input.budgetUsd : null,
    total_cost_usd: 0,
    metadata,
    team_members: [],
  }
}

export function coerceDomainId(value?: string): DomainId | undefined {
  if (value === 'dj-booking' || value === 'product-factory' || value === 'alex-ai-universal') {
    return value
  }
  return undefined
}
