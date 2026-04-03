import * as vscode from 'vscode';
import { LLMRouter } from './services/llm-router.js';
import { CostTracker } from './services/cost-tracker.js';
import { FileManager } from './services/file-manager.js';
import { TerminalManager } from './services/terminal-manager.js';
import { ResponseCache } from './services/cache.js';
import { CostMeter } from './ui/cost-meter.js';
import { reviewCommand } from './commands/review.js';
import { explainCommand } from './commands/explain.js';
import { exportCostReportJsonCommand } from './commands/export-cost-report-json.js';
import { generateCommand } from './commands/generate.js';
import { refactorCommand } from './commands/refactor.js';
import { ContextProvider } from './services/context-provider.js';
import { VSCodeOutputLogger } from './ui/output-logger.js';
import { testCommand } from './commands/test.js';
import { documentCommand } from './commands/document.js';
import { quickFixCommand } from './commands/quick-fix.js';
import { debugCommand } from './commands/debug.js';
import { optimizeCommand } from './commands/optimize.js';
import { structureCommand } from './commands/structure.js';
import { StructureView } from './ui/structure-view.js';
import { terminalCommand } from './commands/terminal.js';
import { analyzeComplexityCommand } from './commands/analyze-complexity.js';
import { historyCommand } from './commands/history.js';
import { HistoryView } from './ui/history-view.js';
import { explainTerminalCommand } from './commands/explain-terminal.js';
import { previewCostCommand } from './commands/preview-cost.js';
import { CostEstimator } from './services/cost-estimator.js';
import { resetCostCommand } from './commands/reset-cost.js';
import { updateDailyBudgetCommand } from './commands/update-daily-budget.js';
import { CLIExecutor } from './services/cli-executor.js';
import { CrewAPIService } from './services/crew-api-service.js';
import { registerTreeViews } from './ui/tree-views.js';
import { rosterCommand, consultCommand } from './commands/crew.js';
import { settingsCommand } from './commands/settings.js';
import { createMemoryCommand, searchMemoryCommand, complianceCheckCommand } from './commands/memory.js';
import { CostHoverProvider } from './providers/hover.js';
import { AICompletionProvider } from './providers/completion.js';
import { DiagnosticsProvider } from './providers/diagnostics.js';
import { CrewCodeLensProvider } from './providers/code-lens.js';
import { ContextBuilder } from './services/context-builder.js';
import { NLPProcessor } from './services/nlp-processor.js';
import { ChatPanel } from './ui/chat-panel.js';
import { CommandExecutor } from './commands/command-executor.js';
import { AgentNetworkService } from './services/agent-network.js';
import { ToolRegistry } from './services/tool-registry.js';
import { findRelatedFilesCommand } from './commands/find-related-files.js';
import { TelemetryService } from './services/telemetry.js';
import { WelcomePanel } from './ui/welcome-panel.js';
import { CrewCodeActionProvider } from './providers/code-action.js';
import { CostReportPanel } from './ui/cost-report-panel.js';
import { AnalysisResultsProvider } from './ui/analysis-results-provider.js';
import { MemoryBrowser } from './ui/memory-browser.js';
import { AutopilotAuditProvider } from './ui/autopilot-audit-provider.js';
import { ProjectWorkbenchPanel } from './ui/project-workbench-panel.js';
import { ProjectIntakePanel } from './ui/project-intake-panel.js';
import { WorkItemIntakePanel } from './ui/work-item-intake-panel.js';

function registerCommandWithTelemetry(
    context: vscode.ExtensionContext,
    telemetryService: TelemetryService,
    commandId: string,
    callback: (...args: any[]) => any
) {
    const disposable = vscode.commands.registerCommand(commandId, async (...args: any[]) => {
        await telemetryService.sendCommandEvent(commandId);
        try {
            return await Promise.resolve(callback(...args));
        } catch (error) {
            if (error instanceof Error) {
                await telemetryService.sendError(error, `Command: ${commandId}`);
            }
            throw error;
        }
    });
    context.subscriptions.push(disposable);
}

