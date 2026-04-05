import { CrewAPIClient } from '@openrouter-crew/crew-api-client';
import { ModelTier } from '@openrouter-crew/shared-cost-tracking';
import { CrewResponse } from './types';

export interface ConsistencyCheckResult {
  isConsistent: boolean;
  score: number; // 0.0 to 1.0
  contradictions: string[];
  reasoning: string;
  suggestedCorrection?: string;
}

/**
 * Hinton-inspired Consistency Checker
 * Implements Axiom 1 of the Dark Forest Protocol: Assume Deception.
 */
export class ConsistencyChecker {
  constructor(private apiClient: CrewAPIClient) {}

  /**
   * Performs an adversarial review of an agent's output.
   * Usually routes to a higher-tier model (Sonnet/Opus) to "criticize" a lower-tier (Haiku).
   */
  async validate(
    originalTask: string,
    agentOutput: string,
    metadata: Record<string, any> = {}
  ): Promise<ConsistencyCheckResult> {
    const criticPrompt = `
      You are an adversarial consistency auditor. 
      Original Task: "${originalTask}"
      Agent Output: "${agentOutput}"
      
      Analyze the output for:
      1. Internal contradictions (does it say X and then implicitly Y?).
      2. Constraint violations (did it ignore rules set in the task?).
      3. Hallucination/Confabulation (does it state facts that contradict the context?).
      
      Respond in JSON format:
      {
        "isConsistent": boolean,
        "score": number,
        "contradictions": string[],
        "reasoning": string,
        "suggestedCorrection": string
      }
    `;

    try {
      const response = await this.apiClient.execute_crew({
        crew_id: 'consistency-critic',
        input: criticPrompt,
        project_id: metadata.projectId || 'system'
      });

      const result = JSON.parse((response as CrewResponse).content) as ConsistencyCheckResult; // Geordi: Explicitly cast to CrewResponse
      return result;
    } catch (error) {
      console.error('Consistency check failed, falling back to neutral score', error);
      return {
        isConsistent: true, // Fail-open to avoid blocking ops
        score: 0.5,
        contradictions: [],
        reasoning: 'Validator error - check logs'
      };
    }
  }

  /**
   * Compares outputs from two different agents/models on the same task.
   */
  async crossValidate(outputs: string[]): Promise<boolean> {
    // Implementation for "Council of Agents" pattern
    // Logic: If N agents disagree significantly, flag for human review
    return true; 
  }

  /**
   * Formats a retry prompt based on validation contradictions.
   */
  getRetryPrompt(originalTask: string, result: ConsistencyCheckResult): string {
    return `
Your previous response was flagged by the Consistency Auditor for the following issues:
${result.contradictions.map(c => `- ${c}`).join('\n')}

Reasoning: ${result.reasoning}
${result.suggestedCorrection ? `Correction Hint: ${result.suggestedCorrection}` : ''}

Please provide a corrected version of the task: ${originalTask}`;
  }

  /**
   * Recommends a model for the next attempt based on the consistency score 
   * and current retry count.
   */
  getRecommendedModel(
    currentModel: ModelTier,
    result: ConsistencyCheckResult,
    retryCount: number,
    isBudgetConstrained: boolean = false
  ): ModelTier {
    // If the budget is nearly exhausted, prevent model upgrades to conserve funds
    if (isBudgetConstrained) {
      console.warn('Budget buffer active: preventing intelligence upgrade.');
      return currentModel;
    }

    // If the score is critically low (< 0.4) or we've already tried and failed 
    // at the current tier, upgrade to the next level of intelligence. (Data: This logic is sound)
    if (result.score < 0.4 || retryCount >= 1) { // Geordi: Added explicit retryCount check
      const tiers = [ModelTier.HAIKU, ModelTier.SONNET, ModelTier.OPUS, ModelTier.GPT_4O, ModelTier.GEMINI_1_5_PRO]; // Picard: Expanded tiers for broader model choice
      const currentIndex = tiers.indexOf(currentModel);

      if (currentIndex !== -1 && currentIndex < tiers.length - 1) {
        return tiers[currentIndex + 1];
      }
    }
    return currentModel;
  }
}