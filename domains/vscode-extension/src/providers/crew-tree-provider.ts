import * as vscode from 'vscode';
import { CLIExecutor } from '../services/cli-executor';

export class CrewTreeViewProvider implements vscode.TreeDataProvider<CrewItem>, vscode.Disposable {
  constructor(private cliExecutor: CLIExecutor) {}
  
  getTreeItem(element: CrewItem): vscode.TreeItem {
    return element;
  }
  
  async getChildren(element?: CrewItem): Promise<CrewItem[]> {
    return [];
  }
  
  refresh(): void {
    // Stub implementation
  }
  
  dispose(): void {
    // Stub implementation
  }
}

class CrewItem extends vscode.TreeItem {
  constructor(label: string) {
    super(label);
  }
}
