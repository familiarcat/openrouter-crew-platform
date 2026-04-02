import * as vscode from 'vscode';
// shared-ui-components subpath exports not yet published — using runtime stubs
type WorkbenchProjectRecord = Record<string, any>;
const createProjectWorkbenchModel: (...args: any[]) => any = () => ({});
const renderProjectWorkbenchHtml: (...args: any[]) => string = () => '<p>Project Workbench loading...</p>';
import { AgentNetworkService } from '../services/agent-network.js';
import { CostTracker } from '../services/cost-tracker.js';
import { BridgeController, FleetDeck } from './bridge-controller';

export class ProjectWorkbenchPanel {
  public static currentPanel: ProjectWorkbenchPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private readonly extensionUri: vscode.Uri;
  private readonly agentNetwork: AgentNetworkService;
  private readonly costTracker: CostTracker;
  private readonly context: vscode.ExtensionContext;
  private readonly disposables: vscode.Disposable[] = [];

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    agentNetwork: AgentNetworkService,
    costTracker: CostTracker,
    context: vscode.ExtensionContext
  ) {
    this.panel = panel;
    this.extensionUri = extensionUri;
    this.agentNetwork = agentNetwork;
    this.costTracker = costTracker;
    this.context = context;

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    this.panel.webview.onDidReceiveMessage(
      async (message) => {
        if (message?.type === 'command' && typeof message.command === 'string') {
          await vscode.commands.executeCommand(message.command);
          if (message.command === 'openrouter-crew.project.create' || message.command === 'openrouter-crew.project.feature') {
            await this.refresh();
          }
        }
        if (message.command === 'navigate') {
          const bridge = BridgeController.getInstance(this.context, this.agentNetwork, this.costTracker);
          bridge.navigateToDeck(message.deck as FleetDeck);
        }
      },
      null,
      this.disposables
    );

    void this.refresh();
  }

  public static createOrShow(extensionUri: vscode.Uri, agentNetwork: AgentNetworkService, costTracker: CostTracker, context: vscode.ExtensionContext) {
    const column = vscode.window.activeTextEditor?.viewColumn ?? vscode.ViewColumn.One;

    if (ProjectWorkbenchPanel.currentPanel) {
      ProjectWorkbenchPanel.currentPanel.panel.reveal(column);
      void ProjectWorkbenchPanel.currentPanel.refresh();
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'openrouterCrewProjectWorkbench',
      'Project Workbench',
      column,
      {
        enableScripts: true,
        localResourceRoots: [extensionUri],
      }
    );

    ProjectWorkbenchPanel.currentPanel = new ProjectWorkbenchPanel(panel, extensionUri, agentNetwork, costTracker, context);
  }

  public async refresh(): Promise<void> {
    const projects = await this.loadProjects();
    const model = createProjectWorkbenchModel({
      surface: 'vscode',
      projects,
    });
    let html = renderProjectWorkbenchHtml(model);

    // Inject Fleet Navigation UI and Logic into the shared component's HTML
    const navStyles = `
      <style>
        .fleet-nav { display: flex; gap: 10px; margin-bottom: 25px; border-bottom: 1px solid var(--vscode-widget-border, #3e3e42); padding: 20px; padding-bottom: 15px; background: var(--vscode-editor-background); }
        .nav-item { 
            padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 0.85em; font-weight: bold;
            background: var(--vscode-sideBar-background); color: var(--vscode-descriptionForeground); border: 1px solid transparent;
            transition: all 0.2s ease;
        }
        .nav-item:hover { background: var(--vscode-editor-inactiveSelectionBackground); border-color: var(--vscode-textLink-foreground); }
        .nav-item.active { background: var(--vscode-textLink-foreground); color: white; border-color: var(--vscode-textLink-foreground); }
        .nav-arrow { opacity: 0.5; font-size: 1.2em; display: flex; align-items: center; color: var(--vscode-foreground); }
      </style>
    `;

    const navHtml = `
      <div class="fleet-nav">
          <div class="nav-item active" onclick="nav('STRATEGY')">1. STRATEGY</div>
          <div class="nav-arrow">→</div>
          <div class="nav-item" onclick="nav('COMMAND')">2. COMMAND</div>
          <div class="nav-arrow">→</div>
          <div class="nav-item" onclick="nav('AUDIT')">3. AUDIT</div>
          <div style="margin-left: auto; display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 0.7em; opacity: 0.6; font-weight: bold; text-transform: uppercase;">[STRATEGIC DECK]</span>
          </div>
      </div>
    `;

    const navScript = `
      <script>
        function nav(deck) {
          const vscode = acquireVsCodeApi();
          vscode.postMessage({ command: 'navigate', deck: deck });
        }
      </script>
    `;

    html = html.replace('</head>', `${navStyles}</head>`);
    html = html.replace('<body>', `<body>${navHtml}`);
    html = html.replace('</body>', `${navScript}</body>`);

    this.panel.webview.html = html;
  }

  public dispose() {
    ProjectWorkbenchPanel.currentPanel = undefined;
    this.panel.dispose();
    while (this.disposables.length > 0) {
      const disposable = this.disposables.pop();
      disposable?.dispose();
    }
  }

  private async loadProjects(): Promise<WorkbenchProjectRecord[]> {
    const projects = await this.agentNetwork.getProjects();
    return projects.map((project: any) => ({
      id: project.id,
      name: project.name,
      description: project.description || '',
      status: project.status || 'draft',
      domain: project.domain?.name || project.domainId || project.domain_id || project.type || 'Unassigned domain',
      budgetAllocated: project.budgetAllocated ?? project.budget_usd ?? 0,
      budgetSpent: project.budgetSpent ?? project.total_cost_usd ?? 0,
      teamSize: project.teamSize ?? project.metadata?.team?.size ?? 0,
      updatedAt: project.updatedAt || project.updated_at || project.created_at,
    }));
  }
}
