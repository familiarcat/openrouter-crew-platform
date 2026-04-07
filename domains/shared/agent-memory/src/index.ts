import { LLMUsageEvent, Project } from '@openrouter-crew/shared-schemas';
import { SupabaseClient } from '@supabase/supabase-js';

export interface MemoryStoreData {
  projectId?: string; agentId?: string; taskId?: string; content?: string;
  metadata?: Record<string, unknown>; [key: string]: unknown;
}
export interface MemoryOutcomeData {
  sessionId?: string;
  activatedNodeIds?: string[];
  outcome: 'success' | 'failure';
  crewMember: string;
  outcomeDelta?: number;
  [key: string]: unknown;
}

export class MemoryService {
  constructor(client?: any) {}
  getMemoriesByProjectId(projectId: string): any[] { return []; }
  getMemoryById(memoryId: string): any { return {}; }
  getMemoryStats(projectId: string): any { return {}; }
  retrieveMemories(projectId: string, context: string): any { return {}; }
  getMemoryNodeTags(memoryId: string): string[] { return []; }

  async store(_data: any): Promise<void> {}
  async reportOutcome(_data: any): Promise<void> {}
};