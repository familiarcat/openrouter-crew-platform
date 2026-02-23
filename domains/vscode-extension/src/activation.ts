import * as vscode from 'vscode';
import { LLMRouter } from './services/llm-router.js';
import { CostTracker } from './services/cost-tracker.js';
import { FileManager } from './services/file-manager.js';
import { TerminalManager } from './services/terminal-manager.js';
import { ResponseCache } from './services/cache.js';
import { CostMeter } from './ui/cost-meter.js';
import { reviewCommand } from './commands/review.js';
import { explainCommand } from './commands/explain.js';
import { CostReportView } from './ui/cost-report-view.js';
import { showCostReportCommand } from './commands/show-cost-report.js';
import { exportCostReportJsonCommand } from './commands/export-cost-report-json.js';
import { generateCommand } from './commands/generate.js';
import { refactorCommand } from './commands/refactor.js';
import { ContextProvider } from './services/context-provider.js';
import { OutputLogger } from './ui/output-logger.js';
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
import { ProjectTreeViewProvider } from './providers/project-tree-provider.js';
import { createProjectCommand, createFeatureCommand } from './commands/project.js';
import { CostHoverProvider } from './providers/hover.js';
import { AICompletionProvider } from './providers/completion.js';
import { DiagnosticsProvider } from './providers/diagnostics.js';
import { CrewCodeLensProvider } from './providers/code-lens.js';
import { ContextBuilder } from './services/context-builder.js';
import { NLPProcessor } from './services/nlp-processor.js';
import { ChatPanel } from './ui/chat-panel.js';

