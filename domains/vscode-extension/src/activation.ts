import * as vscode from 'vscode';
import { LLMRouter } from './services/llm-router';
import { CostTracker } from './services/cost-tracker';
import { FileManager } from './services/file-manager';
import { TerminalManager } from './services/terminal-manager';
import { ContextBuilder } from './services/context-builder';
import { ResponseCache } from './services/cache';
import { ChatViewProvider } from './ui/chat-panel';
import { CostMeter } from './ui/cost-meter';
import { reviewCommand } from './commands/review';
import { explainCommand } from './commands/explain';
import { CostReportView } from './ui/cost-report-view';
import { showCostReportCommand } from './commands/show-cost-report';
import { exportCostReportJsonCommand } from './commands/export-cost-report-json';
import { clearRateLimitCommand } from './commands/clear-rate-limit';
import { generateCommand } from './commands/generate';
import { refactorCommand } from './commands/refactor';
import { ContextProvider } from './services/context-provider';
import { OutputLogger } from './ui/output-logger';
import { testCommand } from './commands/test';
import { documentCommand } from './commands/document';
import { quickFixCommand } from './commands/quick-fix';
import { debugCommand } from './commands/debug';
import { optimizeCommand } from './commands/optimize';
import { structureCommand } from './commands/structure';
import { StructureView } from './ui/structure-view';
import { terminalCommand } from './commands/terminal';
import { analyzeComplexityCommand } from './commands/analyze-complexity';
import { historyCommand } from './commands/history';
import { HistoryView } from './ui/history-view';
import { explainTerminalCommand } from './commands/explain-terminal';
import { previewCostCommand } from './commands/preview-cost';
import { CostEstimator } from './services/cost-estimator';
import { resetCostCommand } from './commands/reset-cost';
import { updateDailyBudgetCommand } from './commands/update-daily-budget';
import { CLIExecutor } from './services/cli-executor';
import { CrewAPIService } from './services/crew-api-service';
import { registerTreeViews } from './ui/tree-views';
import { rosterCommand, consultCommand } from './commands/crew';
import { settingsCommand } from './commands/settings';
import { createMemoryCommand, searchMemoryCommand, complianceCheckCommand } from './commands/memory';

export async function activateExtension(context: vscode.ExtensionContext): Promise<void> {
    // Initialize Core Services
    const costTracker = new CostTracker(context);
    const responseCache = new ResponseCache(context);
    const llmRouter = new LLMRouter(costTracker, responseCache);
    const fileManager = new FileManager();
    const terminalManager = new TerminalManager();
    const contextBuilder = new ContextBuilder(fileManager);
    const contextProvider = new ContextProvider();
    const outputLogger = new OutputLogger();
    const costEstimator = new CostEstimator(llmRouter, costTracker);
    const outputChannel = vscode.window.createOutputChannel('OpenRouter Crew CLI');
    const cliExecutor = new CLIExecutor(outputChannel);
    const crewAPIService = new CrewAPIService(outputChannel);

    // Initialize UI Providers
    const chatProvider = new ChatViewProvider(context.extensionUri, llmRouter, costTracker, contextBuilder);
    const costMeter = new CostMeter(costTracker);
    const costReportView = new CostReportView(context, costTracker);
    const structureView = new StructureView(context);
    const historyView = new HistoryView(context, costTracker);

    // Initialize Tree Views
    const { crewProvider } = registerTreeViews(context, crewAPIService, costTracker);

    // Register Disposables
    context.subscriptions.push(costTracker);
    context.subscriptions.push(terminalManager);
    context.subscriptions.push(costMeter);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(ChatViewProvider.viewType, chatProvider)
    );

    // Register Chat Focus Command
    context.subscriptions.push(
        vscode.commands.registerCommand('openrouter-crew.chat', async () => {
            await vscode.commands.executeCommand('workbench.view.extension.openrouter-crew-sidebar');
        })
    );

    // Register Review Command
    context.subscriptions.push(
        vscode.commands.registerCommand('openrouter-crew.review', () => reviewCommand(chatProvider))
    );

    // Register Explain Command
    context.subscriptions.push(
        vscode.commands.registerCommand('openrouter-crew.explain', () => explainCommand(chatProvider))
    );

    // Register Generate Command
    context.subscriptions.push(
        vscode.commands.registerCommand('openrouter-crew.generate', () => generateCommand(llmRouter, contextProvider, outputLogger))
    );

    // Register Refactor Command
    context.subscriptions.push(
        vscode.commands.registerCommand('openrouter-crew.refactor', () => refactorCommand(llmRouter, contextProvider, outputLogger))
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

    context.subscriptions.push(
        vscode.commands.registerCommand('openrouter-crew.exportCostReportJson', () => exportCostReportJsonCommand(costTracker))
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('openrouter-crew.clearRateLimit', () => clearRateLimitCommand(costTracker))
    );

    // Register Crew Commands
    context.subscriptions.push(
        vscode.commands.registerCommand('openrouter-crew.crew.roster', () => rosterCommand(crewAPIService, crewProvider))
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('openrouter-crew.crew.consult', () => consultCommand(cliExecutor))
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

    // Log initialization
    console.log('✅ OpenRouter Crew Services initialized');
}