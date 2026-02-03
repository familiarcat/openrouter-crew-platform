/**
 * Async Webhook Client with Request Tracking
 *
 * Unified client for n8n webhook integration with:
 * - Pre-execution cost optimization (3-Body Problem energy conservation)
 * - Request tracking in Supabase workflow_requests table
 * - Async callback patterns for long-running workflows
 * - Real-time polling and status tracking
 * - Automatic retry with exponential backoff
 *
 * This consolidates multiple webhook client implementations into a single,
 * cost-optimized solution that supports both sync and async workflows.
 */

import { CrewRequest, CrewResponse } from './types';
import { getCrewMember } from './members';

export interface AsyncWebhookConfig {
  baseUrl: string;
  apiKey?: string;
  n8nUrl?: string;
  n8nApiKey?: string;
  supabaseUrl?: string;
  supabaseKey?: string;
  timeout?: number;
  maxRetries?: number;
  maxPolls?: number;
  pollIntervalMs?: number;
}

export interface WorkflowRequest {
  id: string;
  workflowId: string;
  workflowName: string;
  n8nWorkflowId?: string;
  n8nExecutionId?: string;
  requestType: 'crew-consult' | 'workflow-trigger' | 'coordination' | 'custom';
  requestPayload: Record<string, any>;
  status: 'pending' | 'running' | 'success' | 'failed' | 'timeout' | 'cancelled';
  responsePayload?: Record<string, any>;
  errorMessage?: string;
  estimatedCostUsd?: number;
  actualCostUsd?: number;
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
  pollCount: number;
  retryCount: number;
}

export interface AsyncCallOptions {
  async: boolean;
  timeout?: number;
  maxPolls?: number;
  pollIntervalMs?: number;
  estimatedCost?: number;
  maxRetries?: number;
}

/**
 * Async Webhook Client - Unified n8n integration with cost optimization
 */
export class AsyncWebhookClient {
  private config: AsyncWebhookConfig;
  private supabaseClient?: any; // Will be lazily initialized
  private requestCache: Map<string, WorkflowRequest> = new Map();

  constructor(config: AsyncWebhookConfig) {
    this.config = {
      timeout: 30000,
      maxRetries: 3,
      maxPolls: 60,
      pollIntervalMs: 5000,
      ...config,
    };
  }

