import * as vscode from 'vscode';
import { AgentNetworkService } from './services/agent-network.js';
import { CostTracker } from './services/cost-tracker.js';
import { FileManager } from './services/file-manager.js';
import { LLMRouter } from './services/llm-router.js';
import { ToolRegistry } from './services/tool-registry.js';
import { TerminalManager } from './services/terminal-manager.js';
import { ContextProvider } from './services/context-provider.js';
import { CommandExecutor } from './commands/command-executor.js';
import { generateCommand } from './commands/generate.js';
import { OutputLogger } from './ui/output-logger.js';
import { ChatPanel } from './ui/chat-panel.js';

export function activate(context: vscode.ExtensionContext) {
    const outputChannel = vscode.window.createOutputChannel('OpenRouter Crew');
    outputChannel.appendLine('Initializing OpenRouter Crew Extension...');

    // 1. Initialize Core Services
    const costTracker = new CostTracker(context);
    const fileManager = new FileManager();
    const terminalManager = new TerminalManager();
    const contextProvider = new ContextProvider();
    const llmRouter = new LLMRouter(costTracker);

    // 2. Initialize Agent Network
    // The network orchestrates agents and needs the router for LLM calls
    const agentNetwork = new AgentNetworkService(costTracker);

    // 3. Initialize Tool Registry
    // Tools need access to core services (FileManager, CostTracker, Network)
    const toolRegistry = new ToolRegistry(fileManager, costTracker, agentNetwork);

    // 4. Initialize Command Executor
    // This acts as the controller, bridging VSCode commands to the agent network
    const commandExecutor = new CommandExecutor(
        agentNetwork,
        toolRegistry,
        terminalManager,
        outputChannel
    );

    // 5. Setup Logger
    const outputLogger: OutputLogger = {
        logExchange: (exchange) => {
            outputChannel.appendLine(`[${exchange.model}] Cost: $${exchange.cost.toFixed(6)}`);
            outputChannel.appendLine('--- Output ---');
            outputChannel.appendLine(exchange.content);
            outputChannel.appendLine('--------------');
        }
    };

    // 6. Register Commands
    context.subscriptions.push(
        vscode.commands.registerCommand('openrouter-crew.chat', () => {
            ChatPanel.createOrShow(context.extensionUri, commandExecutor);
        }),
        vscode.commands.registerCommand('openrouter-crew.generate', () => {
            generateCommand(commandExecutor, contextProvider, outputLogger);
        }),
        
        vscode.commands.registerCommand('openrouter-crew.analyzeComplexity', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor found.');
                return;
            }
            
            const path = vscode.workspace.asRelativePath(editor.document.uri);
            const content = editor.document.getText();
            
            try {
                const analysis = await fileManager.analyzeFile(path, content);
                const suggestions = fileManager.generateSuggestions(analysis);
                
                let message = `Complexity Score: ${analysis.complexity}`;
                if (suggestions.length > 0) {
                    message += `\n\nSuggestions:\n${suggestions.map(s => `- ${s.suggestion}`).join('\n')}`;
                }
                
                vscode.window.showInformationMessage(message, { modal: true });
            } catch (e: any) {
                vscode.window.showErrorMessage(`Analysis failed: ${e.message}`);
            }
        })
    );

    // 7. Register Lifecycle Disposables
    context.subscriptions.push(costTracker);
    context.subscriptions.push(terminalManager);

    outputChannel.appendLine('OpenRouter Crew Extension is now active.');
}

export function deactivate() {
    // Cleanup logic if needed
}