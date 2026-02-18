import { upgradeService } from '../services/upgrade-service';

/**
 * Tier Limits for OpenRouter Crew Platform
 * Defines constraints for the "Starter" (Free) tier.
 */

export const STARTER_LIMITS = {
  maxCrews: 1,
  maxMemories: 1000,
  historyDays: 30,
  features: {
    autoArchival: false,
    advancedAnalytics: false,
    multiBudget: false,
    smartScheduling: false
  }
};

export function enforceFeatureAccess(feature: keyof typeof STARTER_LIMITS.features) {
  if (!upgradeService.isFeatureEnabled(feature)) {
    throw new Error(`❌ Feature '${feature}' is not available in Starter tier. Please upgrade to Professional.`);
  }
}

export function checkUsageLimit(current: number, limit: keyof typeof STARTER_LIMITS) {
  const currentLimits = upgradeService.getLimits();
  // @ts-ignore - dynamic access
  if (typeof currentLimits[limit] === 'number' && current >= (currentLimits[limit] as number)) {
    throw new Error(`❌ Limit reached: ${limit} (${currentLimits[limit as keyof typeof currentLimits]}). Please upgrade to scale.`);
  }
}