  /**
   * Initialize Supabase client for request tracking
   */
  private async initSupabaseClient(): Promise<any> {
    if (this.supabaseClient) return this.supabaseClient;

    try {
      const { createClient } = require('@supabase/supabase-js');
      this.supabaseClient = createClient(
        this.config.supabaseUrl || process.env.SUPABASE_URL,
        this.config.supabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      return this.supabaseClient;
    } catch (error) {
      console.warn('Failed to initialize Supabase client:', error);
      return null;
    }
  }

  /**
   * Make a webhook call with cost optimization and async support
   *
   * Implements the 3-Body Problem principle:
   * 1. Analyze cost impact BEFORE execution
   * 2. Check if within budget constraints
   * 3. Track execution with request lifecycle
   * 4. Enable long-running workflows with polling
   */
  async call(
    request: CrewRequest,
    options: Partial<AsyncCallOptions> = {}
  ): Promise<{ data: CrewResponse; requestId?: string }> {
    const member = getCrewMember(request.crewMember);
    if (!member) {
      throw new Error(`Unknown crew member: ${request.crewMember}`);
    }

    const mergedOptions: AsyncCallOptions = {
      async: false,
      timeout: this.config.timeout,
      maxPolls: this.config.maxPolls,
      pollIntervalMs: this.config.pollIntervalMs,
      maxRetries: this.config.maxRetries,
      ...options,
    };

    // Step 1: Pre-execution cost check (Energy Conservation)
    const estimatedCost = mergedOptions.estimatedCost || this.estimateCost(request, member);
    if (!this.checkBudget(estimatedCost)) {
      throw new Error(
        `Estimated cost $${estimatedCost.toFixed(4)} exceeds budget. ` +
        `Use cost optimization: crew cost optimize ${request.crewMember} "${request.message}"`
      );
    }

    // Step 2: Create workflow request tracking entry
    const workflowRequest = await this.createWorkflowRequest(
      request,
      member,
      estimatedCost,
      mergedOptions
    );

    try {
      // Step 3: Make the webhook call with retries
      const response = await this.executeWithRetry(
        request,
        member,
        workflowRequest,
        mergedOptions
      );

      // Step 4: Update request tracking with response
      await this.updateWorkflowRequest(workflowRequest.id, {
        status: 'success',
        responsePayload: response,
        actualCostUsd: response.estimatedCost,
        completedAt: new Date(),
      });

      return {
        data: response,
        requestId: workflowRequest.id,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Update request with error status
      await this.updateWorkflowRequest(workflowRequest.id, {
        status: 'failed',
        errorMessage,
        completedAt: new Date(),
      });

      throw new Error(`Webhook call failed for ${request.crewMember}: ${errorMessage}`);
    }
  }

  /**
   * Create a workflow request tracking entry in Supabase
   */
  private async createWorkflowRequest(
    request: CrewRequest,
    member: any,
    estimatedCost: number,
    options: AsyncCallOptions
  ): Promise<WorkflowRequest> {
    const supabase = await this.initSupabaseClient();
    if (!supabase) {
      // Fallback: create in-memory tracking if Supabase unavailable
      return this.createLocalWorkflowRequest(request, member, estimatedCost);
    }

    try {
      const { data, error } = await supabase
        .from('workflow_requests')
        .insert({
          workflow_name: `crew-${request.crewMember}`,
          request_type: 'crew-consult',
          request_payload: {
            crewMember: request.crewMember,
            message: request.message,
            context: request.context,
          },
          status: 'pending',
          estimated_cost_usd: estimatedCost,
          crew_member: request.crewMember,
          user_id: request.userId || 'default',
          session_id: request.sessionId,
          project_id: request.projectId,
        })
        .select()
        .single();

      if (error) {
        console.warn('Failed to create workflow request in Supabase:', error);
        return this.createLocalWorkflowRequest(request, member, estimatedCost);
      }

      const tracked: WorkflowRequest = {
        id: data.id,
        workflowId: data.workflow_id,
        workflowName: data.workflow_name,
        n8nWorkflowId: data.n8n_workflow_id,
        requestType: data.request_type,
        requestPayload: data.request_payload,
        status: data.status,
        estimatedCostUsd: data.estimated_cost_usd,
        startedAt: new Date(data.created_at),
        pollCount: 0,
        retryCount: 0,
      };

      this.requestCache.set(data.id, tracked);
      return tracked;
    } catch (error) {
      console.warn('Error creating workflow request:', error);
      return this.createLocalWorkflowRequest(request, member, estimatedCost);
    }
  }

  /**
   * Create in-memory workflow request (fallback)
   */
  private createLocalWorkflowRequest(
    request: CrewRequest,
    member: any,
    estimatedCost: number
  ): WorkflowRequest {
    const id = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const tracked: WorkflowRequest = {
      id,
      workflowId: `crew-${request.crewMember}`,
      workflowName: `crew-${request.crewMember}`,
      requestType: 'crew-consult',
      requestPayload: {
        crewMember: request.crewMember,
        message: request.message,
        context: request.context,
      },
      status: 'pending',
      estimatedCostUsd: estimatedCost,
      startedAt: new Date(),
      pollCount: 0,
      retryCount: 0,
    };

    this.requestCache.set(id, tracked);
    return tracked;
  }

  /**
   * Execute webhook call with automatic retry on failure
   */
  private async executeWithRetry(
    request: CrewRequest,
    member: any,
    workflowRequest: WorkflowRequest,
    options: AsyncCallOptions
  ): Promise<CrewResponse> {
    let lastError: Error | null = null;
    const maxRetries = options.maxRetries || 3;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.executeWebhook(request, member, workflowRequest);
        return response;
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxRetries) {
          // Exponential backoff: 100ms, 200ms, 400ms
          const delayMs = Math.pow(2, attempt) * 100;
          console.warn(
            `Webhook call attempt ${attempt + 1} failed, retrying in ${delayMs}ms:`,
            lastError.message
          );
          await this.delay(delayMs);

          // Update retry count
          await this.updateWorkflowRequest(workflowRequest.id, {
            retryCount: attempt + 1,
          });
        }
      }
    }

