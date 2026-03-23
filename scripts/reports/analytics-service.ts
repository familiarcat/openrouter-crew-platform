import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface CostSummary {
  periodDays: number;
  totalCost: number;
  totalTokens: number;
  byModel: { model: string; cost: number; tokens: number }[];
  byCrewMember: { member: string; cost: number; tokens: number }[];
}

export interface DailyCost {
  date: string;
  cost: number;
  tokens: number;
}

export interface DetailedCostSummary {
  startDate: string;
  endDate: string;
  totalCost: number;
  totalTokens: number;
  byModel: { model: string; cost: number; tokens: number }[];
  byCrewMember: { member: string; cost: number; tokens: number }[];
}

export interface PeriodComparison {
  period1: DetailedCostSummary;
  period2: DetailedCostSummary;
  costDiff: number;
  tokenDiff: number;
}

export interface BenchmarkComparison {
  periodDays: number;
  projectCost: number;
  industryAverageCost: number;
  costDifference: number;
  percentDifference: number;
  projectCostPer1kTokens: number;
  industryAverageCostPer1kTokens: number;
  efficiencyRating: 'Excellent' | 'Good' | 'Average' | 'Poor';
}

export interface OptimizationSuggestion {
  type: 'model' | 'crew' | 'general';
  title: string;
  description: string;
  potentialSavings: number;
  impact: 'high' | 'medium' | 'low';
}

export interface CostAnomaly {
  date: string;
  cost: number;
  zScore: number;
  severity: 'high' | 'medium' | 'low';
}

export interface BudgetHistoryEvent {
  id: string;
  created_at: string;
  content: string;
  new_budget: string;
}

export interface TopUser {
  member: string;
  cost: number;
  tokens: number;
}

export class AnalyticsService {
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async getCostSummary(periodDays: number, projectId?: string): Promise<CostSummary> {
    const { data, error } = await this.supabase.rpc('get_cost_summary', {
      period_days: periodDays,
      project_filter: projectId || null,
    });

    if (error) {
      console.error('Error calling get_cost_summary RPC:', error);
      throw error;
    }
    return data as CostSummary;
  }

  async getCostTrend(periodDays: number, projectId?: string): Promise<DailyCost[]> {
    const { data, error } = await this.supabase.rpc('get_cost_trend', {
      period_days: periodDays,
      project_filter: projectId || null,
    });

    if (error) {
      console.error('Error calling get_cost_trend RPC:', error);
      throw error;
    }
    return data as DailyCost[];
  }

  async getDetailedCostSummary(startDate: string, endDate: string, projectId?: string): Promise<DetailedCostSummary> {
    const { data, error } = await this.supabase.rpc('get_detailed_cost_summary', {
      start_date: startDate,
      end_date: endDate,
      project_filter: projectId || null,
    });

    if (error) {
      console.error('Error calling get_detailed_cost_summary RPC:', error);
      throw error;
    }
    return data as DetailedCostSummary;
  }

