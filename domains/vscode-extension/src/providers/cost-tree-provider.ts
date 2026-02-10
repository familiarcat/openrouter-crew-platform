import * as vscode from 'vscode';
import { CLIExecutor } from '../services/cli-executor';

export class CostTreeViewProvider implements vscode.TreeDataProvider<CostItem>, vscode.Disposable {
  constructor(private cliExecutor: CLIExecutor) {}
  
  getTreeItem(element: CostItem): vscode.TreeItem {
    return element;
  }
  
  async getChildren(element?: CostItem): Promise<CostItem[]> {
    return [];
  }
  
  refresh(): void {
    // Stub implementation
  }
  
  dispose(): void {
    // Stub implementation
  }
}

class CostItem extends vscode.TreeItem {
  constructor(label: string) {
    super(label);
  }
}
