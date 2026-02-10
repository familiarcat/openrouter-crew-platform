import * as vscode from 'vscode';
import { CLIExecutor } from '../services/cli-executor';

export class ProjectTreeViewProvider implements vscode.TreeDataProvider<ProjectItem>, vscode.Disposable {
  constructor(private cliExecutor: CLIExecutor) {}
  
  getTreeItem(element: ProjectItem): vscode.TreeItem {
    return element;
  }
  
  async getChildren(element?: ProjectItem): Promise<ProjectItem[]> {
    return [];
  }
  
  refresh(): void {
    // Stub implementation
  }
  
  dispose(): void {
    // Stub implementation
  }
}

class ProjectItem extends vscode.TreeItem {
  constructor(label: string) {
    super(label);
  }
}
