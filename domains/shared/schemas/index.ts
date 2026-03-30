import { z } from 'zod';

/**
 * Bedrock Domain: Shared Schemas
 * Canonical data models and type definitions for the OpenRouter Crew Platform.
 * Domain: Marketing Funnel
 * Logical model for tiered AI billing integration.
 * This package follows the Layer 1 (Domain) architectural law.
 */

export type FunnelStage = 'Awareness' | 'Consideration' | 'Decision' | 'Action';
export type BillingTier = 'Haiku' | 'Sonnet' | 'Opus';

export interface FunnelMetric {
  stage: FunnelStage;
  tier: BillingTier;
  volume: number; // Number of users/agents at this stage
  costPerThousand: number;
  color: string;
}

export const AgentRoleSchema = z.enum([
  'Researcher',
  'Architect',
  'Developer',
  'Manager'
]);

export const ProjectStatusSchema = z.enum([
  'Incubating',
  'Active',
  'Maintenance'
]);
export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;
export interface LiveUsage {
  haiku: number;
  sonnet: number;
  opus: number;
}

// --- Core Models ---

export const AgentSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string(),
  role: AgentRoleSchema,
  capabilities: z.array(z.string()),
  budget: z.object({
    limit: z.number(),
    used: z.number().default(0),
    currency: z.string().default('USD')
  })
});
export type Agent = z.infer<typeof AgentSchema>;

export const ProjectSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string(),
  description: z.string().optional(),
  status: ProjectStatusSchema,
  ownerId: z.string().optional(),
  environment: z.enum(['local', 'development', 'staging', 'production']).default('local'),
  metadata: z.record(z.any()).optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
});
export type Project = z.infer<typeof ProjectSchema>;

export const MessageSchema = z.object({
  id: z.string().uuid().optional(),
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string(),
  tokensUsed: z.number().optional(),
  timestamp: z.string().datetime().default(() => new Date().toISOString())
});
export type Message = z.infer<typeof MessageSchema>;

export const ConversationSchema = z.object({
  id: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  participants: z.array(z.string()),
  messages: z.array(MessageSchema),
  metadata: z.record(z.any()).optional(),
  summary: z.string().optional()
});
export type Conversation = z.infer<typeof ConversationSchema>;

export const CostEventSchema = z.object({
  id: z.string().uuid().optional(),
  sessionId: z.string().optional(),
  model: z.string(),
  tokensInput: z.number(),
  tokensOutput: z.number(),
  cost: z.number(),
  timestamp: z.string().datetime().default(() => new Date().toISOString()),
  metadata: z.record(z.any()).optional()
});
export type CostEvent = z.infer<typeof CostEventSchema>;

export const DeploymentLogSchema = z.object({
  id: z.string().uuid().optional(),
  project_id: z.string().uuid(),
  platform: z.enum(['vercel', 'aws', 'local']),
  deployment_id: z.string().optional(),
  environment: z.enum(['local', 'development', 'staging', 'production']),
  status: z.enum(['queued', 'building', 'success', 'error']),
  build_url: z.string().url().optional().nullable(),
  commit_sha: z.string().optional().nullable(),
  metadata: z.record(z.any()).optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional()
});
export type DeploymentLog = z.infer<typeof DeploymentLogSchema>;

/**
 * Pure domain logic: Calculates the funnel state based on OpenRouter tiering rules.
 * Notice: No UI code here.
 */
export const getFunnelData = (usage: LiveUsage): FunnelMetric[] => {
  return [
    { stage: 'Awareness', tier: 'Haiku', volume: usage.haiku, costPerThousand: 0.001, color: '#3b82f6' }, // Blue
    { stage: 'Consideration', tier: 'Sonnet', volume: usage.sonnet, costPerThousand: 0.003, color: '#8b5cf6' }, // Purple
    { stage: 'Action', tier: 'Opus', volume: usage.opus, costPerThousand: 0.015, color: '#ec4899' } // Pink
  ];
};