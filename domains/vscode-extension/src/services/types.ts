import type { CrewAgent, AgentNetworkService } from './agent-network';
import { CostTracker } from './cost-tracker';
import { FileManager } from './file-manager';
import type { ProposeChangeService } from './propose-change-service'; // Break circular dependency
import { Intent, Complexity, FileContext, ImageContext } from './llm-router';
import { Provider as SchemaProvider } from '@openrouter-crew/shared-schemas';

export interface ToolDependencies {
    fileManager: FileManager;
    costTracker: CostTracker;
    network: AgentNetworkService;
    proposeChangeService: ProposeChangeService;
}

export interface ToolDefinition {
    schema: any;
    execute: (args: any, agent: CrewAgent, deps: ToolDependencies) => Promise<any>;
}

export interface AgentExecutionResult {
    output: string;
    model: string;
    costUSD: number;
    executionTimeMs: number;
}

export interface LLMRequest {
    prompt: string;
    files?: FileContext[];
    images?: ImageContext[];
    language?: string;
    intent?: Intent;
    complexity?: Complexity;
    tools?: any[];
    canonicalForm?: string;
    // Legacy fields for compatibility
    messages?: any[];
    hint?: 'speed' | 'quality' | 'code'; 
}

export interface LLMResponse {
    content: string;
    model: string;
    provider?: SchemaProvider;
    costUSD: number;
    executionTimeMs: number;
    cached: boolean;
    tool_calls?: any[];
    usage?: { prompt_tokens: number; completion_tokens: number };
}
// Added: consistency-checker.ts imports this type
export interface CrewResponse {
  content: string; content: string;output: string;
  model: string;
  costUSD: number;
  executionTimeMs: number;
  success: boolean;
  error?: string;
}
