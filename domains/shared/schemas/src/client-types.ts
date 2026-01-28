import type { Database } from './database'

// Re-export only the types needed by client components
// This reduces the TypeScript compilation overhead during builds
export type Project = Database['public']['Tables']['projects']['Row']
export type LLMUsageEvent = Database['public']['Tables']['llm_usage_events']['Row']
export type CrewMember = Database['public']['Tables']['crew_members']['Row']

// Re-export the full Database type for server-side usage
export type { Database }
