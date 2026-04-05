import { SupabaseClient } from '@supabase/supabase-js';
import { CrewAPIClient } from '@openrouter-crew/crew-api-client';
import { ModelChoice, budgetEnforcer } from '@openrouter-crew/shared-cost-tracking';
import { ConsistencyChecker, ConsistencyCheckResult } from './consistency-checker';

export interface ExecuteParams {
  crew_id: string;
  input: string;
  project_id: string;
  model?: ModelChoice;
}

/**
 * AsyncWebhookClient handles long-running agent tasks by implementing
 * a consistency-guarded retry loop.
 */
export class AsyncWebhookClient {
  private maxRetries = 3;

  constructor(
    private supabase: SupabaseClient,
    private apiClient: CrewAPIClient,
    private consistencyChecker: ConsistencyChecker
  ) {}

  /**
   * Executes a crew task with a Hinton-inspired consistency loop.
   * Tracks every attempt in the attempt_metadata JSONB column in Supabase.
   */
  public async executeWithRetry(params: ExecuteParams, workflowRequestId: string) {
    let currentTaskInput = params.input;
    let currentModel: ModelTier = params.model || ModelTier.HAIKU;
    const attemptsHistory: { attempt: number; model: ModelTier; timestamp: string; duration_ms: number; consistency_score: number; is_consistent: boolean; cost_usd: number; }[] = []; // Geordi: Explicitly type history

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const startTime = Date.now();
      
      try {
        // 1. Execute the agent task via the unified API client
        const response = await this.apiClient.execute_crew({
          ...params,
          input: currentTaskInput,
          model: currentModel,
        }) as CrewResponse; // Geordi: Explicitly cast to CrewResponse

        // 2. Perform Adversarial Consistency Validation (Assume Deception)
        const validation: ConsistencyCheckResult = await this.consistencyChecker.validate(
          currentTaskInput,
          response.content,
          { projectId: params.project_id }
        );

        // 3. Construct the attempt metadata object
        const attemptEntry = {
          attempt,
          model: currentModel,
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
          consistency_score: validation.score,
          is_consistent: validation.isConsistent,
          cost_usd: response.costUSD || 0
        };
        attemptsHistory.push(attemptEntry);

        // 4. Update Supabase with the current list of attempts and latest scores
        await this.supabase
          .from('workflow_requests')
          .update({
            attempt_metadata: attemptsHistory,
            retry_count: attempt,
            last_critique: validation.reasoning,
            consistency_score: validation.score,
            status: validation.isConsistent ? 'success' : (attempt === this.maxRetries ? 'failed' : 'running')
          })
          .eq('id', workflowRequestId);

        // 5. Exit if consistent, otherwise prepare for retry
        if (validation.isConsistent) {
          return response;
        }

        if (attempt < this.maxRetries) {
          // Apply Budget Buffer: only upgrade model if budget is < 90% used
          const isConstrained = budgetEnforcer.isDailyBudgetConstrained(params.project_id);
          currentModel = this.consistencyChecker.getRecommendedModel(
            currentModel,
            validation,
            attempt,
            isConstrained
          );

          // Set up the next prompt with the auditor's critique
          currentTaskInput = this.consistencyChecker.getRetryPrompt(params.input, validation);
        }
      } catch (error: any) {
        console.error(`Execution error on attempt ${attempt}:`, error);
        if (attempt === this.maxRetries) throw error;
      }
    }

    throw new Error(`Mission failed: Consistency threshold not met after ${this.maxRetries} attempts.`);
  }
}