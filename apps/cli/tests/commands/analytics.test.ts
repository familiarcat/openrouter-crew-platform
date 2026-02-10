/**
 * CLI Analytics Commands Tests
 * Verify analytics summary and recommendations
 */

import { expect, test } from '@oclif/test';
import { MemoryAnalyticsService, Memory } from '@openrouter-crew/crew-api-client';

describe('analytics commands', () => {
  let analyticsService: MemoryAnalyticsService;

  beforeEach(() => {
    analyticsService = new MemoryAnalyticsService();
  });

  describe('analytics summary', () => {
    test
      .stdout()
      .command(['analytics', 'summary', '--crew', 'crew_1'])
      .it('displays no memories message when empty', (ctx) => {
        expect(ctx.stdout).to.contain('No memories found');
      });

    test
      .stdout()
      .command(['analytics', 'summary', '--crew', 'crew_1', '--format', 'json'])
      .it('outputs JSON format', (ctx) => {
        try {
          JSON.parse(ctx.stdout);
          expect(true).to.be.true;
        } catch {
          expect.fail('Invalid JSON output');
        }
      });

    test
      .stdout()
      .command(['analytics', 'summary', '--crew', 'crew_1', '--format', 'detailed'])
      .it('displays detailed format', (ctx) => {
        expect(ctx.stdout).to.contain('ANALYTICS SUMMARY');
      });
  });

  describe('analytics with data', () => {
    beforeEach(() => {
      // Setup: Record some access patterns
      analyticsService.recordAccess('mem_1');
      analyticsService.recordAccess('mem_2');
    });

    test
      .stdout()
      .it('includes access patterns in detailed view', () => {
        const patterns = [
          analyticsService.getAccessPattern('mem_1'),
          analyticsService.getAccessPattern('mem_2'),
        ].filter((p) => p !== undefined);

        expect(patterns.length).to.be.greaterThan(0);
      });

    test
      .stdout()
      .it('generates insights correctly', () => {
        const memories: Memory[] = [
          {
            id: 'mem_1',
            crew_id: 'crew_1',
            content: 'Test memory',
            type: 'insight',
            retention_tier: 'standard',
            confidence_level: 0.7,
            created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
            access_count: 0,
            last_accessed: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
            tags: [],
          },
        ];

        const insights = analyticsService.generateInsights(memories);
        expect(insights.length).to.be.greaterThan(0);
      });
  });

  describe('analytics integration', () => {
    test
      .stdout()
      .it('processes complete analytics workflow', () => {
        const memories: Memory[] = Array(3)
          .fill(null)
          .map((_, i) => ({
            id: `mem_${i}`,
            crew_id: 'crew_1',
            content: 'Performance optimization topic. '.repeat(10),
            type: 'insight',
            retention_tier: 'standard',
            confidence_level: 0.8,
            created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
            access_count: 0,
            last_accessed: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
            tags: [],
          }));

        const analytics = analyticsService.generateAnalytics('crew_1', memories);

        expect(analytics.totalMemories).to.equal(3);
        expect(analytics.topTopics.length).to.be.greaterThan(0);
      });
  });
});
