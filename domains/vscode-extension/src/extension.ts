import * as vscode from 'vscode';
import { CommandExecutor } from './commands/command-executor.js';
import { ContextBuilder } from './services/context-builder.js';
import { ContextProvider } from './services/context-provider.js';
import { CostTracker } from './services/cost-tracker.js';
import { OutputLogger } from './ui/output-logger.js';
import { TerminalManager } from './services/terminal-manager.js';
import { FileManager } from './services/file-manager.js';
import { CrewAPIService } from './services/crew-api-service.js';
import { CLIExecutor } from './services/cli-executor.js';
import { CostEstimator } from './services/cost-estimator.js';
import { ProjectTreeViewProvider } from './providers/project-tree-provider.js';
import { LLMRouter } from './services/llm-router.js';
import { NLPProcessor } from './services/nlp-processor.js';
import { ResponseCache } from './services/cache.js';

// UI
import { StructureView } from './ui/structure-view.js';
import { CrewTreeProvider } from './ui/tree-views.js';
import { CostReportView } from './ui/cost-report-view.js';
import { HistoryView } from './ui/history-view.js';
import { ChatPanel } from './ui/chat-panel.js';

// Commands
import { explainCommand } from './commands/explain.js';
import { optimizeCommand } from './commands/optimize.js';
import { analyzeComplexityCommand } from './commands/analyze-complexity.js';
import { reviewCommand } from './commands/review.js';
import { testCommand } from './commands/test.js';
import { documentCommand } from './commands/document.js';
import { refactorCommand } from './commands/refactor.js';
import { quickFixCommand } from './commands/quick-fix.js';
import { generateCommand } from './commands/generate.js';
import { debugCommand } from './commands/debug.js';
import { structureCommand } from './commands/structure.js';
import { terminalCommand } from './commands/terminal.js';
import { explainTerminalCommand } from './commands/explain-terminal.js';
import { previewCostCommand } from './commands/preview-cost.js';
import { previewImageCostCommand } from './commands/preview-image-cost.js';
import { translateCommand } from './commands/translate.js';
import { explainImageCommand } from './commands/explain-image.js';
import { exportCostReportJsonCommand } from './commands/export-cost-report-json.js';
import { resetCostCommand } from './commands/reset-cost.js';
import { rosterCommand, consultCommand } from './commands/crew.js';
import { createMemoryCommand, searchMemoryCommand, complianceCheckCommand } from './commands/memory.js';
import { createProjectCommand, createFeatureCommand } from './commands/project.js';
import { updateDailyBudgetCommand } from './commands/update-daily-budget.js';
import { showCostReportCommand } from './commands/show-cost-report.js';
import { historyCommand } from './commands/history.js';
import { settingsCommand } from './commands/settings.js';
import { applyRefactoringCommand } from './commands/apply-refactoring.js';

