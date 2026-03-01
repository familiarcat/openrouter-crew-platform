import { MemoryCompressionService } from './memory-compression';
/**
 * Manages the archival and restoration of memories.
 * This implementation uses an in-memory store for demonstration purposes.
 * In a production system, this would interact with a persistent storage layer (e.g., S3).
 */
export class MemoryArchivalService {
    config;
    archive = new Map();
    compressionService;
    constructor(config) {
        this.config = {
            strategy: 'automatic',
            maxActiveMemories: 1000,
            minAgeDays: 90,
            compressionEnabled: true,
            encryptionEnabled: false,
            ...config,
        };
        this.compressionService = new MemoryCompressionService();
    }
    /**
     * Archives a single memory, compressing it if enabled.
     * @param memory The memory object to archive.
     * @returns The archived memory object with compression stats.
     */
    async archiveMemory(memory) {
        const originalLength = memory.content.length;
        let content = memory.content;
        let compressed = false;
        if (this.config.compressionEnabled) {
            content = this.compressionService.compress(memory.content);
            compressed = true;
        }
        const compressedLength = content.length;
        const archivedMemory = {
            id: `arch_${memory.id}`,
            originalId: memory.id,
            archivedAt: new Date(),
            originalCreatedAt: memory.created_at,
            originalUpdatedAt: memory.updated_at,
            content: content,
            compressed: compressed,
            originalLength: originalLength,
            compressedLength: compressedLength,
            metadata: {
                retentionTier: memory.retention_tier,
                type: memory.type,
                tags: memory.tags,
                confidence: memory.confidence_level,
            },
        };
        this.archive.set(archivedMemory.id, archivedMemory);
        return { originalLength, compressedLength };
    }
    /**
     * Restores a memory from the archive.
     * @param archiveId The ID of the archived memory to restore.
     * @returns The restored memory object, or undefined if not found.
     */
    async restoreMemory(archiveId) {
        const archivedMemory = this.archive.get(archiveId);
        if (!archivedMemory) {
            return undefined;
        }
        // For the CLI demo, we'll just confirm it was found and remove it.
        // A full implementation would decompress and save to the active memory store.
        this.archive.delete(archiveId);
        return {
            id: archivedMemory.originalId,
            crew_id: 'unknown', // This information is lost in the current ArchivedMemory structure
            content: "Restored content...",
            type: archivedMemory.metadata.type,
            retention_tier: archivedMemory.metadata.retentionTier,
            confidence_level: archivedMemory.metadata.confidence,
            created_at: archivedMemory.originalCreatedAt,
            updated_at: archivedMemory.originalUpdatedAt,
            access_count: 0,
            last_accessed: new Date().toISOString(),
            tags: archivedMemory.metadata.tags,
        };
    }
}
//# sourceMappingURL=memory-archival.js.map