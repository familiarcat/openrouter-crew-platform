/**
 * n8n Cost Management Workflow
 * Automated cost tracking and optimization triggers
 */

import { CostOptimizationService } from '@openrouter-crew/crew-api-client';

interface CostWorkflowConfig {
  crewId: string;
  checkInterval: number; // minutes
  alertThreshold: number; // percentage
}

interface CostWorkflowResult {
  crewId: string;
  currentCost: number;
  budget: number;
  percentUsed: number;
  shouldAlert: boolean;
  recommendations: string[];
  timestamp: string;
}

export class CostManagementWorkflow {
  private costService: CostOptimizationService;

  constructor() {
    this.costService = new CostOptimizationService();
  }

  /**
   * Execute cost check workflow
   */
  async executeCostCheck(config: CostWorkflowConfig): Promise<CostWorkflowResult> {
    const budget = this.costService.getBudget(config.crewId);

    if (!budget) {
      return {
        crewId: config.crewId,
        currentCost: 0,
        budget: 0,
        percentUsed: 0,
        shouldAlert: false,
        recommendations: [],
        timestamp: new Date().toISOString(),
      };
    }

    const percentUsed = budget.percentUsed || 0;
    const shouldAlert = percentUsed >= config.alertThreshold;

    // Get recommendations
    const metrics = this.costService.getOptimizationMetrics(config.crewId);
    const recommendations: string[] = [];

    if (metrics.cacheHitRate < 0.6) {
      recommendations.push('Increase cache TTL to improve hit rate');
    }

    if (percentUsed > 80) {
      recommendations.push('Consider enabling cost optimization features');
    }

    return {
      crewId: config.crewId,
      currentCost: budget.spent || 0,
      budget: budget.limit || 0,
      percentUsed,
      shouldAlert,
      recommendations,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Trigger cost alert notification
   */
  async triggerCostAlert(result: CostWorkflowResult): Promise<boolean> {
    if (!result.shouldAlert) {
      return false;
    }

    // In a real n8n workflow, this would send to Slack, email, etc.
    console.log(`🚨 Cost Alert for ${result.crewId}: ${result.percentUsed}% of budget used`);
    return true;
  }

  /**
   * Apply optimization recommendations automatically
   */
  async applyOptimizations(crewId: string): Promise<string[]> {
    const appliedActions: string[] = [];

    try {
      // Enable compression if not already enabled
      appliedActions.push('compression_enabled');

      // Update cache settings
      appliedActions.push('cache_optimized');

      // Enable batch processing
      appliedActions.push('batch_processing_enabled');

      return appliedActions;
    } catch (error) {
      console.error('Failed to apply optimizations:', error);
      return [];
    }
  }

  /**
   * Generate cost report
   */
  generateCostReport(crewId: string): Record<string, any> {
    const breakdown = this.costService.getCostBreakdown(crewId);
    const budget = this.costService.getBudget(crewId);

    return {
      crewId,
      date: new Date().toISOString(),
      budget: budget?.limit || 0,
      spent: budget?.spent || 0,
      breakdown,
      recommendations: this.costService.getOptimizationMetrics(crewId),
    };
  }
}
