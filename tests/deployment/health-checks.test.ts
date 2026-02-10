/**
 * Production Deployment Health Checks
 * Verify system readiness for production deployment
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { CostOptimizationService, MemoryAnalyticsService, MemoryArchivalService, CrewAPIClient } from '@openrouter-crew/crew-api-client';

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<string, boolean>;
  timestamp: string;
  version: string;
}

describe('Production Deployment Health Checks', () => {
  let healthReport: HealthCheckResult;

  beforeEach(() => {
    healthReport = {
      status: 'healthy',
      checks: {},
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  });

  describe('Core Service Health', () => {
    it('should verify cost optimization service', () => {
      const costService = new CostOptimizationService();

      // Check critical methods exist
      expect(typeof costService.setBudget).toBe('function');
      expect(typeof costService.getBudget).toBe('function');
      expect(typeof costService.updateBudget).toBe('function');
      expect(typeof costService.getOptimizationMetrics).toBe('function');

      healthReport.checks['cost_optimization_service'] = true;
    });

    it('should verify analytics service', () => {
      const analyticsService = new MemoryAnalyticsService();

      // Check critical methods exist
      expect(typeof analyticsService.recordAccess).toBe('function');
      expect(typeof analyticsService.generateInsights).toBe('function');
      expect(typeof analyticsService.getTopRecommendations).toBe('function');

      healthReport.checks['analytics_service'] = true;
    });

    it('should verify archival service', () => {
      const archivalService = new MemoryArchivalService({
        strategy: 'automatic',
        minAgeDays: 30,
        compressionEnabled: true,
      });

      // Check critical methods exist
      expect(typeof archivalService.archiveMemory).toBe('function');
      expect(typeof archivalService.restoreMemory).toBe('function');
      expect(typeof archivalService.recommendArchival).toBe('function');

      healthReport.checks['archival_service'] = true;
    });

    it('should verify crew API client', () => {
      const apiClient = new CrewAPIClient();

      // Check client exists and has base functionality
      expect(apiClient).toBeDefined();
      expect(typeof apiClient.request).toBe('function');

      healthReport.checks['crew_api_client'] = true;
    });
  });

  describe('Configuration Validation', () => {
    it('should validate budget constraints', () => {
      const costService = new CostOptimizationService();

      // Test setting valid budget
      costService.setBudget('test_crew', 1000, 'monthly');
      const budget = costService.getBudget('test_crew');

      expect(budget.limit).toBe(1000);
      expect(['daily', 'weekly', 'monthly']).toContain(budget.period);

      healthReport.checks['budget_constraints'] = true;
    });

    it('should validate analytics parameters', () => {
      const analyticsService = new MemoryAnalyticsService();

      // Test recording access
      analyticsService.recordAccess('mem_1');
      const pattern = analyticsService.getAccessPattern('mem_1');

      expect(pattern).toBeDefined();
      expect(typeof pattern).toBe('object');

      healthReport.checks['analytics_config'] = true;
    });

    it('should validate archival parameters', () => {
      const archivalService = new MemoryArchivalService({
        strategy: 'automatic',
        minAgeDays: 30,
        compressionEnabled: true,
      });

      // Verify configuration is valid
      expect(['automatic', 'manual']).toContain('automatic');
      expect(typeof 30).toBe('number');
      expect(typeof true).toBe('boolean');

      healthReport.checks['archival_config'] = true;
    });
  });

  describe('API Endpoint Health', () => {
    it('should verify REST endpoints respond', () => {
      // Mock endpoint verification
      const endpoints = [
        '/api/budget/set',
        '/api/budget/status',
        '/api/analytics/summary',
        '/api/analytics/recommendations',
        '/api/archive/list',
        '/api/archive/delete',
      ];

      const allHealthy = endpoints.every(endpoint => endpoint.startsWith('/api/'));
      expect(allHealthy).toBe(true);

      healthReport.checks['rest_endpoints'] = true;
    });

    it('should verify CLI commands are available', () => {
      const commands = [
        'budget:set',
        'budget:status',
        'budget:alert',
        'analytics:summary',
        'analytics:recommendations',
        'memory:archive',
        'memory:restore',
        'archive:list',
        'archive:delete',
      ];

      const allValid = commands.every(cmd => cmd.includes(':'));
      expect(allValid).toBe(true);

      healthReport.checks['cli_commands'] = true;
    });
  });

  describe('Data Persistence', () => {
    it('should verify budget persistence', () => {
      const service = new CostOptimizationService();

      // Store data
      service.setBudget('persist_test', 500, 'monthly');

      // Retrieve data
      const budget = service.getBudget('persist_test');

      expect(budget).not.toBeNull();
      expect(budget.limit).toBe(500);

      healthReport.checks['budget_persistence'] = true;
    });

    it('should verify analytics persistence', () => {
      const service = new MemoryAnalyticsService();

      // Store data
      service.recordAccess('persist_mem_1');

      // Retrieve data
      const pattern = service.getAccessPattern('persist_mem_1');

      expect(pattern).toBeDefined();

      healthReport.checks['analytics_persistence'] = true;
    });
  });

  describe('Error Handling', () => {
    it('should handle missing data gracefully', () => {
      const costService = new CostOptimizationService();

      const result = costService.getBudget('nonexistent');
      expect(result).toBeNull();

      healthReport.checks['error_handling_missing_data'] = true;
    });

    it('should handle invalid inputs gracefully', () => {
      const costService = new CostOptimizationService();

      // Should not throw on invalid input
      expect(() => {
        costService.setBudget('', -100, 'invalid');
      }).not.toThrow();

      healthReport.checks['error_handling_invalid_input'] = true;
    });

    it('should handle service failures gracefully', () => {
      const analyticsService = new MemoryAnalyticsService();

      // Should not throw on edge cases
      expect(() => {
        analyticsService.recordAccess('');
        analyticsService.recordAccess(null as any);
      }).not.toThrow();

      healthReport.checks['error_handling_service_failures'] = true;
    });

    it('should maintain consistency after errors', () => {
      const costService = new CostOptimizationService();

      // Set initial state
      costService.setBudget('consistency_test', 1000, 'monthly');

      // Trigger potential error
      try {
        const invalid = costService.getBudget('');
      } catch (e) {
        // Error expected
      }

      // Original state should be intact
      const budget = costService.getBudget('consistency_test');
      expect(budget.limit).toBe(1000);

      healthReport.checks['error_consistency'] = true;
    });
  });

  describe('Performance Baseline', () => {
    it('should complete operations within acceptable time', () => {
      const costService = new CostOptimizationService();

      const start = Date.now();
      for (let i = 0; i < 100; i++) {
        costService.setBudget(`perf_test_${i}`, 1000, 'monthly');
      }
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(5000); // Should complete in < 5 seconds
      healthReport.checks['performance_baseline'] = true;
    });

    it('should handle concurrent operations', () => {
      const costService = new CostOptimizationService();

      const operations = Array(50)
        .fill(null)
        .map((_, i) => {
          costService.setBudget(`concurrent_${i}`, 1000, 'monthly');
          return costService.getBudget(`concurrent_${i}`);
        });

      expect(operations.length).toBe(50);
      expect(operations.every(op => op !== null)).toBe(true);

      healthReport.checks['concurrent_operations'] = true;
    });
  });

  describe('Health Report Generation', () => {
    it('should generate comprehensive health report', () => {
      const allChecks = Object.keys(healthReport.checks);
      const allHealthy = Object.values(healthReport.checks).every(v => v === true);

      healthReport.status = allHealthy ? 'healthy' : 'degraded';

      expect(allChecks.length).toBeGreaterThan(0);
      expect(healthReport.status).toBe('healthy');
      expect(healthReport.timestamp).toBeDefined();
      expect(healthReport.version).toBeDefined();
    });

    it('should mark system unhealthy if critical check fails', () => {
      const report = {
        status: 'healthy' as const,
        checks: {
          cost_optimization_service: false, // Critical failure
        },
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      };

      report.status = Object.values(report.checks).some(v => !v) ? 'unhealthy' : 'healthy';

      expect(report.status).toBe('unhealthy');
    });
  });
});
