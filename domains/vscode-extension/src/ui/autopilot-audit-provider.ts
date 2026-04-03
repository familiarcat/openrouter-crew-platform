import * as vscode from 'vscode';
import { AgentNetworkService } from '../services/agent-network';

export class AutopilotAuditItem extends vscode.TreeItem {
    constructor(
        public readonly audit: any
    ) {
        const date = new Date(audit.created_at).toLocaleDateString();
        const label = `Audit [${audit.severity}] - ${date}`;
        super(label, vscode.TreeItemCollapsibleState.None);
        
        this.description = audit.content.substring(0, 50) + '...';
        this.tooltip = new vscode.MarkdownString(`**Autopilot Audit**\n\n**Severity:** ${audit.severity}\n\n---\n\n${audit.content}`);
        this.contextValue = 'autopilotAudit';
        this.iconPath = new vscode.ThemeIcon(this.getIcon(audit.severity));
        
        // Command to show the full audit log in a dedicated Output Channel
        this.command = {
            command: 'openrouter-crew.autopilot.showAudit',
            title: 'Show Audit Details',
            arguments: [audit]
        };
    }

    private getIcon(severity: string): string {
        switch (severity?.toUpperCase()) {
            case 'CRITICAL': return 'error';
            case 'HIGH': return 'warning';
            case 'MEDIUM': return 'info';
            default: return 'check';
        }
    }
}

export class AutopilotAuditProvider implements vscode.TreeDataProvider<AutopilotAuditItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<AutopilotAuditItem | undefined | null | void> = new vscode.EventEmitter<AutopilotAuditItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<AutopilotAuditItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private agentNetwork: AgentNetworkService) {
        this.agentNetwork.onDidBroadcastInsight((source) => {
            if (source === 'n8n-autopilot-audit') {
                this.refresh();
            }
        });
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: AutopilotAuditItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: AutopilotAuditItem): Promise<AutopilotAuditItem[]> {
        if (element) return [];

        const audits = await this.agentNetwork.getRecentInsights('n8n-autopilot-audit', 20);
        return audits.map(a => new AutopilotAuditItem(a));
    }
}