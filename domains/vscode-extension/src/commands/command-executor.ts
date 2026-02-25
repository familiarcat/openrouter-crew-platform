import * as vscode from 'vscode';
import { AgentNetworkService } from '../services/agent-network.js';
import { ToolRegistry } from '../services/tool-registry.js';
import { TerminalManager } from '../services/terminal-manager.js';
import { AgentExecutionResult } from '../services/types.js';

/**
 * Orchestrates commands between the VSCode UI and the Agent Network.
 */
export class CommandExecutor {
    constructor(
        private network: AgentNetworkService,
        private toolRegistry: ToolRegistry,
        private terminal: TerminalManager,
        private outputChannel: vscode.OutputChannel
    ) {}

    /**
     * Execute a task using the Agent Network.
     * @param task The natural language task description.
     * @param context Additional context (selected code, file path, etc.)
     */
    public async executeTask(task: string, context?: any, signal?: AbortSignal): Promise<AgentExecutionResult> {
        this.outputChannel.show(true);
        this.outputChannel.appendLine(`\n>>> User Task: ${task}`);

        try {
            // 1. Identify the best department/agent for the job
            // For now, we default to the 'Lead' or 'Tech Lead' equivalent, 
            // or a specific agent if the task implies it.
            const agentName = this.determineAgent(task);
            const agent = this.network.getDepartment(agentName);

            this.outputChannel.appendLine(`>>> Assigning to Agent: ${agent.profile.name} (${agent.profile.role})`);

            // 2. Execute the task
            const result = await agent.executeTask(task, context, signal);

            this.outputChannel.appendLine(`\n>>> Result from ${result.model} (Cost: $${result.cost.toFixed(6)}):\n${result.output}`);
            return result;
        } catch (error: any) {
            this.outputChannel.appendLine(`\n>>> Error: ${error.message}`);
            vscode.window.showErrorMessage(`Agent execution failed: ${error.message}`);
            throw error; // Re-throw for the caller (ChatPanel) to handle
        }
    }

    private determineAgent(task: string): string {
        // Simple heuristic routing; can be upgraded to LLM-based routing later
        if (task.toLowerCase().includes('test')) return 'qa';
        if (task.toLowerCase().includes('deploy') || task.toLowerCase().includes('docker')) return 'devops';
        return 'lead'; // Default to Lead Developer
    }
}