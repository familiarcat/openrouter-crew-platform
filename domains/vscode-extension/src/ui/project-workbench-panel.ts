import * as vscode from 'vscode';
import { createProjectWorkbenchModel, renderProjectWorkbenchHtml, WorkbenchProjectRecord } from '@openrouter-crew/shared-ui-components/project-workbench';
import { AgentNetworkService } from '../services/agent-network.js';

export class ProjectWorkbenchPanel {
  public static currentPanel: ProjectWorkbenchPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private readonly extensionUri: vscode.Uri;
  private readonly agentNetwork: AgentNetworkService;
  private readonly disposables: vscode.Disposable[] = [];

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    agentNetwork: AgentNetworkService
  ) {
    this.panel = panel;
    this.extensionUri = extensionUri;
    this.agentNetwork = agentNetwork;

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    this.panel.webview.onDidReceiveMessage(
      async (message) => {
        if (message?.type === 'command' && typeof message.command === 'string') {
          await vscode.commands.executeCommand(message.command);
          if (message.command === 'openrouter-crew.project.create' || message.command === 'openrouter-crew.project.feature') {
            await this.refresh();
          }
        }
      },
      null,
      this.disposables
    );

    void this.refresh();
  }

  public static createOrShow(extensionUri: vscode.Uri, agentNetwork: AgentNetworkService) {
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

    ProjectWorkbenchPanel.currentPanel = new ProjectWorkbenchPanel(panel, extensionUri, agentNetwork);
  }

  public async refresh(): Promise<void> {
    const projects = await this.loadProjects();
    const model = createProjectWorkbenchModel({
      surface: 'vscode',
      projects,
    });
    this.panel.webview.html = renderProjectWorkbenchHtml(model);
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
      domain: project.domain_id || project.type || 'Unassigned domain',
      budgetAllocated: project.budget_usd || 0,
      budgetSpent: project.total_cost_usd || 0,
      updatedAt: project.updated_at || project.created_at,
    }));
  }
}
