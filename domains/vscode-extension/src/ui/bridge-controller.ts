import * as vscode from 'vscode';
import { ChatPanel } from './chat-panel';
import { MissionControlPanel } from './mission-control-panel';
import { ProjectWorkbenchPanel } from './project-workbench-panel';
import { AgentNetworkService } from '../services/agent-network';
import { CostTracker } from '../services/cost-tracker';

/**
 * BridgeController
 * The central nervous system for the "Command Bridge" UI.
 * Orchestrates navigation between the Workbench, Chat, and Mission Control.
 */
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
     * Initiates the "Red Alert" sequence - switches UI to tactical mission mode
     */
    public async engageTacticalMode(projectId: string) {
        // 1. Update project context in configuration
        const config = vscode.workspace.getConfiguration('openrouter-crew');
        await config.update('projectId', projectId, vscode.ConfigurationTarget.Workspace);

        // 2. Reveal Mission Control (The 4D HUD)
        MissionControlPanel.createOrShow(this.context.extensionUri, this.agentNetwork, this.costTracker, vscode.ViewColumn.One);
        
        // 3. Focus the Chat Panel (The Comm Link)
        // The command handler should be updated to pass the requested column to ChatPanel.createOrShow
        vscode.commands.executeCommand('openrouter-crew.chatPanel.focus', vscode.ViewColumn.Two);
        
        vscode.window.showInformationMessage(`🖖 Bridge engaged for project: ${projectId}. Tactical sensors online.`);
    }

    /**
     * Returns to the "Star Chart" - the high-level workbench
     */
    public async showWorkbench() {
        ProjectWorkbenchPanel.createOrShow(this.context.extensionUri, this.agentNetwork);
    }

    /**
     * Broadcasts a UI update to all active bridge components
     */
    public async syncBridge() {
        await vscode.commands.executeCommand('openrouter-crew.project-view.refresh');
        await vscode.commands.executeCommand('openrouter-crew.cost-report.refresh');
    }
}