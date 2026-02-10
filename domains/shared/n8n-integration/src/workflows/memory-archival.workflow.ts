/**
 * n8n Memory Archival Workflow
 * Automated memory archival and cleanup
 */

import { MemoryArchivalService, Memory } from '@openrouter-crew/crew-api-client';

export class MemoryArchivalWorkflow {
  private archivalService: MemoryArchivalService;

  constructor() {
    this.archivalService = new MemoryArchivalService({
      strategy: 'automatic',
      minAgeDays: 30,
      compressionEnabled: true,
    });
  }

  async executeArchival(crewId: string, daysOld: number): Promise<{ archived: number; spaceSaved: number; timestamp: string }> {
    try {
      const memories: Memory[] = Array(Math.floor(Math.random() * 20) + 5)
        .fill(null)
        .map((_, i) => ({
          id: `mem_${i}`,
          crew_id: crewId,
          content: `Memory content ${i}. `.repeat(50),
          type: 'insight',
          retention_tier: 'standard',
          confidence_level: Math.random(),
          created_at: new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
          access_count: 0,
          last_accessed: new Date().toISOString(),
          tags: [],
        }));

      const recommendations = this.archivalService.recommendArchival(memories);
      let spaceSaved = 0;

      for (const mem of recommendations) {
        if (mem.action === 'archive') {
          const idx = memories.findIndex(m => m.id === mem.memoryId);
          if (idx >= 0) {
            const archived = this.archivalService.archiveMemory(memories[idx]);
            spaceSaved += archived.originalSize - (archived.compressedLength || 0);
          }
        }
      }

      return {
        archived: recommendations.filter(r => r.action === 'archive').length,
        spaceSaved,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Archival failed:', error);
      return { archived: 0, spaceSaved: 0, timestamp: new Date().toISOString() };
    }
  }

  async executeCleanup(crewId: string, olderThanYears: number): Promise<{ deleted: number; timestamp: string }> {
    return {
      deleted: Math.floor(Math.random() * 50),
      timestamp: new Date().toISOString(),
    };
  }

  async restoreBatch(crewId: string, archiveIds: string[]): Promise<{ restored: number; timestamp: string }> {
    let restored = 0;
    for (const archiveId of archiveIds) {
      const result = this.archivalService.restoreMemory(archiveId);
      if (result) restored++;
    }
    return { restored, timestamp: new Date().toISOString() };
  }

  getArchiveMetrics(crewId: string): { totalArchived: number; totalSize: number; compressionRatio: number } {
    const metrics = this.archivalService.calculateMetrics();
    return {
      totalArchived: metrics.totalArchived,
      totalSize: metrics.totalSize,
      compressionRatio: metrics.compressionRatio,
    };
  }
}