export function activate(context: vscode.ExtensionContext) {
    console.log('OpenRouter Crew Extension is now active!');

    const outputChannel = vscode.window.createOutputChannel('OpenRouter Crew CLI');
    // Initialize Services
    const outputLogger = new OutputLogger();
    const contextProvider = new ContextProvider();
    const costTracker = new CostTracker(context);
    const fileManager = new FileManager();
    const contextBuilder = new ContextBuilder(fileManager);
    const terminalManager = new TerminalManager();
    const crewService = new CrewAPIService(outputChannel);
    const cliExecutor = new CLIExecutor(outputChannel);
    const responseCache = new ResponseCache(context);
    const llmRouter = new LLMRouter(costTracker, responseCache);
    const costEstimator = new CostEstimator(llmRouter, costTracker);
    const nlpProcessor = new NLPProcessor();

    // Initialize Core Logic
    // The CommandExecutor is the single entry point for all AI-powered commands.
    const commandExecutor = new CommandExecutor(costTracker, contextBuilder);

    // Initialize UI Providers
    const structureView = new StructureView(context);
    const historyView = new HistoryView(context, costTracker);
    const costReportView = new CostReportView(context, costTracker);
    
    const projectProvider = new ProjectTreeViewProvider(cliExecutor);
    vscode.window.registerTreeDataProvider('openrouter-crew.project-view', projectProvider);

    const crewProvider = new CrewTreeProvider(crewService);
    vscode.window.registerTreeDataProvider('openrouter-crew.roster-view', crewProvider);

    // Register Chat Panel
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

    // Register Commands
    const commands = [
        // Refactored Commands (using CommandExecutor)
        vscode.commands.registerCommand('openrouter-crew.explain', () => explainCommand(commandExecutor, contextProvider, outputLogger, fileManager)),
        vscode.commands.registerCommand('openrouter-crew.optimize', () => optimizeCommand(commandExecutor, contextProvider, outputLogger, fileManager)),
        vscode.commands.registerCommand('openrouter-crew.review', () => reviewCommand(commandExecutor, contextProvider, outputLogger, fileManager)),
        vscode.commands.registerCommand('openrouter-crew.refactor', (range?: vscode.Range) => refactorCommand(commandExecutor, contextProvider, outputLogger, range)),
        vscode.commands.registerCommand('openrouter-crew.test', () => testCommand(commandExecutor, contextProvider, outputLogger, fileManager)),
        vscode.commands.registerCommand('openrouter-crew.debug', () => debugCommand(commandExecutor, contextProvider, outputLogger)),
        vscode.commands.registerCommand('openrouter-crew.generate', () => generateCommand(commandExecutor, contextProvider, outputLogger)),
        vscode.commands.registerCommand('openrouter-crew.document', () => documentCommand(commandExecutor, contextProvider, outputLogger, fileManager)),
        vscode.commands.registerCommand('openrouter-crew.quickFix', () => quickFixCommand(commandExecutor, contextProvider, outputLogger)),
        vscode.commands.registerCommand('openrouter-crew.structure', () => structureCommand(commandExecutor, outputLogger, structureView)),
        vscode.commands.registerCommand('openrouter-crew.terminal', () => terminalCommand(commandExecutor, terminalManager, outputLogger)),
        vscode.commands.registerCommand('openrouter-crew.explain-terminal', () => explainTerminalCommand(commandExecutor, outputLogger)),
        vscode.commands.registerCommand('openrouter-crew.analyzeComplexity', () => analyzeComplexityCommand(commandExecutor, contextProvider, fileManager)),
        vscode.commands.registerCommand('openrouter-crew.translate', () => translateCommand(commandExecutor, contextProvider, outputLogger)),
        vscode.commands.registerCommand('openrouter-crew.explainImage', () => explainImageCommand(commandExecutor, outputLogger)),

        // Utility Commands
        vscode.commands.registerCommand('openrouter-crew.previewCost', () => previewCostCommand(contextProvider, costEstimator)),
        vscode.commands.registerCommand('openrouter-crew.previewImageCost', () => previewImageCostCommand(commandExecutor)),
        vscode.commands.registerCommand('openrouter-crew.exportCostReportJson', () => exportCostReportJsonCommand(costTracker)),
        vscode.commands.registerCommand('openrouter-crew.resetCost', () => resetCostCommand(costTracker)),
        vscode.commands.registerCommand('openrouter-crew.updateDailyBudget', () => updateDailyBudgetCommand()),
        vscode.commands.registerCommand('openrouter-crew.settings', () => settingsCommand()),
        vscode.commands.registerCommand('openrouter-crew.applyRefactoring', (newCode, range) => applyRefactoringCommand(newCode, range)),
        
        // View Commands
        vscode.commands.registerCommand('openrouter-crew.showCostReport', () => showCostReportCommand(costReportView)),
        vscode.commands.registerCommand('openrouter-crew.history', () => historyCommand(historyView)),
        
        // Crew & Project Commands
        vscode.commands.registerCommand('openrouter-crew.crew.roster', () => rosterCommand(crewService, crewProvider)),
        vscode.commands.registerCommand('openrouter-crew.crew.consult', () => consultCommand(crewService)),
        vscode.commands.registerCommand('openrouter-crew.memory.create', () => createMemoryCommand(crewService)),
        vscode.commands.registerCommand('openrouter-crew.memory.search', () => searchMemoryCommand(crewService)),
        vscode.commands.registerCommand('openrouter-crew.memory.compliance', () => complianceCheckCommand(crewService)),
        vscode.commands.registerCommand('openrouter-crew.project.create', () => createProjectCommand(cliExecutor, projectProvider)),
        vscode.commands.registerCommand('openrouter-crew.project.feature', () => createFeatureCommand(cliExecutor, projectProvider)),
    ];

    context.subscriptions.push(...commands);
}

export function deactivate() {}