/**
 * Unified CrewAPIClient
 * Single source of truth for all surfaces (IDE, CLI, Web, n8n)
 *
 * Pattern: Intent → Authorization → Execution → Logging → Response
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  AuthContext,
  Intent,
  OperationResult,
  CreateMemoryParams,
  CreateMemoryResponse,
  RetrieveMemoriesParams,
  RetrieveMemoriesResponse,
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
  OperationError,
  Memory,
  UnauthorizedError,
} from './types';
import { validateAuthorization } from './services/authorization';
import { AuditService } from './services/audit';
import { MemoryService } from './services/memory';
import { AdminService } from './services/admin';
import { MemoryDecayService } from './services/memory-decay';

export class CrewAPIClient {
  private auditService: AuditService;
  private memoryService: MemoryService;
  private adminService: AdminService;
  private decayService: MemoryDecayService;

  constructor(private supabase: SupabaseClient) {
    this.auditService = new AuditService(supabase);
    this.memoryService = new MemoryService(supabase);
    this.adminService = new AdminService(supabase);
    this.decayService = new MemoryDecayService(supabase);
  }

  /**
   * MEMORY OPERATIONS
   */

  /**
   * Create a new memory
   */
  async create_memory(
    params: CreateMemoryParams,
    context: AuthContext
  ): Promise<CreateMemoryResponse> {
    const startTime = Date.now();

    try {
      // 1. Extract intent
      const intent: Intent = {
        action: 'CREATE_MEMORY',
        crew_id: context.crew_id,
        metadata: { type: params.type },
      };

      // 2. Validate authorization
      await validateAuthorization(intent, context);

      // 3. Create memory in database
      const { data, error } = await this.supabase
        .from('crew_memory_vectors')
        .insert({
          crew_id: context.crew_id,
          content: params.content,
          type: params.type,
          retention_tier: params.retention_tier || 'standard',
          confidence_level: 0.95,
          tags: params.tags || [],
          metadata: params.metadata || {},
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new OperationError(
          `Failed to create memory: ${error.message}`,
          'CREATE_MEMORY_FAILED',
          { error: error.message }
        );
      }

      const duration = Date.now() - startTime;
      const cost = this.calculateCost('create_memory', data.content.length);

      // 4. Log operation
      await this.auditService.logOperation(context, intent, 'CREATE_MEMORY', 'success', {
        cost,
        duration_ms: duration,
        memory_ids: [data.id],
      });

      // 5. Return response
      return {
        id: data.id,
        content: data.content,
        type: data.type,
        created_at: data.created_at,
        cost,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.auditService.logOperation(
        context,
        { action: 'CREATE_MEMORY', crew_id: context.crew_id },
        'CREATE_MEMORY',
        'failure',
        {
          cost: 0,
          duration_ms: duration,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );
      throw error;
    }
  }

  /**
   * Retrieve memories
   */
  async retrieve_memories(
    params: RetrieveMemoriesParams,
    context: AuthContext
  ): Promise<RetrieveMemoriesResponse> {
    const startTime = Date.now();

    try {
      // 1. Extract intent
      const intent: Intent = {
        action: 'RETRIEVE_MEMORY',
        crew_id: params.crew_id,
        metadata: { policy: params.policy, filter: params.filter },
      };

      // 2. Validate authorization
      await validateAuthorization(intent, context);

      // 3. Query memories from database
      let query = this.supabase
        .from('crew_memory_vectors')
        .select('*')
        .eq('crew_id', params.crew_id);

      if (params.filter) {
        query = query.ilike('content', `%${params.filter}%`);
      }

      query = query.order('created_at', { ascending: false });

      if (params.limit) {
        query = query.limit(params.limit);
      }

      const { data, error, count } = await query;

      if (error) {
        throw new OperationError(
          `Failed to retrieve memories: ${error.message}`,
          'RETRIEVE_MEMORY_FAILED',
          { error: error.message }
        );
      }

      const duration = Date.now() - startTime;
      const cost = this.calculateCost('retrieve_memory', data?.length || 0);

      // 4. Log operation
      await this.auditService.logOperation(context, intent, 'RETRIEVE_MEMORY', 'success', {
        cost,
        duration_ms: duration,
        memory_ids: data?.map((m: Memory) => m.id) || [],
      });

      // 5. Return response
      return {
        memories: (data || []) as Memory[],
        total: count || 0,
        cost,
        confidence: 0.95,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.auditService.logOperation(
        context,
        { action: 'RETRIEVE_MEMORY', crew_id: params.crew_id },
        'RETRIEVE_MEMORY',
        'failure',
        {
          cost: 0,
          duration_ms: duration,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );
      throw error;
    }
  }

  /**
   * Update a memory
   */
  async update_memory(
    params: UpdateMemoryParams,
    context: AuthContext
  ): Promise<Memory> {
    const startTime = Date.now();

    try {
      // 1. Extract intent
      const intent: Intent = {
        action: 'UPDATE_MEMORY',
        crew_id: context.crew_id,
        resource: params.id,
      };

      // 2. Validate authorization
      await validateAuthorization(intent, context);

      // 3. Update memory in database
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (params.content !== undefined) {
        updateData.content = params.content;
      }
      if (params.metadata !== undefined) {
        updateData.metadata = params.metadata;
      }

      const { data, error } = await this.supabase
        .from('crew_memory_vectors')
        .update(updateData)
        .eq('id', params.id)
        .select()
        .single();

      if (error) {
        throw new OperationError(
          `Failed to update memory: ${error.message}`,
          'UPDATE_MEMORY_FAILED',
          { error: error.message }
        );
      }

      const duration = Date.now() - startTime;
      const cost = this.calculateCost('update_memory', params.content?.length || 0);

      // 4. Log operation
      await this.auditService.logOperation(context, intent, 'UPDATE_MEMORY', 'success', {
        cost,
        duration_ms: duration,
        memory_ids: [params.id],
      });

      // 5. Return response
      return data as Memory;
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.auditService.logOperation(
        context,
        { action: 'UPDATE_MEMORY', crew_id: context.crew_id, resource: params.id },
        'UPDATE_MEMORY',
        'failure',
        {
          cost: 0,
          duration_ms: duration,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );
      throw error;
    }
  }

  /**
   * Delete a memory (soft delete by default)
   */
  async delete_memory(
    params: DeleteMemoryParams,
    context: AuthContext
  ): Promise<{ id: string; deleted: boolean }> {
    const startTime = Date.now();

    try {
      // 1. Extract intent
      const intent: Intent = {
        action: 'DELETE_MEMORY',
        crew_id: context.crew_id,
        resource: params.id,
      };

      // 2. Validate authorization (only owners can delete)
      await validateAuthorization(intent, context);

      // 3. Delete memory (soft delete by default)
      if (params.permanent) {
        // Hard delete
        const { error } = await this.supabase
          .from('crew_memory_vectors')
          .delete()
          .eq('id', params.id);

        if (error) {
          throw new OperationError(
            `Failed to delete memory: ${error.message}`,
            'DELETE_MEMORY_FAILED',
            { error: error.message }
          );
        }
      } else {
        // Soft delete
        const { error } = await this.supabase
          .from('crew_memory_vectors')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', params.id);

        if (error) {
          throw new OperationError(
            `Failed to soft delete memory: ${error.message}`,
            'DELETE_MEMORY_FAILED',
            { error: error.message }
          );
        }
      }

      const duration = Date.now() - startTime;
      const cost = this.calculateCost('delete_memory', 1);

      // 4. Log operation
      await this.auditService.logOperation(context, intent, 'DELETE_MEMORY', 'success', {
        cost,
        duration_ms: duration,
        memory_ids: [params.id],
      });

      // 5. Return response
      return { id: params.id, deleted: true };
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.auditService.logOperation(
        context,
        { action: 'DELETE_MEMORY', crew_id: context.crew_id, resource: params.id },
        'DELETE_MEMORY',
        'failure',
        {
          cost: 0,
          duration_ms: duration,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );
      throw error;
    }
  }

  /**
   * Restore a soft-deleted memory
   */
  async restore_memory(
    params: RestoreMemoryParams,
    context: AuthContext
  ): Promise<Memory> {
    const startTime = Date.now();

    try {
      // 1. Extract intent
      const intent: Intent = {
        action: 'RESTORE_MEMORY',
        crew_id: context.crew_id,
        resource: params.id,
      };

      // 2. Validate authorization
      await validateAuthorization(intent, context);

      // 3. Restore memory
      const { data, error } = await this.supabase
        .from('crew_memory_vectors')
        .update({ deleted_at: null })
        .eq('id', params.id)
        .select()
        .single();

      if (error) {
        throw new OperationError(
          `Failed to restore memory: ${error.message}`,
          'RESTORE_MEMORY_FAILED',
          { error: error.message }
        );
      }

      const duration = Date.now() - startTime;
      const cost = this.calculateCost('restore_memory', 1);

      // 4. Log operation
      await this.auditService.logOperation(context, intent, 'RESTORE_MEMORY', 'success', {
        cost,
        duration_ms: duration,
        memory_ids: [params.id],
      });

      // 5. Return response
      return data as Memory;
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.auditService.logOperation(
        context,
        { action: 'RESTORE_MEMORY', crew_id: context.crew_id, resource: params.id },
        'RESTORE_MEMORY',
        'failure',
        {
          cost: 0,
          duration_ms: duration,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );
      throw error;
    }
  }

  /**
   * CREW OPERATIONS
   */

  /**
   * Execute a crew
   */
  async execute_crew(
    params: ExecuteCrewParams,
    context: AuthContext
  ): Promise<ExecuteCrewResponse> {
    const startTime = Date.now();

    try {
      // 1. Extract intent
      const intent: Intent = {
        action: 'EXECUTE_CREW',
        crew_id: params.crew_id,
        metadata: { input: params.input.substring(0, 100) }, // First 100 chars
      };

      // 2. Validate authorization
      await validateAuthorization(intent, context);

      // 3. Execute crew (placeholder - integration with n8n/orchestration)
      const execution_id = `exec_${Date.now()}`;
      const output = `Crew ${params.crew_id} executed with input: ${params.input}`;
      const cost = this.calculateCost('execute_crew', params.input.length);
      const duration = Date.now() - startTime;

      // 4. Log operation
      await this.auditService.logOperation(context, intent, 'EXECUTE_CREW', 'success', {
        cost,
        duration_ms: duration,
      });

      // 5. Return response
      return {
        crew_id: params.crew_id,
        execution_id,
        output,
        status: 'success',
        cost,
        duration_ms: duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.auditService.logOperation(
        context,
        { action: 'EXECUTE_CREW', crew_id: params.crew_id },
        'EXECUTE_CREW',
        'failure',
        {
          cost: 0,
          duration_ms: duration,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );
      throw error;
    }
  }

  /**
   * QUERY OPERATIONS (via MemoryService)
   */

  /**
   * Search memories with filtering
   */
  async search_memories(
    params: SearchMemoriesParams,
    context: AuthContext
  ): Promise<Memory[]> {
    const startTime = Date.now();

    try {
      // 1. Extract intent
      const intent: Intent = {
        action: 'SEARCH_MEMORIES',
        crew_id: context.crew_id,
        metadata: { query: params.query },
      };

      // 2. Validate authorization (viewers can search)
      await validateAuthorization(intent, context);

      // 3. Search memories via service
      const results = await this.memoryService.searchMemories(params, context);
      const duration = Date.now() - startTime;
      const cost = this.calculateCost('search_memories', results.length);

      // 4. Log operation
      await this.auditService.logOperation(context, intent, 'SEARCH_MEMORIES', 'success', {
        cost,
        duration_ms: duration,
        memory_ids: results.map((m) => m.id),
      });

      // 5. Return results
      return results;
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.auditService.logOperation(
        context,
        { action: 'SEARCH_MEMORIES', crew_id: context.crew_id },
        'SEARCH_MEMORIES',
        'failure',
        {
          cost: 0,
          duration_ms: duration,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );
      throw error;
    }
  }

  /**
   * Explain why a memory was retrieved
   */
  async explain_retrieval(
    memory_id: string,
    query: string,
    context: AuthContext
  ): Promise<{
    memory_id: string;
    relevance_score: number;
    match_reason: string;
    confidence: number;
  }> {
    const startTime = Date.now();

    try {
      // 1. Extract intent
      const intent: Intent = {
        action: 'EXPLAIN_RETRIEVAL',
        crew_id: context.crew_id,
        resource: memory_id,
      };

      // 2. Validate authorization (viewers can read)
      await validateAuthorization(intent, context);

      // 3. Explain retrieval via service
      const explanation = await this.memoryService.explainRetrieval(
        memory_id,
        query,
        context
      );
      const duration = Date.now() - startTime;
      const cost = this.calculateCost('explain_retrieval', 1);

      // 4. Log operation
      await this.auditService.logOperation(
        context,
        intent,
        'EXPLAIN_RETRIEVAL',
        'success',
        {
          cost,
          duration_ms: duration,
          memory_ids: [memory_id],
        }
      );

      // 5. Return explanation
      return explanation;
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.auditService.logOperation(
        context,
        { action: 'EXPLAIN_RETRIEVAL', crew_id: context.crew_id, resource: memory_id },
        'EXPLAIN_RETRIEVAL',
        'failure',
        {
          cost: 0,
          duration_ms: duration,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );
      throw error;
    }
  }

  /**
   * Get compliance status for a crew
   */
  async compliance_status(
    params: ComplianceStatusParams,
    context: AuthContext
  ): Promise<{
    crew_id: string;
    period: string;
    total_memories: number;
    deleted_memories: number;
    recovery_window_days: number;
    gdpr_compliant: boolean;
  }> {
    const startTime = Date.now();

    try {
      // 1. Extract intent
      const intent: Intent = {
        action: 'COMPLIANCE_STATUS',
        crew_id: context.crew_id,
        metadata: { period: params.period },
      };

      // 2. Validate authorization (only owners and members)
      await validateAuthorization(intent, context);

      // 3. Get compliance status via service
      const status = await this.memoryService.getComplianceStatus(params, context);
      const duration = Date.now() - startTime;
      const cost = this.calculateCost('compliance_status', 1);

      // 4. Log operation
      await this.auditService.logOperation(
        context,
        intent,
        'COMPLIANCE_STATUS',
        'success',
        {
          cost,
          duration_ms: duration,
        }
      );

      // 5. Return status
      return status;
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.auditService.logOperation(
        context,
        { action: 'COMPLIANCE_STATUS', crew_id: context.crew_id },
        'COMPLIANCE_STATUS',
        'failure',
        {
          cost: 0,
          duration_ms: duration,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );
      throw error;
    }
  }

  /**
   * Get memory expiration forecast
   */
  async expiration_forecast(
    params: ExpirationForecastParams,
    context: AuthContext
  ): Promise<{
    crew_id: string;
    expiring_soon: number;
    expiring_30days: number;
    expiring_90days: number;
  }> {
    const startTime = Date.now();

    try {
      // 1. Extract intent
      const intent: Intent = {
        action: 'EXPIRATION_FORECAST',
        crew_id: context.crew_id,
      };

      // 2. Validate authorization (only owners and members)
      await validateAuthorization(intent, context);

      // 3. Get forecast via service
      const forecast = await this.memoryService.getExpirationForecast(params, context);
      const duration = Date.now() - startTime;
      const cost = this.calculateCost('expiration_forecast', 1);

      // 4. Log operation
      await this.auditService.logOperation(
        context,
        intent,
        'EXPIRATION_FORECAST',
        'success',
        {
          cost,
          duration_ms: duration,
        }
      );

      // 5. Return forecast
      return forecast;
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.auditService.logOperation(
        context,
        { action: 'EXPIRATION_FORECAST', crew_id: context.crew_id },
        'EXPIRATION_FORECAST',
        'failure',
        {
          cost: 0,
          duration_ms: duration,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );
      throw error;
    }
  }

  /**
   * ADMIN OPERATIONS (via AdminService)
   */

  /**
   * Export crew data
   */
  async export_crew_data(
    params: ExportCrewDataParams,
    context: AuthContext
  ): Promise<string> {
    const startTime = Date.now();

    try {
      // 1. Extract intent
      const intent: Intent = {
        action: 'EXPORT_CREW_DATA',
        crew_id: context.crew_id,
        metadata: { format: params.format },
      };

      // 2. Validate authorization (only owners)
      await validateAuthorization(intent, context);

      // 3. Export data via service
      const exportData = await this.adminService.exportCrewData(
        context.crew_id,
        params.format || 'json',
        context
      );
      const duration = Date.now() - startTime;
      const cost = this.calculateCost('export_crew_data', exportData.length);

      // 4. Log operation
      await this.auditService.logOperation(
        context,
        intent,
        'EXPORT_CREW_DATA',
        'success',
        {
          cost,
          duration_ms: duration,
        }
      );

      // 5. Return exported data
      return exportData;
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.auditService.logOperation(
        context,
        { action: 'EXPORT_CREW_DATA', crew_id: context.crew_id },
        'EXPORT_CREW_DATA',
        'failure',
        {
          cost: 0,
          duration_ms: duration,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );
      throw error;
    }
  }

  /**
   * Import crew data
   */
  async import_crew_data(
    params: ImportCrewDataParams,
    context: AuthContext
  ): Promise<{ imported: number; errors: string[] }> {
    const startTime = Date.now();

    try {
      // 1. Extract intent
      const intent: Intent = {
        action: 'IMPORT_CREW_DATA',
        crew_id: context.crew_id,
        metadata: { merge: params.merge },
      };

      // 2. Validate authorization (only owners)
      await validateAuthorization(intent, context);

      // 3. Import data via service
      const result = await this.adminService.importCrewData(
        params.file,
        context.crew_id,
        params.merge || false,
        context
      );
      const duration = Date.now() - startTime;
      const cost = this.calculateCost('import_crew_data', result.imported);

      // 4. Log operation
      await this.auditService.logOperation(
        context,
        intent,
        'IMPORT_CREW_DATA',
        'success',
        {
          cost,
          duration_ms: duration,
          imported: result.imported,
          errors: result.errors.length,
        }
      );

      // 5. Return result
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.auditService.logOperation(
        context,
        { action: 'IMPORT_CREW_DATA', crew_id: context.crew_id },
        'IMPORT_CREW_DATA',
        'failure',
        {
          cost: 0,
          duration_ms: duration,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );
      throw error;
    }
  }

  /**
   * Prune expired memories
   */
  async prune_expired_memories(
    params: PruneExpiredMemoriesParams,
    context: AuthContext
  ): Promise<{
    pruned: number;
    reason: string;
  }> {
    const startTime = Date.now();

    try {
      // 1. Extract intent
      const intent: Intent = {
        action: 'PRUNE_EXPIRED_MEMORIES',
        crew_id: context.crew_id,
        metadata: { dry_run: params.dry_run },
      };

      // 2. Validate authorization (only owners)
      await validateAuthorization(intent, context);

      // 3. Prune memories via service
      const result = await this.adminService.pruneExpiredMemories(
        context.crew_id,
        params.dry_run || false,
        context
      );
      const duration = Date.now() - startTime;
      const cost = this.calculateCost('prune_expired_memories', result.pruned);

      // 4. Log operation
      await this.auditService.logOperation(
        context,
        intent,
        'PRUNE_EXPIRED_MEMORIES',
        'success',
        {
          cost,
          duration_ms: duration,
          pruned: result.pruned,
        }
      );

      // 5. Return result
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.auditService.logOperation(
        context,
        { action: 'PRUNE_EXPIRED_MEMORIES', crew_id: context.crew_id },
        'PRUNE_EXPIRED_MEMORIES',
        'failure',
        {
          cost: 0,
          duration_ms: duration,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );
      throw error;
    }
  }

  /**
   * Generate audit report
   */
  async generate_audit_report(
    params: GenerateAuditReportParams,
    context: AuthContext
  ): Promise<{
    crew_id: string;
    period: { start: string; end: string };
    total_operations: number;
    by_operation: Record<string, number>;
    total_cost: number;
    summary: string;
  }> {
    const startTime = Date.now();

    try {
      // 1. Extract intent
      const intent: Intent = {
        action: 'GENERATE_AUDIT_REPORT',
        crew_id: context.crew_id,
        metadata: { period: `${params.start_date} to ${params.end_date}` },
      };

      // 2. Validate authorization (only owners)
      await validateAuthorization(intent, context);

      // 3. Generate report via service
      const report = await this.adminService.generateAuditReport(
        context.crew_id,
        params.start_date,
        params.end_date,
        context
      );
      const duration = Date.now() - startTime;
      const cost = this.calculateCost('generate_audit_report', 1);

      // 4. Log operation
      await this.auditService.logOperation(
        context,
        intent,
        'GENERATE_AUDIT_REPORT',
        'success',
        {
          cost,
          duration_ms: duration,
        }
      );

      // 5. Return report
      return report;
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.auditService.logOperation(
        context,
        { action: 'GENERATE_AUDIT_REPORT', crew_id: context.crew_id },
        'GENERATE_AUDIT_REPORT',
        'failure',
        {
          cost: 0,
          duration_ms: duration,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );
      throw error;
    }
  }

  /**
   * Get audit log for a crew
   */
  async getAuditLog(crew_id: string): Promise<unknown[]> {
    return this.auditService.getAuditLog(crew_id);
  }

  /**
   * INTERNAL HELPERS
   */

  /**
   * Calculate operation cost
   */
  private calculateCost(operation: string, size: number): number {
    const costPerUnit: Record<string, number> = {
      create_memory: 0.0001,
      retrieve_memory: 0.00001,
      update_memory: 0.00005,
      delete_memory: 0.00001,
      restore_memory: 0.00001,
      execute_crew: 0.001,
      search_memories: 0.00001,
      explain_retrieval: 0.00001,
      compliance_status: 0.00001,
      expiration_forecast: 0.00001,
      export_crew_data: 0.0001,
      import_crew_data: 0.0001,
      prune_expired_memories: 0.00005,
      generate_audit_report: 0.0001,
    };

    const baseCost = costPerUnit[operation] || 0.0001;
    const scaleFactor = Math.max(1, Math.log10(size + 1));

    return baseCost * scaleFactor;
  }
}
