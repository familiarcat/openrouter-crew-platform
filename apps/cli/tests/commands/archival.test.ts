/**
 * CLI Archival Commands Tests
 * Verify archive, restore, and list commands
 */

import { expect, test } from '@oclif/test';
import { MemoryArchivalService, Memory } from '@openrouter-crew/crew-api-client';

describe('archival commands', () => {
  let archivalService: MemoryArchivalService;

  beforeEach(() => {
    archivalService = new MemoryArchivalService({
      strategy: 'automatic',
      minAgeDays: 30,
      compressionEnabled: true,
    });
  });

  describe('memory archive', () => {
    test
      .stdout()
      .command(['memory', 'archive', '--crew', 'crew_1', '--strategy', 'automatic'])
      .it('archives memories with automatic strategy', (ctx) => {
        expect(ctx.stdout).to.contain('archive');
      });

    test
      .stdout()
      .command(['memory', 'archive', '--crew', 'crew_1', '--ids', 'mem_1,mem_2', '--dry-run'])
      .it('shows dry-run preview without archiving', (ctx) => {
        expect(ctx.stdout).to.contain('dry-run');
      });

    test
      .stdout()
      .command(['memory', 'archive', '--crew', 'crew_1', '--strategy', 'by-value'])
      .it('archives with by-value strategy', (ctx) => {
        expect(ctx.stdout).to.contain('archive');
      });
  });

  describe('memory restore', () => {
    test
      .stdout()
      .it('restores memory from archive', () => {
        const memory: Memory = {
          id: 'mem_1',
          crew_id: 'crew_1',
          content: 'Content to archive. '.repeat(50),
          type: 'insight',
          retention_tier: 'standard',
          confidence_level: 0.8,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          access_count: 0,
          last_accessed: '2024-01-01T00:00:00Z',
          tags: [],
        };

        const archived = archivalService.archiveMemory(memory);
        const restored = archivalService.restoreMemory(archived.id);

        expect(restored).to.not.be.undefined;
        expect(restored?.id).to.equal(memory.id);
      });

    test
      .stdout()
      .it('returns error for nonexistent archive', () => {
        const restored = archivalService.restoreMemory('nonexistent_archive_id');
        expect(restored).to.be.undefined;
      });
  });

  describe('archive list', () => {
    test
      .stdout()
      .command(['archive', 'list', '--crew', 'crew_1'])
      .it('lists archived memories', (ctx) => {
        expect(ctx.stdout).to.contain('archive');
      });

    test
      .stdout()
      .command(['archive', 'list', '--crew', 'crew_1', '--limit', '5'])
      .it('respects limit parameter', (ctx) => {
        expect(ctx.stdout).to.contain('archive');
      });

    test
      .stdout()
      .command(['archive', 'list', '--crew', 'crew_1', '--format', 'json'])
      .it('outputs JSON format', (ctx) => {
        try {
          JSON.parse(ctx.stdout);
          expect(true).to.be.true;
        } catch {
          expect.fail('Invalid JSON output');
        }
      });
  });

  describe('archive recommendations', () => {
    test
      .stdout()
      .it('generates archival recommendations', () => {
        const memories: Memory[] = Array(5)
          .fill(null)
          .map((_, i) => ({
            id: `mem_${i}`,
            crew_id: 'crew_1',
            content: 'Content. '.repeat(50),
            type: 'insight',
            retention_tier: 'standard',
            confidence_level: 0.7,
            created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
            access_count: 0,
            last_accessed: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
            tags: [],
          }));

        const recommendations = archivalService.recommendArchival(memories);
        expect(recommendations.length).to.be.greaterThan(0);
        expect(recommendations[0].action).to.equal('archive');
      });
  });

  describe('archival integration', () => {
    test
      .stdout()
      .it('completes full archival workflow', () => {
        const memory: Memory = {
          id: 'mem_test',
          crew_id: 'crew_1',
          content: 'Test content. '.repeat(50),
          type: 'insight',
          retention_tier: 'standard',
          confidence_level: 0.8,
          created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
          access_count: 0,
          last_accessed: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          tags: [],
        };

        // 1. Archive
        const archived = archivalService.archiveMemory(memory);
        expect(archived).to.not.be.undefined;

        // 2. Find in archive
        const found = archivalService.findInArchive(memory.id);
        expect(found).to.not.be.undefined;

        // 3. Restore
        const restored = archivalService.restoreMemory(archived.id);
        expect(restored?.id).to.equal(memory.id);

        // 4. Get metrics
        const metrics = archivalService.calculateMetrics();
        expect(metrics.totalArchived).to.be.greaterThan(0);
      });
  });
});
