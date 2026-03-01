import * as vscode from 'vscode';
import { CostTracker } from './cost-tracker.js';
import { ResponseCache } from './cache.js';
import { CostCalculator, ModelRouter } from '@openrouter-crew/shared-cost-tracking';
import { CostTier } from '@openrouter-crew/shared-schemas';

export type Intent = 'ASK' | 'REVIEW' | 'EXPLAIN' | 'REFACTOR' | 'GENERATE' | 'DEBUG' | 'TEST' | 'DOCUMENT' | 'COMPLETE' | 'OPTIMIZE';
export type Complexity = 'LOW' | 'MEDIUM' | 'HIGH';
export type Provider = 'claude' | 'openrouter';

export interface FileContext {
    path: string;
    content: string;
    language: string;
}

export interface ImageContext {
    base64: string;
    type: string;
}

export interface LLMRequest {
  prompt: string;
  files?: FileContext[];
  images?: ImageContext[];
  language?: string;
  intent?: Intent;
  complexity?: Complexity;
  tools?: any[]; // Support for tool calling
  canonicalForm?: string; // The structural "Signified" for stability
}

export interface LLMResponse {
  content: string;
  model: string;
  provider: Provider;
  costUSD: number;
  executionTimeMs: number;
  cached: boolean;
  tool_calls?: any[];
}

export interface CostEstimate {
    estimatedCost: number;
    model: string;
    provider: Provider;
}

export interface ModelChoice {
    model: string;
    provider: Provider;
    reason: string;
}

export class LLMRouter {
  private sharedRouter: ModelRouter;
  
  constructor(
      private costTracker: CostTracker,
      private cache: ResponseCache
  ) {
      this.sharedRouter = new ModelRouter();
  }

  async route(request: LLMRequest): Promise<LLMResponse> {
      const startTime = Date.now();
      
      // 1. Analyze complexity if not provided
      const complexity = request.complexity || this.analyzeComplexity(request.prompt);
      const contextSize = (request.prompt.length) + (request.files?.reduce((acc, f) => acc + f.content.length, 0) || 0);
      
      // 2. Delegate to Shared Router for Model Selection
      // Adapts local context to shared CostTier logic
      let preferredTier: CostTier = 'budget';
      if (complexity === 'HIGH' || contextSize > 4000 || request.intent === 'DEBUG') {
          preferredTier = 'premium';
      }

      const selectedModel = this.sharedRouter.selectBestModel({
          costTier: preferredTier,
          contextWindow: contextSize,
          requiresTools: !!request.tools
      });
      
      // 3. Execute request via OpenRouter using selected model
      const response = await this.callOpenRouter(request, selectedModel.id);

      // 7. Track Cost & Cache
      await this.costTracker.recordUsage(response.costUSD);

      return {
          ...response,
          executionTimeMs: Date.now() - startTime
      };
  }

  private async callOpenRouter(request: LLMRequest, model: string): Promise<LLMResponse> {
      const config = vscode.workspace.getConfiguration('openrouterCrew');
      const apiKey = config.get<string>('apiKey');

      if (!apiKey) {
          throw new Error('OpenRouter API Key missing. Please configure openrouterCrew.apiKey.');
      }

      // Construct messages
      const messages: any[] = [];
      
      // Add system prompt based on intent
      messages.push({ role: 'system', content: this.getSystemPrompt(request.intent) });

      // Build user content
      let userContent: any = request.prompt;

      // Handle images if present (Multimodal)
      if (request.images && request.images.length > 0) {
          userContent = [
              { type: 'text', text: request.prompt },
              ...request.images.map(img => ({
                  type: 'image_url',
                  image_url: { url: `data:${img.type};base64,${img.base64}` }
              }))
          ];
      }

      // Append file context if present
      if (request.files && request.files.length > 0) {
          const fileContext = request.files.map(f => 
              `File: ${f.path}\n\`\`\`${f.language}\n${f.content}\n\`\`\``
          ).join('\n\n');
          
          if (Array.isArray(userContent)) {
              userContent.push({ type: 'text', text: `\n\nContext Files:\n${fileContext}` });
          } else {
              userContent += `\n\nContext Files:\n${fileContext}`;
          }
      }

      messages.push({ role: 'user', content: userContent });

      const body: any = {
          model: model,
          messages: messages,
          temperature: request.intent === 'GENERATE' ? 0.2 : 0.7,
      };

      if (request.tools) {
          body.tools = request.tools;
      }

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://github.com/openrouter-crew/vscode-extension',
              'X-Title': 'OpenRouter Crew VSCode',
          },
          body: JSON.stringify(body)
      });

      if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`OpenRouter API Error (${response.status}): ${errorText}`);
      }

      const data = await response.json() as any;
      const choice = data.choices?.[0];
      const usage = data.usage;

      // Calculate actual cost using the shared calculator and response usage data
      let costUSD = 0;
      if (usage && usage.prompt_tokens != null && usage.completion_tokens != null) {
          costUSD = CostCalculator.calculateActualCost(
              model,
              usage.prompt_tokens,
              usage.completion_tokens
          );
      }

      return {
          content: choice?.message?.content || '',
          model: model,
          provider: 'openrouter',
          costUSD,
          executionTimeMs: 0, // Calculated in route()
          cached: false,
          tool_calls: choice?.message?.tool_calls
      };
  }

  private getSystemPrompt(intent?: Intent): string {
      const basePrompt = "You are an expert AI coding assistant.";
      switch (intent) {
          case 'DEBUG': return `${basePrompt} Focus on identifying logic errors, bugs, and security vulnerabilities. Provide corrected code blocks.`;
          case 'REFACTOR': return `${basePrompt} Focus on code quality, readability, and performance. Maintain existing behavior while improving structure.`;
          case 'GENERATE': return `${basePrompt} Generate clean, efficient, and well-documented code. Follow best practices.`;
          case 'REVIEW': return `${basePrompt} Act as a senior software engineer conducting a code review. Be critical but constructive.`;
          case 'TEST': return `${basePrompt} Generate comprehensive unit tests covering happy paths and edge cases.`;
          default: return basePrompt;
      }
  }

  private analyzeComplexity(prompt: string): Complexity {
      if (prompt.length > 2000) return 'HIGH';
      if (prompt.length > 500) return 'MEDIUM';
      return 'LOW';
  }
}