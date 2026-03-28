/**
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

export interface LiveUsage {
  haiku: number;
  sonnet: number;
  opus: number;
}

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