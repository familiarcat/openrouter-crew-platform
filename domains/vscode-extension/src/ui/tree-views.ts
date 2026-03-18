import * as vscode from 'vscode';
import { AgentNetworkService } from '../services/agent-network.js';
import { CostTracker } from '../services/cost-tracker.js';
import { CrewAPIService } from '../services/crew-api-service.js';

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
    this.iconPath = new vscode.ThemeIcon(project.isWorkbench ? 'dashboard' : 'repo');
    if (project.isWorkbench) {
      this.command = {
        command: 'openrouter-crew.project.workbench',
        title: 'Open Project Workbench',
      };
    }
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
    const workbenchEntry = new ProjectTreeItem(
      'Project Workbench',
      vscode.TreeItemCollapsibleState.None,
      {
        description: 'Open the shared creation and management interface',
        status: 'shared',
        isWorkbench: true,
      }
    );

    if (projects.length === 0) {
        return [
          workbenchEntry,
          new vscode.TreeItem('No shared projects found yet.', vscode.TreeItemCollapsibleState.None) as ProjectTreeItem,
        ];
    }

    return [
      workbenchEntry,
      ...projects.map(p => new ProjectTreeItem(
          p.name,
          vscode.TreeItemCollapsibleState.None,
          p
      )),
    ];
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

// --- Memory View ---

class MemoryTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly description?: string,
    public readonly memory?: any
  ) {
    super(label, collapsibleState);
    this.tooltip = memory?.content || description;
    this.description = memory?.type || description;
    this.contextValue = 'memory';
    this.iconPath = new vscode.ThemeIcon('bookmark');
  }
}

export class MemoryTreeViewProvider implements vscode.TreeDataProvider<MemoryTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<MemoryTreeItem | undefined | null | void> = new vscode.EventEmitter<MemoryTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<MemoryTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;
  private memories: any[] = [];

  constructor(private crewAPIService: CrewAPIService) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: MemoryTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: MemoryTreeItem): Promise<MemoryTreeItem[]> {
    if (element) {
      return [];
    }

    try {
      this.memories = await this.crewAPIService.getMemories(20);
    } catch (error) {
      return [];
    }

    if (this.memories.length === 0) {
      const empty = new MemoryTreeItem('No memories yet', vscode.TreeItemCollapsibleState.None, 'Use "Create Memory" to save context');
      return [empty];
    }

    return this.memories.map(m => {
      const content = m.content || '[No content]';
      const label = content.substring(0, 50) + (content.length > 50 ? '...' : '');
      return new MemoryTreeItem(label, vscode.TreeItemCollapsibleState.None, m.type, m);
    });
  }
}

// --- Utilities ---

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// --- Registration ---

export function registerTreeViews(context: vscode.ExtensionContext, agentNetwork: AgentNetworkService, costTracker: CostTracker, crewAPIService: CrewAPIService) {
    const projectProvider = new ProjectTreeViewProvider(agentNetwork);
    const crewProvider = new CrewTreeProvider();
    const costProvider = new CostTreeProvider(costTracker);
    const memoryProvider = new MemoryTreeViewProvider(crewAPIService);

    // Register providers
    vscode.window.registerTreeDataProvider('openrouter-crew.project-view', projectProvider);
    vscode.window.registerTreeDataProvider('openrouter-crew.crew-view', crewProvider);
    vscode.window.registerTreeDataProvider('openrouter-crew.cost-report', costProvider);
    vscode.window.registerTreeDataProvider('openrouter-crew.memory-view', memoryProvider);
  
    context.subscriptions.push(
      // Refresh commands
      vscode.commands.registerCommand('openrouter-crew.project-view.refresh', () => projectProvider.refresh()),
      vscode.commands.registerCommand('openrouter-crew.crew-view.refresh', () => crewProvider.refresh()),
      vscode.commands.registerCommand('openrouter-crew.cost-report.refresh', () => costProvider.refresh()),
      vscode.commands.registerCommand('openrouter-crew.memory-view.refresh', () => memoryProvider.refresh()),
      
      // Show Crew Details Command
      vscode.commands.registerCommand('openrouter-crew.showCrewDetails', (item: CrewTreeItem) => {
        const panel = vscode.window.createWebviewPanel(
            'crewDetails',
            `Crew Member: ${item.label}`,
            vscode.ViewColumn.One,
            {}
        );
        panel.webview.html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
      color: var(--vscode-foreground, #e0e0e0);
      background: var(--vscode-editor-background, #1e1e1e);
      padding: 20px;
      line-height: 1.6;
    }
    h1 {
      color: var(--vscode-textLink-foreground, #569cd6);
      font-size: 1.8em;
      margin-bottom: 8px;
      border-bottom: 2px solid var(--vscode-textLink-foreground, #569cd6);
      padding-bottom: 12px;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 0.85em;
      font-weight: 500;
      background: var(--vscode-badge-background, #264f78);
      color: var(--vscode-badge-foreground, #ffffff);
      margin: 8px 0;
    }
    .section {
      margin-top: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--vscode-textSeparator-foreground, #464646);
    }
    .section:last-child {
      border-bottom: none;
    }
    .label {
      color: var(--vscode-descriptionForeground, #9a9a9a);
      font-size: 0.9em;
      font-weight: 500;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .value {
      color: var(--vscode-foreground, #e0e0e0);
      font-size: 1em;
    }
    pre {
      background: var(--vscode-textCodeBlock-background, #1e1e1e);
      border: 1px solid var(--vscode-textSeparator-foreground, #464646);
      padding: 12px;
      border-radius: 4px;
      overflow: auto;
      font-size: 0.85em;
      font-family: var(--vscode-editor-font-family, 'Courier New', monospace);
      max-height: 400px;
    }
    code {
      font-family: var(--vscode-editor-font-family, 'Courier New', monospace);
      color: var(--vscode-symbolIcon-stringForeground, #ce9178);
    }
  </style>
</head>
<body>
  <h1>${item.label}</h1>
  <span class="badge">${item.description || 'Agent'}</span>

  <div class="section">
    <div class="label">Status</div>
    <div class="value">${item.details?.status || 'Ready'}</div>
  </div>

  <div class="section">
    <div class="label">Description</div>
    <div class="value">${item.details?.description || 'No description available'}</div>
  </div>

  <div class="section">
    <div class="label">Configuration</div>
    <pre><code>${escapeHtml(JSON.stringify(item.details, null, 2))}</code></pre>
  </div>
</body>
</html>`;
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
