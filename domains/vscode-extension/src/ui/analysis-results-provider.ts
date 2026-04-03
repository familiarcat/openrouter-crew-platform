import * as vscode from 'vscode';
import { AgentNetworkService } from '../services/agent-network';

export class AnalysisResultItem extends vscode.TreeItem {
    constructor(
        public readonly analysis: any
    ) {
        const date = new Date(analysis.created_at).toLocaleDateString();
        const label = `${analysis.source.split('-')[0]} [${analysis.severity}] - ${date}`;
        super(label, vscode.TreeItemCollapsibleState.None);
        
        this.description = analysis.content.substring(0, 50) + '...';
        this.tooltip = new vscode.MarkdownString(`**${analysis.source}**\n\n**Severity:** ${analysis.severity}\n\n---\n\n${analysis.content}`);
        this.contextValue = 'analysisResult';
        this.iconPath = new vscode.ThemeIcon(this.getIcon(analysis.severity));
        
        // Command to show the full analysis log in a dedicated Output Channel
        this.command = {
            command: 'openrouter-crew.analysis.showDetail',
            title: 'Show Analysis Details',
            arguments: [analysis]
        };
    }

    private getIcon(severity: string): string {
        switch (severity?.toUpperCase()) {
            case 'CRITICAL': return 'error';
            case 'HIGH': return 'warning';
            case 'MEDIUM': return 'info';
            default: return 'light-bulb'; // INFO or other
        }
    }
}

export class AnalysisResultsProvider implements vscode.TreeDataProvider<AnalysisResultItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<AnalysisResultItem | undefined | null | void> = new vscode.EventEmitter<AnalysisResultItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<AnalysisResultItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private readonly sources = ['geordi-optimization-analysis', 'quark-arbitrage-analysis'];

    constructor(private agentNetwork: AgentNetworkService) {
        // Refresh when any of the relevant insights are broadcasted
        this.agentNetwork.onDidBroadcastInsight((source) => {
            if (this.sources.includes(source)) {
                this.refresh();
            }
        });
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: AnalysisResultItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: AnalysisResultItem): Promise<AnalysisResultItem[]> {
        if (element) return [];

        const allAudits = await Promise.all(this.sources.map(source => 
            this.agentNetwork.getRecentInsights(source, 10) // Fetch up to 10 recent analyses for each source
        ));
        const combinedAudits = allAudits.flat().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        return combinedAudits.map(a => new AnalysisResultItem(a));
    }
}