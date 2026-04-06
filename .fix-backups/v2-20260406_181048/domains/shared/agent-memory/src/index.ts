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