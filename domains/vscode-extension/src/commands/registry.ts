import * as vscode from 'vscode';
import { AgentNetworkService } from '../services/agent-network';
import { CostTracker } from '../services/cost-tracker';
import { CrewAPIService } from '../services/crew-api-service';
import { CLIExecutor } from '../services/cli-executor';
import { ChatPanel } from '../ui/chat-panel';
import { CostReportPanel } from '../ui/cost-report-panel';
import { ProjectWorkbenchPanel } from '../ui/project-workbench-panel';
// ProjectIntakePanel and WorkItemIntakePanel require shared-ui-components subpath exports not yet built
// import { ProjectIntakePanel } from '../ui/project-intake-panel';
// import { WorkItemIntakePanel } from '../ui/work-item-intake-panel';
import { triggerMaintenance } from './trigger-maintenance';
import { MaintenanceStatusProvider } from '../providers/maintenance-status';
import { LLMRouter } from '../services/llm-router';
import { NLPProcessor } from '../services/nlp-processor';
import { ContextBuilder } from '../services/context-builder';
import { ToolRegistry } from '../services/tool-registry';
import { CommandExecutor } from './command-executor';
import { PromptManager } from '@openrouter-crew/agent-orchestration';
import { DarkForestValidator } from '../services/dark-forest-validator';
import { worfSecuritySweepCommand } from './worf-security-sweep';
import { geordiWarpCoreOptimizeCommand } from './geordi-warp-core-optimize';
import { quarkArbitrageScannerCommand } from './quark-arbitrage-scanner';
import { rallyCrewAuditCommand } from './rally-crew-audit';
import { drCrusherMedicalDiagnosticCommand } from './dr-crusher-medical-diagnostic';

export interface ExtensionServices {
    costTracker: CostTracker;
    agentNetwork: AgentNetworkService;
    crewAPIService: CrewAPIService;
    cliExecutor: CLIExecutor;
    maintenanceStatusProvider: MaintenanceStatusProvider;
    llmRouter: LLMRouter;
    nlpProcessor: NLPProcessor;
    contextBuilder: ContextBuilder;
    toolRegistry: ToolRegistry;
    commandExecutor: CommandExecutor;
    promptManager: PromptManager;
}

