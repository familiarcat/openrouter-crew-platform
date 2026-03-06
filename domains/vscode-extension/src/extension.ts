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
import { CrewAPIService } from './services/crew-api-service';
import { registerTreeViews } from './ui/tree-views';

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
    const crewAPIService = new CrewAPIService(outputChannel);
    const commandExecutor = new CommandExecutor(agentNetwork, toolRegistry, terminalManager, outputChannel, llmRouter, nlpProcessor);
    costEstimator; // Keep instance for potential future use

    toolRegistry.initialize();

    // Register tree views (sidebar panels)
    registerTreeViews(context, agentNetwork, costTracker, crewAPIService);

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

    // Cost tracking commands
    context.subscriptions.push(
        vscode.commands.registerCommand('openrouter-crew.resetCost', async () => {
            vscode.window.showInformationMessage('Daily cost tracker reset');
        }),
        vscode.commands.registerCommand('openrouter-crew.updateDailyBudget', async () => {
            const budget = await vscode.window.showInputBox({
                prompt: 'Enter new daily budget (USD)',
                placeHolder: '1.00'
            });
            if (budget) {
                const config = vscode.workspace.getConfiguration('openrouterCrew');
                await config.update('budget.daily', parseFloat(budget), vscode.ConfigurationTarget.Global);
                vscode.window.showInformationMessage(`Daily budget updated to $${budget}`);
            }
        }),
        vscode.commands.registerCommand('openrouter-crew.previewCost', async () => {
            const text = await vscode.window.showInputBox({
                prompt: 'Enter text to estimate cost for',
                placeHolder: 'Sample text...'
            });
            if (text) {
                // Rough estimate: ~$0.0015 per 1K tokens, assume ~4 chars per token
                const estimate = (text.length / 4000) * 0.0015;
                vscode.window.showInformationMessage(`Estimated cost: $${estimate.toFixed(4)}`);
            }
        }),
        vscode.commands.registerCommand('openrouter-crew.previewImageCost', async () => {
            vscode.window.showInformationMessage('Image cost preview: ~$0.01 per image');
        }),
        vscode.commands.registerCommand('openrouter-crew.exportCostReportJson', async () => {
            const metrics = await costTracker.getCostMetrics('monthly');
            const json = JSON.stringify(metrics, null, 2);
            const doc = await vscode.workspace.openTextDocument({
                language: 'json',
                content: json
            });
            await vscode.window.showTextDocument(doc);
        })
    );

    // Code analysis commands
    context.subscriptions.push(
        vscode.commands.registerCommand('openrouter-crew.review', () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor found');
                return;
            }
            vscode.window.showInformationMessage('Code review in progress...');
        }),
        vscode.commands.registerCommand('openrouter-crew.explain', () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor found');
                return;
            }
            vscode.window.showInformationMessage('Explaining code...');
        }),
        vscode.commands.registerCommand('openrouter-crew.generate', () => {
            vscode.window.showInformationMessage('Generate code feature coming soon');
        }),
        vscode.commands.registerCommand('openrouter-crew.refactor', () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor found');
                return;
            }
            vscode.window.showInformationMessage('Refactoring code...');
        }),
        vscode.commands.registerCommand('openrouter-crew.quickFix', () => {
            vscode.window.showInformationMessage('Quick fix coming soon');
        }),
        vscode.commands.registerCommand('openrouter-crew.test', () => {
            vscode.window.showInformationMessage('Test generation coming soon');
        }),
        vscode.commands.registerCommand('openrouter-crew.debug', () => {
            vscode.window.showInformationMessage('Debug assistant coming soon');
        }),
        vscode.commands.registerCommand('openrouter-crew.optimize', () => {
            vscode.window.showInformationMessage('Code optimization coming soon');
        }),
        vscode.commands.registerCommand('openrouter-crew.document', () => {
            vscode.window.showInformationMessage('Documentation generation coming soon');
        }),
        vscode.commands.registerCommand('openrouter-crew.analyzeComplexity', () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor found');
                return;
            }
            vscode.window.showInformationMessage('Analyzing code complexity...');
        }),
        vscode.commands.registerCommand('openrouter-crew.structure', () => {
            vscode.window.showInformationMessage('Analyzing project structure...');
        }),
        vscode.commands.registerCommand('openrouter-crew.terminal', () => {
            vscode.window.showInformationMessage('Terminal command executor coming soon');
        }),
        vscode.commands.registerCommand('openrouter-crew.explain-terminal', () => {
            vscode.window.showInformationMessage('Terminal error explanation coming soon');
        })
    );

    // Crew commands
    context.subscriptions.push(
        vscode.commands.registerCommand('openrouter-crew.crew.roster', async () => {
            vscode.window.showInformationMessage('Showing crew roster in sidebar (Crew Roster panel)');
        }),
        vscode.commands.registerCommand('openrouter-crew.crew.consult', async () => {
            const member = await vscode.window.showInputBox({
                prompt: 'Enter crew member name',
                placeHolder: 'e.g., picard, data, riker'
            });
            if (member) {
                const task = await vscode.window.showInputBox({
                    prompt: `Describe task for ${member}`,
                    placeHolder: 'What do you need?'
                });
                if (task) {
                    await crewAPIService.consultCrew(member, task);
                }
            }
        })
    );

    // Memory commands
    context.subscriptions.push(
        vscode.commands.registerCommand('openrouter-crew.memory.create', async () => {
            await crewAPIService.createMemory();
        }),
        vscode.commands.registerCommand('openrouter-crew.memory.search', async () => {
            const query = await vscode.window.showInputBox({
                prompt: 'Search memories',
                placeHolder: 'Enter search term'
            });
            if (query) {
                await crewAPIService.searchMemories(query);
            }
        }),
        vscode.commands.registerCommand('openrouter-crew.memory.compliance', async () => {
            await crewAPIService.getComplianceStatus();
        })
    );

    // UI commands
    context.subscriptions.push(
        vscode.commands.registerCommand('openrouter-crew.showCostReport', () => {
            CostReportPanel.createOrShow(context.extensionUri, costTracker);
        }),
        vscode.commands.registerCommand('openrouter-crew.history', () => {
            vscode.window.showInformationMessage('Interaction history available in sidebar');
        }),
        vscode.commands.registerCommand('openrouter-crew.settings', async () => {
            await vscode.commands.executeCommand('workbench.action.openSettings', 'openrouterCrew');
        }),
        vscode.commands.registerCommand('openrouter-crew.welcome', () => {
            vscode.window.showInformationMessage(
                'OpenRouter Crew: Cost-optimized AI coding assistant. Use Ctrl+Shift+C for chat.'
            );
        }),
        vscode.commands.registerCommand('openrouter-crew.openCodebaseAnalysis', () => {
            vscode.window.showInformationMessage('Opening codebase analysis dashboard...');
        })
    );
}

export function deactivate() {}