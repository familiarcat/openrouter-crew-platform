/**
 * Memory Browser Tree View Provider
 * Browse and manage memories in VSCode sidebar
 */

import * as vscode from 'vscode';
import { MemoryAnalyticsService, Memory } from '@openrouter-crew/crew-api-client';

interface MemoryTreeItem extends vscode.TreeItem {
  memory?: Memory;
  type?: 'folder' | 'memory';
}

export class MemoryBrowserTreeViewProvider implements vscode.TreeDataProvider<MemoryTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<MemoryTreeItem | undefined | null | void> =
    new vscode.EventEmitter<MemoryTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<MemoryTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  private analyticsService: MemoryAnalyticsService;
  private crewId: string = 'crew_1';

  constructor() {
    this.analyticsService = new MemoryAnalyticsService();
  }

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: MemoryTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: MemoryTreeItem): Promise<MemoryTreeItem[]> {
    if (!element) {
      return this.getRootItems();
    }

    if (element.label === 'Recent Memories') {
      return this.getRecentMemories();
    }

    if (element.label === 'By Type') {
      return this.getMemoriesByType();
    }

    if (element.label === 'High Confidence' || element.label === 'Standard' || element.label === 'Low Confidence') {
      return this.getMemoriesFilter(element.label as string);
    }

    if (element.label?.includes('insight') || element.label?.includes('interaction') || element.label?.includes('decision')) {
      return this.getMemoriesOfType(element.label as string);
    }

    return [];
  }

  private getRootItems(): MemoryTreeItem[] {
    const items: MemoryTreeItem[] = [];

    const recentItem = new MemoryTreeItem('Recent Memories', vscode.TreeItemCollapsibleState.Collapsed);
    recentItem.type = 'folder';
    recentItem.iconPath = new vscode.ThemeIcon('history');
    items.push(recentItem);

    const typeItem = new MemoryTreeItem('By Type', vscode.TreeItemCollapsibleState.Collapsed);
    typeItem.type = 'folder';
    typeItem.iconPath = new vscode.ThemeIcon('folder');
    items.push(typeItem);

    const confidenceItem = new MemoryTreeItem('By Confidence', vscode.TreeItemCollapsibleState.Collapsed);
    confidenceItem.type = 'folder';
    confidenceItem.iconPath = new vscode.ThemeIcon('symbol-method');
    items.push(confidenceItem);

    return items;
  }

  private getRecentMemories(): MemoryTreeItem[] {
    const memories = [
      {
        id: 'mem_1001',
        type: 'insight',
        content: 'Performance optimization strategy...',
        confidence: 0.95,
        created: '2 hours ago',
      },
      {
        id: 'mem_1002',
        type: 'interaction',
        content: 'API design discussion...',
        confidence: 0.87,
        created: '5 hours ago',
      },
      {
        id: 'mem_1003',
        type: 'decision',
        content: 'Database migration plan...',
        confidence: 0.92,
        created: '1 day ago',
      },
      {
        id: 'mem_1004',
        type: 'insight',
        content: 'Cache strategy improvements...',
        confidence: 0.85,
        created: '2 days ago',
      },
      {
        id: 'mem_1005',
        type: 'interaction',
        content: 'Team standup notes...',
        confidence: 0.78,
        created: '3 days ago',
      },
    ];

    return memories.map((mem) => {
      const icon = mem.type === 'insight' ? '💡' : mem.type === 'interaction' ? '👥' : '✓';
      const item = new MemoryTreeItem(
        `[${mem.confidence.toFixed(2)}] ${mem.type}: ${mem.content.substring(0, 40)}...`,
        vscode.TreeItemCollapsibleState.None
      );
      item.description = mem.created;
      item.iconPath = new vscode.ThemeIcon('file-text');
      item.tooltip = `${mem.id}\n${mem.content}`;
      item.command = {
        title: 'View Memory',
        command: 'openrouter-crew.memory.view',
        arguments: [mem.id],
      };
      return item;
    });
  }

  private getMemoriesByType(): MemoryTreeItem[] {
    const types = [
      { name: 'Insights', count: 542 },
      { name: 'Interactions', count: 387 },
      { name: 'Decisions', count: 156 },
    ];

    return types.map((type) => {
      const item = new MemoryTreeItem(
        `${type.name} (${type.count})`,
        vscode.TreeItemCollapsibleState.Collapsed
      );
      item.type = 'folder';
      item.iconPath = new vscode.ThemeIcon('folder');
      return item;
    });
  }

  private getMemoriesOfType(typeLabel: string): MemoryTreeItem[] {
    const typeMap: Record<string, string> = {
      insights: 'Insights',
      interactions: 'Interactions',
      decisions: 'Decisions',
    };

    // Return sample memories of this type
    const items: MemoryTreeItem[] = [];
    for (let i = 0; i < 3; i++) {
      const item = new MemoryTreeItem(
        `${typeLabel} ${i + 1}`,
        vscode.TreeItemCollapsibleState.None
      );
      item.description = `0.${85 + i}`;
      item.iconPath = new vscode.ThemeIcon('file-text');
      item.command = {
        title: 'View Memory',
        command: 'openrouter-crew.memory.view',
        arguments: [`mem_${1000 + i}`],
      };
      items.push(item);
    }
    return items;
  }

  private getMemoriesFilter(filter: string): MemoryTreeItem[] {
    let filterName = '';
    if (filter.includes('High')) filterName = 'High Confidence';
    else if (filter.includes('Standard')) filterName = 'Standard';
    else filterName = 'Low Confidence';

    const items: MemoryTreeItem[] = [];
    for (let i = 0; i < 3; i++) {
      const item = new MemoryTreeItem(
        `Memory ${i + 1}`,
        vscode.TreeItemCollapsibleState.None
      );
      item.description = filterName;
      item.iconPath = new vscode.ThemeIcon('file-text');
      item.command = {
        title: 'View Memory',
        command: 'openrouter-crew.memory.view',
        arguments: [`mem_${2000 + i}`],
      };
      items.push(item);
    }
    return items;
  }
}
