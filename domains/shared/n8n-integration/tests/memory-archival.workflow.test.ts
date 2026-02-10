/**
 * Memory Archival Workflow Tests
 * Verify n8n archival automation workflows
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { MemoryArchivalWorkflow } from '../src/workflows/memory-archival.workflow';

describe('MemoryArchivalWorkflow', () => {
  let workflow: MemoryArchivalWorkflow;

  beforeEach(() => {
    workflow = new MemoryArchivalWorkflow();
  });

  describe('Archival Execution', () => {
    it('should execute archival workflow', async () => {
      const result = await workflow.executeArchival('crew_1', 90);
      expect(result).toBeDefined();
      expect(result.archived).toBeGreaterThanOrEqual(0);
      expect(result.spaceSaved).toBeGreaterThanOrEqual(0);
      expect(result.timestamp).toBeDefined();
    });

    it('should archive old memories', async () => {
      const result = await workflow.executeArchival('crew_1', 180);
      expect(typeof result.archived).toBe('number');
    });

    it('should calculate space savings', async () => {
      const result = await workflow.executeArchival('crew_1', 90);
      expect(typeof result.spaceSaved).toBe('number');
    });

    it('should include timestamp', async () => {
      const result = await workflow.executeArchival('crew_1', 90);
      expect(new Date(result.timestamp)).toBeInstanceOf(Date);
    });

    it('should handle archival errors gracefully', async () => {
      const result = await workflow.executeArchival('invalid_crew', 90);
      expect(result.archived).toBe(0);
      expect(result.spaceSaved).toBe(0);
    });
  });

  describe('Cleanup Execution', () => {
    it('should execute cleanup workflow', async () => {
      const result = await workflow.executeCleanup('crew_1', 2);
      expect(result).toBeDefined();
      expect(result.deleted).toBeGreaterThanOrEqual(0);
    });

    it('should delete old archives', async () => {
      const result = await workflow.executeCleanup('crew_1', 3);
      expect(typeof result.deleted).toBe('number');
    });
  });

  describe('Batch Restoration', () => {
    it('should restore batch of archives', async () => {
      const archiveIds = ['arch_1', 'arch_2', 'arch_3'];
      const result = await workflow.restoreBatch('crew_1', archiveIds);
      expect(result.restored).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty restoration', async () => {
      const result = await workflow.restoreBatch('crew_1', []);
      expect(result.restored).toBe(0);
    });
  });

  describe('Archive Metrics', () => {
    it('should retrieve archive metrics', () => {
      const metrics = workflow.getArchiveMetrics('crew_1');
      expect(metrics).toBeDefined();
      expect(metrics.totalArchived).toBeGreaterThanOrEqual(0);
    });

    it('should show compression ratio', () => {
      const metrics = workflow.getArchiveMetrics('crew_1');
      expect(metrics.compressionRatio).toBeGreaterThanOrEqual(0);
      expect(metrics.compressionRatio).toBeLessThanOrEqual(1);
    });

    it('should show total size', () => {
      const metrics = workflow.getArchiveMetrics('crew_1');
      expect(metrics.totalSize).toBeGreaterThanOrEqual(0);
    });
  });
});
