import * as vscode from 'vscode';
import { CostTracker } from './cost-tracker.js';
import { CostEstimator } from './cost-estimator.js';
import { ResponseCache } from './cache.js';
import { LLMRequest, LLMResponse } from './types.js';

export class LLMRouter {
    constructor(
        private costTracker: CostTracker,
        private costEstimator: CostEstimator,
        private responseCache?: ResponseCache
    ) {}

    async route(request: LLMRequest, signal?: AbortSignal): Promise<LLMResponse> {
        const config = vscode.workspace.getConfiguration('openrouterCrew');
        const apiKey = config.get<string>('apiKey');
        if (!apiKey) throw new Error('API Key missing.');

        // Simple routing logic - this is the "Shared" logic that will evolve
        // to include complexity analysis and budget checks.
        let model = 'openai/gpt-4o'; // Default high quality
        if (request.hint === 'speed') {
            model = 'google/gemini-flash-1.5';
        } else if (request.hint === 'code') {
            model = 'anthropic/claude-3.5-sonnet';
        }

        // Perform Budget Check
        const estimatedCost = this.costEstimator.estimateRequestCost(request, model);
        const budgetCheck = await this.costTracker.checkBudget(estimatedCost);
        if (!budgetCheck.allowed) {
            throw new Error(`Budget exceeded: ${budgetCheck.reason}`);
        }

        // Check Cache
        let cacheKey: string | undefined;
        if (this.responseCache) {
            const cachePayload = JSON.stringify({
                model,
                messages: request.messages,
                tools: request.tools
            });
            cacheKey = this.responseCache.generateKey(cachePayload);
            
            const cached = this.responseCache.get<LLMResponse>(cacheKey);
            if (cached) {
                // Return cached response with 0 usage to avoid double-counting cost
                return {
                    ...cached,
                    usage: { prompt_tokens: 0, completion_tokens: 0 },
                    cached: true
                };
            }
        }

        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://github.com/openrouter-crew/vscode-extension',
                    'X-Title': 'OpenRouter Crew VSCode',
                },
                body: JSON.stringify({
                    model: model,
                    messages: request.messages,
                    tools: request.tools,
                }),
                signal
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`OpenRouter API Error: ${response.status} - ${errorText}`);
            }

            const data = await response.json() as any;
            const choice = data.choices?.[0];
            
            if (!choice) throw new Error('No completion choice returned');

            const result: LLMResponse = {
                content: choice.message?.content || null,
                model: data.model || model,
                usage: data.usage || { prompt_tokens: 0, completion_tokens: 0 },
                tool_calls: choice.message?.tool_calls,
                cached: false
            };

            // Cache the result
            if (this.responseCache && cacheKey) {
                await this.responseCache.set(cacheKey, result);
            }

            return result;

        } catch (e: any) {
            throw new Error(`LLM Router Error: ${e.message}`);
        }
    }
}