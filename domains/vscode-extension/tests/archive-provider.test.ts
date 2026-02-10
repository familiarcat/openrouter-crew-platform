/**
 * Archive Tree View Provider Tests
 * Verify archive management functionality
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import * as vscode from 'vscode';
import { ArchiveTreeViewProvider } from '../src/providers/archive-tree-provider';

describe('ArchiveTreeViewProvider', () => {
  let provider: ArchiveTreeViewProvider;

  beforeEach(() => {
    provider = new ArchiveTreeViewProvider();
  });

  describe('Root Items', () => {
    it('should return root tree items', async () => {
      const items = await provider.getChildren();
      expect(items.length).toBe(3);
    });

    it('should include All Archives folder', async () => {
      const items = await provider.getChildren();
      const allItem = items.find(item => item.label === 'All Archives');
      expect(allItem).toBeDefined();
    });

    it('should include By Age folder', async () => {
      const items = await provider.getChildren();
      const ageItem = items.find(item => item.label === 'By Age');
      expect(ageItem).toBeDefined();
    });

    it('should include Archive Statistics folder', async () => {
      const items = await provider.getChildren();
      const statsItem = items.find(item => item.label === 'Archive Statistics');
      expect(statsItem).toBeDefined();
    });
  });

  describe('All Archives', () => {
    it('should return archive list items', async () => {
      const rootItems = await provider.getChildren();
      const allItem = rootItems.find(item => item.label === 'All Archives');
      if (allItem) {
        const archives = await provider.getChildren(allItem);
        expect(archives.length).toBeGreaterThan(0);
      }
    });

    it('should display memory ID and archive date', async () => {
      const rootItems = await provider.getChildren();
      const allItem = rootItems.find(item => item.label === 'All Archives');
      if (allItem) {
        const archives = await provider.getChildren(allItem);
        archives.forEach(archive => {
          expect(archive.label).toMatch(/mem_\d+/);
          expect(archive.label).toMatch(/\d{4}-\d{2}-\d{2}/);
        });
      }
    });

    it('should show compressed size and savings percentage', async () => {
      const rootItems = await provider.getChildren();
      const allItem = rootItems.find(item => item.label === 'All Archives');
      if (allItem) {
        const archives = await provider.getChildren(allItem);
        archives.forEach(archive => {
          expect(archive.description).toMatch(/KB/);
          expect(archive.description).toMatch(/saved \d+%/);
        });
      }
    });

    it('should have view archive command', async () => {
      const rootItems = await provider.getChildren();
      const allItem = rootItems.find(item => item.label === 'All Archives');
      if (allItem) {
        const archives = await provider.getChildren(allItem);
        archives.forEach(archive => {
          expect(archive.command).toBeDefined();
          expect(archive.command?.command).toBe('openrouter-crew.archive.view');
        });
      }
    });
  });

  describe('Archives By Age', () => {
    it('should return age-based categories', async () => {
      const rootItems = await provider.getChildren();
      const ageItem = rootItems.find(item => item.label === 'By Age');
      if (ageItem) {
        const ranges = await provider.getChildren(ageItem);
        expect(ranges.length).toBeGreaterThan(0);
      }
    });

    it('should show count for each time range', async () => {
      const rootItems = await provider.getChildren();
      const ageItem = rootItems.find(item => item.label === 'By Age');
      if (ageItem) {
        const ranges = await provider.getChildren(ageItem);
        ranges.forEach(range => {
          expect(range.label).toMatch(/\(\d+\)/);
        });
      }
    });

    it('should have archives under each age range', async () => {
      const rootItems = await provider.getChildren();
      const ageItem = rootItems.find(item => item.label === 'By Age');
      if (ageItem) {
        const ranges = await provider.getChildren(ageItem);
        for (const range of ranges) {
          const archives = await provider.getChildren(range);
          expect(archives.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('Archive Statistics', () => {
    it('should return statistics items', async () => {
      const rootItems = await provider.getChildren();
      const statsItem = rootItems.find(item => item.label === 'Archive Statistics');
      if (statsItem) {
        const stats = await provider.getChildren(statsItem);
        expect(stats.length).toBeGreaterThan(0);
      }
    });

    it('should display stat names and values', async () => {
      const rootItems = await provider.getChildren();
      const statsItem = rootItems.find(item => item.label === 'Archive Statistics');
      if (statsItem) {
        const stats = await provider.getChildren(statsItem);
        stats.forEach(stat => {
          expect(stat.label).toContain(':');
          expect(stat.label).toMatch(/[0-9%.]+/);
        });
      }
    });

    it('should include key statistics', async () => {
      const rootItems = await provider.getChildren();
      const statsItem = rootItems.find(item => item.label === 'Archive Statistics');
      if (statsItem) {
        const stats = await provider.getChildren(statsItem);
        const labels = stats.map(s => s.label);
        expect(labels.some(l => l?.includes('Total Archived'))).toBe(true);
        expect(labels.some(l => l?.includes('Compression'))).toBe(true);
      }
    });

    it('should not be expandable', async () => {
      const rootItems = await provider.getChildren();
      const statsItem = rootItems.find(item => item.label === 'Archive Statistics');
      if (statsItem) {
        const stats = await provider.getChildren(statsItem);
        stats.forEach(stat => {
          expect(stat.collapsibleState).toBe(vscode.TreeItemCollapsibleState.None);
        });
      }
    });
  });

  describe('Archive Items', () => {
    it('should have proper tree item structure', async () => {
      const rootItems = await provider.getChildren();
      const allItem = rootItems.find(item => item.label === 'All Archives');
      if (allItem) {
        const archives = await provider.getChildren(allItem);
        archives.forEach(archive => {
          const treeItem = provider.getTreeItem(archive);
          expect(treeItem).toBeDefined();
          expect(treeItem.iconPath).toBeDefined();
        });
      }
    });
  });

  describe('Refresh', () => {
    it('should support refresh', () => {
      expect(() => provider.refresh()).not.toThrow();
    });

    it('should have onDidChangeTreeData event', () => {
      expect(provider.onDidChangeTreeData).toBeDefined();
    });
  });
});
