/**
 * Crew Member Types
 *
 * Defines the structure for crew members across all projects
 */

export type CostTier = 'premium' | 'standard' | 'budget' | 'ultra_budget';

export type CrewMemberRole =
  | 'strategic-leadership'
  | 'data-analytics'
  | 'tactical-execution'
  | 'user-experience'
  | 'security-compliance'
  | 'system-health'
  | 'infrastructure'
  | 'communications'
  | 'pragmatic-solutions'
  | 'business-intelligence';

export interface CrewMember {
  id: string;
  name: string;
  displayName: string;
  role: CrewMemberRole;

  // Configuration
  defaultModel: string;
  costTier: CostTier;
  webhookUrl?: string;

  // Capabilities
  expertise: string[];
  personality: string;

  // Status
  active: boolean;
  workloadCurrent: number;
  workloadCapacity: number;

  // Metadata
  avatarUrl?: string;
  bio?: string;
}

export interface CrewRequest {
  projectId: string;
  crewMember: string;
  message: string;
  context?: Record<string, any>;
  maxTokens?: number;
  temperature?: number;
}

export interface CrewResponse {
  crewMember: string;
  content: string;
  model: string;
  tokensUsed: number;
  estimatedCost: number;
  executionTime: number;
  metadata?: Record<string, any>;
}

export interface WorkloadStatus {
  crewMember: string;
  current: number;
  capacity: number;
  utilizationPercent: number;
  available: boolean;
}
