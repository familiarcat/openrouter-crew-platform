/**
 * domains/vscode-extension/src/services/tool-registry.ts
 * 
 * Manages the registration and execution of tools available to agents.
 * This class centralizes all tool definitions and their implementation logic.
 */

import * as vscode from 'vscode';
import { AgentNetworkService, CrewAgent } from './agent-network.js';
import { CostTracker } from './cost-tracker.js';
import { FileManager } from './file-manager.js';
import { gitTools } from './git.js';
import { fsTools } from './filesystem.js';
import { analysisTools } from './analysis.js';
import { opsTools } from './ops.js';
import { utilityTools } from './utility.js';

/**
 * A tool the agent can use (e.g., "readFile", "runTest")
 */
export interface AgentTool {
    name: string;
    description: string;
    execute: (args: any, agent: CrewAgent) => Promise<any>;
}

/**
 * Manages the registration and execution of tools available to agents.
 */
export class ToolRegistry {
    private tools: Map<string, AgentTool> = new Map();
    private toolDefinitions: any[] = [];

    constructor(
        private fileManager: FileManager,
        private costTracker: CostTracker,
        private network: AgentNetworkService
    ) {
        this.registerAllTools();
    }

    /**
     * Returns the JSON schema definitions for all registered tools, for use with an LLM.
     */
    public getToolDefinitions(): any[] {
        return this.toolDefinitions;
    }

    /**
     * Executes a tool by name with the given arguments.
     */
    public async executeTool(name: string, args: any, agent: CrewAgent): Promise<any> {
        const tool = this.tools.get(name);
        if (!tool) {
            return `Error: Tool "${name}" not found.`;
        }
        try {
            return await tool.execute(args, agent);
        } catch (e: any) {
            return `Error executing tool "${name}": ${e.message}`;
        }
    }

    private register(schema: any, execute: (args: any, agent: CrewAgent) => Promise<any>) {
        this.toolDefinitions.push(schema);
        this.tools.set(schema.function.name, {
            name: schema.function.name,
            description: schema.function.description,
            execute,
        });
    }

    private registerAllTools() {
        const allTools = [
            ...gitTools,
            ...fsTools,
            ...analysisTools,
            ...opsTools,
            ...utilityTools
        ];

        allTools.forEach(tool => {
            this.register(tool.schema, (args, agent) => tool.execute(args, agent, {
                fileManager: this.fileManager,
                costTracker: this.costTracker,
                network: this.network
            }));
        });
    }
}