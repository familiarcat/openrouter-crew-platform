/**
 * Performance and Load Tests
 * Verify system can handle production loads
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { CostOptimizationService, MemoryAnalyticsService, MemoryArchivalService } from '@openrouter-crew/crew-api-client';

interface PerformanceMetrics {
  operation: string;
  count: number;
  duration: number;
  avgLatency: number;
  throughput: number; // ops/sec
  passed: boolean;
}

describe('Performance and Load Tests', () => {
  const metrics: PerformanceMetrics[] = [];

  const createMetric = (operation: string, count: number, duration: number): PerformanceMetrics => ({
    operation,
    count,
    duration,
    avgLatency: duration / count,
    throughput: (count / duration) * 1000,
    passed: duration < count * 10, // 10ms per operation max
  });

  describe('Cost Service Load Tests', () => {
    it('should handle 100 budget operations', () => {
      const service = new CostOptimizationService();

      const start = Date.now();

      for (let i = 0; i < 100; i++) {
        service.setBudget(`crew_${i}`, 1000 + i, 'monthly');
        service.updateBudget(`crew_${i}`, 100);
      }

      const duration = Date.now() - start;
      const metric = createMetric('cost_budget_ops', 100, duration);

      expect(metric.passed).toBe(true);
      expect(metric.throughput).toBeGreaterThan(5); // At least 5 ops/sec
      expect(metric.avgLatency).toBeLessThan(100); // Average < 100ms

      metrics.push(metric);
    });

    it('should retrieve 1000 budgets efficiently', () => {
      const service = new CostOptimizationService();

      // Setup
      for (let i = 0; i < 100; i++) {
        service.setBudget(`retrieve_crew_${i}`, 1000, 'monthly');
      }

      // Test retrieval
      const start = Date.now();

      for (let i = 0; i < 1000; i++) {
        service.getBudget(`retrieve_crew_${i % 100}`);
      }

      const duration = Date.now() - start;
      const metric = createMetric('cost_budget_retrieval', 1000, duration);

      expect(metric.passed).toBe(true);
      expect(metric.throughput).toBeGreaterThan(10); // At least 10 ops/sec
      expect(metric.avgLatency).toBeLessThan(50); // Average < 50ms

      metrics.push(metric);
    });

    it('should calculate metrics under load', () => {
      const service = new CostOptimizationService();

      const start = Date.now();

      for (let i = 0; i < 50; i++) {
        service.getOptimizationMetrics(`crew_${i}`);
      }

      const duration = Date.now() - start;
      const metric = createMetric('cost_metrics_calculation', 50, duration);

      expect(metric.passed).toBe(true);
      expect(metric.throughput).toBeGreaterThan(2); // At least 2 ops/sec
      expect(metric.avgLatency).toBeLessThan(200); // Average < 200ms

      metrics.push(metric);
    });
  });

  describe('Analytics Service Load Tests', () => {
    it('should record 10000 memory accesses', () => {
      const service = new MemoryAnalyticsService();

      const start = Date.now();

      for (let i = 0; i < 10000; i++) {
        service.recordAccess(`mem_${i % 100}`);
      }

      const duration = Date.now() - start;
      const metric = createMetric('analytics_access_recording', 10000, duration);

      expect(metric.passed).toBe(true);
      expect(metric.throughput).toBeGreaterThan(50); // At least 50 ops/sec
      expect(metric.avgLatency).toBeLessThan(10); // Average < 10ms

      metrics.push(metric);
    });

    it('should generate insights for 100 memory sets', () => {
      const service = new MemoryAnalyticsService();

      const start = Date.now();

      for (let i = 0; i < 100; i++) {
        service.generateInsights([]);
      }

      const duration = Date.now() - start;
      const metric = createMetric('analytics_insights_generation', 100, duration);

      expect(metric.passed).toBe(true);
      expect(metric.throughput).toBeGreaterThan(5); // At least 5 ops/sec

      metrics.push(metric);
    });

    it('should handle 100 concurrent analytics queries', () => {
      const service = new MemoryAnalyticsService();

      const start = Date.now();

      const results = Array(100)
        .fill(null)
        .map((_, i) => {
          return service.generateAnalytics(`crew_${i}`, []);
        });

      const duration = Date.now() - start;
      const metric = createMetric('analytics_concurrent_queries', 100, duration);

      expect(results.length).toBe(100);
      expect(metric.throughput).toBeGreaterThan(5); // At least 5 ops/sec

      metrics.push(metric);
    });
  });

  describe('Archival Service Load Tests', () => {
    it('should archive 50 memories', () => {
      const service = new MemoryArchivalService({
        strategy: 'automatic',
        minAgeDays: 30,
        compressionEnabled: true,
      });

      const start = Date.now();

      for (let i = 0; i < 50; i++) {
        const memory = {
          id: `arch_mem_${i}`,
          crew_id: 'crew_1',
          content: `Memory content ${i}. `.repeat(100),
          type: 'insight' as const,
          retention_tier: 'standard' as const,
          confidence_level: Math.random(),
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          access_count: 0,
          last_accessed: '2024-01-01T00:00:00Z',
          tags: [],
        };

        service.archiveMemory(memory);
      }

      const duration = Date.now() - start;
      const metric = createMetric('archival_memory_archiving', 50, duration);

      expect(metric.passed).toBe(true);
      expect(metric.throughput).toBeGreaterThan(2); // At least 2 ops/sec

      metrics.push(metric);
    });

    it('should recommend archival for 100 memory sets', () => {
      const service = new MemoryArchivalService({
        strategy: 'automatic',
        minAgeDays: 30,
        compressionEnabled: true,
      });

      const start = Date.now();

      for (let i = 0; i < 100; i++) {
        service.recommendArchival([]);
      }

      const duration = Date.now() - start;
      const metric = createMetric('archival_recommendations', 100, duration);

      expect(metric.passed).toBe(true);
      expect(metric.throughput).toBeGreaterThan(10); // At least 10 ops/sec

      metrics.push(metric);
    });
  });

  describe('Combined Load Scenarios', () => {
    it('should handle mixed workload (cost + analytics)', () => {
      const costService = new CostOptimizationService();
      const analyticsService = new MemoryAnalyticsService();

      const start = Date.now();

      for (let i = 0; i < 100; i++) {
        // Cost operations
        costService.setBudget(`mixed_crew_${i}`, 1000, 'monthly');
        costService.updateBudget(`mixed_crew_${i}`, 100);

        // Analytics operations
        analyticsService.recordAccess(`mixed_mem_${i}`);
        analyticsService.getAccessPattern(`mixed_mem_${i}`);
      }

      const duration = Date.now() - start;
      const metric = createMetric('mixed_cost_analytics', 400, duration); // 4 ops * 100

      expect(metric.passed).toBe(true);
      expect(metric.throughput).toBeGreaterThan(20); // At least 20 ops/sec

      metrics.push(metric);
    });

    it('should handle sustained load over time', () => {
      const costService = new CostOptimizationService();
      const analyticsService = new MemoryAnalyticsService();

      const durationLimit = 5000; // 5 seconds
      const start = Date.now();
      let operationCount = 0;

      while (Date.now() - start < durationLimit) {
        costService.setBudget(`sustained_${operationCount}`, 1000, 'monthly');
        analyticsService.recordAccess(`sustained_${operationCount}`);
        operationCount++;
      }

      const duration = Date.now() - start;
      const metric = createMetric('sustained_load', operationCount, duration);

      expect(metric.throughput).toBeGreaterThan(50); // Should do 50+ ops/sec

      metrics.push(metric);
    });
  });

  describe('Performance Report', () => {
    it('should generate performance summary', () => {
      expect(metrics.length).toBeGreaterThan(0);

      const allPassed = metrics.every(m => m.passed);
      expect(allPassed).toBe(true);

      const avgThroughput = metrics.reduce((sum, m) => sum + m.throughput, 0) / metrics.length;
      expect(avgThroughput).toBeGreaterThan(10);
    });

    it('should identify bottlenecks', () => {
      const slowest = metrics.reduce((prev, current) =>
        current.avgLatency > prev.avgLatency ? current : prev,
      );

      expect(slowest.avgLatency).toBeLessThan(200); // Even slowest should be < 200ms
    });

    it('should verify scalability', () => {
      const archiveOps = metrics.find(m => m.operation === 'archival_memory_archiving');
      const analyticsOps = metrics.find(m => m.operation === 'analytics_access_recording');

      if (archiveOps && analyticsOps) {
        // Analytics should scale better (more ops/sec)
        expect(analyticsOps.throughput).toBeGreaterThan(archiveOps.throughput);
      }
    });
  });
});
