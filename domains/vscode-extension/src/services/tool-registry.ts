/**
 * domains/vscode-extension/src/services/tool-registry.ts
 * 
 * Manages the registration and execution of tools available to agents.
 * This class centralizes all tool definitions and their implementation logic.
 */

import * as vscode from 'vscode';
import { AgentNetworkService, CrewAgent } from './agent-network';
import { CostTracker } from './cost-tracker';
import { FileManager } from './file-manager';
import { ProposeChangeService } from './propose-change-service';
import { ToolDefinition } from './types';
import * as fs from 'fs';
import * as path from 'path';

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
    private isInitialized = false;

    constructor(
        private fileManager: FileManager,
        private costTracker: CostTracker,
        private network: AgentNetworkService,
        private proposeChangeService: ProposeChangeService
    ) {
        // Initialization is now async and must be called separately.
    }

    public async initialize(): Promise<void> {
        if (this.isInitialized) return;
        await this.registerAllTools();
        this.isInitialized = true;
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

    private registerTools(tools: ToolDefinition[]) {
        tools.forEach(tool => {
            this.register(tool.schema, (args, agent) => tool.execute(args, agent, {
                fileManager: this.fileManager,
                costTracker: this.costTracker,
                network: this.network,
                proposeChangeService: this.proposeChangeService
            }));
        });
    }

    private async registerAllTools() {
        // Assumes tools are moved to a `tools` directory adjacent to `services`
        const toolsDir = path.resolve(__dirname, '../tools');
        
        const allTools: ToolDefinition[] = [];
        let toolFiles: string[] = [];

        try {
            toolFiles = fs.readdirSync(toolsDir).filter(file => file.endsWith('.js')); // .js because it runs after compilation

            for (const file of toolFiles) {
                const filePath = path.join(toolsDir, file);
                const module = await import(`file://${filePath}`);

                // Find exported tool arrays (e.g., gitTools, fsTools)
                for (const exportName in module) {
                    if (Array.isArray(module[exportName])) {
                        const toolDefs = module[exportName] as ToolDefinition[];
                        if (toolDefs.length > 0 && toolDefs.every(def => def.schema && def.execute)) {
                            allTools.push(...toolDefs);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error dynamically loading tools:', error);
            vscode.window.showErrorMessage('Failed to load agent tools. Some features may not work.');
            return;
        }

        this.registerTools(allTools);

        console.log(`[ToolRegistry] Registered ${allTools.length} tools from ${toolFiles.length} files.`);
    }
}