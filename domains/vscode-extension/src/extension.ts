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
import { CLIExecutor } from './services/cli-executor';
import { MaintenanceStatusProvider } from './providers/maintenance-status';
import { registerCommands } from './commands/registry';
import { StabilizerService } from './services/stabilizer-service';
import { TreatmentPlanView } from './ui/treatment-plan-view';
import { ProposeChangeService } from './services/propose-change-service';
import { PromptManager, OllamaMCPClient } from '@openrouter-crew/agent-orchestration';
import { AgentMCPClientPool } from './services/agent-mcp-client';

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
    const proposeChangeService = new ProposeChangeService(costTracker);
    const toolRegistry = new ToolRegistry(fileManager, costTracker, agentNetwork, proposeChangeService);
    const terminalManager = new TerminalManager();
    const outputChannel = vscode.window.createOutputChannel('OpenRouter Crew');
    const cliOutputChannel = vscode.window.createOutputChannel('OpenRouter Crew CLI');
    const crewAPIService = new CrewAPIService(outputChannel);
    const commandExecutor = new CommandExecutor(agentNetwork, toolRegistry, terminalManager, outputChannel, llmRouter, nlpProcessor);
    const cliExecutor = new CLIExecutor(cliOutputChannel);
    const apiKey = vscode.workspace.getConfiguration('openrouterCrew').get<string>('apiKey') || '';
    const openaiClient = new (require('openai').default)({ apiKey, baseURL: 'https://openrouter.ai/api/v1' });
    const promptManager = new (PromptManager as any)(openaiClient, new OllamaMCPClient());
    const agentMCPClientPool = new AgentMCPClientPool(costTracker, context);
    context.subscriptions.push(agentMCPClientPool);
    agentNetwork.setCrewRouting(promptManager, agentMCPClientPool);
    costEstimator; // Keep instance for potential future use

    toolRegistry.initialize();

    // Geordi's Warp Field Stabilizer — Docker health monitor
    const stabilizerService = new StabilizerService();
    context.subscriptions.push(stabilizerService);

    // Dr. Crusher's Treatment Plan View — diagnostic results panel
    const treatmentPlanView = new TreatmentPlanView(context);
    context.subscriptions.push(
        vscode.commands.registerCommand('openrouter-crew.showTreatmentPlan', (result) => {
            treatmentPlanView.show(result, { docker: "N/A", cost: "N/A", model: "N/A" });
        })
    );

    // Register tree views (sidebar panels)
    registerTreeViews(context, agentNetwork, costTracker, crewAPIService);

    // Maintenance Status Provider
    const maintenanceStatusProvider = new MaintenanceStatusProvider();
    vscode.window.registerTreeDataProvider('openrouter-crew.maintenanceView', maintenanceStatusProvider);

    // Initialize UI components
    const statusBar = new CostStatusBar(costTracker);
    context.subscriptions.push(statusBar);

    // Register Webview Panel Serializer for ChatPanel to persist it across sessions
    context.subscriptions.push(
        vscode.window.registerWebviewPanelSerializer(ChatPanel.viewType, {
            async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
                // The state is persisted by VS Code, but we are using globalState for history.
                // `revive` will handle loading the history from globalState.
                ChatPanel.revive(webviewPanel, context.extensionUri, agentNetwork, llmRouter, costTracker, nlpProcessor, contextBuilder, toolRegistry, commandExecutor, promptManager, context);
            }
        })
    );

    // Register all commands
    registerCommands(context, {
        costTracker,
        agentNetwork,
        crewAPIService,
        cliExecutor,
        maintenanceStatusProvider,
        llmRouter,
        nlpProcessor,
        contextBuilder,
        toolRegistry,
        commandExecutor,
        promptManager
    });
}

export function deactivate() {}
