/**
 * Memory Archival Service
 * Manages memory archival, strategies, and retrieval from archive
 */

import { Memory, RetentionTier } from '../types';
import { MemoryCompressionService } from './memory-compression';

export interface ArchivalConfig {
  strategy?: 'automatic' | 'by-value' | 'manual';
  maxActiveMemories?: number;
  minAgeDays?: number;
  compressionEnabled?: boolean;
  encryptionEnabled?: boolean;
}

export interface ArchivedMemory {
  id: string;
  originalId: string;
  archivedAt: Date;
  originalCreatedAt: string;
  originalUpdatedAt: string;
  content: string;
  compressed: boolean;
  originalLength: number;
  compressedLength: number;
  metadata: {
    retentionTier: RetentionTier;
    type: string;
    tags: string[];
    confidence: number;
  };
}

export interface ArchivalMetrics {
  totalArchived: number;
  totalActive: number;
  archiveSize: number;
  compressionRatio: number;
  estimatedSavings: number;
  oldestArchived: Date | null;
  newestArchived: Date | null;
}

export interface ArchivalAction {
  memoryId: string;
  action: 'archive' | 'restore' | 'skip';
  reason: string;
  estimatedSavings?: number;
}

export class MemoryArchivalService {
  private archive: Map<string, ArchivedMemory> = new Map();
  private compressionService: MemoryCompressionService;
  private config: Required<ArchivalConfig>;

  constructor(config: ArchivalConfig = {}) {
    this.config = {
      strategy: config.strategy || 'automatic',
      maxActiveMemories: config.maxActiveMemories || 1000,
      minAgeDays: config.minAgeDays || 90,
      compressionEnabled: config.compressionEnabled !== false,
      encryptionEnabled: config.encryptionEnabled === true,
    };

    this.compressionService = new MemoryCompressionService();
  }

  /**
   * Determine if a memory should be archived
   */
  shouldArchive(memory: Memory): boolean {
    // Don't archive eternal or recent memories
    if (memory.retention_tier === 'eternal') {
      return false;
    }

    // Check age threshold
    const createdDate = new Date(memory.created_at);
    const ageDays = (new Date().getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);

    if (ageDays < this.config.minAgeDays) {
      return false;
    }

    // Check access recency
    const lastAccessDate = new Date(memory.last_accessed);
    const daysSinceAccess = (new Date().getTime() - lastAccessDate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceAccess < 30) {
      return false; // Recently accessed
    }

    // Check confidence level
    if (memory.confidence_level < 0.3) {
      return true; // Low confidence should be archived
    }

    // Check based on retention tier
    if (memory.retention_tier === 'session' || memory.retention_tier === 'temporary') {
      return daysSinceAccess > 7;
    }

    return true;
  }

  /**
   * Archive a single memory
   */
  archiveMemory(memory: Memory): ArchivedMemory {
    let compressedContent = memory.content;
    let originalLength = memory.content.length;
    let compressedLength = memory.content.length;
    let compressed = false;

    // Compress if enabled
    if (this.config.compressionEnabled) {
      const compressionResult = this.compressionService.compress(memory, {
        strategy: 'lossy',
      });

      if (compressionResult.compressed && compressionResult.compressedContent) {
        compressedContent = compressionResult.compressedContent;
        compressedLength = compressedContent.length;
        compressed = true;
      }
    }

    // Encrypt if enabled (placeholder - would use actual encryption)
    if (this.config.encryptionEnabled) {
      // In production, would encrypt here
      // compressedContent = encrypt(compressedContent);
    }

    const archived: ArchivedMemory = {
      id: `archive_${memory.id}_${Date.now()}`,
      originalId: memory.id,
      archivedAt: new Date(),
      originalCreatedAt: memory.created_at,
      originalUpdatedAt: memory.updated_at,
      content: compressedContent,
      compressed,
      originalLength,
      compressedLength,
      metadata: {
        retentionTier: memory.retention_tier,
        type: memory.type,
        tags: memory.tags,
        confidence: memory.confidence_level,
      },
    };

    this.archive.set(archived.id, archived);
    return archived;
  }

