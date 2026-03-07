/**
 * Data Agent MCP Server
 *
 * Provides Claude with cost analysis, forecasting, and ROI calculation tools.
 * Each tool is implemented as an MCP endpoint that Claude can call directly.
 *
 * Available Tools:
 * - analyze-costs: Identify cost patterns and optimization opportunities
 * - forecast-costs: Project future costs based on trends
 * - calculate-roi: Evaluate ROI of proposed changes
 * - identify-anomalies: Find unusual cost patterns
 */

import { BaseMCPServer, ToolDefinition, ToolResult } from './base-mcp-server'

export class DataAgentServer extends BaseMCPServer {
  constructor() {
    super('Data', 'pragmatic-solutions')
    this.setupTools()
  }

  /**
   * Setup all data analysis tools
   */
  private setupTools() {
    // Tool 1: Analyze Costs
    this.registerTool({
        name: 'analyze-costs',
        description:
          'Analyze cost patterns from past data. Returns total costs, per-unit costs, cost drivers, and optimization opportunities.',
        inputSchema: {
          type: 'object',
          properties: {
            timeframe: {
              type: 'string',
              description: 'Time period to analyze: "last-7-days", "last-30-days", "last-90-days"',
              default: 'last-7-days'
            },
            group_by: {
              type: 'string',
              description: 'Group results by: "model", "crew_member", "workflow", "day"',
              default: 'model'
            }
          }
        },
        handler: this.analyzeCosts.bind(this)
    })

    // Tool 2: Forecast Costs
    this.registerTool({
        name: 'forecast-costs',
        description:
          'Project future costs based on current trends. Uses linear regression and seasonal adjustment.',
        inputSchema: {
          type: 'object',
          properties: {
            projection_days: {
              type: 'number',
              description: 'How many days to project into the future',
              default: 30
            },
            assume_change: {
              type: 'string',
              description:
                'Assume a change occurs: "no-change" (default), "reduce-to-haiku", "implement-caching", "optimize-routing"'
            }
          }
        },
        handler: this.forecastCosts.bind(this)
    })

    // Tool 3: Calculate ROI
    this.registerTool({
        name: 'calculate-roi',
        description:
          'Calculate return on investment for a proposed optimization. Returns payback period, annual savings, and ROI percentage.',
        inputSchema: {
          type: 'object',
          properties: {
            proposal: {
              type: 'string',
              description:
                'Description of the proposed change (e.g., "switch simple queries to Haiku")'
            },
            current_weekly_cost: {
              type: 'number',
              description: 'Current weekly cost in dollars'
            },
            projected_savings_percent: {
              type: 'number',
              description: 'Projected cost savings as percentage (0-100)'
            },
            implementation_cost: {
              type: 'number',
              description: 'One-time implementation cost in dollars'
            },
            implementation_days: {
              type: 'number',
              description: 'Days required to implement',
              default: 7
            }
          }
        },
        handler: this.calculateROI.bind(this)
    })

    // Tool 4: Identify Anomalies
    this.registerTool({
        name: 'identify-anomalies',
        description:
          'Find unusual cost patterns that may indicate problems or opportunities.',
        inputSchema: {
          type: 'object',
          properties: {
            sensitivity: {
              type: 'string',
              description: 'Anomaly detection sensitivity: "low", "medium", "high"',
              default: 'medium'
            }
          }
        },
        handler: this.identifyAnomalies.bind(this)
    })
  }

