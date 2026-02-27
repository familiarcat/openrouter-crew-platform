import * as vscode from 'vscode';
import { AgentNetworkService } from '../services/agent-network.js';
import { ToolRegistry } from '../services/tool-registry.js';
import { TerminalManager } from '../services/terminal-manager.js';
import { AgentExecutionResult } from '../services/types.js';
import { LLMRouter } from '../services/llm-router.js';

/**
 * Orchestrates commands between the VSCode UI and the Agent Network.
 */
export class CommandExecutor {
    constructor(
        private network: AgentNetworkService,
        private toolRegistry: ToolRegistry,
        private terminal: TerminalManager,
        private outputChannel: vscode.OutputChannel,
        private llmRouter: LLMRouter
    ) {}

    /**
     * Execute a task using the Agent Network.
     * @param task The natural language task description.
     * @param context Additional context (selected code, file path, etc.)
     */
    public async executeTask(task: string, context?: any, signal?: AbortSignal, onProgress?: (message: string) => void): Promise<AgentExecutionResult> {
        this.outputChannel.show(true);
        this.outputChannel.appendLine(`\n>>> User Task: ${task}`);

        try {
            // 1. Identify the best department/agent for the job
            // For now, we default to the 'Lead' or 'Tech Lead' equivalent, 
            // or a specific agent if the task implies it.
            const agentName = await this.determineAgent(task);
            const agent = this.network.getDepartment(agentName);

            this.outputChannel.appendLine(`>>> Assigning to Agent: ${agent.profile.name} (${agent.profile.role})`);

            // 2. Execute the task
            const result = await agent.executeTask(task, context, signal, onProgress);

            this.outputChannel.appendLine(`\n>>> Result from ${result.model} (Cost: $${result.cost.toFixed(6)}):\n${result.output}`);
            return result;
        } catch (error: any) {
            this.outputChannel.appendLine(`\n>>> Error: ${error.message}`);
            vscode.window.showErrorMessage(`Agent execution failed: ${error.message}`);
            throw error; // Re-throw for the caller (ChatPanel) to handle
        }
    }

    private async determineAgent(task: string): Promise<string> {
        const lowerTask = task.toLowerCase();

        // 1. Fast Heuristics
        if (lowerTask.includes('test') || lowerTask.includes('coverage')) return 'qa';
        if (lowerTask.includes('deploy') || lowerTask.includes('docker') || lowerTask.includes('pipeline')) return 'devops';
        if (lowerTask.includes('security') || lowerTask.includes('audit')) return 'security';
        if (lowerTask.includes('design') || lowerTask.includes('css') || lowerTask.includes('ui')) return 'design';
        if (lowerTask.includes('sql') || lowerTask.includes('database')) return 'data';

        // 2. LLM-based routing for ambiguous tasks
        try {
            const response = await this.llmRouter.route({
                messages: [{
                    role: 'system',
                    content: `Classify the following task into one of these agent roles: lead, qa, devops, security, design, product, data.
                    Task: "${task}"
                    Return ONLY the role name (e.g., "lead").`
                }],
                hint: 'speed'
            });
            
            const role = response.content?.trim().toLowerCase();
            if (role && ['lead', 'qa', 'devops', 'security', 'design', 'product', 'data'].includes(role)) {
                return role;
            }
        } catch (e) {
            // Fallback to lead if routing fails
        }

        return 'lead';
    }

    /**
     * Perform a code review on the specified code.
     */
    public async review(code: string, filePath: string, targetName?: string): Promise<AgentExecutionResult> {
        const contextDescription = targetName ? `function/class '${targetName}'` : 'the selected code';
        const task = `Perform a comprehensive code review of ${contextDescription} in '${filePath}'.
        
        Check for:
        1. Logic errors and bugs
        2. Security vulnerabilities
        3. Performance issues
        4. Code style and best practices
        5. TypeScript/typing issues (if applicable)

        Provide specific, actionable feedback and code snippets for improvements.

        Code to review:
        \`\`\`
        ${code}
        \`\`\`
        `;

        return this.executeTask(task);
    }
}