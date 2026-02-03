/**
 * Crew Tree View Provider
 *
 * Displays crew members and their status in a tree view
 * Shows availability, workload, and specialization
 */

import * as vscode from 'vscode';
import { CLIExecutor } from '../services/cli-executor';

export class CrewTreeViewProvider implements vscode.TreeDataProvider<CrewItem>, vscode.Disposable {
  private _onDidChangeTreeData: vscode.EventEmitter<CrewItem | undefined | null | void> =
    new vscode.EventEmitter<CrewItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<CrewItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  private cliExecutor: CLIExecutor;
  private crewMembers: any[] = [];

  constructor(cliExecutor: CLIExecutor) {
    this.cliExecutor = cliExecutor;
    this.loadCrewData();
  }

  /**
   * Load crew data from CLI
   */
  private async loadCrewData(): Promise<void> {
    const result = await this.cliExecutor.getCrewRoster();
    if (result.success && Array.isArray(result.data)) {
      this.crewMembers = result.data;
    }
  }

  /**
   * Refresh the tree view
   */
  refresh(): void {
    this.loadCrewData().then(() => {
      this._onDidChangeTreeData.fire();
    });
  }

  /**
   * Get tree item for an element
   */
  getTreeItem(element: CrewItem): vscode.TreeItem {
    return element;
  }

  /**
   * Get children of an element
   */
  getChildren(element?: CrewItem): Thenable<CrewItem[]> {
    if (!element) {
      // Root level - return crew members
      return Promise.resolve(
        this.crewMembers.map(
          (member) =>
            new CrewItem(
              member.name,
              member.role,
              member.available ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.None,
              {
                command: 'openrouter-crew.crew.consult',
                title: 'Consult Crew Member',
                arguments: [member.name],
              },
              member
            )
        )
      );
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
 * Crew Item for tree view
 */
export class CrewItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly role: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command,
    public readonly data?: any
  ) {
    super(label, collapsibleState);

    // Set description (role)
    this.description = role;

    // Set icon based on availability
    const icon = data?.available ? '✓' : '⊘';
    const color = data?.available ? new vscode.ThemeColor('terminal.ansiGreen') : new vscode.ThemeColor('terminal.ansiRed');

    // Set tooltip
    this.tooltip = new vscode.MarkdownString(
      `**${label}**\n\n` +
        `Role: ${role}\n\n` +
        `Status: ${data?.available ? 'Available' : 'Busy'}\n\n` +
        `Workload: ${data?.workload}%\n\n` +
        `Model: ${data?.model}`
    );

    // Set context value for commands
    this.contextValue = 'crewMember';
  }
}
