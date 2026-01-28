/**
 * Cost Optimizer (Quark's ROI Analyzer)
 *
 * Analyzes usage patterns and recommends optimizations
 * Based on rag-refresh-product-factory Quark optimizer
 */

import { OptimizationResult, UsageEvent, ModelTier } from './types';
import { modelRouter } from './model-router';
import { costCalculator } from './cost-calculator';

export class CostOptimizer {
  /**
   * Analyze usage history and recommend optimizations
   */
  analyzeUsage(events: UsageEvent[]): OptimizationResult[] {
    const recommendations: OptimizationResult[] = [];

    // Group events by model
    const byModel = new Map<string, UsageEvent[]>();
    for (const event of events) {
      const existing = byModel.get(event.model) || [];
      existing.push(event);
      byModel.set(event.model, existing);
    }

    // Analyze each model
    for (const [model, modelEvents] of byModel.entries()) {
      const currentModel = modelRouter.getModel(model);
      if (!currentModel) continue;

      // Calculate average tokens
      const avgInputTokens =
        modelEvents.reduce((sum, e) => sum + e.inputTokens, 0) / modelEvents.length;
      const avgOutputTokens =
        modelEvents.reduce((sum, e) => sum + e.outputTokens, 0) / modelEvents.length;

      // Try cheaper tiers
      const cheaperTiers: ModelTier[] = [];
      if (currentModel.tier === 'premium') {
        cheaperTiers.push('standard', 'budget');
      } else if (currentModel.tier === 'standard') {
        cheaperTiers.push('budget');
      }

      for (const tier of cheaperTiers) {
        const alternatives = modelRouter.getModelsByTier(tier);

        for (const alt of alternatives) {
          // Skip if doesn't meet requirements
          if (currentModel.supportsTools && !alt.supportsTools) continue;
          if (avgInputTokens + avgOutputTokens > alt.contextWindow) continue;

          // Calculate savings
          const currentCost = costCalculator.calculateActualCost(
            model,
            avgInputTokens,
            avgOutputTokens
          );
          const altCost = costCalculator.calculateActualCost(
            alt.id,
            avgInputTokens,
            avgOutputTokens
          );

          if (altCost < currentCost) {
            const savings = currentCost - altCost;
            const savingsPercent = (savings / currentCost) * 100;

            // Only recommend if savings > 20%
            if (savingsPercent > 20) {
              recommendations.push({
                originalModel: model,
                originalCost: currentCost * modelEvents.length,
                recommendedModel: alt.id,
                recommendedCost: altCost * modelEvents.length,
                savings: savings * modelEvents.length,
                savingsPercent,
                reasoning: `Switch from ${currentModel.name} (${currentModel.tier}) to ${alt.name} (${alt.tier}) for ${savingsPercent.toFixed(1)}% savings on ${modelEvents.length} requests`
              });
            }
          }
        }
      }
    }

    // Sort by total savings descending
    recommendations.sort((a, b) => b.savings - a.savings);

    return recommendations;
  }

  /**
   * Calculate total cost for a period
   */
  calculateTotalCost(events: UsageEvent[]): number {
    return events.reduce((sum, event) => sum + event.estimatedCost, 0);
  }

  /**
   * Calculate cost breakdown by project
   */
  costByProject(events: UsageEvent[]): Map<string, number> {
    const byProject = new Map<string, number>();

    for (const event of events) {
      const current = byProject.get(event.projectId) || 0;
      byProject.set(event.projectId, current + event.estimatedCost);
    }

    return byProject;
  }

  /**
   * Calculate cost breakdown by model tier
   */
  costByTier(events: UsageEvent[]): Map<ModelTier, number> {
    const byTier = new Map<ModelTier, number>();

    for (const event of events) {
      const current = byTier.get(event.routingMode) || 0;
      byTier.set(event.routingMode, current + event.estimatedCost);
    }

    return byTier;
  }

  /**
   * Calculate cost breakdown by crew member
   */
  costByCrewMember(events: UsageEvent[]): Map<string, number> {
    const byCrew = new Map<string, number>();

    for (const event of events) {
      if (!event.crewMember) continue;
      const current = byCrew.get(event.crewMember) || 0;
      byCrew.set(event.crewMember, current + event.estimatedCost);
    }

    return byCrew;
  }
}

// Export singleton
export const costOptimizer = new CostOptimizer();
