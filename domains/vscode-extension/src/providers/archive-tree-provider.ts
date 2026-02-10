/**
 * Archive Tree View Provider
 * Manage archived memories in VSCode
 */

import * as vscode from 'vscode';
import { MemoryArchivalService, Memory } from '@openrouter-crew/crew-api-client';

interface ArchiveItem extends vscode.TreeItem {
  archiveId?: string;
  type?: 'folder' | 'archive';
}

export class ArchiveTreeViewProvider implements vscode.TreeDataProvider<ArchiveItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<ArchiveItem | undefined | null | void> =
    new vscode.EventEmitter<ArchiveItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<ArchiveItem | undefined | null | void> = this._onDidChangeTreeData.event;

  private archivalService: MemoryArchivalService;
  private crewId: string = 'crew_1';

  constructor() {
    this.archivalService = new MemoryArchivalService({
      strategy: 'automatic',
      minAgeDays: 30,
      compressionEnabled: true,
    });
  }

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: ArchiveItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: ArchiveItem): Promise<ArchiveItem[]> {
    if (!element) {
      return this.getRootItems();
    }

    if (element.label === 'All Archives') {
      return this.getAllArchives();
    }

    if (element.label === 'By Age') {
      return this.getArchivesByAge();
    }

    if (element.label === 'Archive Statistics') {
      return this.getArchiveStats();
    }

    if (
      element.label === 'This Week' ||
      element.label === 'This Month' ||
      element.label === 'Older than 3 Months'
    ) {
      return this.getArchivesByTimeRange(element.label as string);
    }

    return [];
  }

  private getRootItems(): ArchiveItem[] {
    const items: ArchiveItem[] = [];

    const allItem = new ArchiveItem('All Archives', vscode.TreeItemCollapsibleState.Collapsed);
    allItem.type = 'folder';
    allItem.iconPath = new vscode.ThemeIcon('package');
    items.push(allItem);

    const ageItem = new ArchiveItem('By Age', vscode.TreeItemCollapsibleState.Collapsed);
    ageItem.type = 'folder';
    ageItem.iconPath = new vscode.ThemeIcon('calendar');
    items.push(ageItem);

    const statsItem = new ArchiveItem('Archive Statistics', vscode.TreeItemCollapsibleState.Collapsed);
    statsItem.type = 'folder';
    statsItem.iconPath = new vscode.ThemeIcon('graph');
    items.push(statsItem);

    return items;
  }

  private getAllArchives(): ArchiveItem[] {
    const archives = [
      {
        id: 'arch_001',
        memoryId: 'mem_1234',
        originalSize: 45,
        compressedSize: 18,
        archived: '2025-12-15',
        confidence: 0.82,
      },
      {
        id: 'arch_002',
        memoryId: 'mem_5678',
        originalSize: 78,
        compressedSize: 28,
        archived: '2025-11-20',
        confidence: 0.75,
      },
      {
        id: 'arch_003',
        memoryId: 'mem_9012',
        originalSize: 156,
        compressedSize: 52,
        archived: '2025-10-05',
        confidence: 0.89,
      },
      {
        id: 'arch_004',
        memoryId: 'mem_3456',
        originalSize: 102,
        compressedSize: 35,
        archived: '2025-08-10',
        confidence: 0.71,
      },
      {
        id: 'arch_005',
        memoryId: 'mem_7890',
        originalSize: 67,
        compressedSize: 22,
        archived: '2025-06-20',
        confidence: 0.86,
      },
    ];

    return archives.map((archive) => {
      const saved = ((1 - archive.compressedSize / archive.originalSize) * 100).toFixed(0);
      const item = new ArchiveItem(
        `${archive.memoryId} [${archive.archived}]`,
        vscode.TreeItemCollapsibleState.None
      );
      item.description = `${archive.compressedSize}KB (saved ${saved}%)`;
      item.archiveId = archive.id;
      item.iconPath = new vscode.ThemeIcon('file-archive');
      item.tooltip = `ID: ${archive.id}\nConfidence: ${archive.confidence}`;
      item.command = {
        title: 'View Archive',
        command: 'openrouter-crew.archive.view',
        arguments: [archive.id],
      };
      item.contextValue = 'archive';
      return item;
    });
  }

  private getArchivesByAge(): ArchiveItem[] {
    const timeRanges = [
      { label: 'This Week', count: 12 },
      { label: 'This Month', count: 34 },
      { label: 'Older than 3 Months', count: 199 },
    ];

    return timeRanges.map((range) => {
      const item = new ArchiveItem(`${range.label} (${range.count})`, vscode.TreeItemCollapsibleState.Collapsed);
      item.type = 'folder';
      item.iconPath = new vscode.ThemeIcon('folder');
      return item;
    });
  }

  private getArchiveStats(): ArchiveItem[] {
    const stats = [
      {
        label: 'Total Archived',
        value: '245',
        icon: 'archive',
      },
      {
        label: 'Total Size',
        value: '2.3 GB',
        icon: 'database',
      },
      {
        label: 'Compression Ratio',
        value: '68%',
        icon: 'zap',
      },
      {
        label: 'Space Saved',
        value: '1.8 GB',
        icon: 'check-circle',
      },
      {
        label: 'Average Age',
        value: '92 days',
        icon: 'calendar',
      },
    ];

    return stats.map((stat) => {
      const item = new ArchiveItem(`${stat.label}: ${stat.value}`, vscode.TreeItemCollapsibleState.None);
      item.iconPath = new vscode.ThemeIcon(stat.icon);
      return item;
    });
  }

  private getArchivesByTimeRange(range: string): ArchiveItem[] {
    // Return sample archives for this time range
    const items: ArchiveItem[] = [];
    const count = range === 'This Week' ? 3 : range === 'This Month' ? 5 : 4;

    for (let i = 0; i < count; i++) {
      const item = new ArchiveItem(
        `Archive_${i + 1}`,
        vscode.TreeItemCollapsibleState.None
      );
      item.description = `${50 + i * 10}KB`;
      item.iconPath = new vscode.ThemeIcon('file-archive');
      item.command = {
        title: 'View Archive',
        command: 'openrouter-crew.archive.view',
        arguments: [`arch_${1000 + i}`],
      };
      items.push(item);
    }
    return items;
  }
}
