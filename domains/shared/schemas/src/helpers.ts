/**
 * Schema Helpers
 *
 * Utility functions for working with database types
 */

import { Database } from './database';

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type Insertable<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type Updateable<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

// Convenience type aliases
export type Project = Tables<'projects'>;
export type LLMUsageEvent = Tables<'llm_usage_events'>;
export type CrewMember = Tables<'crew_members'>;
export type CrewMemory = Tables<'crew_memories'>;
export type Workflow = Tables<'workflows'>;
export type WorkflowExecution = Tables<'workflow_executions'>;
