import * as vscode from 'vscode';
import { AgentNetworkService } from '../services/agent-network';
import { CostTracker } from '../services/cost-tracker';
import { CrewAPIService } from '../services/crew-api-service';
import { CLIExecutor } from '../services/cli-executor';
import { ChatPanel } from '../ui/chat-panel';
import { CostReportPanel } from '../ui/cost-report-panel';
import { ProjectWorkbenchPanel } from '../ui/project-workbench-panel';
import { ProjectIntakePanel } from '../ui/project-intake-panel';
import { WorkItemIntakePanel } from '../ui/work-item-intake-panel';
import { triggerMaintenance } from './trigger-maintenance';
import { MaintenanceStatusProvider } from '../providers/maintenance-status';
import { LLMRouter } from '../services/llm-router';
import { NLPProcessor } from '../services/nlp-processor';
import { ContextBuilder } from '../services/context-builder';
import { ToolRegistry } from '../services/tool-registry';
import { CommandExecutor } from './command-executor';

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
        commandExecutor
    } = services;

    const subscriptions = context.subscriptions;

    // Chat & Reporting
    subscriptions.push(
        vscode.commands.registerCommand('openrouter-crew.chat', () => {
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
        vscode.commands.registerCommand('openrouter-crew.memory.compliance', () => crewAPIService.getComplianceStatus())
    );

    // Project & UI
    subscriptions.push(
        vscode.commands.registerCommand('openrouter-crew.project.workbench', () => ProjectWorkbenchPanel.createOrShow(context.extensionUri, agentNetwork)),
        vscode.commands.registerCommand('openrouter-crew.project.create', () => ProjectIntakePanel.createOrShow(context.extensionUri, cliExecutor)),
        vscode.commands.registerCommand('openrouter-crew.project.feature', () => WorkItemIntakePanel.createOrShow(context.extensionUri, cliExecutor)),
        vscode.commands.registerCommand('openrouter-crew.settings', () => vscode.commands.executeCommand('workbench.action.openSettings', 'openrouterCrew')),
        vscode.commands.registerCommand('openrouter-crew.welcome', () => vscode.window.showInformationMessage('OpenRouter Crew: Cost-optimized AI coding assistant. Use Ctrl+Shift+C for chat.')),
        
        // Placeholders for future AI features
        vscode.commands.registerCommand('openrouter-crew.explain', () => vscode.window.showInformationMessage('Explaining code...')),
        vscode.commands.registerCommand('openrouter-crew.review', () => vscode.window.showInformationMessage('Code review in progress...')),
        vscode.commands.registerCommand('openrouter-crew.refactor', () => vscode.window.showInformationMessage('Refactoring code...'))
    );
}