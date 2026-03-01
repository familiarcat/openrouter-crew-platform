import { CrewAgent, AgentNetworkService } from '../services/agent-network.js';
import { CostTracker } from '../services/cost-tracker.js';
import { FileManager } from '../services/file-manager.js';
import { Intent, Complexity, FileContext, ImageContext, Provider } from './llm-router.js';

export interface ToolDependencies {
    fileManager: FileManager;
    costTracker: CostTracker;
    network: AgentNetworkService;
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