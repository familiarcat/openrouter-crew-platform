/**
 * Core types for the Unified CrewAPIClient, based on the Surface Parity Contract.
 * Defines the contract for all surface interactions.
 */

// Base types from the analysis document
export type Surface = 'ide' | 'cli' | 'web' | 'n8n' | 'api';
export type RetrievalPolicy = 'task-specific' | 'default';
export type MemoryType = 'story' | 'insight' | 'pattern' | 'lesson' | 'best-practice';
export type RetentionTier = 'eternal' | 'standard' | 'temporary' | 'session';
export type UserRole = 'owner' | 'member' | 'viewer';

export interface Intent {
  action: string;
  crew_id?: string;
}

export interface AuthContext {
  user_id: string;
  crew_id: string;
  role: UserRole;
  surface: Surface;
}

export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

// Core Data Models
export interface Memory {
  id: string;
  crew_id: string;
  content: string;
  type: MemoryType;
  retention_tier: RetentionTier;
  confidence_level: number;
  created_at: string;
  updated_at: string;
  access_count: number;
  last_accessed: string;
  tags: string[];
  deleted_at?: string | null;
}

export interface Crew {
  id: string;
  name: string;
  description: string;
  agents: string[];
}

// Generic response for success/failure
export interface OperationResult {
  success: boolean;
  message?: string;
}

export interface ClientConfig {
  baseUrl: string;
  apiKey?: string;
  projectId?: string;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  signal?: AbortSignal;
}

// --- Operation-specific types from the Unified Operation Catalog ---

// MEMORY OPERATIONS
export interface CreateMemoryParams {
  content: string;
  type: MemoryType;
  retention_tier: RetentionTier;
  crew_id: string;
}
export interface CreateMemoryResponse {
  id: string;
  status: 'created';
}

export interface RetrieveMemoriesParams {
  filter: string;
  policy: RetrievalPolicy;
  budget?: number;
  crew_id: string;
}
export interface RetrieveMemoriesResponse {
  memories: Memory[];
}

export interface UpdateMemoryParams {
  id: string;
  content?: string;
  metadata?: Record<string, any>;
}
export type UpdateMemoryResponse = OperationResult;

export interface DeleteMemoryParams {
  id: string;
  soft?: boolean;
}
export type DeleteMemoryResponse = OperationResult;

export interface RestoreMemoryParams {
  id: string;
}
export type RestoreMemoryResponse = OperationResult;

// CREW OPERATIONS
export interface CreateCrewParams {
  name: string;
  description: string;
  agents: string[];
}
export interface CreateCrewResponse extends Crew {}

export interface ExecuteCrewParams {
  crew_id: string;
  input: string;
  context?: Record<string, any>;
}
export interface ExecuteCrewResponse {
  content: string;
  content: string; content: string; content: string;
  content: string;
  content: string;
  output: string;
  cost: number;
  tokens: number;
  model: string;
}

export interface ListCrewsParams {
  filter?: string;
  sort?: 'recent' | 'name';
}
export interface ListCrewsResponse {
  crews: Crew[];
}

export interface GetCrewStatusParams {
  crew_id: string;
}
export interface GetCrewStatusResponse {
  id: string;
  status: 'idle' | 'running' | 'error';
  last_activity: string;
}

// QUERY OPERATIONS
export interface SearchMemoriesParams {
  query: string;
  filters?: Record<string, any>;
  limit?: number;
}
export interface SearchMemoriesResponse {
  memories: Memory[];
}

// ADMIN OPERATIONS
export interface ExportCrewDataParams {
  crew_id: string;
  format: 'json' | 'csv';
}
export interface ExportCrewDataResponse {
  file_content: string;
  file_name: string;
}

export interface PruneExpiredMemoriesParams {
  crew_id: string;
  dry_run?: boolean;
}
export interface PruneExpiredMemiesResponse extends OperationResult {
  pruned_count: number;
}

export interface ComplianceStatusParams {
  crew_id: string;
  period?: string;
}

export interface ExpirationForecastParams {
  crew_id: string;
}

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
    [key: string]: any;
  };
  created_at: string;
}

export interface ArchivedMemory {
  id: string;
  originalId: string;
  archivedAt: Date;
  originalCreatedAt: string;
  originalUpdatedAt: string;
  content: string; // can be compressed
  compressed: boolean;
  originalLength: number;
  compressedLength: number;
  metadata: {
    retentionTier: RetentionTier;
    type: string;
    tags: string[];
    confidence: number;
  };
}

export interface ArchivalConfig {
  strategy?: 'automatic' | 'by-value' | 'manual';
  maxActiveMemories?: number;
  minAgeDays?: number;
  compressionEnabled?: boolean;
  encryptionEnabled?: boolean;
}

// Instrumentation Types
export interface ExecutionContext {
  requestId: string;
  traceId: string;
  spanId: string;
  domain: string;
  feature: string;
  action: string;
  userId?: string;
  timestamp: Date;
  [key: string]: any;
}

export interface CostMeasurement {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
  actualCost: number;
  model: string;
  durationMs: number;
}

export interface LLMRequestInstrumentation {
  context: ExecutionContext;
  model: string;
  prompt: string;
  cost: CostMeasurement;
  successfulRequest: boolean;
  errorMessage?: string;
  timestamp: Date;
  [key: string]: any;
}

export interface CostEvent {
  eventType: string;
  instrumentation: LLMRequestInstrumentation | any;
  timestamp: Date;
}