  async forecastCosts(daysToProject: number = 7, historicalDays: number = 30, projectId?: string): Promise<{
    forecast: DailyCost[];
    totalForecastCost: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    slope: number;
  }> {
    const historicalData = await this.getCostTrend(historicalDays, projectId);

    if (historicalData.length < 2) {
      return { forecast: [], totalForecastCost: 0, trend: 'stable', slope: 0 };
    }

    // Simple Linear Regression
    // x = day index (0 to n-1)
    // y = cost
    const n = historicalData.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    historicalData.forEach((day, i) => {
      sumX += i;
      sumY += day.cost;
      sumXY += i * day.cost;
      sumXX += i * i;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const forecast: DailyCost[] = [];
    let totalForecastCost = 0;
    const lastDate = new Date(historicalData[historicalData.length - 1].date);

    for (let i = 1; i <= daysToProject; i++) {
      const nextDate = new Date(lastDate);
      nextDate.setDate(lastDate.getDate() + i);
      
      // x for prediction starts at n, n+1, ...
      const x = n - 1 + i; 
      const predictedCost = Math.max(0, slope * x + intercept); // Cost can't be negative

      forecast.push({
        date: nextDate.toISOString().split('T')[0],
        cost: predictedCost,
        tokens: 0 
      });
      totalForecastCost += predictedCost;
    }

    const trend = slope > 0.0001 ? 'increasing' : slope < -0.0001 ? 'decreasing' : 'stable';

    return { forecast, totalForecastCost, trend, slope };
  }

  async comparePeriods(
    start1: string, end1: string,
    start2: string, end2: string,
    projectId?: string
  ): Promise<PeriodComparison> {
    const [period1, period2] = await Promise.all([
      this.getDetailedCostSummary(start1, end1, projectId),
      this.getDetailedCostSummary(start2, end2, projectId)
    ]);

    const costDiff = period2.totalCost - period1.totalCost;
    const tokenDiff = period2.totalTokens - period1.totalTokens;

    return { period1, period2, costDiff, tokenDiff };
  }

  async getBenchmarkComparison(periodDays: number, projectId?: string): Promise<BenchmarkComparison> {
    const summary = await this.getCostSummary(periodDays, projectId);

    // Simulated Industry Data (e.g., average cost per 1k tokens for mixed workloads)
    // Assuming industry average is around $0.02 per 1k tokens for similar mix of models
    const industryRatePer1kTokens = 0.02;
    const industryAverageCost = (summary.totalTokens / 1000) * industryRatePer1kTokens;

    const projectCostPer1kTokens = summary.totalTokens > 0 ? (summary.totalCost / summary.totalTokens) * 1000 : 0;

    const costDifference = summary.totalCost - industryAverageCost;
    const percentDifference = industryAverageCost > 0 ? (costDifference / industryAverageCost) * 100 : 0;

    let efficiencyRating: 'Excellent' | 'Good' | 'Average' | 'Poor' = 'Average';
    if (percentDifference < -20) efficiencyRating = 'Excellent';
    else if (percentDifference < -5) efficiencyRating = 'Good';
    else if (percentDifference > 20) efficiencyRating = 'Poor';

    return {
      periodDays,
      projectCost: summary.totalCost,
      industryAverageCost,
      costDifference,
      percentDifference,
      projectCostPer1kTokens,
      industryAverageCostPer1kTokens: industryRatePer1kTokens,
      efficiencyRating
    };
  }

  async getOptimizationSuggestions(periodDays: number, projectId?: string): Promise<OptimizationSuggestion[]> {
    const summary = await this.getCostSummary(periodDays, projectId);
    const suggestions: OptimizationSuggestion[] = [];

    // 1. Model Optimization
    // Identify expensive models that have cheaper, efficient alternatives
    const modelUpgrades: Record<string, { alt: string; savings: number }> = {
      'gpt-4': { alt: 'gpt-4o', savings: 0.5 },
      'claude-3-opus': { alt: 'claude-3.5-sonnet', savings: 0.6 },
      'claude-2': { alt: 'claude-3-haiku', savings: 0.8 },
      'text-davinci-003': { alt: 'gpt-3.5-turbo-instruct', savings: 0.9 }
    };

    summary.byModel.forEach(m => {
      // Check if model starts with any of the keys (to handle versions)
      const key = Object.keys(modelUpgrades).find(k => m.model.includes(k));
      if (key && m.cost > 0.5) { // Only suggest if cost is significant (> $0.50)
        const upgrade = modelUpgrades[key];
        const estimatedSavings = m.cost * upgrade.savings;
        suggestions.push({
          type: 'model',
          title: `Switch ${m.model} to ${upgrade.alt}`,
          description: `You spent $${m.cost.toFixed(2)} on ${m.model}. Switching to ${upgrade.alt} offers similar or better performance at a lower cost.`,
          potentialSavings: estimatedSavings,
          impact: estimatedSavings > 5 ? 'high' : (estimatedSavings > 1 ? 'medium' : 'low')
        });
      }
    });

    // 2. Crew Member Optimization
    // Check for crew members with unusually high cost per token (inefficient prompting or expensive model selection)
    const avgCostPer1k = summary.totalTokens > 0 ? (summary.totalCost / summary.totalTokens) * 1000 : 0;
    
    summary.byCrewMember.forEach(m => {
      const memberCostPer1k = m.tokens > 0 ? (m.cost / m.tokens) * 1000 : 0;
      // If member is 50% more expensive than average and has spent > $1
      if (memberCostPer1k > avgCostPer1k * 1.5 && m.cost > 1.0) {
        suggestions.push({
          type: 'crew',
          title: `Optimize ${m.member} configuration`,
          description: `${m.member} costs $${memberCostPer1k.toFixed(4)}/1k tokens (Avg: $${avgCostPer1k.toFixed(4)}). Review model selection and prompt verbosity.`,
          potentialSavings: m.cost * 0.2, // Conservative 20% savings estimate
          impact: 'medium'
        });
      }
    });

    return suggestions.sort((a, b) => b.potentialSavings - a.potentialSavings);
  }

  async detectAnomalies(periodDays: number, projectId?: string, sensitivity: number = 2): Promise<CostAnomaly[]> {
    const trendData = await this.getCostTrend(periodDays, projectId);

    if (trendData.length < 2) return [];

    const costs = trendData.map(d => d.cost);
    const mean = costs.reduce((a, b) => a + b, 0) / costs.length;
    const variance = costs.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / costs.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return [];

    const anomalies: CostAnomaly[] = [];

    trendData.forEach(day => {
      const zScore = (day.cost - mean) / stdDev;
      if (Math.abs(zScore) > sensitivity) {
        anomalies.push({
          date: day.date,
          cost: day.cost,
          zScore,
          severity: Math.abs(zScore) > 3 ? 'high' : (Math.abs(zScore) > 2.5 ? 'medium' : 'low')
        });
      }
    });

    // Sort by date descending (most recent first)
    return anomalies.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getBudgetHistory(projectId: string): Promise<BudgetHistoryEvent[]> {
    const { data, error } = await this.supabase.rpc('get_budget_history', {
      project_filter: projectId,
    });

    if (error) {
      console.error('Error calling get_budget_history RPC:', error);
      throw error;
    }
    return data as BudgetHistoryEvent[];
  }

  async getTopUsers(periodDays: number, projectId?: string): Promise<TopUser[]> {
    const summary = await this.getCostSummary(periodDays, projectId);
    // The summary already returns byCrewMember sorted by cost descending
    return summary.byCrewMember;
  }
}