import * as vscode from 'vscode';
import { ChatPanel } from './chat-panel';
import { MissionControlPanel } from './mission-control-panel';
import { ProjectWorkbenchPanel } from './project-workbench-panel';
import { AgentNetworkService } from '../services/agent-network';
import { CostTracker } from '../services/cost-tracker';
import { CodebaseAnalysisWebview } from './CodebaseAnalysisWebview';

/**
 * BridgeController
 * The central nervous system for the "Command Bridge" UI.
 * Orchestrates navigation between pedagogical "Decks": Strategy, Command, and Audit.
 */

export enum FleetDeck {
    STRATEGY = 'STRATEGY',
    COMMAND = 'COMMAND',
    AUDIT = 'AUDIT'
}

export class BridgeController {
    private static instance: BridgeController;

    private constructor(
        private context: vscode.ExtensionContext,
        private agentNetwork: AgentNetworkService,
        private costTracker: CostTracker
    ) {}

    public static getInstance(
        context: vscode.ExtensionContext,
        agentNetwork: AgentNetworkService,
        costTracker: CostTracker
    ): BridgeController {
        if (!BridgeController.instance) {
            BridgeController.instance = new BridgeController(context, agentNetwork, costTracker);
        }
        return BridgeController.instance;
    }

    /**
     * Navigates the entire UI to a specific pedagogical deck
     */
    public async navigateToDeck(deck: FleetDeck, projectId?: string) {
        switch (deck) {
            case FleetDeck.STRATEGY:
                await this.showWorkbench();
                break;
            case FleetDeck.COMMAND:
                if (projectId) await this.engageTacticalMode(projectId);
                break;
            case FleetDeck.AUDIT:
                await CodebaseAnalysisWebview.getInstance().show(this.context, this.agentNetwork, this.costTracker);
                break;
        }
    }

    /**
     * Initiates the "Red Alert" sequence - switches UI to tactical mission mode
     */
    public async engageTacticalMode(projectId: string) {
        // 1. Update project context in configuration
        const config = vscode.workspace.getConfiguration('openrouter-crew');
        await config.update('projectId', projectId, vscode.ConfigurationTarget.Workspace);

        // 2. Reveal Mission Control (The 4D HUD)
        MissionControlPanel.createOrShow(this.context.extensionUri, this.agentNetwork, this.costTracker, vscode.ViewColumn.One);
        
        // 3. Focus the Chat Panel (The Comm Link)
        // Focuses the interaction layer in the secondary column
        vscode.commands.executeCommand('openrouter-crew.chatPanel.focus', vscode.ViewColumn.Two);
        
        vscode.window.showInformationMessage(`🖖 Bridge engaged for project: ${projectId}. Tactical sensors online.`);
    }

    /**
     * Returns to the "Star Chart" - the high-level workbench
     */
    public async showWorkbench() {
        ProjectWorkbenchPanel.createOrShow(this.context.extensionUri, this.agentNetwork, this.costTracker, this.context);
    }

    /**
     * Broadcasts a UI update to all active bridge components
     */
    public async syncBridge() {
        await vscode.commands.executeCommand('openrouter-crew.project-view.refresh');
        await vscode.commands.executeCommand('openrouter-crew.cost-report.refresh');
    }
}