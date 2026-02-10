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
} from './types';
import { validateAuthorization } from './services/authorization';
import { AuditService } from './services/audit';

export class CrewAPIClient {
  private auditService: AuditService;

  constructor(private supabase: SupabaseClient) {
    this.auditService = new AuditService(supabase);
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
        memory_ids: data?.map((m) => m.id) || [],
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
    };

    const baseCost = costPerUnit[operation] || 0.0001;
    const scaleFactor = Math.max(1, Math.log10(size + 1));

    return baseCost * scaleFactor;
  }
}
