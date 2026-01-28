/**
 * n8n Cost Optimization Integration
 *
 * Endpoint: POST /api/n8n/cost-optimize
 *
 * Provides cost optimization recommendations for balancing
 * Claude Code token usage with OpenRouter API calls.
 *
 * This endpoint is designed to be called by n8n workflows to:
 * 1. Track token usage across systems
 * 2. Get LLM tier recommendations
 * 3. Balance costs between Claude Code and OpenRouter
 * 4. Monitor budget thresholds
 */

import { NextRequest, NextResponse } from 'next/server';
import { LLMTier } from '@/lib/orchestration/types';

interface CostOptimizationRequest {
  /** Source system making the request */
  source: 'claude-code' | 'openrouter' | 'n8n-workflow';

  /** Description of the task */
  task: string;

  /** Optional: Current token usage stats */
  currentUsage?: {
    claudeCodeTokens: number;
    openRouterTokens: number;
    totalCostUsd: number;
  };

  /** Optional: Budget constraints */
  budget?: {
    dailyBudgetUsd?: number;
    monthlyBudgetUsd?: number;
    maxCostPerTask?: number;
  };

  /** Optional: Task complexity hint */
  complexity?: 'trivial' | 'routine' | 'important' | 'critical';

  /** Optional: Required expertise areas */
  expertise?: string[];
}

interface CostOptimizationResponse {
  success: boolean;
  recommendation?: {
    /** Recommended system to use */
    preferredSystem: 'claude-code' | 'openrouter';

    /** Recommended LLM tier */
    recommendedTier: LLMTier;

    /** Estimated cost */
    estimatedCostUsd: number;

    /** Cost comparison */
    costComparison: {
      claudeCodeCost: number;
      openRouterCost: number;
      savingsPercent: number;
    };

    /** Reasoning */
    reasoning: string;

    /** Usage alerts */
    alerts?: string[];
  };
  usageStats?: {
    currentPeriod: 'daily' | 'monthly';
    usedBudgetUsd: number;
    remainingBudgetUsd: number;
    percentUsed: number;
    projectedMonthlySpend: number;
  };
  error?: string;
}

/**
 * Calculate usage statistics
 */
function calculateUsageStats(
  currentUsage: { claudeCodeTokens: number; openRouterTokens: number; totalCostUsd: number },
  budget?: { dailyBudgetUsd?: number; monthlyBudgetUsd?: number }
): CostOptimizationResponse['usageStats'] {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();
  const daysRemaining = daysInMonth - currentDay + 1;

  // Determine which budget period to use
  let period: 'daily' | 'monthly' = 'monthly';
  let budgetLimit = budget?.monthlyBudgetUsd || 100; // Default $100/month
  let usedBudget = currentUsage.totalCostUsd;

  if (budget?.dailyBudgetUsd) {
    period = 'daily';
    budgetLimit = budget.dailyBudgetUsd;
    // For daily budget, assume current cost is today's spend
    usedBudget = currentUsage.totalCostUsd;
  }

  const remainingBudget = Math.max(0, budgetLimit - usedBudget);
  const percentUsed = (usedBudget / budgetLimit) * 100;

  // Project monthly spend based on current usage
  const avgDailySpend = currentUsage.totalCostUsd / currentDay;
  const projectedMonthlySpend = avgDailySpend * daysInMonth;

  return {
    currentPeriod: period,
    usedBudgetUsd: usedBudget,
    remainingBudgetUsd: remainingBudget,
    percentUsed,
    projectedMonthlySpend,
  };
}

/**
 * Generate cost optimization recommendation
 */
