import { CrewAgent, AgentNetworkService } from '../services/agent-network.js';
import { CostTracker } from '../services/cost-tracker.js';
import { FileManager } from '../services/file-manager.js';

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