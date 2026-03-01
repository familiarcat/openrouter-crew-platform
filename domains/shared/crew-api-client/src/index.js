/**
 * Unified CrewAPIClient - Public API
 * Exported from @openrouter-crew/crew-api-client
 */
export { CrewAPIClient } from './CrewAPIClient';
export { AuditService } from './services/audit';
export { MemoryDecayService, DEFAULT_DECAY_POLICIES } from './services/memory-decay';
export { MemoryService } from './services/memory';
export { AdminService } from './services/admin';
export { MemoryAnalyticsService } from './services/memory-analytics';
export { MemoryCompressionService } from './services/memory-compression';
export { MemoryArchivalService } from './services/memory-archival';
export { CostOptimizationService } from './services/cost-optimization';
export { validateAuthorization, getRequiredRoles, hasPermission, } from './services/authorization';
// Export all types and errors for consumers
export * from './types';
export * from './errors';
// Note: The original file had some type exports that are now covered by `export * from './types'`.
// The `UnauthorizedError` and `OperationError` are replaced by the more specific error classes
// in `errors.ts`. This change simplifies the public API.
//# sourceMappingURL=index.js.map