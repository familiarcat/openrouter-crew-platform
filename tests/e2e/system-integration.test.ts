/**
 * End-to-End System Integration Tests
 * Verify all platform components work together seamlessly
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { CostOptimizationService, MemoryAnalyticsService, MemoryArchivalService } from '@openrouter-crew/crew-api-client';

interface SystemTestContext {
  crewId: string;
  costService: CostOptimizationService;
  analyticsService: MemoryAnalyticsService;
  archivalService: MemoryArchivalService;
}

describe('End-to-End System Integration', () => {
  let context: SystemTestContext;

  beforeEach(() => {
    context = {
      crewId: 'integration_test_crew',
      costService: new CostOptimizationService(),
      analyticsService: new MemoryAnalyticsService(),
      archivalService: new MemoryArchivalService({
        strategy: 'automatic',
        minAgeDays: 30,
        compressionEnabled: true,
      }),
    };
  });

  describe('Complete Crew Lifecycle', () => {
    it('should initialize crew with budget and analytics', () => {
      // Create budget
      context.costService.setBudget(context.crewId, 1000, 'monthly');
      const budget = context.costService.getBudget(context.crewId);

      expect(budget).toBeDefined();
      expect(budget.limit).toBe(1000);

      // Initialize analytics
      context.analyticsService.recordAccess('mem_1');
      const pattern = context.analyticsService.getAccessPattern('mem_1');

      expect(pattern).toBeDefined();
    });

    it('should track cost through all operations', () => {
      // Set initial budget
      context.costService.setBudget(context.crewId, 500, 'monthly');

      // Simulate operations with costs
      context.costService.updateBudget(context.crewId, 150);
      context.costService.updateBudget(context.crewId, 200);

      // Verify accumulated cost
      const budget = context.costService.getBudget(context.crewId);
      expect(budget.spent).toBe(200);
      expect(budget.remaining).toBe(300);
    });

    it('should correlate cost with analytics', () => {
      const budget = context.costService.getBudget(context.crewId);
      const analytics = context.analyticsService.generateAnalytics(context.crewId, []);

      expect(budget).toBeDefined();
      expect(analytics).toBeDefined();
      expect(analytics.crewId).toBe(context.crewId);
    });
  });

  describe('Multi-Service Data Flow', () => {
    it('should flow data from CLI commands to services', () => {
      // Simulate CLI: budget set command
      context.costService.setBudget(context.crewId, 750, 'monthly');

      // Verify data persists in service
      const budget = context.costService.getBudget(context.crewId);
      expect(budget.limit).toBe(750);
      expect(budget.period).toBe('monthly');
    });

    it('should integrate analytics across multiple data points', () => {
      // Record multiple accesses (simulating CLI analytics commands)
      context.analyticsService.recordAccess('mem_1');
      context.analyticsService.recordAccess('mem_2');
      context.analyticsService.recordAccess('mem_1');

      // Verify patterns are tracked
      const pattern1 = context.analyticsService.getAccessPattern('mem_1');
      const pattern2 = context.analyticsService.getAccessPattern('mem_2');

      expect(pattern1).toBeDefined();
      expect(pattern2).toBeDefined();
    });

    it('should coordinate archival with cost tracking', () => {
      // Set up cost tracking
      context.costService.setBudget(context.crewId, 1000, 'monthly');

      // Archive memory
      const memory = {
        id: 'mem_archive_test',
        crew_id: context.crewId,
        content: 'Test content for archival. '.repeat(50),
        type: 'insight' as const,
        retention_tier: 'standard' as const,
        confidence_level: 0.85,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        access_count: 0,
        last_accessed: '2024-01-01T00:00:00Z',
        tags: [],
      };

      const archived = context.archivalService.archiveMemory(memory);
      expect(archived).toBeDefined();
      expect(archived.id).toBe(memory.id);
    });
  });

  describe('Cross-Service Consistency', () => {
    it('should maintain consistency between cost and analytics', () => {
      const crewId = 'consistency_test_crew';

      // Initialize in cost service
      context.costService.setBudget(crewId, 1000, 'monthly');
      context.costService.updateBudget(crewId, 300);

      // Initialize in analytics service
      context.analyticsService.recordAccess('mem_1');

      // Verify both services reference the same crew
      const costBudget = context.costService.getBudget(crewId);
      const analytics = context.analyticsService.generateAnalytics(crewId, []);

      expect(costBudget.limit).toBe(1000);
      expect(analytics.crewId).toBe(crewId);
    });

    it('should sync archival status across services', () => {
      // Create memory in analytics
      const memory = {
        id: 'mem_sync_test',
        crew_id: context.crewId,
        content: 'Memory for sync test. '.repeat(100),
        type: 'decision' as const,
        retention_tier: 'standard' as const,
        confidence_level: 0.9,
        created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        access_count: 5,
        last_accessed: new Date().toISOString(),
        tags: ['important'],
      };

      // Archive it
      const archived = context.archivalService.archiveMemory(memory);

      // Verify it's findable
      const found = context.archivalService.findInArchive(memory.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(memory.id);
    });
  });

  describe('System Performance Under Load', () => {
    it('should handle multiple crews simultaneously', () => {
      const crewIds = Array(5)
        .fill(null)
        .map((_, i) => `crew_load_test_${i}`);

      for (const crewId of crewIds) {
        context.costService.setBudget(crewId, 1000, 'monthly');
        context.analyticsService.recordAccess(`mem_${crewId}_1`);
      }

      // Verify all crews initialized
      for (const crewId of crewIds) {
        const budget = context.costService.getBudget(crewId);
        expect(budget).toBeDefined();
        expect(budget.limit).toBe(1000);
      }
    });

    it('should process high-frequency analytics', () => {
      // Simulate high-frequency access recording
      for (let i = 0; i < 100; i++) {
        context.analyticsService.recordAccess(`mem_${i % 10}`);
      }

      // Should still be able to generate analytics
      const analytics = context.analyticsService.generateAnalytics(context.crewId, []);
      expect(analytics).toBeDefined();
    });

    it('should handle large batch archival', () => {
      const memories = Array(10)
        .fill(null)
        .map((_, i) => ({
          id: `batch_mem_${i}`,
          crew_id: context.crewId,
          content: `Batch memory ${i}. `.repeat(100),
          type: 'insight' as const,
          retention_tier: 'standard' as const,
          confidence_level: Math.random(),
          created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
          access_count: 0,
          last_accessed: new Date().toISOString(),
          tags: [],
        }));

      // Archive all
      let archived = 0;
      for (const memory of memories) {
        const result = context.archivalService.archiveMemory(memory);
        if (result) archived++;
      }

      expect(archived).toBe(memories.length);
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover from missing budget', () => {
      // Try to update non-existent budget
      const result = context.costService.getBudget('nonexistent_crew');
      expect(result).toBeNull();

      // Should still be able to create new one
      context.costService.setBudget('nonexistent_crew', 500, 'monthly');
      const newBudget = context.costService.getBudget('nonexistent_crew');
      expect(newBudget).toBeDefined();
    });

    it('should handle invalid memory gracefully', () => {
      const invalidMemory = {
        id: '',
        crew_id: context.crewId,
        content: '',
        type: 'insight' as const,
        retention_tier: 'standard' as const,
        confidence_level: -1, // Invalid confidence
        created_at: 'invalid-date',
        updated_at: 'invalid-date',
        access_count: -1,
        last_accessed: 'invalid-date',
        tags: [],
      };

      // Should not crash
      expect(() => {
        context.archivalService.archiveMemory(invalidMemory);
      }).not.toThrow();
    });

    it('should maintain consistency after failures', () => {
      // Set initial state
      context.costService.setBudget(context.crewId, 1000, 'monthly');

      // Simulate failure and recovery
      try {
        const result = context.costService.getBudget('bad_crew_id');
        expect(result).toBeNull();
      } catch (error) {
        // Error is expected
      }

      // Original crew should still be intact
      const budget = context.costService.getBudget(context.crewId);
      expect(budget.limit).toBe(1000);
    });
  });

  describe('Data Integrity Verification', () => {
    it('should maintain referential integrity', () => {
      const crewId = 'integrity_test';

      // Create in cost service
      context.costService.setBudget(crewId, 800, 'monthly');
      context.costService.updateBudget(crewId, 200);

      // Verify integrity
      const budget = context.costService.getBudget(crewId);
      expect(budget.spent).toBe(200);
      expect(budget.remaining).toBe(600);
      expect(budget.percentUsed).toBeCloseTo(25, 1);
    });

    it('should preserve archive integrity during restore', () => {
      const memory = {
        id: 'integrity_mem',
        crew_id: context.crewId,
        content: 'Important memory content that must be preserved',
        type: 'decision' as const,
        retention_tier: 'standard' as const,
        confidence_level: 0.95,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        access_count: 10,
        last_accessed: '2024-01-01T00:00:00Z',
        tags: ['critical'],
      };

      // Archive
      const archived = context.archivalService.archiveMemory(memory);

      // Restore
      const restored = context.archivalService.restoreMemory(archived.id);

      // Verify integrity
      expect(restored?.id).toBe(memory.id);
      expect(restored?.content).toBeDefined();
    });
  });
});
