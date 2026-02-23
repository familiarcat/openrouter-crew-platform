import * as vscode from 'vscode';
import { CostTracker } from './cost-tracker.js';
import { ResponseCache } from './cache.js';

/**
 * LLM Router Service
 * Routes prompts to the most cost-effective model based on complexity and intent.
 */

export type Intent = 'ASK' | 'REVIEW' | 'GENERATE' | 'EXPLAIN' | 'REFACTOR' | 'DEBUG' | 'TEST' | 'OPTIMIZE' | 'DOCUMENT';
export type ExtendedIntent = Intent | 'STRUCTURE' | 'TERMINAL' | 'COMPLETE';
export type Complexity = 'LOW' | 'MEDIUM' | 'HIGH';

export interface LLMRequest {
  prompt: string;
  context?: string | { selectedCode: string };
  intent?: ExtendedIntent;
  complexity?: Complexity;
  language?: string;
  maxTokens?: number;
}

export interface LLMResponse {
  content: string;
  model: string;
  cost: number;
  costUSD?: number;
  executionTimeMs?: number;
}

export class LLMRouter {
  constructor(private costTracker: CostTracker, private cache?: ResponseCache) {
    // CostOptimizationService is integrated via CostTracker
  }

  /**
   * Estimates the complexity of a request based on length, intent, and keywords.
   * See docs/LLM_ROUTER_LOGIC.md for detailed scoring logic.
   */
  public estimateComplexity(request: LLMRequest): Complexity {
    if (request.complexity) {
        return request.complexity; // Allow override
    }

    let score = 0;
    const promptLength = request.prompt.length;
    const contextLength = typeof request.context === 'string' 
        ? request.context.length 
        : (request.context?.selectedCode?.length || 0);

    // Score based on length
    if (promptLength + contextLength > 2000) score += 3;
    else if (promptLength + contextLength > 500) score += 1;

    // Score based on intent
    const complexIntents: ExtendedIntent[] = ['DEBUG', 'REFACTOR', 'OPTIMIZE', 'STRUCTURE', 'TEST'];
    if (request.intent && complexIntents.includes(request.intent)) {
        score += 2;
    }

    // Score based on keywords
    const complexKeywords = ['algorithm', 'architecture', 'performance', 'concurrent', 'database', 'security'];
    for (const keyword of complexKeywords) {
        if (request.prompt.toLowerCase().includes(keyword)) {
            score += 1;
        }
    }

    if (score >= 4) return 'HIGH';
    if (score >= 2) return 'MEDIUM';
    return 'LOW';
  }

  public selectModel(request: LLMRequest, config: vscode.WorkspaceConfiguration): string {
    const complexity = this.estimateComplexity(request);

    const modelSimple = config.get<string>('model.simple')!;
    const modelDefault = config.get<string>('model.default')!;
    const modelComplex = config.get<string>('model.complex')!;
    const modelReview = config.get<string>('model.review')!;
    const modelPremium = config.get<string>('model.premium') || 'anthropic/claude-3-opus';

    // Intent-based overrides first
    switch (request.intent) {
        case 'REVIEW':
            return modelReview;
        case 'STRUCTURE':
            return modelPremium;
        case 'DEBUG':
        case 'REFACTOR':
        case 'OPTIMIZE':
            if (complexity === 'HIGH') {
                return modelPremium;
            }
            return modelComplex;
    }

    // Then complexity-based
    switch (complexity) {
        case 'LOW':
            return modelSimple;
        case 'HIGH':
            return modelComplex;
        case 'MEDIUM':
        default:
            return modelDefault;
    }
  }

  /**
   * Executes fetch with exponential backoff and jitter to handle rate limits (429)
   * and server errors (5xx).
   */
  private async _fetchWithBackoff(url: string, options: any, retries = 3, delay = 1000): Promise<Response> {
    try {
      const response = await fetch(url, options);

      if (response.ok) {
        return response;
      }

      // Retry on 429 (Rate Limit) or 5xx (Server Error)
      if (retries > 0 && (response.status === 429 || response.status >= 500)) {
        const jitter = Math.random() * 200; // Add 0-200ms jitter to prevent thundering herd
        const waitTime = delay + jitter;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this._fetchWithBackoff(url, options, retries - 1, delay * 2);
      }

      return response;
    } catch (error) {
      if (retries > 0) {
        const jitter = Math.random() * 200;
        const waitTime = delay + jitter;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this._fetchWithBackoff(url, options, retries - 1, delay * 2);
      }
      throw error;
    }
  }

  /**
   * Route a request to the optimal model
   */
  async route(request: LLMRequest): Promise<LLMResponse> {
    const config = vscode.workspace.getConfiguration('openrouterCrew');

    // Check cache first
    let cacheKey: string | undefined;
    const contextStr = typeof request.context === 'string' ? request.context : request.context?.selectedCode || '';
    if (this.cache) {
      cacheKey = this.cache.generateKey(request.prompt + contextStr);
      const cachedResponse = this.cache.get<LLMResponse>(cacheKey);
      if (cachedResponse) {
        return { ...cachedResponse, model: `${cachedResponse.model} (cached)` };
      }
    }

    const apiKey = config.get<string>('apiKey');

    if (!apiKey) {
      throw new Error('OpenRouter API Key not configured. Please set openrouterCrew.apiKey in settings.');
    }

    // Check Budget
    const metrics = await this.costTracker.getCostMetrics('daily');
    if (metrics.totalCost >= metrics.budgetLimit) {
      throw new Error(`Daily budget limit of $${metrics.budgetLimit.toFixed(2)} exceeded. Current usage: $${metrics.totalCost.toFixed(2)}.`);
    }

    const complexity = this.estimateComplexity(request);
    const model = this.selectModel({ ...request, complexity }, config);

    const messages = [
      {
        role: 'system',
        content: 'You are an expert coding assistant. Provide clear, concise, and correct code solutions.'
      },
      {
        role: 'user',
        content: contextStr ? `Context:\n${contextStr}\n\nQuestion:\n${request.prompt}` : request.prompt
      }
    ];

    try {
      const startTime = Date.now();
      const response = await this._fetchWithBackoff('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://github.com/openrouter-crew/vscode-extension',
          'X-Title': 'OpenRouter Crew VSCode',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          max_tokens: request.maxTokens
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json() as any;
      const content = data.choices?.[0]?.message?.content || '';
      const executionTimeMs = Date.now() - startTime;
      
      // Basic cost estimation (placeholder until shared cost service is integrated)
      const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0 };
      
      const cost = this.costTracker.estimateCost(usage.prompt_tokens, usage.completion_tokens, model);

      await this.costTracker.recordUsage({
        timestamp: Date.now(),
        command: (request.intent || 'ASK') as string,
        promptLength: request.prompt.length,
        model: data.model || model,
        costUSD: cost,
        executionTimeMs,
        cached: false,
        intent: (request.intent || 'ASK') as string
      });

      const responseData = {
        content,
        model: data.model || model,
        cost,
        costUSD: cost,
        executionTimeMs
      };

      // Save to cache before returning
      if (this.cache && cacheKey) {
        await this.cache.set(cacheKey, responseData);
      }

      return responseData;

    } catch (error) {
      console.error('LLM Router Error:', error);
      throw error;
    }
  }
}