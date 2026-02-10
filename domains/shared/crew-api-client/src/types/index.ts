/**
 * Unified CrewAPIClient Types
 * Single source of truth for all surfaces
 */

export type Surface = 'ide' | 'cli' | 'web' | 'n8n';
export type RetrievalPolicy = 'default' | 'task-specific' | 'budget-constrained' | 'quality-focused';
export type MemoryType = 'story' | 'insight' | 'pattern' | 'lesson' | 'best-practice';
export type RetentionTier = 'eternal' | 'standard' | 'temporary' | 'session';
export type UserRole = 'owner' | 'member' | 'viewer';

/**
 * Authorization Context - passed through all operations
 */
export interface AuthContext {
  user_id: string;
  crew_id: string;
  role: UserRole;
  surface: Surface;
  tenant_id?: string;
}

/**
 * Intent - extracted from user input/command
 */
export interface Intent {
  action: string;
  crew_id: string;
  resource?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Operation Result - standardized response
 */
export interface OperationResult {
  success: boolean;
  data?: unknown;
  error?: string;
  cost?: number;
  duration_ms?: number;
  confidence?: number;
}

/**
 * Memory Operations
 */
export interface CreateMemoryParams {
  content: string;
  type: MemoryType;
  retention_tier?: RetentionTier;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface CreateMemoryResponse {
  id: string;
  content: string;
  type: MemoryType;
  created_at: string;
  cost: number;
}

export interface RetrieveMemoriesParams {
  crew_id: string;
  filter?: string;
  policy?: RetrievalPolicy;
  budget?: number;
  limit?: number;
}

export interface RetrieveMemoriesResponse {
  memories: Memory[];
  total: number;
  cost: number;
  confidence: number;
}

export interface Memory {
  id: string;
  crew_id: string;
  content: string;
  type: MemoryType;
  retention_tier: RetentionTier;
  confidence_level: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  access_count: number;
  last_accessed: string;
  tags: string[];
}

export interface UpdateMemoryParams {
  id: string;
  content?: string;
  metadata?: Record<string, unknown>;
}

export interface DeleteMemoryParams {
  id: string;
  permanent?: boolean;
}

export interface RestoreMemoryParams {
  id: string;
}

/**
 * Crew Operations
 */
export interface CreateCrewParams {
  name: string;
  description?: string;
  agents?: number;
  config?: Record<string, unknown>;
}

export interface ExecuteCrewParams {
  crew_id: string;
  input: string;
  context?: Record<string, unknown>;
  budget?: number;
  timeout?: number;
}

export interface ExecuteCrewResponse {
  crew_id: string;
  execution_id: string;
  output: string;
  status: 'success' | 'failure' | 'timeout';
  cost: number;
  duration_ms: number;
}

export interface ListCrewsParams {
  filter?: string;
  sort?: 'recent' | 'name';
  limit?: number;
}

/**
 * Query Operations
 */
export interface SearchMemoriesParams {
  query: string;
  filters?: {
    type?: MemoryType;
    crew_id?: string;
    confidence_min?: number;
  };
  limit?: number;
}

export interface ComplianceStatusParams {
  crew_id: string;
  period?: string; // e.g., "30d", "90d"
}

export interface ExpirationForecastParams {
  crew_id: string;
}

/**
 * Admin Operations
 */
export interface ExportCrewDataParams {
  crew_id: string;
  format?: 'json' | 'csv';
}

export interface ImportCrewDataParams {
  file: Buffer | string;
  merge?: boolean;
}

export interface PruneExpiredMemoriesParams {
  crew_id: string;
  dry_run?: boolean;
}

export interface GenerateAuditReportParams {
  crew_id: string;
  start_date: string;
  end_date: string;
}

/**
 * Audit Log Entry
 */
export interface AuditLogEntry {
  id: string;
  user_id: string;
  crew_id: string;
  surface: Surface;
  intent: Intent;
  action: string;
  result: 'success' | 'failure';
  error?: string;
  metadata: {
    cost: number;
    duration_ms: number;
    memory_ids?: string[];
  };
  created_at: string;
}

/**
 * Authorization Error
 */
export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Operation Error
 */
export class OperationError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'OperationError';
  }
}
