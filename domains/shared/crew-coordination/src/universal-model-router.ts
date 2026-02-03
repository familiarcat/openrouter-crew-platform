/**
 * Universal Model Router - Claude + OpenRouter Intelligence
 *
 * Implements intelligent model selection based on:
 * - Task complexity analysis
 * - Cost estimation
 * - Model availability
 * - Quality requirements
 * - Budget constraints
 *
 * This is the brain of the cost optimization system that decides
 * whether to use Claude (direct) or OpenRouter (multi-model) for each task.
 */

export interface ModelOption {
  provider: 'claude' | 'openrouter';
  model: string;
  displayName: string;
  tier: 'premium' | 'standard' | 'budget' | 'ultra_budget';
  estimatedCostPerRequest: number;
  estimatedLatencyMs: number;
  qualityScore: number; // 0-100 based on hallucination rate, accuracy
  bestFor: string[];
}

export interface RoutingRequest {
  task: string;
  maxTokens?: number;
  qualityRequired: 'high' | 'medium' | 'low';
  speedRequired: 'fast' | 'normal' | 'slow';
  budget?: number;
  preferredProvider?: 'claude' | 'openrouter';
}

export interface RoutingDecision {
  selectedModel: ModelOption;
  reasoning: string;
  estimatedCost: number;
  estimatedLatency: number;
  alternatives: ModelOption[];
  costSavings?: {
    vsExpensive: number;
    vsMostExpensive: number;
  };
}

/**
 * Universal Model Router - Makes intelligent model selection decisions
 */
export class UniversalModelRouter {
  private claudeModels: ModelOption[] = [
    {
      provider: 'claude',
      model: 'claude-opus-4.5',
      displayName: 'Claude 4.5 Opus (Most Advanced)',
      tier: 'premium',
      estimatedCostPerRequest: 0.015,
      estimatedLatencyMs: 2500,
      qualityScore: 95,
      bestFor: ['complex reasoning', 'strategic planning', 'creative tasks'],
    },
    {
      provider: 'claude',
      model: 'claude-sonnet-4',
      displayName: 'Claude 4 Sonnet (Balanced)',
      tier: 'standard',
      estimatedCostPerRequest: 0.008,
      estimatedLatencyMs: 1800,
      qualityScore: 88,
      bestFor: ['general tasks', 'analysis', 'coding'],
    },
    {
      provider: 'claude',
      model: 'claude-sonnet-3.5',
      displayName: 'Claude 3.5 Sonnet (Fast)',
      tier: 'standard',
      estimatedCostPerRequest: 0.005,
      estimatedLatencyMs: 1200,
      qualityScore: 85,
      bestFor: ['quick analysis', 'simple coding', 'content generation'],
    },
    {
      provider: 'claude',
      model: 'claude-haiku',
      displayName: 'Claude Haiku (Budget)',
      tier: 'budget',
      estimatedCostPerRequest: 0.0008,
      estimatedLatencyMs: 800,
      qualityScore: 70,
      bestFor: ['classification', 'simple summarization', 'data extraction'],
    },
  ];

  private openrouterModels: ModelOption[] = [
    {
      provider: 'openrouter',
      model: 'openai/gpt-4-turbo',
      displayName: 'GPT-4 Turbo (OpenRouter)',
      tier: 'premium',
      estimatedCostPerRequest: 0.012,
      estimatedLatencyMs: 3000,
      qualityScore: 90,
      bestFor: ['complex reasoning', 'coding', 'analysis'],
    },
    {
      provider: 'openrouter',
      model: 'anthropic/claude-3-opus',
      displayName: 'Claude 3 Opus (OpenRouter)',
      tier: 'premium',
      estimatedCostPerRequest: 0.015,
      estimatedLatencyMs: 2800,
      qualityScore: 92,
      bestFor: ['strategic planning', 'complex tasks', 'reasoning'],
    },
    {
      provider: 'openrouter',
      model: 'meta-llama/llama-2-70b',
      displayName: 'Llama 2 70B (OpenRouter)',
      tier: 'budget',
      estimatedCostPerRequest: 0.0008,
      estimatedLatencyMs: 2000,
      qualityScore: 72,
      bestFor: ['coding', 'general tasks', 'creative writing'],
    },
    {
      provider: 'openrouter',
      model: 'google/gemini-pro',
      displayName: 'Gemini Pro (OpenRouter)',
      tier: 'budget',
      estimatedCostPerRequest: 0.0005,
      estimatedLatencyMs: 1500,
      qualityScore: 75,
      bestFor: ['quick analysis', 'summarization', 'translation'],
    },
    {
      provider: 'openrouter',
      model: 'google/gemini-flash-1.5',
      displayName: 'Gemini Flash 1.5 (Ultra Budget)',
      tier: 'ultra_budget',
      estimatedCostPerRequest: 0.0001,
      estimatedLatencyMs: 500,
      qualityScore: 65,
      bestFor: ['quick classification', 'simple extraction', 'filtering'],
    },
  ];

