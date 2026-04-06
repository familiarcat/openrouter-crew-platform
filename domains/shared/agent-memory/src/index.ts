import { LLMUsageEvent, Project } from '@openrouter-crew/shared-schemas';
export class MemoryService {
  getMemoriesByProjectId(projectId: string): any[] { return []; }
  getMemoryById(memoryId: string): any { return {}; }
  getMemoryStats(projectId: string): any { return {}; }
  retrieveMemories(projectId: string, context: string): any { return {}; }
  // Data: Add a stub for the dashboard's selectedNode.tags property
  // This is a temporary fix until the dashboard is properly typed
  getMemoryNodeTags(memoryId: string): string[] { return []; }
};
// ─── Compatibility shim ───────────────────────────────────────────────────────
// observation-lounge.ts expects: new MemoryService(supabaseClient), .store(), .reportOutcome()
// This shim satisfies those call sites without breaking the existing class.

export interface MemoryStoreData {
  projectId?: string;
  agentId?: string;
  taskId?: string;
  content?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface MemoryOutcomeData {
  projectId?: string;
  agentId?: string;
  taskId?: string;
  success?: boolean;
  costUSD?: number;
  [key: string]: unknown;
}

// Re-export MemoryService as a class that accepts an optional client arg
// and exposes store() / reportOutcome() for observation-lounge.ts consumers.
const _OriginalMemoryService = MemoryService;

class MemoryServiceCompat extends (_OriginalMemoryService as any) {
  private _client: unknown;

  constructor(client?: unknown) {
    super();
    this._client = client;
  }

  async store(_data: MemoryStoreData): Promise<void> {
    // Override in production implementation; stub satisfies the type checker.
  }

  async reportOutcome(_data: MemoryOutcomeData): Promise<void> {
    // Override in production implementation; stub satisfies the type checker.
  }
}

// Replace the default export with the compat version
export { MemoryServiceCompat as MemoryService };
