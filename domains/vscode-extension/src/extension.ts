import * as vscode from 'vscode';
import { ContextBuilder } from './services/context-builder.js';
import { ContextProvider } from './services/context-provider.js';
import { OutputLogger } from './ui/output-logger.js';
import { LLMRouter } from './services/llm-router.js';
import { TerminalManager } from './services/terminal-manager.js';
import { FileManager } from './services/file-manager.js';
import { CrewAPIService } from './services/crew-api-service.js';
import { CLIExecutor } from './services/cli-executor.js';
import { CostEstimator } from './services/cost-estimator.js';

// UI
import { StructureView } from './ui/structure-view.js';
import { CrewTreeProvider } from './ui/tree-views.js';

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
import { exportCostReportJsonCommand } from './commands/export-cost-report-json.js';
import { resetCostCommand } from './commands/reset-cost.js';
import { rosterCommand, consultCommand } from './commands/crew.js';
import { createMemoryCommand, searchMemoryCommand, complianceCheckCommand } from './commands/memory.js';
import { createProjectCommand, createFeatureCommand } from './commands/project.js';
import { updateDailyBudgetCommand } from './commands/update-daily-budget.js';
import { showCostReportCommand } from './commands/show-cost-report.js';
import { historyCommand } from './commands/history.js';
import { settingsCommand } from './commands/settings.js';

export function activate(context: vscode.ExtensionContext) {
    console.log('OpenRouter Crew Extension is now active!');

    // Initialize Services
    const outputLogger = new OutputLogger();
    const contextProvider = new ContextProvider();
    const costTracker = new CostTracker(context);
    const contextBuilder = new ContextBuilder(contextProvider);
    const terminalManager = new TerminalManager();
    const fileManager = new FileManager();
    const crewService = new CrewAPIService();
    const cliExecutor = new CLIExecutor();
    const costEstimator = new CostEstimator(costTracker);

    // Initialize Core Logic
    // CommandExecutor creates its own LLMRouter internally, but we also need one for legacy commands
    const commandExecutor = new CommandExecutor(costTracker, contextBuilder);
    const legacyRouter = new LLMRouter(costTracker);

    // Initialize UI Providers
    const structureView = new StructureView(context.extensionUri);
    const historyView = new HistoryView(context.extensionUri, costTracker);
    const costReportView = new CostReportView(context.extensionUri, costTracker);
    
    const projectProvider = new ProjectTreeViewProvider(cliExecutor);
    vscode.window.registerTreeDataProvider('openrouterCrewProjects', projectProvider);

    const crewProvider = new CrewTreeProvider(crewService);
    vscode.window.registerTreeDataProvider('openrouterCrewRoster', crewProvider);

    // Register Commands
    const commands = [
        // Refactored Commands (using CommandExecutor)
        vscode.commands.registerCommand('openrouter-crew.explain', () => explainCommand(commandExecutor, contextProvider, outputLogger)),
        vscode.commands.registerCommand('openrouter-crew.optimize', () => optimizeCommand(commandExecutor, contextProvider, outputLogger)),
        vscode.commands.registerCommand('openrouter-crew.review', () => reviewCommand(commandExecutor, contextProvider, outputLogger)),
        vscode.commands.registerCommand('openrouter-crew.refactor', (range?: vscode.Range) => refactorCommand(commandExecutor, contextProvider, outputLogger, range)),
        vscode.commands.registerCommand('openrouter-crew.test', () => testCommand(commandExecutor, contextProvider, outputLogger)),
        vscode.commands.registerCommand('openrouter-crew.debug', () => debugCommand(commandExecutor, contextProvider, outputLogger)),
        vscode.commands.registerCommand('openrouter-crew.generate', () => generateCommand(commandExecutor, contextProvider, outputLogger)),
        vscode.commands.registerCommand('openrouter-crew.document', () => documentCommand(commandExecutor, contextProvider, outputLogger)),
        vscode.commands.registerCommand('openrouter-crew.quickFix', () => quickFixCommand(commandExecutor, contextProvider, outputLogger)),
        vscode.commands.registerCommand('openrouter-crew.structure', () => structureCommand(commandExecutor, outputLogger, structureView)),
        vscode.commands.registerCommand('openrouter-crew.terminal', () => terminalCommand(commandExecutor)),
        vscode.commands.registerCommand('openrouter-crew.explainTerminal', () => explainTerminalCommand(commandExecutor, outputLogger)),
        
        // Legacy Commands (using LLMRouter directly)
        vscode.commands.registerCommand('openrouter-crew.analyzeComplexity', () => analyzeComplexityCommand(legacyRouter, contextProvider)),
        
        // Utility Commands
        vscode.commands.registerCommand('openrouter-crew.previewCost', () => previewCostCommand(contextProvider, costEstimator)),
        vscode.commands.registerCommand('openrouter-crew.exportCostReportJson', () => exportCostReportJsonCommand(costTracker)),
        vscode.commands.registerCommand('openrouter-crew.resetCost', () => resetCostCommand(costTracker)),
        vscode.commands.registerCommand('openrouter-crew.updateDailyBudget', () => updateDailyBudgetCommand()),
        vscode.commands.registerCommand('openrouter-crew.settings', () => settingsCommand()),
        
        // View Commands
        vscode.commands.registerCommand('openrouter-crew.showCostReport', () => showCostReportCommand(costReportView)),
        vscode.commands.registerCommand('openrouter-crew.history', () => historyCommand(historyView)),
        
        // Crew & Project Commands
        vscode.commands.registerCommand('openrouter-crew.roster', () => rosterCommand(crewService, crewProvider)),
        vscode.commands.registerCommand('openrouter-crew.consult', () => consultCommand(crewService)),
        vscode.commands.registerCommand('openrouter-crew.createMemory', () => createMemoryCommand(crewService)),
        vscode.commands.registerCommand('openrouter-crew.searchMemory', () => searchMemoryCommand(crewService)),
        vscode.commands.registerCommand('openrouter-crew.complianceCheck', () => complianceCheckCommand(crewService)),
        vscode.commands.registerCommand('openrouter-crew.createProject', () => createProjectCommand(cliExecutor, projectProvider)),
        vscode.commands.registerCommand('openrouter-crew.createFeature', () => createFeatureCommand(cliExecutor, projectProvider)),
    ];

    context.subscriptions.push(...commands);
}

export function deactivate() {}