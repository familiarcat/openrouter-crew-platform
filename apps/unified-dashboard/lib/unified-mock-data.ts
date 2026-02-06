/**
 * Unified Data Structure for E2E Testing
 * 
 * Schema Review:
 * - Domains: Top-level boundaries acting as tenants.
 * - Projects: Work units belonging to a domain.
 * - Metrics: Aggregated health and performance stats.
 * 
 * This structure supports:
 * - CRUD operations (Create, Read, Update, Delete projects)
 * - Filtering and Aggregation (by domain, status)
 * - Health Monitoring (uptime, error rates)
 */

export type DomainId = 'dj-booking' | 'product-factory' | 'alex-ai-universal';
export type ProjectStatus = 'active' | 'draft' | 'completed' | 'archived' | 'maintenance';
export type HealthStatus = 'healthy' | 'degraded' | 'critical';

export interface DomainConfig {
  id: DomainId;
  name: string;
  description: string;
  color: string;
  icon: string;
  port: number;
}

export interface Project {
  id: string;
  domainId: DomainId;
  name: string;
  description: string;
  status: ProjectStatus;
  budget: {
    allocated: number;
    spent: number;
    currency: string;
  };
  team: {
    leads: string[];
    size: number;
  };
  metrics: {
    uptime: number;
    requestsPerMin: number;
    errorRate: number;
  };
  updatedAt: string;
}

export interface ActivityEvent {
  id: string;
  projectId?: string;
  domainId: DomainId;
  type: 'deployment' | 'alert' | 'creation' | 'update';
  message: string;
  timestamp: string;
}

// --- Mock Data Generation ---

export const DOMAINS: DomainConfig[] = [
  {
    id: 'dj-booking',
    name: 'DJ-Booking',
    description: 'Event management and artist booking platform',
    color: 'from-purple-500 to-indigo-500',
    icon: 'Music',
    port: 3001
  },
  {
    id: 'product-factory',
    name: 'Product Factory',
    description: 'Agile sprint planning and RAG workflows',
    color: 'from-cyan-500 to-blue-500',
    icon: 'Factory',
    port: 3002
  },
  {
    id: 'alex-ai-universal',
    name: 'Alex-AI Universal',
    description: 'Platform engineering and developer tools',
    color: 'from-emerald-500 to-teal-500',
    icon: 'Cpu',
    port: 3003
  }
];

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'proj-001',
    domainId: 'dj-booking',
    name: 'Summer Festival 2026',
    description: 'Main stage coordination and artist logistics',
    status: 'active',
    budget: { allocated: 50000, spent: 12500, currency: 'USD' },
    team: { leads: ['Sarah J.'], size: 8 },
    metrics: { uptime: 99.9, requestsPerMin: 450, errorRate: 0.02 },
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
  },
  {
    id: 'proj-002',
    domainId: 'product-factory',
    name: 'Sprint 42: AI Integration',
    description: 'Integrating LLM router into core workflows',
    status: 'active',
    budget: { allocated: 15000, spent: 8200, currency: 'USD' },
    team: { leads: ['Mike T.'], size: 5 },
    metrics: { uptime: 99.5, requestsPerMin: 120, errorRate: 0.5 },
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
  },
  {
    id: 'proj-003',
    domainId: 'alex-ai-universal',
    name: 'CLI Tool v2.0',
    description: 'Refactoring CLI for better cross-platform support',
    status: 'draft',
    budget: { allocated: 5000, spent: 0, currency: 'USD' },
    team: { leads: ['Alex'], size: 2 },
    metrics: { uptime: 100, requestsPerMin: 0, errorRate: 0 },
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
  },
  {
    id: 'proj-004',
    domainId: 'dj-booking',
    name: 'Venue API Gateway',
    description: 'External API for venue partners',
    status: 'maintenance',
    budget: { allocated: 8000, spent: 7500, currency: 'USD' },
    team: { leads: ['DevOps'], size: 3 },
    metrics: { uptime: 98.2, requestsPerMin: 890, errorRate: 1.2 },
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString()
  }
];

export const MOCK_ACTIVITY: ActivityEvent[] = [
  { id: 'evt-1', domainId: 'product-factory', type: 'deployment', message: 'Deployed Sprint 42 to Staging', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
  { id: 'evt-2', domainId: 'dj-booking', type: 'alert', message: 'High latency detected in Venue API', timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
  { id: 'evt-3', domainId: 'alex-ai-universal', type: 'creation', message: 'New project "CLI Tool v2.0" created', timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
  { id: 'evt-4', domainId: 'product-factory', type: 'update', message: 'Budget threshold reached (50%)', timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString() }
];

export function getDomainStats(domainId: DomainId) {
  const projects = MOCK_PROJECTS.filter(p => p.domainId === domainId);
  const totalBudget = projects.reduce((sum, p) => sum + p.budget.allocated, 0);
  const totalSpent = projects.reduce((sum, p) => sum + p.budget.spent, 0);
  const activeCount = projects.filter(p => p.status === 'active').length;
  
  return {
    projectCount: projects.length,
    activeCount,
    budgetUtilization: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
    healthScore: 95 // Mock score
  };
}
