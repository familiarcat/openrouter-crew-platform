import * as vscode from 'vscode';
import { CostTracker } from './services/cost-tracker';
import { ChatPanel } from './ui/chat-panel';
import { CostStatusBar } from './ui/status-bar';
import { CostReportPanel } from './ui/cost-report-panel';
import { LLMRouter } from './services/llm-router';
import { NLPProcessor } from './services/nlp-processor';
import { ContextBuilder } from './services/context-builder';
import { ToolRegistry } from './services/tool-registry';
import { FileManager } from './services/file-manager';
import { AgentNetworkService } from './services/agent-network';
import { CostEstimator } from './services/cost-estimator';
import { ResponseCache } from './services/cache';
import { CommandExecutor } from './commands/command-executor';
import { TerminalManager } from './services/terminal-manager';

export function activate(context: vscode.ExtensionContext) {

    console.log('Congratulations, your extension "openrouter-crew-vscode" is now active!');

    // Initialize services
    const costTracker = new CostTracker(context);
    const responseCache = new ResponseCache(context);
    const costEstimator = new CostEstimator(costTracker);
    const llmRouter = new LLMRouter(costTracker, responseCache);
    const fileManager = new FileManager();
    const nlpProcessor = new NLPProcessor(llmRouter);
    const contextBuilder = new ContextBuilder(fileManager);
    const agentNetwork = new AgentNetworkService(costTracker, llmRouter);
    const toolRegistry = new ToolRegistry(fileManager, costTracker, agentNetwork);
    const terminalManager = new TerminalManager();
    const outputChannel = vscode.window.createOutputChannel('OpenRouter Crew');
    const commandExecutor = new CommandExecutor(agentNetwork, toolRegistry, terminalManager, outputChannel, llmRouter, nlpProcessor);
    
    toolRegistry.initialize();

    // Initialize UI components
    const statusBar = new CostStatusBar(costTracker);
    context.subscriptions.push(statusBar);

    // Register Webview Panel Serializer for ChatPanel to persist it across sessions
    context.subscriptions.push(
        vscode.window.registerWebviewPanelSerializer(ChatPanel.viewType, {
            async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
                // The state is persisted by VS Code, but we are using globalState for history.
                // `revive` will handle loading the history from globalState.
                ChatPanel.revive(webviewPanel, context.extensionUri, llmRouter, costTracker, nlpProcessor, contextBuilder, toolRegistry, commandExecutor, context);
            }
        })
    );

    // Register commands
    const chatCommand = vscode.commands.registerCommand('openrouter-crew.chat', () => {
        ChatPanel.createOrShow(
            context.extensionUri, 
            llmRouter, 
            costTracker, 
            nlpProcessor, 
            contextBuilder, 
            toolRegistry, 
            commandExecutor,
            context
        );
    });
    context.subscriptions.push(chatCommand);

    const costReportCommand = vscode.commands.registerCommand('openrouter-crew.cost.report', () => {
        CostReportPanel.createOrShow(context.extensionUri, costTracker);
    });
    context.subscriptions.push(costReportCommand);

    // Example command to test cost tracking
    const recordUsageCommand = vscode.commands.registerCommand('openrouter-crew.recordUsage', async () => {
        const cost = await vscode.window.showInputBox({ prompt: 'Enter cost to record (e.g., 0.01)' });
        if (cost) {
            await costTracker.recordUsage(parseFloat(cost));
            vscode.window.showInformationMessage(`Recorded cost of $${cost}`);
        }
    });
    context.subscriptions.push(recordUsageCommand);
}

export function deactivate() {}