export async function activateExtension(context: vscode.ExtensionContext): Promise<void> {
    // Initialize Core Services
    const costTracker = new CostTracker(context);
    const responseCache = new ResponseCache(context);
    const costEstimator = new CostEstimator(costTracker);
    const llmRouter = new LLMRouter(costTracker, responseCache);
    const fileManager = new FileManager();
    const terminalManager = new TerminalManager();
    const nlpProcessor = new NLPProcessor(llmRouter);
    const contextBuilder = new ContextBuilder(fileManager);
    const contextProvider = new ContextProvider();
    const outputLogger = new VSCodeOutputLogger();
    const outputChannel = vscode.window.createOutputChannel('OpenRouter Crew CLI');
    const cliExecutor = new CLIExecutor(outputChannel);
    const crewAPIService = new CrewAPIService(outputChannel);
    const telemetryService = new TelemetryService(context);

    // Initialize Agent Network & Tools
    const agentNetwork = new AgentNetworkService(costTracker, llmRouter);
    const toolRegistry = new ToolRegistry(fileManager, costTracker, agentNetwork);
    await toolRegistry.initialize();
    const commandExecutor = new CommandExecutor(agentNetwork, toolRegistry, terminalManager, outputChannel, llmRouter, nlpProcessor);

    // Initialize UI Providers & Managers
    const costMeter = new CostMeter(costTracker);
    const structureView = new StructureView(context);
    const historyView = new HistoryView(context, costTracker);
    const diagnosticsProvider = new DiagnosticsProvider(fileManager);
    const codeLensProvider = new CrewCodeLensProvider(fileManager);
    const codeActionProvider = new CrewCodeActionProvider();

    // Initialize Tree Views
    // This registers 'openrouter-crew.project-view', 'openrouter-crew.crew-view', etc.
    const { crewProvider } = registerTreeViews(context, agentNetwork, costTracker, crewAPIService);

    // Initialize Memory Browser
    const memoryBrowser = new MemoryBrowser(crewAPIService, agentNetwork);
    vscode.window.registerTreeDataProvider('openrouter-crew.memory-view', memoryBrowser);
    registerCommandWithTelemetry(context, telemetryService, 'openrouter-crew.memory-view.refresh', () => memoryBrowser.refresh());

    // Initialize Analysis Results Provider (Geordi & Quark)
    const analysisResultsProvider = new AnalysisResultsProvider(agentNetwork);
    vscode.window.registerTreeDataProvider('openrouter-crew.analysis-results', analysisResultsProvider);
    registerCommandWithTelemetry(context, telemetryService, 'openrouter-crew.analysis-results.refresh', () => analysisResultsProvider.refresh());
    
    // Command to show the full analysis log in a dedicated channel
    registerCommandWithTelemetry(context, telemetryService, 'openrouter-crew.analysis.showDetail', (analysis: any) => {
        const channel = vscode.window.createOutputChannel('Crew Analysis Detail');
        channel.clear();
        channel.appendLine(`=== ${analysis.source.toUpperCase()} [${analysis.severity}] ===`);
        channel.appendLine(`Timestamp: ${new Date(analysis.created_at).toLocaleString()}`);
        channel.appendLine('-------------------------------------------');
        channel.appendLine(analysis.content);
        channel.show();
    });

    // Initialize Autopilot Audit Provider
    const autopilotAuditProvider = new AutopilotAuditProvider(agentNetwork);
    vscode.window.registerTreeDataProvider('openrouter-crew.autopilot-audits', autopilotAuditProvider);
    registerCommandWithTelemetry(context, telemetryService, 'openrouter-crew.autopilot-audits.refresh', () => autopilotAuditProvider.refresh());
    
    // Command to show the full audit log in a dedicated channel
    registerCommandWithTelemetry(context, telemetryService, 'openrouter-crew.autopilot.showAudit', (audit: any) => {
        const channel = vscode.window.createOutputChannel('Autopilot Audit Detail');
        channel.clear();
        channel.appendLine(`=== AUTOPILOT AUDIT [${audit.severity}] ===`);
        channel.appendLine(`Timestamp: ${new Date(audit.created_at).toLocaleString()}`);
        channel.appendLine('-------------------------------------------');
        channel.appendLine(audit.content);
        channel.show();
    });

    // Register Disposables
    context.subscriptions.push(costTracker);
    context.subscriptions.push(terminalManager);
    context.subscriptions.push(costMeter);
    context.subscriptions.push(
        vscode.languages.registerHoverProvider(
            ['javascript', 'typescript', 'python', 'java', 'csharp', 'go', 'rust'],
            new CostHoverProvider(fileManager)
        )
    );
    context.subscriptions.push(
        vscode.languages.registerInlineCompletionItemProvider(
            ['javascript', 'typescript', 'python', 'java', 'csharp', 'go', 'rust'],
            new AICompletionProvider(llmRouter)
        )
    );
    
    // Initialize Diagnostics
    diagnosticsProvider.subscribeToDocumentChanges(context);

    // Register Code Lens Provider
    context.subscriptions.push(
        vscode.languages.registerCodeLensProvider(['javascript', 'typescript', 'python', 'java', 'csharp', 'go', 'rust'], codeLensProvider)
    );

    // Register Code Action Provider
    context.subscriptions.push(
        vscode.languages.registerCodeActionsProvider(['javascript', 'typescript', 'python', 'java', 'csharp', 'go', 'rust'], codeActionProvider)
    );

    // Register Chat Panel Command (replaces sidebar focus)
    registerCommandWithTelemetry(context, telemetryService, 'openrouter-crew.chat', () => {
        ChatPanel.createOrShow(context.extensionUri, llmRouter, costTracker, nlpProcessor, contextBuilder, toolRegistry, commandExecutor, context);
    });

    if (vscode.window.registerWebviewPanelSerializer) {
        vscode.window.registerWebviewPanelSerializer(ChatPanel.viewType, {
            async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
                ChatPanel.revive(webviewPanel, context.extensionUri, llmRouter, costTracker, nlpProcessor, contextBuilder, toolRegistry, commandExecutor, context);
            }
        });
    }

    // Register Review Command
    registerCommandWithTelemetry(context, telemetryService, 'openrouter-crew.review', () => reviewCommand(commandExecutor, contextProvider, outputLogger, fileManager));

    // Register Explain Command
    registerCommandWithTelemetry(context, telemetryService, 'openrouter-crew.explain', () => explainCommand(commandExecutor, contextProvider, outputLogger, fileManager));

    // Register Generate Command
    registerCommandWithTelemetry(context, telemetryService, 'openrouter-crew.generate', () => generateCommand(commandExecutor, contextProvider, outputLogger));

    // Register Refactor Command
    registerCommandWithTelemetry(context, telemetryService, 'openrouter-crew.refactor', (range?: vscode.Range) => refactorCommand(commandExecutor, contextProvider, outputLogger, range));

    // Register Test Command
    registerCommandWithTelemetry(context, telemetryService, 'openrouter-crew.test', () => testCommand(commandExecutor, contextProvider, outputLogger, fileManager));

    // Register Document Command
    registerCommandWithTelemetry(context, telemetryService, 'openrouter-crew.document', () => documentCommand(commandExecutor, contextProvider, outputLogger, fileManager));

    // Register Quick Fix Command
    registerCommandWithTelemetry(context, telemetryService, 'openrouter-crew.quickFix', () => quickFixCommand(commandExecutor, contextProvider, outputLogger));

    // Register Debug Command
    registerCommandWithTelemetry(context, telemetryService, 'openrouter-crew.debug', () => debugCommand(commandExecutor, contextProvider, outputLogger));

    // Register Optimize Command
    registerCommandWithTelemetry(context, telemetryService, 'openrouter-crew.optimize', () => optimizeCommand(commandExecutor, contextProvider, outputLogger, fileManager));

    // Register Structure Command
    registerCommandWithTelemetry(context, telemetryService, 'openrouter-crew.structure', () => structureCommand(commandExecutor, outputLogger, structureView));

    // Register Terminal Command
    registerCommandWithTelemetry(context, telemetryService, 'openrouter-crew.terminal', () => terminalCommand(commandExecutor, terminalManager, outputLogger));

    // Register Analyze Complexity Command
    registerCommandWithTelemetry(context, telemetryService, 'openrouter-crew.analyzeComplexity', () => analyzeComplexityCommand(commandExecutor, contextProvider, fileManager));

    // Register History Command
    registerCommandWithTelemetry(context, telemetryService, 'openrouter-crew.history', () => historyCommand(historyView));

    // Register Explain Terminal Command
    registerCommandWithTelemetry(context, telemetryService, 'openrouter-crew.explain-terminal', () => explainTerminalCommand(commandExecutor, outputLogger));

    // Register Preview Cost Command
    registerCommandWithTelemetry(context, telemetryService, 'openrouter-crew.previewCost', () => previewCostCommand(contextProvider, costEstimator));

    // Register Reset Cost Command
    registerCommandWithTelemetry(context, telemetryService, 'openrouter-crew.resetCost', () => resetCostCommand(costTracker));

    // Register Update Daily Budget Command
    registerCommandWithTelemetry(context, telemetryService, 'openrouter-crew.updateDailyBudget', () => updateDailyBudgetCommand());

    // Register Cost Report Commands
    registerCommandWithTelemetry(context, telemetryService, 'openrouter-crew.showCostReport', () => CostReportPanel.createOrShow(context.extensionUri, costTracker));

    // Register Crew Commands
    registerCommandWithTelemetry(context, telemetryService, 'openrouter-crew.crew.roster', () => rosterCommand(crewAPIService, crewProvider));
    registerCommandWithTelemetry(context, telemetryService, 'openrouter-crew.crew.consult', () => consultCommand(crewAPIService));

    // Register Settings Command
    registerCommandWithTelemetry(context, telemetryService, 'openrouter-crew.settings', () => settingsCommand());

    // Register Memory Commands
    registerCommandWithTelemetry(context, telemetryService, 'openrouter-crew.memory.create', () => createMemoryCommand(crewAPIService));
    registerCommandWithTelemetry(context, telemetryService, 'openrouter-crew.memory.search', () => searchMemoryCommand(crewAPIService));
    registerCommandWithTelemetry(context, telemetryService, 'openrouter-crew.memory.compliance', () => complianceCheckCommand(crewAPIService));

    // Register specialized Crew MCP commands
    registerCommandWithTelemetry(context, telemetryService, 'openrouter-crew.worf.securitySweep', () => vscode.commands.executeCommand('openrouter-crew.worf.securitySweep'));
    registerCommandWithTelemetry(context, telemetryService, 'openrouter-crew.geordi.warpCoreOptimize', () => vscode.commands.executeCommand('openrouter-crew.geordi.warpCoreOptimize'));
    registerCommandWithTelemetry(context, telemetryService, 'openrouter-crew.quark.arbitrageScanner', () => vscode.commands.executeCommand('openrouter-crew.quark.arbitrageScanner'));
    registerCommandWithTelemetry(context, telemetryService, 'openrouter-crew.dr-crusher.medicalDiagnostic', () => vscode.commands.executeCommand('openrouter-crew.dr-crusher.medicalDiagnostic'));

    // Register Project Commands
    registerCommandWithTelemetry(context, telemetryService, 'openrouter-crew.project.workbench', () => {
        ProjectWorkbenchPanel.createOrShow(context.extensionUri, agentNetwork);
    });
    registerCommandWithTelemetry(context, telemetryService, 'openrouter-crew.project.create', async () => {
        ProjectIntakePanel.createOrShow(context.extensionUri, cliExecutor);
    });
    registerCommandWithTelemetry(context, telemetryService, 'openrouter-crew.project.feature', async () => {
        WorkItemIntakePanel.createOrShow(context.extensionUri, cliExecutor);
    });

    // Register Find Related Files Command
    registerCommandWithTelemetry(context, telemetryService, 'openrouter-crew.findRelatedFiles', () => findRelatedFilesCommand(commandExecutor, contextProvider, fileManager));

    // Register Welcome Command
    registerCommandWithTelemetry(context, telemetryService, 'openrouter-crew.welcome', () => WelcomePanel.createOrShow(context.extensionUri));

    // Check for API Key on startup
    const config = vscode.workspace.getConfiguration('openrouterCrew');
    const apiKey = config.get<string>('apiKey');
    if (!apiKey) {
        vscode.commands.executeCommand('openrouter-crew.welcome');
    }

    // Log initialization
    telemetryService.sendActivationEvent();
    console.log('✅ OpenRouter Crew Services initialized');
}
