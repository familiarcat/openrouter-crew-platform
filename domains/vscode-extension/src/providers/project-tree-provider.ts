/**
 * Project Tree View Provider
 *
 * Displays projects, features, and stories
 */

import * as vscode from 'vscode';
import { CLIExecutor } from '../services/cli-executor';

export class ProjectTreeViewProvider
  implements vscode.TreeDataProvider<ProjectItem>, vscode.Disposable
{
  private _onDidChangeTreeData: vscode.EventEmitter<ProjectItem | undefined | null | void> =
    new vscode.EventEmitter<ProjectItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<ProjectItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  private cliExecutor: CLIExecutor;
  private projects: any[] = [];

  constructor(cliExecutor: CLIExecutor) {
    this.cliExecutor = cliExecutor;
    this.loadProjects();
  }

  /**
   * Load projects from CLI
   */
  private async loadProjects(): Promise<void> {
    const result = await this.cliExecutor.listProjects();
    if (result.success && Array.isArray(result.data)) {
      this.projects = result.data;
    }
  }

  /**
   * Refresh the tree view
   */
  refresh(): void {
    this.loadProjects().then(() => {
      this._onDidChangeTreeData.fire();
    });
  }

  /**
   * Get tree item for an element
   */
  getTreeItem(element: ProjectItem): vscode.TreeItem {
    return element;
  }

  /**
   * Get children of an element
   */
  getChildren(element?: ProjectItem): Thenable<ProjectItem[]> {
    if (!element) {
      // Root level - return projects
      return Promise.resolve(
        this.projects.map(
          (project) =>
            new ProjectItem(
              project.name,
              `${project.type} (${project.status})`,
              vscode.TreeItemCollapsibleState.Collapsed,
              project
            )
        )
      );
    }

    // Show project details
    const details: ProjectItem[] = [];

    if (element.data) {
      details.push(
        new ProjectItem(
          `Budget: $${element.data.budget?.toFixed(2)}`,
          'property',
          vscode.TreeItemCollapsibleState.None
        )
      );
      details.push(
        new ProjectItem(
          `Used: $${element.data.used?.toFixed(2)}`,
          'property',
          vscode.TreeItemCollapsibleState.None
        )
      );
      details.push(
        new ProjectItem(
          `Status: ${element.data.status}`,
          'property',
          vscode.TreeItemCollapsibleState.None
        )
      );
    }

    return Promise.resolve(details);
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this._onDidChangeTreeData.dispose();
  }
}

/**
 * Project Item for tree view
 */
export class ProjectItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly description: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly data?: any
  ) {
    super(label, collapsibleState);

    this.description = description;
    this.contextValue = 'project';

    // Set tooltip
    if (data) {
      this.tooltip = new vscode.MarkdownString(
        `**${label}**\n\n` +
          `Type: ${data.type}\n\n` +
          `Status: ${data.status}\n\n` +
          `Budget: $${data.budget?.toFixed(2)}`
      );
    }
  }
}
