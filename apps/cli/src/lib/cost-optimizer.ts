/**
 * Cost Optimizer - Pre-execution cost analysis and optimization
 * This implements the "3-Body Problem" energy conservation principle:
 * Every operation must be analyzed for cost impact BEFORE execution
 */

export interface CostAnalysis {
  current: {
    member: string;
    model: string;
    estimatedCost: number;
  };
  alternatives?: Array<{
    member: string;
    model: string;
    estimatedCost: number;
    recommended?: boolean;
  }>;
  withinBudget: boolean;
  budget: number;
}

export class CostOptimizer {
  /**
   * Model pricing (simplified - would fetch from OpenRouter in production)
   */
  private modelPricing: Record<string, { input: number; output: number }> = {
    'claude-sonnet-4': { input: 0.003, output: 0.015 },
    'claude-sonnet-3.5': { input: 0.003, output: 0.015 },
    'claude-haiku': { input: 0.00025, output: 0.00125 },
    'gemini-flash-1.5': { input: 0.00001, output: 0.00004 },
  };

  /**
   * Crew member to model mapping
   */
  private crewModels: Record<string, string> = {
    picard: 'claude-sonnet-4',
    data: 'claude-sonnet-3.5',
    riker: 'claude-sonnet-3.5',
    troi: 'claude-sonnet-3.5',
    worf: 'claude-sonnet-3.5',
    crusher: 'claude-sonnet-3.5',
    lafarge: 'claude-sonnet-3.5',
    uhura: 'claude-sonnet-3.5',
    obrien: 'gemini-flash-1.5',
    quark: 'gemini-flash-1.5',
  };

  /**
   * Analyze task and provide cost optimization options
   */
  async analyze(member: string, task: string): Promise<CostAnalysis> {
    // Estimate tokens for the task
    const estimatedTokens = this.estimateTokens(task);

    // Get current crew member's model
    const currentModel = this.crewModels[member.toLowerCase()] || 'claude-sonnet-3.5';
    const currentCost = this.calculateCost(currentModel, estimatedTokens);

    // Generate alternatives
    const alternatives = this.generateAlternatives(member, currentModel, estimatedTokens);

    // Get project budget (simplified - would fetch from Supabase in production)
    const budget = process.env.PROJECT_BUDGET ? parseFloat(process.env.PROJECT_BUDGET) : 100.0;

    return {
      current: {
        member,
        model: currentModel,
        estimatedCost: currentCost,
      },
      alternatives,
      withinBudget: currentCost <= budget,
      budget,
    };
  }

  /**
   * Estimate tokens from task description
   */
  private estimateTokens(task: string): { input: number; output: number } {
    // Rough estimate: 1 token ≈ 4 characters
    const inputTokens = Math.ceil(task.length / 4);

    // Estimate output based on complexity
    let outputTokens = 200; // Minimum response

    if (task.length > 500) {
      outputTokens = 500;
    }
    if (task.includes('analyze') || task.includes('compare') || task.includes('evaluate')) {
      outputTokens = Math.max(outputTokens, 800);
    }
    if (task.includes('code') || task.includes('implement') || task.includes('debug')) {
      outputTokens = Math.max(outputTokens, 1000);
    }

    return { input: inputTokens, output: outputTokens };
  }

  /**
   * Calculate cost for a model and token count
   */
  private calculateCost(model: string, tokens: { input: number; output: number }): number {
    const pricing = this.modelPricing[model] || this.modelPricing['claude-sonnet-3.5'];
    return tokens.input * pricing.input + tokens.output * pricing.output;
  }

  /**
   * Generate alternative crew members and models
   */
  private generateAlternatives(
    member: string,
    currentModel: string,
    tokens: { input: number; output: number }
  ): Array<{
    member: string;
    model: string;
    estimatedCost: number;
    recommended?: boolean;
  }> {
    const alternatives = [];

    // Get all available models and their costs
    const modelCosts = Object.entries(this.modelPricing).map(([model, pricing]) => ({
      model,
      cost: this.calculateCost(model, tokens),
    }));

    // Sort by cost
    modelCosts.sort((a, b) => a.cost - b.cost);

    // Add top 3 cheaper alternatives
    for (const { model, cost } of modelCosts.slice(0, 3)) {
      if (model === currentModel) continue;

      // Find a crew member with this model
      const altMember = Object.entries(this.crewModels).find(([_, m]) => m === model)?.[0] || 'obrien';

      const savings = this.calculateCost(currentModel, tokens) - cost;
      const savingsPercent = (savings / this.calculateCost(currentModel, tokens)) * 100;

      alternatives.push({
        member: altMember,
        model,
        estimatedCost: cost,
        recommended: savingsPercent > 25, // Recommend if > 25% savings
      });
    }

    return alternatives;
  }

  /**
   * Check if operation is within budget
   */
  async checkBudget(cost: number, budget?: number): Promise<boolean> {
    const projectBudget = budget || (process.env.PROJECT_BUDGET ? parseFloat(process.env.PROJECT_BUDGET) : 100.0);

    return cost <= projectBudget;
  }

  /**
   * Get cost optimization recommendation
   */
  async getRecommendation(
    member: string,
    task: string
  ): Promise<{ recommended: string; savings: number; explanation: string }> {
    const analysis = await this.analyze(member, task);

    if (!analysis.alternatives || analysis.alternatives.length === 0) {
      return {
        recommended: member,
        savings: 0,
        explanation: 'No cheaper alternatives available',
      };
    }

    const best = analysis.alternatives[0];
    const savings = analysis.current.estimatedCost - best.estimatedCost;

    return {
      recommended: best.member,
      savings,
      explanation: `${best.member} (${best.model}) would save $${savings.toFixed(4)} (${(
        (savings / analysis.current.estimatedCost) *
        100
      ).toFixed(1)}%)`,
    };
  }
}
