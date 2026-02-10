/**
 * Unified CrewAPIClient - Public API
 * Exported from @openrouter-crew/crew-api-client
 */

export { CrewAPIClient } from './CrewAPIClient';
export { AuditService } from './services/audit';
export { MemoryDecayService, DEFAULT_DECAY_POLICIES } from './services/memory-decay';
export type { DecayMetrics } from './services/memory-decay';
export { MemoryService } from './services/memory';
export { AdminService } from './services/admin';
export { MemoryAnalyticsService } from './services/memory-analytics';
export { MemoryArchivalService } from './services/memory-archival';
export { CostOptimizationService } from './services/cost-optimization';
export {
  validateAuthorization,
  getRequiredRoles,
  hasPermission,
} from './services/authorization';

export type {
  Surface,
  RetrievalPolicy,
  MemoryType,
  RetentionTier,
  UserRole,
  AuthContext,
  Intent,
  OperationResult,
  CreateMemoryParams,
  CreateMemoryResponse,
  RetrieveMemoriesParams,
  RetrieveMemoriesResponse,
  Memory,
  UpdateMemoryParams,
  DeleteMemoryParams,
  RestoreMemoryParams,
  CreateCrewParams,
  ExecuteCrewParams,
  ExecuteCrewResponse,
  ListCrewsParams,
  SearchMemoriesParams,
  ComplianceStatusParams,
  ExpirationForecastParams,
  ExportCrewDataParams,
  ImportCrewDataParams,
  PruneExpiredMemoriesParams,
  GenerateAuditReportParams,
  AuditLogEntry,
} from './types';

export { UnauthorizedError, OperationError } from './types';