  /**
   * Analyze task complexity on a scale of 1-10
   */
  private analyzeComplexity(task: string): number {
    let complexity = 1;

    // Check for complexity indicators
    const complexityKeywords = [
      { keyword: 'analyze', weight: 2 },
      { keyword: 'strategic', weight: 3 },
      { keyword: 'complex', weight: 3 },
      { keyword: 'reasoning', weight: 2 },
      { keyword: 'plan', weight: 2 },
      { keyword: 'design', weight: 2 },
      { keyword: 'architecture', weight: 3 },
      { keyword: 'debug', weight: 2 },
      { keyword: 'optimize', weight: 2 },
      { keyword: 'summarize', weight: 1 },
      { keyword: 'extract', weight: 1 },
      { keyword: 'classify', weight: 1 },
    ];

    const lowerTask = task.toLowerCase();

    for (const { keyword, weight } of complexityKeywords) {
      if (lowerTask.includes(keyword)) {
        complexity += weight;
      }
    }

    // Add task length factor
    complexity += Math.floor(task.length / 500);

    // Cap at 10
    return Math.min(10, complexity);
  }

  /**
   * Get quality score multiplier based on requirements
   */
  private getQualityMultiplier(qualityRequired: string): number {
    switch (qualityRequired) {
      case 'high':
        return 0.95; // Prefer highest quality
      case 'medium':
        return 0.7; // Balanced
      case 'low':
        return 0.5; // Quality not critical
      default:
        return 0.7;
    }
  }

  /**
   * Get speed score multiplier based on requirements
   */
  private getSpeedMultiplier(speedRequired: string): number {
    switch (speedRequired) {
      case 'fast':
        return 0.95; // Prioritize latency
      case 'normal':
        return 0.7; // Balanced
      case 'slow':
        return 0.3; // Speed not critical
      default:
        return 0.7;
    }
  }

  /**
   * Calculate a score for each model based on routing request
   */
  private scoreModel(
    model: ModelOption,
    request: RoutingRequest,
    complexity: number
  ): number {
    let score = 0;

    // Quality component (40% weight)
    const qualityMultiplier = this.getQualityMultiplier(request.qualityRequired);
    const qualityComponent = (model.qualityScore / 100) * 40 * qualityMultiplier;
    score += qualityComponent;

    // Latency component (30% weight)
    const speedMultiplier = this.getSpeedMultiplier(request.speedRequired);
    const speedComponent =
      ((2500 - model.estimatedLatencyMs) / 2500) * 30 * speedMultiplier;
    score += speedComponent;

    // Cost component (30% weight)
    const costComponent = ((0.015 - model.estimatedCostPerRequest) / 0.015) * 30;
    score += costComponent;

    // Complexity bonus: prefer higher quality for complex tasks
    if (complexity >= 7 && model.qualityScore >= 85) {
      score += 5;
    }

    // Budget penalty
    if (request.budget && model.estimatedCostPerRequest > request.budget) {
      score -= 50; // Strong penalty for exceeding budget
    }

    return score;
  }

