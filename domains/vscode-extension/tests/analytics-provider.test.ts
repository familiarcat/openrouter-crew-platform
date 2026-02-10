/**
 * Analytics Tree View Provider Tests
 * Verify analytics sidebar functionality
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import * as vscode from 'vscode';
import { AnalyticsTreeViewProvider } from '../src/providers/analytics-tree-provider';

describe('AnalyticsTreeViewProvider', () => {
  let provider: AnalyticsTreeViewProvider;

  beforeEach(() => {
    provider = new AnalyticsTreeViewProvider();
  });

  describe('Root Items', () => {
    it('should return root tree items', async () => {
      const items = await provider.getChildren();
      expect(items.length).toBe(3);
    });

    it('should include Topics item', async () => {
      const items = await provider.getChildren();
      const topicsItem = items.find(item => item.label === 'Topics');
      expect(topicsItem).toBeUndefined(); // Should be "Top Topics"
      const topTopicsItem = items.find(item => item.label === 'Top Topics');
      expect(topTopicsItem).toBeDefined();
    });

    it('should include Insights item', async () => {
      const items = await provider.getChildren();
      const insightsItem = items.find(item => item.label === 'Insights');
      expect(insightsItem).toBeDefined();
    });

    it('should include Recommendations item', async () => {
      const items = await provider.getChildren();
      const recsItem = items.find(item => item.label === 'Recommendations');
      expect(recsItem).toBeDefined();
    });

    it('should mark root items as collapsible', async () => {
      const items = await provider.getChildren();
      items.forEach(item => {
        expect(item.collapsibleState).toBe(vscode.TreeItemCollapsibleState.Collapsed);
      });
    });
  });

  describe('Topic Items', () => {
    it('should return topic list items', async () => {
      const rootItems = await provider.getChildren();
      const topicsItem = rootItems.find(item => item.label === 'Top Topics');
      if (topicsItem) {
        const topics = await provider.getChildren(topicsItem);
        expect(topics.length).toBeGreaterThan(0);
      }
    });

    it('should display topic names and frequencies', async () => {
      const rootItems = await provider.getChildren();
      const topicsItem = rootItems.find(item => item.label === 'Top Topics');
      if (topicsItem) {
        const topics = await provider.getChildren(topicsItem);
        topics.forEach(topic => {
          expect(topic.label).toMatch(/\(\d+\)/); // Should have (count) format
        });
      }
    });

    it('should have view topic command', async () => {
      const rootItems = await provider.getChildren();
      const topicsItem = rootItems.find(item => item.label === 'Top Topics');
      if (topicsItem) {
        const topics = await provider.getChildren(topicsItem);
        topics.forEach(topic => {
          expect(topic.command).toBeDefined();
          expect(topic.command?.command).toBe('openrouter-crew.analytics.viewTopic');
        });
      }
    });
  });

  describe('Insight Items', () => {
    it('should return insight items', async () => {
      const rootItems = await provider.getChildren();
      const insightsItem = rootItems.find(item => item.label === 'Insights');
      if (insightsItem) {
        const insights = await provider.getChildren(insightsItem);
        expect(insights.length).toBeGreaterThan(0);
      }
    });

    it('should display insight names and values', async () => {
      const rootItems = await provider.getChildren();
      const insightsItem = rootItems.find(item => item.label === 'Insights');
      if (insightsItem) {
        const insights = await provider.getChildren(insightsItem);
        insights.forEach(insight => {
          expect(insight.label).toContain(':'); // Format: "Title: Value"
        });
      }
    });

    it('should include confidence score insight', async () => {
      const rootItems = await provider.getChildren();
      const insightsItem = rootItems.find(item => item.label === 'Insights');
      if (insightsItem) {
        const insights = await provider.getChildren(insightsItem);
        const confidenceInsight = insights.find(i => i.label?.includes('Confidence'));
        expect(confidenceInsight).toBeDefined();
      }
    });
  });

  describe('Recommendation Items', () => {
    it('should return recommendation items', async () => {
      const rootItems = await provider.getChildren();
      const recsItem = rootItems.find(item => item.label === 'Recommendations');
      if (recsItem) {
        const recs = await provider.getChildren(recsItem);
        expect(recs.length).toBeGreaterThan(0);
      }
    });

    it('should display recommendations with priority levels', async () => {
      const rootItems = await provider.getChildren();
      const recsItem = rootItems.find(item => item.label === 'Recommendations');
      if (recsItem) {
        const recs = await provider.getChildren(recsItem);
        recs.forEach(rec => {
          expect(rec.label).toMatch(/\[(High|Medium|Low)\]/);
        });
      }
    });

    it('should have apply recommendation command', async () => {
      const rootItems = await provider.getChildren();
      const recsItem = rootItems.find(item => item.label === 'Recommendations');
      if (recsItem) {
        const recs = await provider.getChildren(recsItem);
        recs.forEach(rec => {
          expect(rec.command).toBeDefined();
          expect(rec.command?.command).toBe('openrouter-crew.analytics.applyRecommendation');
        });
      }
    });
  });

  describe('Tree Item Properties', () => {
    it('should provide tree item with icon', (done) => {
      provider.getChildren().then(items => {
        items.forEach(item => {
          expect(item.iconPath).toBeDefined();
        });
        done();
      });
    });

    it('should be retrievable from provider', (done) => {
      provider.getChildren().then(items => {
        items.forEach(item => {
          const treeItem = provider.getTreeItem(item);
          expect(treeItem).toBeDefined();
          expect(treeItem.label).toBeDefined();
        });
        done();
      });
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