export async function activateExtension(context: vscode.ExtensionContext): Promise<void> {
    // Initialize Core Services
    const costTracker = new CostTracker(context);
    const responseCache = new ResponseCache(context);
    const llmRouter = new LLMRouter(costTracker, responseCache);
    const fileManager = new FileManager();
    const terminalManager = new TerminalManager();
    const nlpProcessor = new NLPProcessor();
    const contextBuilder = new ContextBuilder(fileManager);
    const contextProvider = new ContextProvider();
    const outputLogger = new OutputLogger();
    const costEstimator = new CostEstimator(llmRouter, costTracker);
    const outputChannel = vscode.window.createOutputChannel('OpenRouter Crew CLI');
    const cliExecutor = new CLIExecutor(outputChannel);
    const crewAPIService = new CrewAPIService(outputChannel);

    // Initialize UI Providers & Managers
    const costMeter = new CostMeter(costTracker);
    const costReportView = new CostReportView(context, costTracker);
    const structureView = new StructureView(context);
    const historyView = new HistoryView(context, costTracker);
    const projectProvider = new ProjectTreeViewProvider(cliExecutor);
    const diagnosticsProvider = new DiagnosticsProvider(fileManager);
    const codeLensProvider = new CrewCodeLensProvider(fileManager);

    // Initialize Tree Views
    const { crewProvider } = registerTreeViews(context, crewAPIService, costTracker);

    // Register Disposables
    context.subscriptions.push(costTracker);
    context.subscriptions.push(terminalManager);
    context.subscriptions.push(costMeter);
    context.subscriptions.push(
        vscode.window.registerTreeDataProvider('openrouter-crew.project-view', projectProvider)
    );
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

    // Register Chat Panel Command (replaces sidebar focus)
    context.subscriptions.push(
        vscode.commands.registerCommand('openrouter-crew.chat', () => {
            ChatPanel.createOrShow(context.extensionUri, llmRouter, costTracker, nlpProcessor, contextBuilder);
        })
    );

    if (vscode.window.registerWebviewPanelSerializer) {
        vscode.window.registerWebviewPanelSerializer(ChatPanel.viewType, {
            async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
                ChatPanel.revive(webviewPanel, context.extensionUri, llmRouter, costTracker, nlpProcessor, contextBuilder);
            }
        });
    }

    // Register Review Command
    context.subscriptions.push(
        vscode.commands.registerCommand('openrouter-crew.review', () => reviewCommand(llmRouter, contextProvider, outputLogger))
    );

    // Register Explain Command
    context.subscriptions.push(
        vscode.commands.registerCommand('openrouter-crew.explain', () => explainCommand(llmRouter, contextProvider, outputLogger))
    );

    // Register Generate Command
    context.subscriptions.push(
        vscode.commands.registerCommand('openrouter-crew.generate', () => generateCommand(llmRouter, contextProvider, outputLogger))
    );

    // Register Refactor Command
    context.subscriptions.push(
        vscode.commands.registerCommand('openrouter-crew.refactor', (range?: vscode.Range) => refactorCommand(llmRouter, contextProvider, outputLogger, range))
    );

    // Register Test Command
    context.subscriptions.push(
        vscode.commands.registerCommand('openrouter-crew.test', () => testCommand(llmRouter, contextProvider, outputLogger))
    );

    // Register Document Command
    context.subscriptions.push(
        vscode.commands.registerCommand('openrouter-crew.document', () => documentCommand(llmRouter, contextProvider, outputLogger))
    );

    // Register Quick Fix Command
    context.subscriptions.push(
        vscode.commands.registerCommand('openrouter-crew.quickFix', () => quickFixCommand(llmRouter, contextProvider, outputLogger))
    );

    // Register Debug Command
    context.subscriptions.push(
        vscode.commands.registerCommand('openrouter-crew.debug', () => debugCommand(llmRouter, contextProvider, outputLogger))
    );

    // Register Optimize Command
    context.subscriptions.push(
        vscode.commands.registerCommand('openrouter-crew.optimize', () => optimizeCommand(llmRouter, contextProvider, outputLogger))
    );

    // Register Structure Command
    context.subscriptions.push(
        vscode.commands.registerCommand('openrouter-crew.structure', () => structureCommand(llmRouter, fileManager, outputLogger, structureView))
    );

    // Register Terminal Command
    context.subscriptions.push(
        vscode.commands.registerCommand('openrouter-crew.terminal', () => terminalCommand(llmRouter, terminalManager, outputLogger))
    );

    // Register Analyze Complexity Command
    context.subscriptions.push(
        vscode.commands.registerCommand('openrouter-crew.analyzeComplexity', () => analyzeComplexityCommand(llmRouter, contextProvider))
    );

    // Register History Command
    context.subscriptions.push(
        vscode.commands.registerCommand('openrouter-crew.history', () => historyCommand(historyView))
    );

    // Register Explain Terminal Command
    context.subscriptions.push(
        vscode.commands.registerCommand('openrouter-crew.explain-terminal', () => explainTerminalCommand(llmRouter, outputLogger))
    );

    // Register Preview Cost Command
    context.subscriptions.push(
        vscode.commands.registerCommand('openrouter-crew.previewCost', () => previewCostCommand(contextProvider, costEstimator))
    );

    // Register Reset Cost Command
    context.subscriptions.push(
        vscode.commands.registerCommand('openrouter-crew.resetCost', () => resetCostCommand(costTracker))
    );

    // Register Update Daily Budget Command
    context.subscriptions.push(
        vscode.commands.registerCommand('openrouter-crew.updateDailyBudget', () => updateDailyBudgetCommand())
    );

    // Register Cost Report Commands
    context.subscriptions.push(
        vscode.commands.registerCommand('openrouter-crew.showCostReport', () => showCostReportCommand(costReportView))
    );

    // Register Crew Commands
    context.subscriptions.push(
        vscode.commands.registerCommand('openrouter-crew.crew.roster', () => rosterCommand(crewAPIService, crewProvider))
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('openrouter-crew.crew.consult', () => consultCommand(crewAPIService))
    );

    // Register Settings Command
    context.subscriptions.push(
        vscode.commands.registerCommand('openrouter-crew.settings', () => settingsCommand())
    );

    // Register Memory Commands
    context.subscriptions.push(
        vscode.commands.registerCommand('openrouter-crew.memory.create', () => createMemoryCommand(crewAPIService))
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('openrouter-crew.memory.search', () => searchMemoryCommand(crewAPIService))
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('openrouter-crew.memory.compliance', () => complianceCheckCommand(crewAPIService))
    );

    // Register Project Commands
    context.subscriptions.push(
        vscode.commands.registerCommand('openrouter-crew.project.create', () => createProjectCommand(cliExecutor, projectProvider))
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('openrouter-crew.project.feature', () => createFeatureCommand(cliExecutor, projectProvider))
    );

    // Log initialization
    console.log('✅ OpenRouter Crew Services initialized');
}