  /**
   * Route a request to the best model
   */
  route(request: RoutingRequest): RoutingDecision {
    const complexity = this.analyzeComplexity(request.task);

    // Get candidate models
    let candidates: ModelOption[] = [];

    if (request.preferredProvider === 'claude') {
      candidates = this.claudeModels;
    } else if (request.preferredProvider === 'openrouter') {
      candidates = this.openrouterModels;
    } else {
      // Consider all models
      candidates = [...this.claudeModels, ...this.openrouterModels];
    }

    // Score all candidates
    const scored = candidates.map((model) => ({
      model,
      score: this.scoreModel(model, request, complexity),
    }));

    // Sort by score (highest first)
    scored.sort((a, b) => b.score - a.score);

    // Selected model is highest scored
    const selected = scored[0];

    // Get alternatives (top 3 other options)
    const alternatives = scored
      .slice(1, 4)
      .map((s) => s.model);

    // Calculate cost savings
    const mostExpensiveModel = scored[scored.length - 1].model;
    const costSavings = {
      vsMostExpensive:
        mostExpensiveModel.estimatedCostPerRequest -
        selected.model.estimatedCostPerRequest,
      vsExpensive:
        this.claudeModels[0].estimatedCostPerRequest -
        selected.model.estimatedCostPerRequest,
    };

    // Generate reasoning
    const reasoning = this.generateReasoning(
      selected.model,
      request,
      complexity
    );

    return {
      selectedModel: selected.model,
      reasoning,
      estimatedCost: selected.model.estimatedCostPerRequest,
      estimatedLatency: selected.model.estimatedLatencyMs,
      alternatives,
      costSavings,
    };
  }

  /**
   * Generate human-readable reasoning for selection
   */
  private generateReasoning(
    model: ModelOption,
    request: RoutingRequest,
    complexity: number
  ): string {
    const reasons: string[] = [];

    // Complexity
    if (complexity >= 8) {
      reasons.push(`High task complexity (${complexity}/10) requires advanced model`);
    } else if (complexity >= 5) {
      reasons.push(`Medium task complexity (${complexity}/10)`);
    } else {
      reasons.push(`Low task complexity (${complexity}/10) - budget model sufficient`);
    }

    // Quality
    if (request.qualityRequired === 'high') {
      reasons.push(
        `High quality required - selected high-accuracy model (${model.qualityScore}% quality)`
      );
    }

    // Speed
    if (request.speedRequired === 'fast') {
      reasons.push(
        `Fast response required - selected model with ${model.estimatedLatencyMs}ms latency`
      );
    }

    // Cost
    if (request.budget) {
      if (model.estimatedCostPerRequest <= request.budget / 10) {
        reasons.push(`Well within budget: $${model.estimatedCostPerRequest.toFixed(4)} < budget`);
      }
    }

    // Best for
    if (model.bestFor.some((task) => request.task.toLowerCase().includes(task))) {
      reasons.push(`Model is optimized for ${model.bestFor.join(', ')}`);
    }

    return reasons.join(' • ');
  }

  /**
   * Get all available models (for comparison)
   */
  getAllModels(): ModelOption[] {
    return [...this.claudeModels, ...this.openrouterModels];
  }

  /**
   * Get models for a specific tier
   */
  getModelsByTier(tier: 'premium' | 'standard' | 'budget' | 'ultra_budget'): ModelOption[] {
    return this.getAllModels().filter((m) => m.tier === tier);
  }

  /**
   * Compare multiple models for cost/quality trade-offs
   */
  compare(task: string, count: number = 5): ModelOption[] {
    const allModels = this.getAllModels();

    // Score models for this task
    const request: RoutingRequest = {
      task,
      qualityRequired: 'medium',
      speedRequired: 'normal',
    };

    const complexity = this.analyzeComplexity(task);

    const scored = allModels.map((model) => ({
      model,
      score: this.scoreModel(model, request, complexity),
    }));

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, count).map((s) => s.model);
  }
}

/**
 * Singleton instance
 */
let routerInstance: UniversalModelRouter | null = null;

export function getUniversalModelRouter(): UniversalModelRouter {
  if (!routerInstance) {
    routerInstance = new UniversalModelRouter();
  }
  return routerInstance;
}