  /**
   * Batch archive memories
   */
  batchArchive(memories: Memory[], strategy: 'automatic' | 'by-value' | 'manual' = this.config.strategy): {
    archived: ArchivedMemory[];
    skipped: string[];
    stats: ArchivalMetrics;
  } {
    const archived: ArchivedMemory[] = [];
    const skipped: string[] = [];

    for (const memory of memories) {
      let shouldArchiveMemory = false;

      switch (strategy) {
        case 'automatic':
          shouldArchiveMemory = this.shouldArchive(memory);
          break;
        case 'by-value':
          // Archive based on priority (confidence, access patterns, etc.)
          shouldArchiveMemory = this.evaluateByValue(memory);
          break;
        case 'manual':
          // Manual selection already done by caller
          shouldArchiveMemory = true;
          break;
      }

      if (shouldArchiveMemory) {
        archived.push(this.archiveMemory(memory));
      } else {
        skipped.push(memory.id);
      }
    }

    return {
      archived,
      skipped,
      stats: this.calculateMetrics(),
    };
  }

  /**
   * Evaluate memory for value-based archival
   */
  private evaluateByValue(memory: Memory): boolean {
    // Calculate a value score (higher = keep, lower = archive)
    let valueScore = 0;

    // Confidence weight
    valueScore += memory.confidence_level * 40;

    // Access frequency weight
    valueScore += Math.min(memory.access_count, 10) * 5;

    // Retention tier weight
    const tierWeight: Record<RetentionTier, number> = {
      'eternal': 100,
      'standard': 40,
      'temporary': 10,
      'session': 0,
    };
    valueScore += tierWeight[memory.retention_tier];

    // Archive if value score is below threshold
    return valueScore < 50;
  }

  /**
   * Restore a memory from archive
   */
  restoreMemory(archiveId: string): Memory | undefined {
    const archived = this.archive.get(archiveId);
    if (!archived) {
      return undefined;
    }

    // Decompress if needed
    let content = archived.content;
    if (archived.compressed) {
      // In production, would decompress here
      // content = decompress(content);
    }

    // Decrypt if needed
    if (this.config.encryptionEnabled) {
      // In production, would decrypt here
      // content = decrypt(content);
    }

    return {
      id: archived.originalId,
      crew_id: '', // Would be provided from context
      content,
      type: archived.metadata.type as any,
      retention_tier: archived.metadata.retentionTier,
      confidence_level: archived.metadata.confidence,
      created_at: archived.originalCreatedAt,
      updated_at: archived.originalUpdatedAt,
      access_count: 0,
      last_accessed: new Date().toISOString(),
      tags: archived.metadata.tags,
    };
  }

  /**
   * Search archive by memory ID
   */
  findInArchive(originalMemoryId: string): ArchivedMemory | undefined {
    for (const archived of this.archive.values()) {
      if (archived.originalId === originalMemoryId) {
        return archived;
      }
    }
    return undefined;
  }

  /**
   * Get all archived memories
   */
  listArchived(limit: number = 100): ArchivedMemory[] {
    return Array.from(this.archive.values())
      .sort((a, b) => b.archivedAt.getTime() - a.archivedAt.getTime())
      .slice(0, limit);
  }

  /**
   * Delete archived memory permanently
   */
  deleteArchived(archiveId: string): boolean {
    return this.archive.delete(archiveId);
  }

  /**
   * Calculate archival metrics
   */
  calculateMetrics(): ArchivalMetrics {
    const archivedArray = Array.from(this.archive.values());

    if (archivedArray.length === 0) {
      return {
        totalArchived: 0,
        totalActive: 0,
        archiveSize: 0,
        compressionRatio: 0,
        estimatedSavings: 0,
        oldestArchived: null,
        newestArchived: null,
      };
    }

    const archiveSize = archivedArray.reduce((sum, a) => sum + a.compressedLength, 0);
    const originalSize = archivedArray.reduce((sum, a) => sum + a.originalLength, 0);
    const estimatedSavings = originalSize - archiveSize;
    const compressionRatio = archiveSize > 0 ? archiveSize / originalSize : 0;

    const dates = archivedArray.map(a => a.archivedAt).sort((a, b) => a.getTime() - b.getTime());

    return {
      totalArchived: archivedArray.length,
      totalActive: 0, // Would be passed in by caller
      archiveSize,
      compressionRatio,
      estimatedSavings,
      oldestArchived: dates[0],
      newestArchived: dates[dates.length - 1],
    };
  }

