import type { CrewAgent, AgentNetworkService } from './agent-network';
import { CostTracker } from './cost-tracker';
import { FileManager } from './file-manager';
import { ProposeChangeService } from './propose-change-service';
import { Intent, Complexity, FileContext, ImageContext, Provider } from './llm-router';

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
    cost: number;
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
    provider?: Provider;
    costUSD: number;
    executionTimeMs: number;
    cached: boolean;
    tool_calls?: any[];
    usage?: { prompt_tokens: number; completion_tokens: number };
}