import * as vscode from 'vscode';
import { CLIExecutor } from '../services/cli-executor';

/**
 * Tree Item for Projects and Features
 */
class ProjectTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly type: 'project' | 'feature',
    public readonly description?: string,
    public readonly metadata?: any
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}`;
    this.description = description;
    this.contextValue = type;

    if (type === 'project') {
      this.iconPath = new vscode.ThemeIcon('project');
    } else {
      this.iconPath = new vscode.ThemeIcon('checklist');
    }
  }
}

/**
 * Project Tree View Provider
 * Displays projects and their features in the sidebar
 */
export class ProjectTreeViewProvider implements vscode.TreeDataProvider<ProjectTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<ProjectTreeItem | undefined | null | void> = new vscode.EventEmitter<ProjectTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<ProjectTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  constructor(private cliExecutor: CLIExecutor) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ProjectTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: ProjectTreeItem): Promise<ProjectTreeItem[]> {
    if (!element) {
      // Root level: List projects
      return this.getProjects();
    } else if (element.type === 'project') {
      // Project level: List features
      return this.getFeatures(element.label);
    }

    return [];
  }

  private async getProjects(): Promise<ProjectTreeItem[]> {
    const result = await this.cliExecutor.listProjects();
    
    if (!result.success || !result.data) {
      return [new ProjectTreeItem('No projects found', vscode.TreeItemCollapsibleState.None, 'project')];
    }

    // Assuming result.data is an array of project objects
    // If it's just strings, we'll adapt
    const projects = Array.isArray(result.data) ? result.data : [];

    return projects.map((project: any) => {
      const name = typeof project === 'string' ? project : project.name;
      const desc = typeof project === 'string' ? '' : project.description;
      
      return new ProjectTreeItem(
        name,
        vscode.TreeItemCollapsibleState.Collapsed,
        'project',
        desc,
        project
      );
    });
  }

  private async getFeatures(projectName: string): Promise<ProjectTreeItem[]> {
    // In a real implementation, we might call cliExecutor.listFeatures(projectName)
    // For now, we'll return placeholder features or fetch if available
    
    // Placeholder logic
    return [
      new ProjectTreeItem('Core Implementation', vscode.TreeItemCollapsibleState.None, 'feature', 'In Progress'),
      new ProjectTreeItem('Documentation', vscode.TreeItemCollapsibleState.None, 'feature', 'Pending'),
      new ProjectTreeItem('Testing', vscode.TreeItemCollapsibleState.None, 'feature', 'Pending'),
    ];
  }
}

// Export for consistency with other providers
export { ProjectTreeItem as ProjectItem };