  /**
   * Recommend memories for archival
   */
  recommendArchival(memories: Memory[], limit: number = 10): ArchivalAction[] {
    const recommendations: ArchivalAction[] = [];

    for (const memory of memories) {
      if (this.shouldArchive(memory)) {
        const originalLength = memory.content.length;
        const estimatedSavings = originalLength * 0.6; // Estimate 60% compression savings

        recommendations.push({
          memoryId: memory.id,
          action: 'archive',
          reason: this.getArchivalReason(memory),
          estimatedSavings,
        });
      }
    }

    return recommendations.slice(0, limit);
  }

  /**
   * Generate human-readable reason for archival recommendation
   */
  private getArchivalReason(memory: Memory): string {
    const createdDate = new Date(memory.created_at);
    const ageDays = (new Date().getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);

    const lastAccessDate = new Date(memory.last_accessed);
    const daysSinceAccess = (new Date().getTime() - lastAccessDate.getTime()) / (1000 * 60 * 60 * 24);

    if (memory.confidence_level < 0.3) {
      return 'Low confidence memory - archive for cleanup';
    }

    if (daysSinceAccess > 180) {
      return `Not accessed in ${Math.floor(daysSinceAccess)} days - archive for storage optimization`;
    }

    if (ageDays > this.config.minAgeDays && daysSinceAccess > 30) {
      return `Old memory (${Math.floor(ageDays)} days) not accessed recently - archive to improve performance`;
    }

    return 'Memory meets archival criteria';
  }

  /**
   * Get archival strategy analysis
   */
  analyzeStrategy(memories: Memory[]): {
    strategyName: string;
    estimatedArchivable: number;
    estimatedSavings: number;
    timeToExecute: string;
  } {
    let archivable = 0;
    let totalSavings = 0;

    for (const memory of memories) {
      if (this.shouldArchive(memory)) {
        archivable += 1;
        totalSavings += memory.content.length * 0.6; // Estimate compression
      }
    }

    return {
      strategyName: this.config.strategy,
      estimatedArchivable: archivable,
      estimatedSavings: totalSavings,
      timeToExecute: archivable > 100 ? '5-10 minutes' : archivable > 10 ? '1-2 minutes' : '<1 minute',
    };
  }

  /**
   * Clear archive (destructive operation)
   */
  clearArchive(): number {
    const count = this.archive.size;
    this.archive.clear();
    return count;
  }

  /**
   * Get archive statistics by retention tier
   */
  getArchiveStatsByTier(): Record<RetentionTier, {
    count: number;
    size: number;
    avgConfidence: number;
  }> {
    const stats: Record<RetentionTier, { count: number; size: number; avgConfidence: number }> = {
      'eternal': { count: 0, size: 0, avgConfidence: 0 },
      'standard': { count: 0, size: 0, avgConfidence: 0 },
      'temporary': { count: 0, size: 0, avgConfidence: 0 },
      'session': { count: 0, size: 0, avgConfidence: 0 },
    };

    const byTier: Record<RetentionTier, { count: number; size: number; confidences: number[] }> = {
      'eternal': { count: 0, size: 0, confidences: [] },
      'standard': { count: 0, size: 0, confidences: [] },
      'temporary': { count: 0, size: 0, confidences: [] },
      'session': { count: 0, size: 0, confidences: [] },
    };

    for (const archived of this.archive.values()) {
      const tier = archived.metadata.retentionTier;
      byTier[tier].count += 1;
      byTier[tier].size += archived.compressedLength;
      byTier[tier].confidences.push(archived.metadata.confidence);
    }

    for (const tier of Object.keys(byTier) as RetentionTier[]) {
      const tierData = byTier[tier];
      stats[tier] = {
        count: tierData.count,
        size: tierData.size,
        avgConfidence: tierData.confidences.length > 0
          ? tierData.confidences.reduce((a, b) => a + b, 0) / tierData.confidences.length
          : 0,
      };
    }

    return stats;
  }
}
