import * as vscode from 'vscode';
import {
  createProjectIntakeModel,
  DEFAULT_PROJECT_INTAKE_VALUES,
  ProjectIntakeValues,
  renderProjectIntakeHtml,
} from '@openrouter-crew/shared-ui-components/project-intake';
import { CLIExecutor } from '../services/cli-executor.js';
import { ProjectWorkbenchPanel } from './project-workbench-panel.js';

export class ProjectIntakePanel {
  public static currentPanel: ProjectIntakePanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private readonly cliExecutor: CLIExecutor;
  private readonly disposables: vscode.Disposable[] = [];
  private values: ProjectIntakeValues = { ...DEFAULT_PROJECT_INTAKE_VALUES };

  private constructor(panel: vscode.WebviewPanel, cliExecutor: CLIExecutor) {
    this.panel = panel;
    this.cliExecutor = cliExecutor;

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    this.panel.webview.onDidReceiveMessage(async (message) => {
      if (message?.type === 'submit-project-intake') {
        await this.handleSubmit(message.payload);
      }
    }, null, this.disposables);

    this.render();
  }

  public static createOrShow(extensionUri: vscode.Uri, cliExecutor: CLIExecutor) {
    const column = vscode.window.activeTextEditor?.viewColumn ?? vscode.ViewColumn.One;

    if (ProjectIntakePanel.currentPanel) {
      ProjectIntakePanel.currentPanel.panel.reveal(column);
      ProjectIntakePanel.currentPanel.render();
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'openrouterCrewProjectIntake',
      'Project Intake',
      column,
      {
        enableScripts: true,
        localResourceRoots: [extensionUri],
      },
    );

    ProjectIntakePanel.currentPanel = new ProjectIntakePanel(panel, cliExecutor);
  }

  public dispose() {
    ProjectIntakePanel.currentPanel = undefined;
    this.panel.dispose();
    while (this.disposables.length > 0) {
      this.disposables.pop()?.dispose();
    }
  }

  private render() {
    const model = createProjectIntakeModel('vscode');
    this.panel.webview.html = renderProjectIntakeHtml(model, this.values);
  }

  private async handleSubmit(payload: Partial<ProjectIntakeValues>) {
    const values: ProjectIntakeValues = {
      name: String(payload?.name || '').trim(),
      description: String(payload?.description || ''),
      domainId: String(payload?.domainId || 'product-factory'),
      template: String(payload?.template || 'standard'),
      budgetUsd: String(payload?.budgetUsd || ''),
    };

    this.values = values;

    if (!values.name) {
      this.postError('Project name is required.');
      return;
    }

    const budget = values.budgetUsd.trim() ? parseFloat(values.budgetUsd) : undefined;
    if (typeof budget === 'number' && Number.isNaN(budget)) {
      this.postError('Budget must be a number.');
      return;
    }

    const result = await this.cliExecutor.createProject(values.name, {
      description: values.description,
      domainId: values.domainId,
      budget,
    });

    if (!result.success) {
      this.postError(result.error || 'Project creation failed.');
      return;
    }

    vscode.window.showInformationMessage(`Project created: ${values.name}`);
    await vscode.commands.executeCommand('openrouter-crew.project-view.refresh');
    if (ProjectWorkbenchPanel.currentPanel) {
      await ProjectWorkbenchPanel.currentPanel.refresh();
    }
    this.dispose();
  }

  private postError(error: string) {
    void this.panel.webview.postMessage({
      type: 'project-intake-error',
      error,
    });
  }
}
