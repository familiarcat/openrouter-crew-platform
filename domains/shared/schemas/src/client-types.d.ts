import type { Database } from './database';
export type Project = Database['public']['Tables']['projects']['Row'];
export type LLMUsageEvent = Database['public']['Tables']['llm_usage_events']['Row'];
export type CrewMember = Database['public']['Tables']['crew_members']['Row'];
export type { Database };
//# sourceMappingURL=client-types.d.ts.map