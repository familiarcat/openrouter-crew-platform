/**
 * Memory Browser Tree View Provider Tests
 * Verify memory browsing functionality
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import * as vscode from 'vscode';
import { MemoryBrowserTreeViewProvider } from '../src/providers/memory-browser-provider';

describe('MemoryBrowserTreeViewProvider', () => {
  let provider: MemoryBrowserTreeViewProvider;

  beforeEach(() => {
    provider = new MemoryBrowserTreeViewProvider();
  });

  describe('Root Items', () => {
    it('should return root tree items', async () => {
      const items = await provider.getChildren();
      expect(items.length).toBe(3);
    });

    it('should include Recent Memories folder', async () => {
      const items = await provider.getChildren();
      const recentItem = items.find(item => item.label === 'Recent Memories');
      expect(recentItem).toBeDefined();
      expect(recentItem?.collapsibleState).toBe(vscode.TreeItemCollapsibleState.Collapsed);
    });

    it('should include By Type folder', async () => {
      const items = await provider.getChildren();
      const typeItem = items.find(item => item.label === 'By Type');
      expect(typeItem).toBeDefined();
    });

    it('should include By Confidence folder', async () => {
      const items = await provider.getChildren();
      const confidenceItem = items.find(item => item.label?.includes('Confidence'));
      expect(confidenceItem).toBeDefined();
    });
  });

  describe('Recent Memories', () => {
    it('should return recent memory items', async () => {
      const rootItems = await provider.getChildren();
      const recentItem = rootItems.find(item => item.label === 'Recent Memories');
      if (recentItem) {
        const memories = await provider.getChildren(recentItem);
        expect(memories.length).toBeGreaterThan(0);
      }
    });

    it('should display memory type and confidence', async () => {
      const rootItems = await provider.getChildren();
      const recentItem = rootItems.find(item => item.label === 'Recent Memories');
      if (recentItem) {
        const memories = await provider.getChildren(recentItem);
        memories.forEach(memory => {
          expect(memory.label).toMatch(/\[0\.\d+\]/); // Confidence in [0.xx] format
          expect(memory.label).toMatch(/(insight|interaction|decision)/);
        });
      }
    });

    it('should show created time as description', async () => {
      const rootItems = await provider.getChildren();
      const recentItem = rootItems.find(item => item.label === 'Recent Memories');
      if (recentItem) {
        const memories = await provider.getChildren(recentItem);
        memories.forEach(memory => {
          expect(memory.description).toMatch(/(ago|day)/);
        });
      }
    });

    it('should have view memory command', async () => {
      const rootItems = await provider.getChildren();
      const recentItem = rootItems.find(item => item.label === 'Recent Memories');
      if (recentItem) {
        const memories = await provider.getChildren(recentItem);
        memories.forEach(memory => {
          expect(memory.command).toBeDefined();
          expect(memory.command?.command).toBe('openrouter-crew.memory.view');
        });
      }
    });

    it('should have tooltip with memory ID and content', async () => {
      const rootItems = await provider.getChildren();
      const recentItem = rootItems.find(item => item.label === 'Recent Memories');
      if (recentItem) {
        const memories = await provider.getChildren(recentItem);
        memories.forEach(memory => {
          expect(memory.tooltip).toBeDefined();
          expect(typeof memory.tooltip).toBe('string');
        });
      }
    });
  });

  describe('Memories By Type', () => {
    it('should return type categories', async () => {
      const rootItems = await provider.getChildren();
      const typeItem = rootItems.find(item => item.label === 'By Type');
      if (typeItem) {
        const types = await provider.getChildren(typeItem);
        expect(types.length).toBeGreaterThan(0);
      }
    });

    it('should show type names and counts', async () => {
      const rootItems = await provider.getChildren();
      const typeItem = rootItems.find(item => item.label === 'By Type');
      if (typeItem) {
        const types = await provider.getChildren(typeItem);
        types.forEach(type => {
          expect(type.label).toMatch(/\(\d+\)/); // (count) format
          expect(type.collapsibleState).toBe(vscode.TreeItemCollapsibleState.Collapsed);
        });
      }
    });

    it('should have memories under each type', async () => {
      const rootItems = await provider.getChildren();
      const typeItem = rootItems.find(item => item.label === 'By Type');
      if (typeItem) {
        const types = await provider.getChildren(typeItem);
        for (const type of types) {
          const memories = await provider.getChildren(type);
          expect(memories.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('Memory Items', () => {
    it('should have proper tree item structure', async () => {
      const rootItems = await provider.getChildren();
      const recentItem = rootItems.find(item => item.label === 'Recent Memories');
      if (recentItem) {
        const memories = await provider.getChildren(recentItem);
        memories.forEach(memory => {
          const treeItem = provider.getTreeItem(memory);
          expect(treeItem).toBeDefined();
          expect(treeItem.label).toBeDefined();
          expect(treeItem.iconPath).toBeDefined();
        });
      }
    });

    it('should not be collapsible', async () => {
      const rootItems = await provider.getChildren();
      const recentItem = rootItems.find(item => item.label === 'Recent Memories');
      if (recentItem) {
        const memories = await provider.getChildren(recentItem);
        memories.forEach(memory => {
          expect(memory.collapsibleState).toBe(vscode.TreeItemCollapsibleState.None);
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
