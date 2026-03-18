import * as vscode from 'vscode';
import {
  createWorkItemIntakeModel,
  getDefaultWorkItemIntakeValues,
  renderWorkItemIntakeHtml,
  WorkItemIntakeOption,
  WorkItemIntakeValues,
} from '@openrouter-crew/shared-ui-components/work-item-intake';
import { CLIExecutor } from '../services/cli-executor.js';
import { ProjectWorkbenchPanel } from './project-workbench-panel.js';

interface ProjectSummary {
  id: string;
  name: string;
  description?: string;
}

interface SprintSummary {
  id: string;
  name: string;
  goal?: string;
  status?: string;
}

function mapProjectOptions(projects: ProjectSummary[]): WorkItemIntakeOption[] {
  return projects.map((project) => ({
    id: project.id,
    label: project.name,
    description: project.description || 'Shared project lane',
  }));
}

function mapSprintOptions(sprints: SprintSummary[]): WorkItemIntakeOption[] {
  return sprints.map((sprint) => ({
    id: sprint.id,
    label: sprint.name,
    description: sprint.goal || sprint.status || 'Shared sprint lane',
  }));
}

export class WorkItemIntakePanel {
  public static currentPanel: WorkItemIntakePanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private readonly cliExecutor: CLIExecutor;
  private readonly disposables: vscode.Disposable[] = [];
  private projectOptions: WorkItemIntakeOption[] = [];
  private sprintOptionsByProject: Record<string, WorkItemIntakeOption[]> = {};
  private isReady = false;
  private values: WorkItemIntakeValues = {
    projectId: '',
    sprintId: '',
    title: '',
    description: '',
    workType: 'feature',
    priority: '2',
    storyPoints: '3',
  };

  private constructor(panel: vscode.WebviewPanel, cliExecutor: CLIExecutor) {
    this.panel = panel;
    this.cliExecutor = cliExecutor;

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    this.panel.webview.onDidReceiveMessage(async (message) => {
      if (message?.type === 'submit-work-item-intake') {
        await this.handleSubmit(message.payload);
      }
    }, null, this.disposables);

    this.panel.webview.html = this.renderLoading();
    void this.initialize();
  }

  public static createOrShow(extensionUri: vscode.Uri, cliExecutor: CLIExecutor) {
    const column = vscode.window.activeTextEditor?.viewColumn ?? vscode.ViewColumn.One;

    if (WorkItemIntakePanel.currentPanel) {
      WorkItemIntakePanel.currentPanel.panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'openrouterCrewWorkItemIntake',
      'Feature Intake',
      column,
      {
        enableScripts: true,
        localResourceRoots: [extensionUri],
      },
    );

    WorkItemIntakePanel.currentPanel = new WorkItemIntakePanel(panel, cliExecutor);
  }

  public dispose() {
    WorkItemIntakePanel.currentPanel = undefined;
    this.panel.dispose();
    while (this.disposables.length > 0) {
      this.disposables.pop()?.dispose();
    }
  }

  private async initialize() {
    const projectsResult = await this.cliExecutor.listProjects();
    if (!projectsResult.success || !Array.isArray(projectsResult.data)) {
      this.postError(projectsResult.error || 'Unable to load projects for feature intake.');
      return;
    }

    this.projectOptions = mapProjectOptions(projectsResult.data as ProjectSummary[]);

    for (const project of this.projectOptions) {
      const sprintsResult = await this.cliExecutor.listSprints(project.id);
      const sprintData = sprintsResult.success
        ? Array.isArray(sprintsResult.data) ? sprintsResult.data : Array.isArray(sprintsResult.data?.data) ? sprintsResult.data.data : []
        : [];
      this.sprintOptionsByProject[project.id] = mapSprintOptions(sprintData as SprintSummary[]);
    }

    this.values = getDefaultWorkItemIntakeValues({
      surface: 'vscode',
      projectOptions: this.projectOptions,
      sprintOptionsByProject: this.sprintOptionsByProject,
    });
    this.render();
  }

  private render() {
    const model = createWorkItemIntakeModel({
      surface: 'vscode',
      projectOptions: this.projectOptions,
      sprintOptionsByProject: this.sprintOptionsByProject,
    });
    this.isReady = true;
    this.panel.webview.html = renderWorkItemIntakeHtml(model, this.values);
  }

  private renderLoading(): string {
    return '<html><body style="font-family:sans-serif;background:#111827;color:#e5e7eb;padding:24px;">Loading shared feature intake...</body></html>';
  }

  private async handleSubmit(payload: Partial<WorkItemIntakeValues>) {
    const values: WorkItemIntakeValues = {
      projectId: String(payload?.projectId || ''),
      sprintId: String(payload?.sprintId || ''),
      title: String(payload?.title || '').trim(),
      description: String(payload?.description || ''),
      workType: String(payload?.workType || 'feature'),
      priority: String(payload?.priority || '2'),
      storyPoints: String(payload?.storyPoints || '3'),
    };

    this.values = values;

    if (!values.projectId || !values.sprintId) {
      this.postError('Choose a project and sprint before creating work.');
      return;
    }

    if (!values.title) {
      this.postError('Work item title is required.');
      return;
    }

    const priority = Number.parseInt(values.priority, 10);
    const storyPoints = Number.parseInt(values.storyPoints, 10);
    if (Number.isNaN(priority) || Number.isNaN(storyPoints)) {
      this.postError('Priority and story points must be valid numbers.');
      return;
    }

    const result = await this.cliExecutor.createStory({
      projectId: values.projectId,
      sprintId: values.sprintId,
      title: values.title,
      description: values.description,
      workType: values.workType,
      priority,
      storyPoints,
    });

    if (!result.success) {
      this.postError(result.error || 'Work item creation failed.');
      return;
    }

    vscode.window.showInformationMessage(`Work item created: ${values.title}`);
    await vscode.commands.executeCommand('openrouter-crew.project-view.refresh');
    if (ProjectWorkbenchPanel.currentPanel) {
      await ProjectWorkbenchPanel.currentPanel.refresh();
    }
    this.dispose();
  }

  private postError(error: string) {
    if (!this.isReady) {
      void vscode.window.showErrorMessage(error);
      return;
    }

    void this.panel.webview.postMessage({
      type: 'work-item-intake-error',
      error,
    });
  }
}
