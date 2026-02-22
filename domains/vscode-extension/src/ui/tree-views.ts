import * as vscode from 'vscode';
import { CostTracker } from '../services/cost-tracker';
import { CrewAPIService } from '../services/crew-api-service';

/**
 * Tree Item for Crew Members
 */
class CrewTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly contextValue: string,
    public readonly description?: string
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}`;
    this.description = description;
  }
}

/**
 * Crew Tree View Provider
 * Displays active crew members and their status
 */
export class CrewTreeProvider implements vscode.TreeDataProvider<CrewTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<CrewTreeItem | undefined | null | void> = new vscode.EventEmitter<CrewTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<CrewTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  constructor(private crewService: CrewAPIService) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: CrewTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: CrewTreeItem): Promise<CrewTreeItem[]> {
    if (element) {
      return []; // No children for now
    }

    const roster = await this.crewService.getCrewRoster();

    if (roster && roster.length > 0) {
      return roster.map((member: any) => new CrewTreeItem(
        member.display_name || member.name,
        vscode.TreeItemCollapsibleState.None,
        member.role,
        member.role
      ));
    }

    // Fallback if API fails or returns no members
    return [
      new CrewTreeItem('No Crew Found', vscode.TreeItemCollapsibleState.None, 'empty', 'Could not fetch crew roster')
    ];
  }
}

/**
 * Tree Item for Cost Metrics
 */
class CostTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly value: string,
    public readonly iconPath?: vscode.ThemeIcon
  ) {
    super(label, collapsibleState);
    this.description = value;
    this.tooltip = `${this.label}: ${this.value}`;
    this.iconPath = iconPath;
  }
}

/**
 * Cost Tree View Provider
 * Displays cost metrics and budget status
 */
export class CostTreeProvider implements vscode.TreeDataProvider<CostTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<CostTreeItem | undefined | null | void> = new vscode.EventEmitter<CostTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<CostTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  constructor(private costTracker: CostTracker) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: CostTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: CostTreeItem): Promise<CostTreeItem[]> {
    if (element) {
      return [];
    }

    const metrics = this.costTracker.getMetrics();
    const config = vscode.workspace.getConfiguration('openrouterCrew');
    const monthlyBudget = config.get<number>('budget.monthly') || 10.0;
    const percentUsed = (metrics.thisMonthCost / monthlyBudget) * 100;

    return [
      new CostTreeItem(
        "Today's Cost",
        vscode.TreeItemCollapsibleState.None,
        `$${metrics.todayCost.toFixed(4)}`,
        new vscode.ThemeIcon('graph')
      ),
      new CostTreeItem(
        "Month to Date",
        vscode.TreeItemCollapsibleState.None,
        `$${metrics.thisMonthCost.toFixed(4)}`,
        new vscode.ThemeIcon('calendar')
      ),
      new CostTreeItem(
        "Remaining Budget",
        vscode.TreeItemCollapsibleState.None,
        `$${metrics.remainingBudget.toFixed(2)} (${(100 - percentUsed).toFixed(1)}%)`,
        new vscode.ThemeIcon('pie-chart')
      ),
      new CostTreeItem(
        "Total Requests",
        vscode.TreeItemCollapsibleState.None,
        `${metrics.requestCount}`,
        new vscode.ThemeIcon('symbol-event')
      ),
      new CostTreeItem(
        "Avg Cost/Request",
        vscode.TreeItemCollapsibleState.None,
        `$${metrics.averageCost.toFixed(5)}`,
        new vscode.ThemeIcon('calculator')
      ),
      new CostTreeItem(
        "Rate Limit Hits",
        vscode.TreeItemCollapsibleState.None,
        `${metrics.rateLimitHits}`,
        new vscode.ThemeIcon('zap')
      )
    ];
  }
}

/**
 * Register Tree Views
 */
export function registerTreeViews(
  context: vscode.ExtensionContext,
  crewService: CrewAPIService,
  costTracker: CostTracker
): { crewProvider: CrewTreeProvider; costProvider: CostTreeProvider } {
  const crewProvider = new CrewTreeProvider(crewService);
  const costProvider = new CostTreeProvider(costTracker);

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('openrouter-crew.crew-view', crewProvider),
    vscode.window.registerTreeDataProvider('openrouter-crew.cost-view', costProvider)
  );

  // Refresh views periodically
  setInterval(() => costProvider.refresh(), 60000); // Refresh cost every minute

  return { crewProvider, costProvider };
}