import * as vscode from 'vscode';
import { AgentNetworkService } from '../services/agent-network.js';
import { CostTracker } from '../services/cost-tracker.js';

const agentProfiles = require('../config/agent-profiles.json');
// --- Project View ---

class ProjectTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly project: any
  ) {
    super(label, collapsibleState);
    this.tooltip = `${project.description || 'No description'}`;
    this.description = project.status;
    this.contextValue = 'project';
    this.iconPath = new vscode.ThemeIcon('repo');
  }
}

export class ProjectTreeViewProvider implements vscode.TreeDataProvider<ProjectTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<ProjectTreeItem | undefined | null | void> = new vscode.EventEmitter<ProjectTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<ProjectTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  constructor(private agentNetwork: AgentNetworkService) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ProjectTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: ProjectTreeItem): Promise<ProjectTreeItem[]> {
    if (element) {
      // Future: Show project details (sprints, files) as children
      return [];
    }

    const projects = await this.agentNetwork.getProjects();
    if (projects.length === 0) {
        return [new vscode.TreeItem('No projects found in Supabase.', vscode.TreeItemCollapsibleState.None) as ProjectTreeItem];
    }

    return projects.map(p => new ProjectTreeItem(
        p.name,
        vscode.TreeItemCollapsibleState.None,
        p
    ));
  }
}


// --- Crew View ---

class CrewTreeItem extends vscode.TreeItem {
    constructor(
      public readonly label: string,
      public readonly collapsibleState: vscode.TreeItemCollapsibleState,
      public readonly description?: string,
      public readonly details?: any
    ) {
      super(label, collapsibleState);
      this.tooltip = `${this.label} - ${this.description}`;
      this.contextValue = 'crewMember';
      this.iconPath = new vscode.ThemeIcon('person');
      this.command = {
        command: 'openrouter-crew.showCrewDetails',
        title: 'Show Details',
        arguments: [this]
      };
    }
  }
  
  export class CrewTreeProvider implements vscode.TreeDataProvider<CrewTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<CrewTreeItem | undefined | null | void> = new vscode.EventEmitter<CrewTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<CrewTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;
  
    constructor() {}
  
    refresh(): void {
      this._onDidChangeTreeData.fire();
    }
  
    getTreeItem(element: CrewTreeItem): vscode.TreeItem {
      return element;
    }
  
    async getChildren(element?: CrewTreeItem): Promise<CrewTreeItem[]> {
      if (element) {
        return []; // No children for now
      }
  
      const profiles = agentProfiles as Record<string, any>;
      if (Object.keys(profiles).length > 0) {
        return Object.values(profiles).map((member: any) => new CrewTreeItem(
          member.name,
          vscode.TreeItemCollapsibleState.None,
          member.role,
          member
        ));
      }
  
      return [
        new CrewTreeItem('No Crew Found', vscode.TreeItemCollapsibleState.None, 'Could not load agent profiles', {})
      ];
    }
  }

// --- Cost View ---

class CostTreeItem extends vscode.TreeItem {
    constructor(
      public readonly label: string,
      public readonly collapsibleState: vscode.TreeItemCollapsibleState,
      public readonly value: string,
      public readonly iconPath?: vscode.ThemeIcon
    ) {
      super(label, collapsibleState);
      this.description = value;
      this.tooltip = `${this.label}: ${this.value}`;
      this.iconPath = iconPath;
    }
  }
  
  export class CostTreeProvider implements vscode.TreeDataProvider<CostTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<CostTreeItem | undefined | null | void> = new vscode.EventEmitter<CostTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<CostTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;
  
    constructor(private costTracker: CostTracker) {}
  
    refresh(): void {
      this._onDidChangeTreeData.fire();
    }
  
    getTreeItem(element: CostTreeItem): vscode.TreeItem {
      return element;
    }
  
    async getChildren(element?: CostTreeItem): Promise<CostTreeItem[]> {
      if (element) {
        return [];
      }
  
      const dailyMetrics = await this.costTracker.getCostMetrics('daily');
      const monthlyMetrics = await this.costTracker.getCostMetrics('monthly');
  
      return [
        new CostTreeItem("Today's Cost", vscode.TreeItemCollapsibleState.None, `$${dailyMetrics.totalCost.toFixed(4)}`, new vscode.ThemeIcon('graph')),
        new CostTreeItem("Month to Date", vscode.TreeItemCollapsibleState.None, `$${monthlyMetrics.totalCost.toFixed(4)}`, new vscode.ThemeIcon('calendar')),
        new CostTreeItem("Remaining Budget", vscode.TreeItemCollapsibleState.None, `$${monthlyMetrics.remaining.toFixed(2)} (${(100 - monthlyMetrics.percentUsed).toFixed(1)}%)`, new vscode.ThemeIcon('pie-chart'))
      ];
    }
  }

// --- Registration ---

export function registerTreeViews(context: vscode.ExtensionContext, agentNetwork: AgentNetworkService, costTracker: CostTracker) {
    const projectProvider = new ProjectTreeViewProvider(agentNetwork);
    const crewProvider = new CrewTreeProvider();
    const costProvider = new CostTreeProvider(costTracker);

    // Register providers
    vscode.window.registerTreeDataProvider('openrouter-crew.project-view', projectProvider);
    vscode.window.registerTreeDataProvider('openrouter-crew.crew-view', crewProvider);
    vscode.window.registerTreeDataProvider('openrouter-crew.cost-report', costProvider);
  
    context.subscriptions.push(
      // Refresh commands
      vscode.commands.registerCommand('openrouter-crew.project-view.refresh', () => projectProvider.refresh()),
      vscode.commands.registerCommand('openrouter-crew.crew-view.refresh', () => crewProvider.refresh()),
      vscode.commands.registerCommand('openrouter-crew.cost-report.refresh', () => costProvider.refresh()),
      
      // Show Crew Details Command
      vscode.commands.registerCommand('openrouter-crew.showCrewDetails', (item: CrewTreeItem) => {
        const panel = vscode.window.createWebviewPanel(
            'crewDetails',
            `Crew Member: ${item.label}`,
            vscode.ViewColumn.One,
            {}
        );
        panel.webview.html = `<html><body>
            <h1>${item.label}</h1>
            <p><strong>Role:</strong> ${item.description}</p>
            <pre>${JSON.stringify(item.details, null, 2)}</pre>
        </body></html>`;
      })
    );
  
    let refreshInterval: NodeJS.Timeout | undefined;

    const startRefreshing = () => {
        const config = vscode.workspace.getConfiguration('openrouterCrew');
        const autoRefreshEnabled = config.get<boolean>('treeView.autoRefresh', true);

        if (!autoRefreshEnabled) {
            return;
        }

        if (!refreshInterval) {
            refreshInterval = setInterval(() => {
                projectProvider.refresh();
                costProvider.refresh();
            }, 60000); // Refresh views every minute
        }
    };

    const stopRefreshing = () => {
        if (refreshInterval) {
            clearInterval(refreshInterval);
            refreshInterval = undefined;
        }
    };

    // Initial check
    if (vscode.window.state.focused) {
        startRefreshing();
    }

    // Listen for focus changes
    context.subscriptions.push(
        vscode.window.onDidChangeWindowState(state => {
            if (state.focused) {
                startRefreshing();
                // Immediate refresh on focus
                projectProvider.refresh();
                costProvider.refresh();
            } else {
                stopRefreshing();
            }
        })
    );

    // Ensure cleanup on deactivation
    context.subscriptions.push({ dispose: stopRefreshing });

    return { projectProvider, crewProvider, costProvider };
  }