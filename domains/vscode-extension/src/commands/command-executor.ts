import * as vscode from 'vscode';
import { AgentNetworkService } from '../services/agent-network';
import { ToolRegistry } from '../services/tool-registry';
import { TerminalManager } from '../services/terminal-manager';
import { LLMRouter, LLMResponse } from '../services/llm-router';
import { NLPProcessor } from '../services/nlp-processor';
import { OCREngine } from '../services/ocr-engine';

export interface CommandResult {
    success: boolean;
    output: string;
    model: string;
    costUSD: number;
}

export class CommandExecutor {
    private ocrEngine: OCREngine;

    constructor(
        private agentNetwork: AgentNetworkService,
        private toolRegistry: ToolRegistry,
        private terminalManager: TerminalManager,
        private outputChannel: vscode.OutputChannel,
        private llmRouter: LLMRouter,
        private nlpProcessor: NLPProcessor
    ) {
        this.ocrEngine = new OCREngine();
    }

    /**
     * Analyzes the complexity of a code snippet.
     */
    async analyzeComplexity(code: string, filePath: string): Promise<CommandResult> {
        const prompt = `Analyze the cyclomatic complexity and maintainability of the following code from ${filePath}:\n\n\`\`\`\n${code}\n\`\`\``;
        const response = await this.llmRouter.route({
            prompt,
            intent: 'REVIEW',
            complexity: 'HIGH'
        });
        
        return {
            success: true,
            output: response.content,
            model: response.model,
            costUSD: response.costUSD
        };
    }

    /**
     * Processes an image using OCR.
     */
    async processImage(base64Image: string): Promise<any> {
        return this.ocrEngine.processImage(base64Image);
    }

    /**
     * Estimates the cost of processing an image.
     */
    async estimateImageCost(base64Image: string): Promise<{ costUSD: number; model: string; inputTokens: number; outputTokens: number; complexity: string }> {
        // Rough estimate: ~0.004 USD per image for high-res analysis
        return {
            costUSD: 0.004,
            model: 'gpt-4o',
            inputTokens: 1000,
            outputTokens: 500,
            complexity: 'MEDIUM'
        };
    }

    /**
     * Explains a terminal command or error.
     */
    async explainTerminal(input: string): Promise<CommandResult> {
        const prompt = `Explain the following terminal command or error:\n\n${input}`;
        const response = await this.llmRouter.route({
            prompt,
            intent: 'EXPLAIN',
            complexity: 'MEDIUM'
        });
        return {
            success: true,
            output: response.content,
            model: response.model,
            costUSD: response.costUSD
        };
    }

    /**
     * Analyzes project structure.
     */
    async structure(focus?: string): Promise<LLMResponse> {
        const files = await vscode.workspace.findFiles('**/*', '**/node_modules/**');
        const fileList = files.map(f => vscode.workspace.asRelativePath(f)).join('\n');
        
        const prompt = `Analyze the project structure based on this file list. Focus: ${focus || 'General Architecture'}\n\n${fileList}`;
        
        return this.llmRouter.route({
            prompt,
            intent: 'EXPLAIN',
            complexity: 'HIGH'
        });
    }

    /**
     * Executes a generic task using the agent network.
     */
    async executeTask(task: string, context?: any): Promise<{ output: string; model: string; costUSD: number; executionTimeMs: number; success: boolean }> {
        const agent = this.agentNetwork.getDepartment('engineering');
        
        if (!context?.intent) {
            const detection = await this.nlpProcessor.detectIntent(task);
            context = { ...context, ...detection };
        }
        
        const result = await agent.executeTask(task, context);
        return {
            ...result,
            success: true // Agents throw on failure, so return is success
        };
    }
}