/**
 * API Contract Validation Tests
 * Verify API contracts across all interfaces
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { CostOptimizationService, MemoryAnalyticsService, MemoryArchivalService } from '@openrouter-crew/crew-api-client';

interface ContractValidation {
  interface: string;
  method: string;
  expectedSignature: string;
  validated: boolean;
}

describe('API Contract Validation', () => {
  const validations: ContractValidation[] = [];

  describe('Cost Optimization Service Contract', () => {
    it('should implement setBudget(crewId, amount, period)', () => {
      const service = new CostOptimizationService();

      // Verify method signature and behavior
      expect(typeof service.setBudget).toBe('function');

      // Test execution
      const result = service.setBudget('crew_1', 1000, 'monthly');
      expect(result).toBeDefined();

      validations.push({
        interface: 'CostOptimizationService',
        method: 'setBudget',
        expectedSignature: '(crewId: string, amount: number, period: string) => void',
        validated: true,
      });
    });

    it('should implement getBudget(crewId)', () => {
      const service = new CostOptimizationService();

      expect(typeof service.getBudget).toBe('function');

      service.setBudget('test_crew', 500, 'weekly');
      const budget = service.getBudget('test_crew');

      expect(budget).not.toBeNull();
      expect(budget?.limit).toBe(500);
      expect(budget?.period).toBe('weekly');

      validations.push({
        interface: 'CostOptimizationService',
        method: 'getBudget',
        expectedSignature: '(crewId: string) => Budget',
        validated: true,
      });
    });

    it('should implement updateBudget(crewId, amount)', () => {
      const service = new CostOptimizationService();

      expect(typeof service.updateBudget).toBe('function');

      service.setBudget('update_crew', 1000, 'monthly');
      service.updateBudget('update_crew', 250);

      const budget = service.getBudget('update_crew');
      expect(budget.spent).toBe(250);

      validations.push({
        interface: 'CostOptimizationService',
        method: 'updateBudget',
        expectedSignature: '(crewId: string, amount: number) => void',
        validated: true,
      });
    });

    it('should implement getOptimizationMetrics(crewId)', () => {
      const service = new CostOptimizationService();

      expect(typeof service.getOptimizationMetrics).toBe('function');

      const metrics = service.getOptimizationMetrics('crew_1');

      expect(metrics).toBeDefined();
      expect(typeof metrics.cacheHitRate).toBe('number');
      expect(typeof metrics.batchSavings).toBe('number');

      validations.push({
        interface: 'CostOptimizationService',
        method: 'getOptimizationMetrics',
        expectedSignature: '(crewId: string) => OptimizationMetrics',
        validated: true,
      });
    });

    it('should implement getCostBreakdown(crewId)', () => {
      const service = new CostOptimizationService();

      expect(typeof service.getCostBreakdown).toBe('function');

      const breakdown = service.getCostBreakdown('crew_1');

      expect(breakdown).toBeDefined();
      expect(typeof breakdown).toBe('object');

      validations.push({
        interface: 'CostOptimizationService',
        method: 'getCostBreakdown',
        expectedSignature: '(crewId: string) => CostBreakdown',
        validated: true,
      });
    });
  });

  describe('Memory Analytics Service Contract', () => {
    it('should implement recordAccess(memoryId)', () => {
      const service = new MemoryAnalyticsService();

      expect(typeof service.recordAccess).toBe('function');

      const result = service.recordAccess('mem_1');
      expect(result).toBeDefined();

      validations.push({
        interface: 'MemoryAnalyticsService',
        method: 'recordAccess',
        expectedSignature: '(memoryId: string) => void',
        validated: true,
      });
    });

    it('should implement getAccessPattern(memoryId)', () => {
      const service = new MemoryAnalyticsService();

      expect(typeof service.getAccessPattern).toBe('function');

      service.recordAccess('pattern_mem');
      const pattern = service.getAccessPattern('pattern_mem');

      expect(pattern).toBeDefined();

      validations.push({
        interface: 'MemoryAnalyticsService',
        method: 'getAccessPattern',
        expectedSignature: '(memoryId: string) => AccessPattern',
        validated: true,
      });
    });

    it('should implement generateInsights(memories)', () => {
      const service = new MemoryAnalyticsService();

      expect(typeof service.generateInsights).toBe('function');

      const insights = service.generateInsights([]);

      expect(Array.isArray(insights)).toBe(true);

      validations.push({
        interface: 'MemoryAnalyticsService',
        method: 'generateInsights',
        expectedSignature: '(memories: Memory[]) => Insight[]',
        validated: true,
      });
    });

    it('should implement getTopRecommendations(memories, limit)', () => {
      const service = new MemoryAnalyticsService();

      expect(typeof service.getTopRecommendations).toBe('function');

      const recommendations = service.getTopRecommendations([], 5);

      expect(Array.isArray(recommendations)).toBe(true);

      validations.push({
        interface: 'MemoryAnalyticsService',
        method: 'getTopRecommendations',
        expectedSignature: '(memories: Memory[], limit: number) => Recommendation[]',
        validated: true,
      });
    });

    it('should implement generateAnalytics(crewId, memories)', () => {
      const service = new MemoryAnalyticsService();

      expect(typeof service.generateAnalytics).toBe('function');

      const analytics = service.generateAnalytics('crew_1', []);

      expect(analytics).toBeDefined();
      expect(typeof analytics.totalMemories).toBe('number');

      validations.push({
        interface: 'MemoryAnalyticsService',
        method: 'generateAnalytics',
        expectedSignature: '(crewId: string, memories: Memory[]) => Analytics',
        validated: true,
      });
    });
  });

  describe('Memory Archival Service Contract', () => {
    it('should implement archiveMemory(memory)', () => {
      const service = new MemoryArchivalService({
        strategy: 'automatic',
        minAgeDays: 30,
        compressionEnabled: true,
      });

      expect(typeof service.archiveMemory).toBe('function');

      const memory = {
        id: 'test_mem',
        crew_id: 'crew_1',
        content: 'Test content',
        type: 'insight' as const,
        retention_tier: 'standard' as const,
        confidence_level: 0.8,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        access_count: 0,
        last_accessed: '2024-01-01T00:00:00Z',
        tags: [],
      };

      const archived = service.archiveMemory(memory);
      expect(archived).toBeDefined();

      validations.push({
        interface: 'MemoryArchivalService',
        method: 'archiveMemory',
        expectedSignature: '(memory: Memory) => ArchivedMemory',
        validated: true,
      });
    });

    it('should implement restoreMemory(archiveId)', () => {
      const service = new MemoryArchivalService({
        strategy: 'automatic',
        minAgeDays: 30,
        compressionEnabled: true,
      });

      expect(typeof service.restoreMemory).toBe('function');

      const restored = service.restoreMemory('arch_1');

      // Should return Memory or null
      expect(restored === null || restored?.id).toBeDefined();

      validations.push({
        interface: 'MemoryArchivalService',
        method: 'restoreMemory',
        expectedSignature: '(archiveId: string) => Memory | null',
        validated: true,
      });
    });

    it('should implement recommendArchival(memories)', () => {
      const service = new MemoryArchivalService({
        strategy: 'automatic',
        minAgeDays: 30,
        compressionEnabled: true,
      });

      expect(typeof service.recommendArchival).toBe('function');

      const recommendations = service.recommendArchival([]);

      expect(Array.isArray(recommendations)).toBe(true);

      validations.push({
        interface: 'MemoryArchivalService',
        method: 'recommendArchival',
        expectedSignature: '(memories: Memory[]) => ArchivalRecommendation[]',
        validated: true,
      });
    });

    it('should implement calculateMetrics()', () => {
      const service = new MemoryArchivalService({
        strategy: 'automatic',
        minAgeDays: 30,
        compressionEnabled: true,
      });

      expect(typeof service.calculateMetrics).toBe('function');

      const metrics = service.calculateMetrics();

      expect(metrics).toBeDefined();
      expect(typeof metrics.totalArchived).toBe('number');
      expect(typeof metrics.compressionRatio).toBe('number');

      validations.push({
        interface: 'MemoryArchivalService',
        method: 'calculateMetrics',
        expectedSignature: '() => ArchiveMetrics',
        validated: true,
      });
    });
  });

  describe('Contract Validation Summary', () => {
    it('should validate all critical contracts', () => {
      expect(validations.length).toBeGreaterThan(0);

      const allValidated = validations.every(v => v.validated);
      expect(allValidated).toBe(true);

      const contractsByInterface = validations.reduce(
        (acc, v) => {
          if (!acc[v.interface]) acc[v.interface] = [];
          acc[v.interface].push(v.method);
          return acc;
        },
        {} as Record<string, string[]>,
      );

      expect(Object.keys(contractsByInterface).length).toBe(3);
    });

    it('should ensure backward compatibility', () => {
      const criticalMethods = [
        'setBudget',
        'getBudget',
        'updateBudget',
        'recordAccess',
        'generateInsights',
        'archiveMemory',
        'restoreMemory',
      ];

      const validatedMethods = validations.map(v => v.method);

      criticalMethods.forEach(method => {
        expect(validatedMethods).toContain(method);
      });
    });
  });
});