export function registerCommands(context: vscode.ExtensionContext, services: ExtensionServices) {
    const {
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
    } = services;

    const subscriptions = context.subscriptions;

    // Chat & Reporting
    subscriptions.push(
        vscode.commands.registerCommand('openrouter-crew.chat', () => {
            ChatPanel.createOrShow(
                context.extensionUri,
                agentNetwork,
                llmRouter,
                costTracker,
                nlpProcessor,
                contextBuilder,
                toolRegistry,
                commandExecutor,
                promptManager,
                context
            );
        }),
        vscode.commands.registerCommand('openrouter-crew.cost.report', () => {
            CostReportPanel.createOrShow(context.extensionUri, costTracker);
        }),
        vscode.commands.registerCommand('openrouter-crew.showCostReport', () => {
            CostReportPanel.createOrShow(context.extensionUri, costTracker);
        })
    );

    // Cost Tracking & Maintenance
    subscriptions.push(
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
        vscode.commands.registerCommand('openrouter-crew.triggerMaintenance', () => {
            triggerMaintenance(maintenanceStatusProvider);
        }),
        vscode.commands.registerCommand('openrouter-crew.previewCost', async () => {
            const text = await vscode.window.showInputBox({
                prompt: 'Enter text to estimate cost for',
                placeHolder: 'Sample text...'
            });
            if (text) {
                const estimate = (text.length / 4000) * 0.0015;
                vscode.window.showInformationMessage(`Estimated cost: $${estimate.toFixed(4)}`);
            }
        }),
        vscode.commands.registerCommand('openrouter-crew.exportCostReportJson', async () => {
            const metrics = await costTracker.getCostMetrics('monthly');
            const json = JSON.stringify(metrics, null, 2);
            const doc = await vscode.workspace.openTextDocument({ language: 'json', content: json });
            await vscode.window.showTextDocument(doc);
        })
    );

    // Crew Management
    subscriptions.push(
        vscode.commands.registerCommand('openrouter-crew.crew.consult', async () => {
            const member = await vscode.window.showInputBox({ prompt: 'Enter crew member name', placeHolder: 'e.g., picard, data, riker' });
            if (member) {
                const task = await vscode.window.showInputBox({ prompt: `Describe task for ${member}`, placeHolder: 'What do you need?' });
                if (task) await crewAPIService.consultCrew(member, task);
            }
        }),
        vscode.commands.registerCommand('openrouter-crew.memory.create', () => crewAPIService.createMemory()),
        vscode.commands.registerCommand('openrouter-crew.memory.search', async () => {
            const query = await vscode.window.showInputBox({ prompt: 'Search memories', placeHolder: 'Enter search term' });
            if (query) await crewAPIService.searchMemories(query);
        }),
        vscode.commands.registerCommand('openrouter-crew.memory.compliance', () => crewAPIService.getComplianceStatus()),
        vscode.commands.registerCommand('openrouter-crew.worf.securitySweep', () => worfSecuritySweepCommand(context, agentNetwork)), // Worf's Security Sweep
        vscode.commands.registerCommand('openrouter-crew.geordi.warpCoreOptimize', () => geordiWarpCoreOptimizeCommand(context, agentNetwork)), // Geordi's Optimization
        vscode.commands.registerCommand('openrouter-crew.quark.arbitrageScanner', () => quarkArbitrageScannerCommand(context, agentNetwork)), // Quark's Arbitrage Scanner
        vscode.commands.registerCommand('openrouter-crew.dr-crusher.medicalDiagnostic', () => drCrusherMedicalDiagnosticCommand(context, agentNetwork)), // Crusher's Diagnostic
        vscode.commands.registerCommand('openrouter-crew.crew.rallyAudit', () => rallyCrewAuditCommand(context, agentNetwork, costTracker))
    );

    // Project & UI
    subscriptions.push(
        vscode.commands.registerCommand('openrouter-crew.project.workbench', () => ProjectWorkbenchPanel.createOrShow(context.extensionUri, agentNetwork, costTracker, context)),
        vscode.commands.registerCommand('openrouter-crew.project.create', () => vscode.window.showInformationMessage('Project creation panel coming soon.')),
        vscode.commands.registerCommand('openrouter-crew.project.feature', () => vscode.window.showInformationMessage('Work item intake panel coming soon.')),
        vscode.commands.registerCommand('openrouter-crew.settings', () => vscode.commands.executeCommand('workbench.action.openSettings', 'openrouterCrew')),
        vscode.commands.registerCommand('openrouter-crew.welcome', () => vscode.window.showInformationMessage('OpenRouter Crew: Cost-optimized AI coding assistant. Use Ctrl+Shift+C for chat.')),
        
        // AI commands — routed through PromptManager triage → specialized crew agent → OpenRouter
        vscode.commands.registerCommand('openrouter-crew.explain', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) return vscode.window.showWarningMessage('Open a file to explain.');
            const selection = editor.selection.isEmpty
                ? editor.document.getText()
                : editor.document.getText(editor.selection);
            ChatPanel.createOrShow(
                context.extensionUri, agentNetwork, llmRouter, costTracker,
                nlpProcessor, contextBuilder, toolRegistry, commandExecutor, promptManager, context
            );
            const agent = agentNetwork.getDepartment('data');
            const result = await agent.executeTask(
                `Explain the following code clearly:\n\n${selection}`,
                { intent: 'EXPLAIN', complexity: 'MEDIUM' }
            ).catch(e => ({ output: `Error: ${e.message}`, model: '', cost: 0, executionTimeMs: 0 }));
            ChatPanel.currentPanel?.ask(result.output);
        }),

        vscode.commands.registerCommand('openrouter-crew.review', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) return vscode.window.showWarningMessage('Open a file to review.');
            const selection = editor.selection.isEmpty
                ? editor.document.getText()
                : editor.document.getText(editor.selection);
            ChatPanel.createOrShow(
                context.extensionUri, agentNetwork, llmRouter, costTracker,
                nlpProcessor, contextBuilder, toolRegistry, commandExecutor, promptManager, context
            );

            // Deep Interaction: Worf pre-scans with DarkForestValidator
            const validator = new DarkForestValidator();
            const scanResult = validator.validateContent(selection, editor.document.fileName);
            const securityContext = scanResult.isValid ? "" : `\n[TACTICAL ALERT] Dark Forest Violation Detected: ${scanResult.reason} (Axiom: ${scanResult.violatedAxiom})\n`;

            const agent = agentNetwork.getDepartment('worf');
            const result = await agent.executeTask(
                `${securityContext}Review the following code for security vulnerabilities, deceptive patterns, and best practices:\n\n${selection}`,
                { intent: 'REVIEW', complexity: 'HIGH' }
            ).catch(e => ({ output: `Error: ${e.message}`, model: '', cost: 0, executionTimeMs: 0 }));
            ChatPanel.currentPanel?.ask(result.output);
        }),

        vscode.commands.registerCommand('openrouter-crew.refactor', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) return vscode.window.showWarningMessage('Open a file to refactor.');
            const filePath = editor.document.uri.fsPath;
            const content = editor.selection.isEmpty
                ? editor.document.getText()
                : editor.document.getText(editor.selection);
            const agent = agentNetwork.getDepartment('geordi_la_forge');
            vscode.window.withProgress(
                { location: vscode.ProgressLocation.Notification, title: 'Crew: Refactoring...', cancellable: false },
                async () => {
                    const result = await agent.executeTask(
                        `Refactor the following code for clarity, performance, and maintainability. Return only the improved code:\n\n${content}`,
                        { intent: 'REFACTOR', complexity: 'HIGH' }
                    ).catch(e => ({ output: '', model: '', cost: 0, executionTimeMs: 0, error: e.message }));
                    if (result.output && result.output.trim()) {
                        // Route through ProposeChangeService so changes go to diff review
                        const { ProposeChangeService } = await import('../services/propose-change-service');
                        const proposer = new ProposeChangeService(costTracker);
                        await proposer.propose(filePath, result.output, result.cost);
                    }
                }
            );
        })
    );
}