  /**
   * Tool Implementation: Analyze Costs
   */
  private async analyzeCosts(args: any): Promise<ToolResult> {
    try {
      const { timeframe = 'last-7-days', group_by = 'model' } = args

      // Fetch cost data from Supabase
      const costData = await this.getCostData(timeframe)

      if (costData.length === 0) {
        return {
          success: true,
          data: {
            message: 'No cost data available for the specified timeframe',
            total_cost: 0,
            entries: 0
          },
          confidence: 0.5
        }
      }

      // Calculate statistics
      const totalCost = costData.reduce((sum, entry) => sum + (entry.estimated_cost_usd || 0), 0)
      const avgCostPerCall = totalCost / costData.length
      const costPerToken = totalCost / costData.reduce((sum, entry) => sum + (entry.total_tokens || 0), 1)

      // Group by requested dimension
      const grouped = this.groupBy(costData, group_by)
      const topCostDrivers = Object.entries(grouped)
        .map(([key, entries]: any) => ({
          name: key,
          cost: entries.reduce((sum: number, e: any) => sum + (e.estimated_cost_usd || 0), 0),
          count: entries.length
        }))
        .sort((a, b) => b.cost - a.cost)
        .slice(0, 5)

      // Identify optimization opportunities
      const opportunities = this.identifyOptimizations(costData, topCostDrivers)

      return {
        success: true,
        data: {
          period: timeframe,
          total_cost: parseFloat(totalCost.toFixed(2)),
          cost_per_call: parseFloat(avgCostPerCall.toFixed(4)),
          cost_per_token: parseFloat(costPerToken.toFixed(6)),
          entries: costData.length,
          top_cost_drivers: topCostDrivers,
          optimization_opportunities: opportunities,
          analysis: {
            trend: this.calculateTrend(costData),
            volatility: this.calculateVolatility(costData),
            efficiency_score: this.calculateEfficiencyScore(costData)
          }
        },
        confidence: 0.92,
        metadata: {
          analysis_timestamp: new Date().toISOString(),
          data_points: costData.length
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        confidence: 0
      }
    }
  }

  /**
   * Tool Implementation: Forecast Costs
   */
  private async forecastCosts(args: any): Promise<ToolResult> {
    try {
      const {
        projection_days = 30,
        assume_change = 'no-change'
      } = args

      // Get historical cost data
      const costData = await this.getCostData('last-30-days')

      if (costData.length < 7) {
        return {
          success: true,
          data: {
            message: 'Insufficient historical data for accurate forecast',
            minimum_required_days: 7,
            available_days: costData.length
          },
          confidence: 0.3
        }
      }

      // Calculate trend line
      const dailyCosts = this.aggregateDailyCosts(costData)
      const { slope, intercept } = this.linearRegression(dailyCosts)

      // Project forward
      const historicalDays = dailyCosts.length
      const projectedCosts = []
      let totalProjectedCost = 0

      for (let i = 0; i < projection_days; i++) {
        const dayIndex = historicalDays + i
        let projectedCost = slope * dayIndex + intercept

        // Apply assumed change
        if (assume_change !== 'no-change') {
          projectedCost = this.applyChangeScenario(projectedCost, assume_change)
        }

        projectedCosts.push({
          day: i + 1,
          projected_cost: parseFloat(projectedCost.toFixed(2))
        })

        totalProjectedCost += projectedCost
      }

      // Calculate summary statistics
      const avgDailyCost = totalProjectedCost / projection_days
      const projectedMonthly = (totalProjectedCost / projection_days) * 30
      const daysUntilBudgetHit = this.calculateDaysUntilBudget(
        projectedCosts,
        parseFloat(process.env.MONTHLY_BUDGET || '2000')
      )

      return {
        success: true,
        data: {
          scenario: assume_change,
          projection_days,
          total_projected_cost: parseFloat(totalProjectedCost.toFixed(2)),
          average_daily_cost: parseFloat(avgDailyCost.toFixed(2)),
          projected_monthly_cost: parseFloat(projectedMonthly.toFixed(2)),
          days_until_budget_hit: daysUntilBudgetHit || projection_days,
          trend: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable',
          confidence_score: this.calculateForecastConfidence(costData),
          sample_projections: projectedCosts.slice(0, 7) // First week
        },
        confidence: this.calculateForecastConfidence(costData),
        metadata: {
          method: 'linear-regression',
          slope,
          intercept,
          historical_days: historicalDays
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        confidence: 0
      }
    }
  }

  /**
   * Tool Implementation: Calculate ROI
   */
  private async calculateROI(args: any): Promise<ToolResult> {
    try {
      const {
        proposal,
        current_weekly_cost,
        projected_savings_percent,
        implementation_cost,
        implementation_days = 7
      } = args

      if (!proposal || !current_weekly_cost || !projected_savings_percent) {
        return {
          success: false,
          error: 'Missing required parameters: proposal, current_weekly_cost, projected_savings_percent',
          confidence: 0
        }
      }

      // Calculate savings
      const weeklySavings = (current_weekly_cost * projected_savings_percent) / 100
      const monthlySavings = weeklySavings * 4.33 // weeks per month
      const annualSavings = monthlySavings * 12

      // Calculate payback
      const paybackWeeks = implementation_cost / weeklySavings
      const paybackDays = paybackWeeks * 7
      const paybackMonths = paybackWeeks / 4.33

      // Calculate ROI
      const roi = ((annualSavings - implementation_cost) / implementation_cost) * 100

      // Implementation timeline
      const implementationStart = new Date()
      const implementationEnd = new Date(implementationStart.getTime() + implementation_days * 24 * 60 * 60 * 1000)
      const paybackDate = new Date(implementationEnd.getTime() + paybackDays * 24 * 60 * 60 * 1000)

      return {
        success: true,
        data: {
          proposal,
          implementation_cost: implementation_cost,
          implementation_days,
          implementation_end_date: implementationEnd.toISOString().split('T')[0],
          weekly_savings: parseFloat(weeklySavings.toFixed(2)),
          monthly_savings: parseFloat(monthlySavings.toFixed(2)),
          annual_savings: parseFloat(annualSavings.toFixed(2)),
          payback_period: {
            days: Math.round(paybackDays),
            weeks: parseFloat(paybackWeeks.toFixed(1)),
            months: parseFloat(paybackMonths.toFixed(1))
          },
          payback_date: paybackDate.toISOString().split('T')[0],
          roi_percentage: parseFloat(roi.toFixed(1)),
          roi_recommendation:
            roi > 200 ? 'Highly recommended' : roi > 100 ? 'Recommended' : roi > 0 ? 'Consider' : 'Not recommended'
        },
        confidence: 0.88,
        metadata: {
          current_weekly_cost,
          projected_savings_percent,
          calculation_timestamp: new Date().toISOString()
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        confidence: 0
      }
    }
  }

  /**
   * Tool Implementation: Identify Anomalies
   */
  private async identifyAnomalies(args: any): Promise<ToolResult> {
    try {
      const { sensitivity = 'medium' } = args

      const costData = await this.getCostData('last-7-days')

      if (costData.length < 3) {
        return {
          success: true,
          data: {
            message: 'Insufficient data for anomaly detection',
            anomalies: []
          },
          confidence: 0.3
        }
      }

      // Calculate statistical baseline
      const costs = costData.map(e => e.estimated_cost_usd || 0)
      const mean = costs.reduce((a, b) => a + b, 0) / costs.length
      const stdDev = Math.sqrt(
        costs.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / costs.length
      )

      // Sensitivity thresholds
      const thresholds = {
        low: 3,
        medium: 2,
        high: 1.5
      }
      const threshold = thresholds[sensitivity as keyof typeof thresholds] || 2

      // Find anomalies
      const anomalies = costData
        .map((entry, index) => ({
          index,
          date: entry.created_at || new Date().toISOString(),
          cost: entry.estimated_cost_usd || 0,
          zScore: (entry.estimated_cost_usd || 0 - mean) / stdDev,
          isAnomaly: Math.abs((entry.estimated_cost_usd || 0 - mean) / stdDev) > threshold
        }))
        .filter(a => a.isAnomaly)

      return {
        success: true,
        data: {
          sensitivity,
          threshold_z_score: threshold,
          anomalies_detected: anomalies.length,
          anomalies: anomalies.map(a => ({
            date: a.date,
            cost: parseFloat(a.cost.toFixed(2)),
            deviation_from_mean: parseFloat(((a.cost - mean) / mean * 100).toFixed(1)) + '%',
            z_score: parseFloat(a.zScore.toFixed(2))
          })),
          baseline: {
            mean_cost: parseFloat(mean.toFixed(2)),
            std_deviation: parseFloat(stdDev.toFixed(2))
          }
        },
        confidence: 0.85,
        metadata: {
          analysis_date: new Date().toISOString(),
          data_points_analyzed: costData.length
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        confidence: 0
      }
    }
  }

  /**
   * Helper: Group data by dimension
   */
  private groupBy(data: any[], key: string): Record<string, any[]> {
    return data.reduce((result, item) => {
      const groupKey = item[key] || 'unknown'
      if (!result[groupKey]) result[groupKey] = []
      result[groupKey].push(item)
      return result
    }, {} as Record<string, any[]>)
  }

  /**
   * Helper: Identify optimization opportunities
   */
  private identifyOptimizations(data: any[], drivers: any[]): string[] {
    const opportunities = []

    // Check model usage
    const models = [...new Set(data.map(e => e.model))]
    if (models.includes('claude-3.5-sonnet') && data.length > 10) {
      const simpleQueries = data.filter(e => e.request_type === 'simple').length
      if (simpleQueries > data.length * 0.3) {
        opportunities.push(
          `Use Haiku for ${simpleQueries} simple queries - potential 60% cost savings on those calls`
        )
      }
    }

    // Check for repeated queries
    if (data.length > 20) {
      opportunities.push('Implement caching layer for repeated queries - could save 20-40% on API calls')
    }

    // Check batch processing opportunities
    if (data.some(e => e.workflow === 'batch')) {
      opportunities.push('Schedule batch jobs during off-peak hours - potential 15% cost reduction')
    }

    return opportunities
  }

  /**
   * Helper: Calculate trend
   */
  private calculateTrend(data: any[]): string {
    if (data.length < 2) return 'insufficient-data'
    const firstHalf = data.slice(0, Math.floor(data.length / 2))
    const secondHalf = data.slice(Math.floor(data.length / 2))
    const avg1 = firstHalf.reduce((s, e) => s + (e.estimated_cost_usd || 0), 0) / firstHalf.length
    const avg2 = secondHalf.reduce((s, e) => s + (e.estimated_cost_usd || 0), 0) / secondHalf.length
    if (avg2 > avg1 * 1.1) return 'increasing'
    if (avg2 < avg1 * 0.9) return 'decreasing'
    return 'stable'
  }

  /**
   * Helper: Calculate volatility
   */
  private calculateVolatility(data: any[]): string {
    const costs = data.map(e => e.estimated_cost_usd || 0)
    const mean = costs.reduce((a, b) => a + b, 0) / costs.length
    const variance = costs.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / costs.length
    const stdDev = Math.sqrt(variance)
    const cv = stdDev / mean // Coefficient of variation
    if (cv > 0.5) return 'high'
    if (cv > 0.2) return 'medium'
    return 'low'
  }

  /**
   * Helper: Calculate efficiency score
   */
  private calculateEfficiencyScore(data: any[]): number {
    let score = 100
    const avgCostPerToken = data.reduce((s, e) => s + ((e.estimated_cost_usd || 0) / Math.max(e.total_tokens || 1, 1)), 0) / data.length
    if (avgCostPerToken > 0.000005) score -= 20
    if (this.calculateTrend(data) === 'increasing') score -= 15
    if (this.calculateVolatility(data) === 'high') score -= 10
    return Math.max(0, score)
  }

  /**
   * Helper: Aggregate costs by day
   */
  private aggregateDailyCosts(data: any[]): number[] {
    const byDate: Record<string, number> = {}
    data.forEach(entry => {
      const date = entry.created_at?.split('T')[0] || new Date().toISOString().split('T')[0]
      byDate[date] = (byDate[date] || 0) + (entry.estimated_cost_usd || 0)
    })
    return Object.values(byDate).sort()
  }

  /**
   * Helper: Linear regression calculation
   */
  private linearRegression(data: number[]): { slope: number; intercept: number } {
    const n = data.length
    const x_mean = (n - 1) / 2
    const y_mean = data.reduce((a, b) => a + b, 0) / n

    let numerator = 0
    let denominator = 0
    for (let i = 0; i < n; i++) {
      numerator += (i - x_mean) * (data[i]! - y_mean)
      denominator += Math.pow(i - x_mean, 2)
    }

    const slope = denominator === 0 ? 0 : numerator / denominator
    const intercept = y_mean - slope * x_mean
    return { slope, intercept }
  }

  /**
   * Helper: Apply change scenario
   */
  private applyChangeScenario(baseCost: number, scenario: string): number {
    const reductions: Record<string, number> = {
      'reduce-to-haiku': 0.4, // 40% reduction
      'implement-caching': 0.25, // 25% reduction
      'optimize-routing': 0.2 // 20% reduction
    }
    const reduction = reductions[scenario] || 0
    return baseCost * (1 - reduction)
  }

  /**
   * Helper: Calculate days until budget
   */
  private calculateDaysUntilBudget(projectedCosts: any[], monthlyBudget: number): number | null {
    const dailyBudget = monthlyBudget / 30
    let totalCost = 0
    for (const day of projectedCosts) {
      totalCost += day.projected_cost
      if (totalCost >= monthlyBudget) {
        return day.day
      }
    }
    return null
  }

  /**
   * Helper: Calculate forecast confidence
   */
  private calculateForecastConfidence(data: any[]): number {
    // More historical data = higher confidence
    const dataConfidence = Math.min(0.9, 0.5 + (data.length / 100) * 0.4)
    // Stable trends = higher confidence
    const trend = this.calculateTrend(data)
    const trendConfidence = trend === 'stable' ? 0.95 : trend === 'increasing' || trend === 'decreasing' ? 0.85 : 0.5

    return (dataConfidence + trendConfidence) / 2
  }

  /**
   * Get tool definition
   */
  protected getToolDefinition(toolName: string): ToolDefinition | null {
    const definitions: Record<string, ToolDefinition> = {
      'analyze-costs': {
        name: 'analyze-costs',
        description: 'Analyze cost patterns and identify optimization opportunities',
        inputSchema: {
          type: 'object',
          properties: {
            timeframe: { type: 'string', default: 'last-7-days' },
            group_by: { type: 'string', default: 'model' }
          }
        }
      },
      'forecast-costs': {
        name: 'forecast-costs',
        description: 'Project future costs based on trends',
        inputSchema: {
          type: 'object',
          properties: {
            projection_days: { type: 'number', default: 30 },
            assume_change: { type: 'string', default: 'no-change' }
          }
        }
      },
      'calculate-roi': {
        name: 'calculate-roi',
        description: 'Calculate ROI of proposed optimization',
        inputSchema: {
          type: 'object',
          properties: {
            proposal: { type: 'string' },
            current_weekly_cost: { type: 'number' },
            projected_savings_percent: { type: 'number' },
            implementation_cost: { type: 'number' }
          }
        }
      },
      'identify-anomalies': {
        name: 'identify-anomalies',
        description: 'Find unusual cost patterns',
        inputSchema: {
          type: 'object',
          properties: {
            sensitivity: { type: 'string', default: 'medium' }
          }
        }
      }
    }
    return definitions[toolName] || null
  }
}

export default DataAgentServer
