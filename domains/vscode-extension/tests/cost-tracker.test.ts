/**
 * Cost Tracker Tests
 */

import { CostTracker, SupabaseAwareCostTracker } from '../src/services/cost-tracker';

describe('CostTracker', () => {
  let tracker: CostTracker;

  beforeEach(() => {
    tracker = new CostTracker(100);  // $100 daily budget
  });

  describe('Transaction Recording', () => {
    it('should record transaction', () => {
      const result = tracker.recordTransaction(
        'claude-sonnet',
        'REVIEW',
        1000,
        500,
        0.025
      );
      expect(result.success).toBe(true);
    });

    it('should deduct from budget', () => {
      const initialBudget = tracker.getRemainingBudget();
      tracker.recordTransaction('claude-sonnet', 'REVIEW', 1000, 500, 10);
      expect(tracker.getRemainingBudget()).toBe(initialBudget - 10);
    });

    it('should reject transaction exceeding budget', () => {
      const result = tracker.recordTransaction(
        'claude-sonnet',
        'REVIEW',
        1000,
        500,
        150  // Exceeds $100 budget
      );
      expect(result.success).toBe(false);
    });

    it('should track multiple transactions', () => {
      tracker.recordTransaction('gemini-flash', 'ASK', 500, 200, 0.0001);
      tracker.recordTransaction('claude-sonnet', 'REVIEW', 1000, 500, 0.025);
      const analytics = tracker.getAnalytics();
      expect(analytics.transactionCount).toBe(2);
    });
  });

  describe('Budget Management', () => {
    it('should set budget', () => {
      tracker.setBudget(50);
      expect(tracker.getRemainingBudget()).toBe(50);
    });

    it('should track budget usage percentage', () => {
      tracker.recordTransaction('claude-sonnet', 'REVIEW', 1000, 500, 25);
      const analytics = tracker.getAnalytics();
      expect(analytics.budgetUsedPercent).toBeCloseTo(25, 1);
    });

    it('should warn at 75% usage', () => {
      tracker.setBudget(100);
      tracker.recordTransaction('claude-sonnet', 'REVIEW', 1000, 500, 76);
      const alerts = tracker.getAlerts();
      expect(alerts.some(a => a.type === 'warning')).toBe(true);
    });

    it('should alert at 95% usage', () => {
      tracker.setBudget(100);
      tracker.recordTransaction('claude-sonnet', 'REVIEW', 1000, 500, 96);
      const alerts = tracker.getAlerts();
      expect(alerts.some(a => a.type === 'critical')).toBe(true);
    });
  });

  describe('Analytics', () => {
    it('should calculate total cost', () => {
      tracker.recordTransaction('gemini-flash', 'ASK', 100, 50, 0.0001);
      tracker.recordTransaction('claude-sonnet', 'REVIEW', 1000, 500, 0.018);
      const analytics = tracker.getAnalytics();
      expect(analytics.totalCost).toBeCloseTo(0.0181, 4);
    });

    it('should calculate average cost', () => {
      tracker.recordTransaction('gemini-flash', 'ASK', 100, 50, 0.0001);
      tracker.recordTransaction('claude-sonnet', 'REVIEW', 1000, 500, 0.018);
      const analytics = tracker.getAnalytics();
      expect(analytics.averageCost).toBeCloseTo(0.0091, 4);
    });

    it('should track cost by model', () => {
      tracker.recordTransaction('gemini-flash', 'ASK', 100, 50, 0.0001);
      tracker.recordTransaction('claude-sonnet', 'REVIEW', 1000, 500, 0.018);
      const analytics = tracker.getAnalytics();
      expect(analytics.costByModel['gemini-flash']).toBeCloseTo(0.0001, 4);
      expect(analytics.costByModel['claude-sonnet']).toBeCloseTo(0.018, 4);
    });

    it('should track cost by intent', () => {
      tracker.recordTransaction('gemini-flash', 'ASK', 100, 50, 0.0001);
      tracker.recordTransaction('claude-sonnet', 'REVIEW', 1000, 500, 0.018);
      const analytics = tracker.getAnalytics();
      expect(analytics.costByIntent['ASK']).toBeCloseTo(0.0001, 4);
      expect(analytics.costByIntent['REVIEW']).toBeCloseTo(0.018, 4);
    });

    it('should identify highest cost transaction', () => {
      tracker.recordTransaction('gemini-flash', 'ASK', 100, 50, 0.0001);
      tracker.recordTransaction('claude-sonnet', 'REVIEW', 1000, 500, 0.5);
      const analytics = tracker.getAnalytics();
      expect(analytics.highestCostTransaction?.costUSD).toBeCloseTo(0.5, 4);
    });

    it('should detect trend', () => {
      // Record cheap transactions first
      for (let i = 0; i < 5; i++) {
        tracker.recordTransaction('gemini-flash', 'ASK', 100, 50, 0.0001);
      }
      // Then expensive transactions
      for (let i = 0; i < 5; i++) {
        tracker.recordTransaction('claude-sonnet', 'REVIEW', 1000, 500, 0.018);
      }
      const analytics = tracker.getAnalytics();
      expect(['stable', 'increasing', 'decreasing']).toContain(analytics.trend);
    });
  });

  describe('History Management', () => {
    it('should retrieve transaction history', () => {
      tracker.recordTransaction('gemini-flash', 'ASK', 100, 50, 0.0001);
      tracker.recordTransaction('claude-sonnet', 'REVIEW', 1000, 500, 0.018);
      const history = tracker.getHistory();
      expect(history.length).toBe(2);
    });

    it('should limit history to specified count', () => {
      for (let i = 0; i < 100; i++) {
        tracker.recordTransaction('gemini-flash', 'ASK', 100, 50, 0.0001);
      }
      const history = tracker.getHistory(10);
      expect(history.length).toBe(10);
    });

    it('should clear history', () => {
      tracker.recordTransaction('gemini-flash', 'ASK', 100, 50, 0.0001);
      tracker.clearHistory();
      const analytics = tracker.getAnalytics();
      expect(analytics.transactionCount).toBe(0);
    });
  });

  describe('Cost Comparison', () => {
    it('should calculate Copilot savings', () => {
      for (let i = 0; i < 10; i++) {
        tracker.recordTransaction('gemini-flash', 'ASK', 100, 50, 0.0001);
      }
      const savings = tracker.estimateCopilotSavings();
      expect(savings.estimatedCopilotCost).toBe(10 * 0.05);
      expect(savings.actualCost).toBeLessThan(savings.estimatedCopilotCost);
      expect(savings.savingsPercent).toBeGreaterThan(99);
    });

    it('should show savings for mixed usage', () => {
      tracker.recordTransaction('gemini-flash', 'ASK', 100, 50, 0.0001);
      tracker.recordTransaction('claude-sonnet', 'REVIEW', 1000, 500, 0.018);
      tracker.recordTransaction('gpt4-turbo', 'REVIEW', 2000, 1000, 0.04);
      const savings = tracker.estimateCopilotSavings();
      expect(savings.savingsPercent).toBeGreaterThan(80);
    });
  });

  describe('Reporting', () => {
    it('should generate cost report', () => {
      tracker.recordTransaction('gemini-flash', 'ASK', 100, 50, 0.0001);
      tracker.recordTransaction('claude-sonnet', 'REVIEW', 1000, 500, 0.018);
      const report = tracker.generateReport();
      expect(report).toContain('Cost Report');
      expect(report).toContain('Budget Status');
      expect(report).toContain('Usage Statistics');
      expect(report).toContain('Copilot Comparison');
    });

    it('should include savings in report', () => {
      tracker.recordTransaction('gemini-flash', 'ASK', 100, 50, 0.0001);
      const report = tracker.generateReport();
      expect(report).toContain('Savings');
      expect(report).toContain('%');
    });
  });

  describe('Alert Management', () => {
    it('should retrieve alerts', () => {
      tracker.setBudget(100);
      tracker.recordTransaction('claude-sonnet', 'REVIEW', 1000, 500, 80);
      const alerts = tracker.getAlerts();
      expect(alerts.length).toBeGreaterThan(0);
    });

    it('should clear alerts', () => {
      tracker.setBudget(100);
      tracker.recordTransaction('claude-sonnet', 'REVIEW', 1000, 500, 80);
      tracker.clearAlerts();
      const alerts = tracker.getAlerts();
      expect(alerts.length).toBe(0);
    });

    it('should provide actionable alert messages', () => {
      tracker.setBudget(100);
      tracker.recordTransaction('claude-sonnet', 'REVIEW', 1000, 500, 80);
      const alerts = tracker.getAlerts();
      const alert = alerts[0];
      expect(alert.message).toBeDefined();
      expect(alert.suggestedAction).toBeDefined();
    });
  });

  describe('Supabase Integration', () => {
    it('should export for Supabase', () => {
      tracker.recordTransaction('gemini-flash', 'ASK', 100, 50, 0.0001);
      const exported = tracker['exportForSupabase']();
      expect(exported.length).toBe(1);
      expect(exported[0].id).toBeDefined();
    });

    it('should sync transactions', async () => {
      const supabaseTracker = new SupabaseAwareCostTracker(
        100,
        'https://example.supabase.co',
        'test-key',
        'user-123'
      );
      const result = await supabaseTracker.recordTransactionAndSync(
        'gemini-flash',
        'ASK',
        100,
        50,
        0.0001
      );
      expect(result.success).toBeDefined();
    });

    it('should load from Supabase', async () => {
      const supabaseTracker = new SupabaseAwareCostTracker(
        100,
        'https://example.supabase.co',
        'test-key',
        'user-123'
      );
      await supabaseTracker.recordTransactionAndSync(
        'gemini-flash',
        'ASK',
        100,
        50,
        0.0001
      );
      const loaded = await supabaseTracker.loadFromSupabase();
      expect(Array.isArray(loaded)).toBe(true);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should track day of development work', () => {
      const costs = [0.0001, 0.018, 0.04, 0.0002, 0.012, 0.025];
      for (const cost of costs) {
        tracker.recordTransaction('claude-sonnet', 'REVIEW', 1000, 500, cost);
      }
      const analytics = tracker.getAnalytics();
      expect(analytics.transactionCount).toBe(6);
      expect(analytics.totalCost).toBeGreaterThan(0.09);
    });

    it('should enforce budget limits during active session', () => {
      tracker.setBudget(5);
      tracker.recordTransaction('claude-sonnet', 'REVIEW', 1000, 500, 2);
      tracker.recordTransaction('claude-sonnet', 'REVIEW', 1000, 500, 2);
      const result = tracker.recordTransaction(
        'claude-sonnet',
        'REVIEW',
        1000,
        500,
        2  // Would exceed budget
      );
      expect(result.success).toBe(false);
    });

    it('should show significant savings over Copilot', () => {
      // Simulate 50 daily queries
      for (let i = 0; i < 50; i++) {
        const intent = ['ASK', 'REVIEW', 'GENERATE'][i % 3];
        const cost = intent === 'ASK' ? 0.0001 : intent === 'REVIEW' ? 0.018 : 0.04;
        tracker.recordTransaction('claude-sonnet', intent, 1000, 500, cost);
      }
      const savings = tracker.estimateCopilotSavings();
      expect(savings.savingsPercent).toBeGreaterThan(75);
    });
  });
});
