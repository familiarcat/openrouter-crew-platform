/**
 * Cost Tree View Provider
 *
 * Displays cost breakdown by crew member and model
 */

import * as vscode from 'vscode';
import { CLIExecutor } from '../services/cli-executor';

export class CostTreeViewProvider
  implements vscode.TreeDataProvider<CostItem>, vscode.Disposable
{
  private _onDidChangeTreeData: vscode.EventEmitter<CostItem | undefined | null | void> =
    new vscode.EventEmitter<CostItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<CostItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  private cliExecutor: CLIExecutor;
  private costData: any = null;

  constructor(cliExecutor: CLIExecutor) {
    this.cliExecutor = cliExecutor;
    this.loadCostData();
  }

  /**
   * Load cost data from CLI
   */
  private async loadCostData(): Promise<void> {
    const result = await this.cliExecutor.getCostReport(30);
    if (result.success) {
      this.costData = result.data;
    }
  }

  /**
   * Refresh the tree view
   */
  refresh(): void {
    this.loadCostData().then(() => {
      this._onDidChangeTreeData.fire();
    });
  }

  /**
   * Get tree item for an element
   */
  getTreeItem(element: CostItem): vscode.TreeItem {
    return element;
  }

  /**
   * Get children of an element
   */
  getChildren(element?: CostItem): Thenable<CostItem[]> {
    if (!element && this.costData) {
      // Root level
      const items: CostItem[] = [];

      if (this.costData.summary) {
        items.push(
          new CostItem(
            `Total: $${this.costData.summary.total?.toFixed(2)}`,
            'summary',
            vscode.TreeItemCollapsibleState.None
          )
        );
        items.push(
          new CostItem(
            `Daily Avg: $${this.costData.summary.averagePerDay?.toFixed(2)}`,
            'summary',
            vscode.TreeItemCollapsibleState.None
          )
        );
      }

      if (this.costData.byMember && this.costData.byMember.length > 0) {
        items.push(
          new CostItem('By Crew Member', 'category', vscode.TreeItemCollapsibleState.Expanded)
        );
      }

      if (this.costData.byModel && this.costData.byModel.length > 0) {
        items.push(
          new CostItem('By Model', 'category', vscode.TreeItemCollapsibleState.Expanded)
        );
      }

      return Promise.resolve(items);
    }

    return Promise.resolve([]);
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this._onDidChangeTreeData.dispose();
  }
}

/**
 * Cost Item for tree view
 */
export class CostItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly type: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.contextValue = type;
  }
}
