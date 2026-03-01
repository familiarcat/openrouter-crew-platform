import { Memory, ArchivalConfig } from '../types';
/**
 * Manages the archival and restoration of memories.
 * This implementation uses an in-memory store for demonstration purposes.
 * In a production system, this would interact with a persistent storage layer (e.g., S3).
 */
export declare class MemoryArchivalService {
    private config;
    private archive;
    private compressionService;
    constructor(config?: ArchivalConfig);
    /**
     * Archives a single memory, compressing it if enabled.
     * @param memory The memory object to archive.
     * @returns The archived memory object with compression stats.
     */
    archiveMemory(memory: Memory): Promise<{
        originalLength: number;
        compressedLength: number;
    }>;
    /**
     * Restores a memory from the archive.
     * @param archiveId The ID of the archived memory to restore.
     * @returns The restored memory object, or undefined if not found.
     */
    restoreMemory(archiveId: string): Promise<Memory | undefined>;
}
//# sourceMappingURL=memory-archival.d.ts.map