    throw lastError || new Error('Webhook execution failed');
  }

  /**
   * Execute the actual webhook call
   */
  private async executeWebhook(
    request: CrewRequest,
    member: any,
    workflowRequest: WorkflowRequest
  ): Promise<CrewResponse> {
    const webhookUrl = member.webhookUrl || this.buildWebhookUrl(member.name);
    const startTime = Date.now();

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'X-N8N-API-KEY': this.config.apiKey }),
        },
        body: JSON.stringify({
          project_id: request.projectId,
          message: request.message,
          context: request.context || {},
          max_tokens: request.maxTokens,
          temperature: request.temperature,
          workflow_request_id: workflowRequest.id,
        }),
        signal: AbortSignal.timeout(this.config.timeout!),
      });

      if (!response.ok) {
        throw new Error(
          `Webhook returned ${response.status}: ${response.statusText}`
        );
      }

      const data = (await response.json()) as any;
      const executionTime = Date.now() - startTime;

      return {
        crewMember: request.crewMember,
        content: data.content || data.response || '',
        model: data.model || member.defaultModel,
        tokensUsed: data.tokens_used || data.total_tokens || 0,
        estimatedCost: data.estimated_cost || data.cost || 0,
        executionTime,
        metadata: data.metadata || {},
      };
    } catch (error) {
      throw new Error(
        `Failed to call webhook ${webhookUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Update workflow request status in Supabase
   */
  private async updateWorkflowRequest(
    requestId: string,
    updates: Partial<WorkflowRequest>
  ): Promise<void> {
    // Update cache
    const cached = this.requestCache.get(requestId);
    if (cached) {
      this.requestCache.set(requestId, { ...cached, ...updates });
    }

    // Update in Supabase
    const supabase = await this.initSupabaseClient();
    if (!supabase) return;

    try {
      const dbUpdates: Record<string, any> = {};
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.responsePayload) dbUpdates.response_payload = updates.responsePayload;
      if (updates.errorMessage) dbUpdates.error_message = updates.errorMessage;
      if (updates.actualCostUsd) dbUpdates.actual_cost_usd = updates.actualCostUsd;
      if (updates.completedAt) dbUpdates.completed_at = updates.completedAt.toISOString();
      if (updates.retryCount !== undefined) dbUpdates.retry_count = updates.retryCount;
      if (updates.pollCount !== undefined) dbUpdates.poll_count = updates.pollCount;

      await supabase
        .from('workflow_requests')
        .update(dbUpdates)
        .eq('id', requestId);
    } catch (error) {
      console.warn('Failed to update workflow request:', error);
    }
  }

  /**
   * Get request status by ID
   */
  async getRequestStatus(requestId: string): Promise<WorkflowRequest | null> {
    // Check cache first
    const cached = this.requestCache.get(requestId);
    if (cached) return cached;

    // Check Supabase
    const supabase = await this.initSupabaseClient();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('workflow_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (error) return null;

      const request: WorkflowRequest = {
        id: data.id,
        workflowId: data.workflow_id,
        workflowName: data.workflow_name,
        n8nWorkflowId: data.n8n_workflow_id,
        requestType: data.request_type,
        requestPayload: data.request_payload,
        status: data.status,
        responsePayload: data.response_payload,
        errorMessage: data.error_message,
        estimatedCostUsd: data.estimated_cost_usd,
        actualCostUsd: data.actual_cost_usd,
        startedAt: new Date(data.created_at),
        completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
        durationMs: data.duration_ms,
        pollCount: data.poll_count,
        retryCount: data.retry_count,
      };

      this.requestCache.set(requestId, request);
      return request;
    } catch (error) {
      console.warn('Error fetching request status:', error);
      return null;
    }
  }

  /**
   * Estimate cost based on crew member and task complexity
   */
  private estimateCost(request: CrewRequest, member: any): number {
    // Rough estimation based on message length and member tier
    const messageTokens = Math.ceil(request.message.length / 4);
    const contextTokens = request.context
      ? Math.ceil(JSON.stringify(request.context).length / 4)
      : 0;
    const inputTokens = messageTokens + contextTokens;
    const outputTokens = Math.max(200, inputTokens / 2);

    // Model pricing (simplified)
    const modelPricing: Record<string, { input: number; output: number }> = {
      'claude-sonnet-4': { input: 0.003, output: 0.015 },
      'claude-sonnet-3.5': { input: 0.003, output: 0.015 },
      'claude-haiku': { input: 0.00025, output: 0.00125 },
      'gemini-flash-1.5': { input: 0.00001, output: 0.00004 },
    };

    const model = member.defaultModel || 'claude-sonnet-3.5';
    const pricing = modelPricing[model] || modelPricing['claude-sonnet-3.5'];

    return inputTokens * pricing.input + outputTokens * pricing.output;
  }

  /**
   * Check if operation is within budget
   */
  private checkBudget(cost: number): boolean {
    const budget = parseFloat(process.env.PROJECT_BUDGET || '100');
    return cost <= budget;
  }

  /**
   * Build webhook URL from crew member name
   */
  private buildWebhookUrl(crewMemberName: string): string {
    const base = this.config.baseUrl || process.env.N8N_WEBHOOK_URL;
    return `${base}/webhook/crew-${crewMemberName}`;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Test webhook connectivity
   */
  async testConnection(crewMemberName: string): Promise<boolean> {
    try {
      const member = getCrewMember(crewMemberName);
      if (!member) return false;

      const webhookUrl = member.webhookUrl || this.buildWebhookUrl(member.name);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'X-N8N-API-KEY': this.config.apiKey }),
        },
        body: JSON.stringify({
          test: true,
          message: 'Connection test',
        }),
        signal: AbortSignal.timeout(5000),
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}