function generateRecommendation(
  request: CostOptimizationRequest
): CostOptimizationResponse['recommendation'] {
  const { source, task, complexity = 'routine', currentUsage, budget } = request;

  // Determine recommended tier based on complexity
  let recommendedTier: LLMTier;
  let estimatedTokens: number;

  if (complexity === 'trivial') {
    recommendedTier = LLMTier.ULTRA_BUDGET;
    estimatedTokens = 500;
  } else if (complexity === 'routine') {
    recommendedTier = LLMTier.BUDGET;
    estimatedTokens = 1500;
  } else if (complexity === 'important') {
    recommendedTier = LLMTier.STANDARD;
    estimatedTokens = 3000;
  } else {
    recommendedTier = LLMTier.PREMIUM;
    estimatedTokens = 5000;
  }

  // Estimate costs (rough approximation)
  const tierCosts: Record<string, number> = {
    [LLMTier.ULTRA_BUDGET]: 0.0001,
    [LLMTier.BUDGET]: 0.0003,
    [LLMTier.STANDARD]: 0.001,
    [LLMTier.PREMIUM]: 0.003,
  };

  const openRouterCost = estimatedTokens * tierCosts[recommendedTier];
  const claudeCodeCost = 0.015; // Approximate per-task cost for Claude Code

  // Determine preferred system based on cost and current usage
  let preferredSystem: 'claude-code' | 'openrouter' = 'openrouter';
  let reasoning = '';

  if (currentUsage) {
    const claudeCodeTokenRatio = currentUsage.claudeCodeTokens / (currentUsage.claudeCodeTokens + currentUsage.openRouterTokens || 1);

    // Balance: If Claude Code usage is > 70%, prefer OpenRouter
    if (claudeCodeTokenRatio > 0.7) {
      preferredSystem = 'openrouter';
      reasoning = `Claude Code usage is high (${(claudeCodeTokenRatio * 100).toFixed(1)}%). Recommending OpenRouter to balance load and token usage.`;
    }
    // If Claude Code usage is < 30%, prefer Claude Code
    else if (claudeCodeTokenRatio < 0.3) {
      preferredSystem = 'claude-code';
      reasoning = `Claude Code usage is low (${(claudeCodeTokenRatio * 100).toFixed(1)}%). Recommending Claude Code for better context awareness and IDE integration.`;
    }
    // Otherwise, compare costs
    else {
      if (claudeCodeCost < openRouterCost) {
        preferredSystem = 'claude-code';
        reasoning = `Claude Code is more cost-effective for this task ($${claudeCodeCost.toFixed(4)} vs $${openRouterCost.toFixed(4)}). Token usage is balanced.`;
      } else {
        preferredSystem = 'openrouter';
        reasoning = `OpenRouter with ${recommendedTier} tier is more cost-effective ($${openRouterCost.toFixed(4)} vs $${claudeCodeCost.toFixed(4)}).`;
      }
    }
  } else {
    // No usage data, default to cost comparison
    if (complexity === 'trivial' || complexity === 'routine') {
      preferredSystem = 'openrouter';
      reasoning = `For ${complexity} tasks, OpenRouter with budget/ultra-budget tier is most cost-effective.`;
    } else {
      preferredSystem = 'claude-code';
      reasoning = `For ${complexity} tasks, Claude Code provides better context awareness and IDE integration.`;
    }
  }

  const savingsPercent = ((Math.max(claudeCodeCost, openRouterCost) - Math.min(claudeCodeCost, openRouterCost)) / Math.max(claudeCodeCost, openRouterCost)) * 100;

  // Generate alerts
  const alerts: string[] = [];
  if (currentUsage && budget) {
    const usageStats = calculateUsageStats(currentUsage, budget);
    if (usageStats.percentUsed > 90) {
      alerts.push(`⚠️ ${usageStats.percentUsed.toFixed(1)}% of ${usageStats.currentPeriod} budget used!`);
    }
    if (usageStats.projectedMonthlySpend > (budget.monthlyBudgetUsd || 100)) {
      alerts.push(`⚠️ Projected to exceed monthly budget: $${usageStats.projectedMonthlySpend.toFixed(2)}`);
    }
  }

  return {
    preferredSystem,
    recommendedTier,
    estimatedCostUsd: preferredSystem === 'claude-code' ? claudeCodeCost : openRouterCost,
    costComparison: {
      claudeCodeCost,
      openRouterCost,
      savingsPercent,
    },
    reasoning,
    alerts: alerts.length > 0 ? alerts : undefined,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CostOptimizationRequest;

    // Validate request
    if (!body.source || !body.task) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: source and task',
        } as CostOptimizationResponse,
        { status: 400 }
      );
    }

    // Generate recommendation
    const recommendation = generateRecommendation(body);

    // Calculate usage stats if current usage provided
    let usageStats: CostOptimizationResponse['usageStats'] | undefined;
    if (body.currentUsage && body.budget) {
      usageStats = calculateUsageStats(body.currentUsage, body.budget);
    }

    return NextResponse.json({
      success: true,
      recommendation,
      usageStats,
    } as CostOptimizationResponse);
  } catch (error: any) {
    console.error('Cost optimization error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate cost optimization recommendation',
      } as CostOptimizationResponse,
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for health check
 */
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    endpoint: '/api/n8n/cost-optimize',
    description: 'n8n cost optimization integration for balancing Claude Code and OpenRouter usage',
    usage: {
      method: 'POST',
      body: {
        source: 'claude-code | openrouter | n8n-workflow',
        task: 'Description of the task',
        currentUsage: {
          claudeCodeTokens: 0,
          openRouterTokens: 0,
          totalCostUsd: 0,
        },
        budget: {
          dailyBudgetUsd: 10,
          monthlyBudgetUsd: 100,
        },
        complexity: 'trivial | routine | important | critical',
      },
    },
  });
}
