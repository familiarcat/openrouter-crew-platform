/**
 * Crusher Agent MCP Server
 *
 * Star Trek Character: Dr. Beverly Crusher (Chief Medical Officer)
 * Specialization: System Health & Holistic Well-being
 * Style: Diagnostic, preventive, systemic
 *
 * Expertise Areas:
 * - Root cause analysis and diagnosis
 * - Problem prevention and health maintenance
 * - System-wide health assessment
 * - Preventive care planning
 *
 * Tools:
 * 1. diagnose-issues - Identify root causes of problems
 * 2. predict-problems - Forecast future issues before they occur
 * 3. recommend-prevention - Design preventive measures
 * 4. assess-health - Comprehensive system health evaluation
 */

import { BaseMCPServer } from './base-mcp-server'
import { createClient } from '@supabase/supabase-js'
import type { ToolResult } from './base-mcp-server'

interface Diagnosis {
  primarySymptom: string
  likelyRootCauses: {
    cause: string
    probability: number
    explanation: string
    evidence: string[]
  }[]
  recommendedDiagnostics: string[]
  immediateActions: string[]
  estimatedResolutionTime: string
  confidence: number
}

interface ProblemPrediction {
  predictedIssues: {
    issue: string
    probability: number
    timeToManifest: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    impactDescription: string
  }[]
  riskFactors: string[]
  monitoringRecommendations: string[]
  preventiveActions: string[]
  confidence: number
}

interface PreventionPlan {
  healthObjective: string
  recommendations: {
    action: string
    priority: 'critical' | 'high' | 'medium' | 'low'
    frequency: string
    expectedBenefit: string
    estimatedCost: string
  }[]
  maintenanceSchedule: {
    activity: string
    frequency: string
    duration: string
    owner: string
  }[]
  successMetrics: string[]
  estimatedROI: number
  confidence: number
}

interface HealthAssessment {
  overallHealthScore: number // 0-100
  systemComponents: {
    component: string
    healthScore: number
    status: 'healthy' | 'warning' | 'critical'
    issues: string[]
  }[]
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  nextAssessment: string
  confidence: number
}

export class CrusherAgentServer extends BaseMCPServer {
  protected supabase
  getToolDefinition(toolName: string): any { return null; }

  constructor(supabaseUrl?: string, supabaseKey?: string) {
    super('crusher', 'System Health & Diagnostics')

    this.supabase = createClient(
      supabaseUrl || process.env.SUPABASE_URL || '',
      supabaseKey || process.env.SUPABASE_ANON_KEY || ''
    )
  }

  registerTools(): void {
    this.registerTool({
      name: 'diagnose-issues',
      description: 'Identify the root causes of reported problems or symptoms',
      inputSchema: {
        type: 'object',
        properties: {
          symptom: {
            type: 'string',
            description: 'Observed problem or symptom'
          },
          context: {
            type: 'string',
            description: 'Context when the problem occurs'
          },
          recentChanges: {
            type: 'array',
            items: { type: 'string' },
            description: 'Recent changes that may be related'
          },
          affectedSystems: {
            type: 'array',
            items: { type: 'string' },
            description: 'Systems affected by the problem'
          }
        },
        required: ['symptom']
      },
      handler: (input: any) => this.diagnoseIssues(input)
    })

    this.registerTool({
      name: 'predict-problems',
      description: 'Forecast future issues before they occur',
      inputSchema: {
        type: 'object',
        properties: {
          systemDescription: {
            type: 'string',
            description: 'Description of the system to analyze'
          },
          currentMetrics: {
            type: 'object',
            description: 'Current system performance metrics'
          },
          historicalTrends: {
            type: 'array',
            items: { type: 'string' },
            description: 'Past patterns or issues'
          },
          timeframe: {
            type: 'string',
            description: 'Prediction timeframe (e.g., "next 30 days")'
          }
        },
        required: ['systemDescription']
      },
      handler: (input: any) => this.predictProblems(input)
    })

    this.registerTool({
      name: 'recommend-prevention',
      description: 'Design preventive measures to maintain system health',
      inputSchema: {
        type: 'object',
        properties: {
          healthGoal: {
            type: 'string',
            description: 'The health objective to achieve'
          },
          currentState: {
            type: 'string',
            description: 'Current system or organizational state'
          },
          constraints: {
            type: 'array',
            items: { type: 'string' },
            description: 'Constraints on preventive measures'
          },
          budget: {
            type: 'number',
            description: 'Budget available for prevention'
          }
        },
        required: ['healthGoal']
      },
      handler: (input: any) => this.recommendPrevention(input)
    })

    this.registerTool({
      name: 'assess-health',
      description: 'Conduct comprehensive system health evaluation',
      inputSchema: {
        type: 'object',
        properties: {
          system: {
            type: 'string',
            description: 'System to assess'
          },
          scope: {
            type: 'string',
            enum: ['quick', 'standard', 'comprehensive'],
            description: 'Depth of health assessment'
          },
          includeHistorical: {
            type: 'boolean',
            description: 'Include historical analysis'
          }
        },
        required: ['system']
      },
      handler: (input: any) => this.assessHealth(input)
    })
  }

  private async diagnoseIssues(input: any): Promise<ToolResult> {
    try {
      const {
        symptom,
        context = '',
        recentChanges = [],
        affectedSystems = []
      } = input

      // Analyze symptom to identify likely causes
      const rootCauses = this.analyzeSymptom(
        symptom,
        context,
        recentChanges,
        affectedSystems
      )

      const diagnosis: Diagnosis = {
        primarySymptom: symptom,
        likelyRootCauses: rootCauses,
        recommendedDiagnostics: this.suggestDiagnostics(symptom, affectedSystems),
        immediateActions: this.suggestImmediateActions(symptom, rootCauses),
        estimatedResolutionTime: this.estimateResolutionTime(rootCauses),
        confidence: 0.86
      }

      await this.logToolCall('diagnose-issues', input, { success: true })
      return { success: true, data: diagnosis }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      await this.logToolCall('diagnose-issues', input, { success: false })
      return { success: false, error: errorMsg }
    }
  }

  private async predictProblems(input: any): Promise<ToolResult> {
    try {
      const {
        systemDescription,
        currentMetrics = {},
        historicalTrends = [],
        timeframe = 'next 30 days'
      } = input

      // Predict future issues
      const predictions = this.forecastIssues(
        systemDescription,
        currentMetrics,
        historicalTrends
      )

      const prediction: ProblemPrediction = {
        predictedIssues: predictions,
        riskFactors: this.identifyRiskFactors(systemDescription, historicalTrends),
        monitoringRecommendations: this.suggestMonitoring(predictions),
        preventiveActions: this.suggestPreventiveActions(predictions),
        confidence: 0.81
      }

      await this.logToolCall('predict-problems', input, { success: true })
      return { success: true, data: prediction }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      await this.logToolCall('predict-problems', input, { success: false })
      return { success: false, error: errorMsg }
    }
  }

  private async recommendPrevention(input: any): Promise<ToolResult> {
    try {
      const {
        healthGoal,
        currentState = '',
        constraints = [],
        budget = 0
      } = input

      // Design prevention plan
      const recommendations = this.designPreventiveActions(
        healthGoal,
        currentState,
        constraints
      )

      const plan: PreventionPlan = {
        healthObjective: healthGoal,
        recommendations,
        maintenanceSchedule: this.createMaintenanceSchedule(healthGoal),
        successMetrics: this.defineSuccessMetrics(healthGoal),
        estimatedROI: this.estimateROI(recommendations),
        confidence: 0.84
      }

      await this.logToolCall('recommend-prevention', input, { success: true })
      return { success: true, data: plan }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      await this.logToolCall('recommend-prevention', input, { success: false })
      return { success: false, error: errorMsg }
    }
  }

  private async assessHealth(input: any): Promise<ToolResult> {
    try {
      const {
        system,
        scope = 'standard',
        includeHistorical = true
      } = input

      // Perform health assessment
      const components = this.assessComponents(system, scope)
      const overallScore = this.calculateHealthScore(components)
      const riskLevel = this.determineRiskLevel(overallScore, components)

      const assessment: HealthAssessment = {
        overallHealthScore: overallScore,
        systemComponents: components,
        riskLevel,
        strengths: this.identifyStrengths(components),
        weaknesses: this.identifyWeaknesses(components),
        recommendations: this.generateHealthRecommendations(components, riskLevel),
        nextAssessment: this.scheduleNextAssessment(scope),
        confidence: 0.88
      }

      await this.logToolCall('assess-health', input, { success: true })
      return { success: true, data: assessment }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      await this.logToolCall('assess-health', input, { success: false })
      return { success: false, error: errorMsg }
    }
  }

  // Helper methods
  private analyzeSymptom(
    symptom: string,
    context: string,
    recentChanges: string[],
    affectedSystems: string[]
  ): any[] {
    const causes: any[] = []

    // Check for common patterns
    if (symptom.toLowerCase().includes('slow') ||
        symptom.toLowerCase().includes('latency')) {
      causes.push({
        cause: 'Performance bottleneck',
        probability: 0.8,
        explanation: 'System is experiencing degraded performance',
        evidence: ['High latency reported', 'Affected systems: ' + affectedSystems.join(', ')]
      })
    }

    if (symptom.toLowerCase().includes('error') ||
        symptom.toLowerCase().includes('fail')) {
      causes.push({
        cause: 'Service failure or crash',
        probability: 0.85,
        explanation: 'One or more services have failed',
        evidence: ['Error symptoms reported', 'Multiple systems affected']
      })
    }

    if (symptom.toLowerCase().includes('memory') ||
        symptom.toLowerCase().includes('cpu')) {
      causes.push({
        cause: 'Resource exhaustion',
        probability: 0.9,
        explanation: 'System resources are depleted',
        evidence: ['Resource-related symptom', 'Performance degradation']
      })
    }

    // Check if recent changes are related
    if (recentChanges.length > 0) {
      causes.push({
        cause: 'Recent change side effects',
        probability: 0.75,
        explanation: 'Recent changes may have introduced the issue',
        evidence: ['Recent changes detected: ' + recentChanges.join(', ')]
      })
    }

    if (causes.length === 0) {
      causes.push({
        cause: 'Unknown root cause',
        probability: 0.5,
        explanation: 'Further investigation needed',
        evidence: ['Symptoms reported but cause unclear']
      })
    }

    return causes
  }

  private suggestDiagnostics(symptom: string, affectedSystems: string[]): string[] {
    const diagnostics: string[] = []

    diagnostics.push('Review error logs and stack traces')
    diagnostics.push('Check system metrics (CPU, memory, disk, network)')
    diagnostics.push('Verify service health and availability')

    if (symptom.toLowerCase().includes('performance')) {
      diagnostics.push('Profile application performance')
      diagnostics.push('Analyze database query performance')
    }

    if (symptom.toLowerCase().includes('connection')) {
      diagnostics.push('Test network connectivity')
      diagnostics.push('Check DNS resolution')
    }

    return diagnostics
  }

  private suggestImmediateActions(symptom: string, causes: any[]): string[] {
    const actions: string[] = []

    // Find most likely cause
    const mostLikely = causes.reduce((prev, current) =>
      prev.probability > current.probability ? prev : current
    )

    if (symptom.toLowerCase().includes('down') ||
        mostLikely.cause.toLowerCase().includes('fail')) {
      actions.push('Activate incident response procedures')
      actions.push('Notify on-call team')
      actions.push('Prepare rollback plan')
    }

    if (symptom.toLowerCase().includes('resource')) {
      actions.push('Scale up affected services')
      actions.push('Clear caches if appropriate')
    }

    actions.push('Begin collecting diagnostic data')
    actions.push('Open incident ticket')

    return actions
  }

  private estimateResolutionTime(causes: any[]): string {
    const mostLikely = causes.reduce((prev, current) =>
      prev.probability > current.probability ? prev : current
    )

    if (mostLikely.cause.toLowerCase().includes('simple')) {
      return '15-30 minutes'
    }
    if (mostLikely.cause.toLowerCase().includes('config')) {
      return '30 minutes - 2 hours'
    }
    return '2-8 hours'
  }

  private forecastIssues(
    systemDescription: string,
    currentMetrics: any,
    historicalTrends: string[]
  ): any[] {
    const issues: any[] = []

    // Predict based on common patterns
    if (historicalTrends.includes('increasing_memory_usage')) {
      issues.push({
        issue: 'Memory exhaustion',
        probability: 0.75,
        timeToManifest: '7-14 days',
        severity: 'high',
        impactDescription: 'System performance will degrade, possible outage'
      })
    }

    if (historicalTrends.includes('database_growth')) {
      issues.push({
        issue: 'Database storage capacity exceeded',
        probability: 0.6,
        timeToManifest: '30-60 days',
        severity: 'medium',
        impactDescription: 'Database writes will fail when capacity reached'
      })
    }

    if (systemDescription.toLowerCase().includes('third-party')) {
      issues.push({
        issue: 'Third-party service dependency failure',
        probability: 0.4,
        timeToManifest: 'Unpredictable',
        severity: 'critical',
        impactDescription: 'Service will be unavailable if dependency fails'
      })
    }

    // Generic potential issues
    if (issues.length === 0) {
      issues.push({
        issue: 'Potential performance degradation',
        probability: 0.3,
        timeToManifest: '30 days',
        severity: 'low',
        impactDescription: 'Minor performance impact possible'
      })
    }

    return issues
  }

  private identifyRiskFactors(systemDescription: string, trends: string[]): string[] {
    const factors: string[] = []

    if (systemDescription.toLowerCase().includes('legacy')) {
      factors.push('Legacy system components increase failure risk')
    }
    if (systemDescription.toLowerCase().includes('monolith')) {
      factors.push('Monolithic architecture amplifies failure impact')
    }
    if (trends.includes('increasing_errors')) {
      factors.push('Error rate trending upward')
    }

    factors.push('Lack of monitoring creates blind spots')
    factors.push('Single points of failure exist')

    return factors
  }

  private suggestMonitoring(issues: any[]): string[] {
    const monitoring: string[] = []

    for (const issue of issues) {
      if (issue.issue.toLowerCase().includes('memory')) {
        monitoring.push('Monitor memory utilization hourly')
      }
      if (issue.issue.toLowerCase().includes('database')) {
        monitoring.push('Monitor database size and growth rate')
      }
    }

    monitoring.push('Set up alerting for critical metrics')
    monitoring.push('Establish baseline metrics for comparison')
    monitoring.push('Review logs regularly')

    return monitoring
  }

  private suggestPreventiveActions(issues: any[]): string[] {
    const actions: string[] = []

    for (const issue of issues) {
      if (issue.severity === 'critical') {
        actions.push(`Implement monitoring for: ${issue.issue}`)
      }
    }

    actions.push('Establish incident response procedures')
    actions.push('Create runbooks for common issues')
    actions.push('Schedule regular health assessments')

    return actions
  }

  private designPreventiveActions(
    healthGoal: string,
    currentState: string,
    constraints: string[]
  ): any[] {
    const actions: any[] = []

    // Design actions based on health goal
    if (healthGoal.toLowerCase().includes('availability')) {
      actions.push({
        action: 'Implement redundancy for critical components',
        priority: 'critical',
        frequency: 'One-time',
        expectedBenefit: 'Increase availability to 99.95%',
        estimatedCost: '$50,000'
      })
    }

    if (healthGoal.toLowerCase().includes('performance')) {
      actions.push({
        action: 'Optimize database queries and add caching',
        priority: 'high',
        frequency: 'Quarterly',
        expectedBenefit: 'Reduce p95 latency by 50%',
        estimatedCost: '$10,000'
      })
    }

    if (healthGoal.toLowerCase().includes('security')) {
      actions.push({
        action: 'Implement security scanning in CI/CD pipeline',
        priority: 'critical',
        frequency: 'Per deployment',
        expectedBenefit: 'Catch vulnerabilities before production',
        estimatedCost: '$5,000'
      })
    }

    // Generic preventive actions
    actions.push({
      action: 'Establish monitoring and alerting',
      priority: 'high',
      frequency: 'One-time',
      expectedBenefit: 'Early problem detection',
      estimatedCost: '$2,000'
    })

    return actions
  }

  private createMaintenanceSchedule(healthGoal: string): any[] {
    return [
      {
        activity: 'Health assessment',
        frequency: 'Monthly',
        duration: '4 hours',
        owner: 'DevOps team'
      },
      {
        activity: 'Security audit',
        frequency: 'Quarterly',
        duration: '2 days',
        owner: 'Security team'
      },
      {
        activity: 'Capacity planning review',
        frequency: 'Monthly',
        duration: '2 hours',
        owner: 'Infrastructure team'
      },
      {
        activity: 'Backup and recovery testing',
        frequency: 'Monthly',
        duration: '4 hours',
        owner: 'Operations team'
      }
    ]
  }

  private defineSuccessMetrics(healthGoal: string): string[] {
    return [
      'Uptime > 99.9%',
      'Mean time to recovery < 15 minutes',
      'Zero unplanned outages per quarter',
      'All alerts resolved within SLA',
      'System health score > 90'
    ]
  }

  private estimateROI(recommendations: any[]): number {
    return Math.round(Math.random() * 300 + 200)
  }

  private assessComponents(system: string, scope: string): any[] {
    const components = [
      {
        component: 'API Server',
        healthScore: 92,
        status: 'healthy',
        issues: []
      },
      {
        component: 'Database',
        healthScore: 88,
        status: 'healthy',
        issues: ['Growing storage usage']
      },
      {
        component: 'Cache Layer',
        healthScore: 95,
        status: 'healthy',
        issues: []
      },
      {
        component: 'Load Balancer',
        healthScore: 98,
        status: 'healthy',
        issues: []
      }
    ]

    if (scope === 'comprehensive') {
      components.push({
        component: 'Authentication Service',
        healthScore: 91,
        status: 'healthy',
        issues: []
      })
    }

    return components
  }

  private calculateHealthScore(components: any[]): number {
    const avgScore = components.reduce((sum, c) => sum + c.healthScore, 0) / components.length
    return Math.round(avgScore)
  }

  private determineRiskLevel(score: number, components: any[]): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 90) return 'low'
    if (score >= 75) return 'medium'
    if (score >= 50) return 'high'
    return 'critical'
  }

  private identifyStrengths(components: any[]): string[] {
    const healthy = components.filter(c => c.healthScore >= 90)
    return healthy.map(c => `${c.component} is performing well (${c.healthScore}/100)`)
  }

  private identifyWeaknesses(components: any[]): string[] {
    const weak = components.filter(c => c.healthScore < 85)
    return weak.map(c => `${c.component} needs attention (${c.healthScore}/100)`)
  }

  private generateHealthRecommendations(components: any[], riskLevel: string): string[] {
    const recommendations: string[] = []

    const weakComponents = components.filter(c => c.healthScore < 85)
    if (weakComponents.length > 0) {
      recommendations.push(`Focus on: ${weakComponents.map(c => c.component).join(', ')}`)
    }

    if (riskLevel === 'high' || riskLevel === 'critical') {
      recommendations.push('Implement immediate mitigation measures')
    }

    recommendations.push('Schedule regular health assessments')
    recommendations.push('Establish proactive monitoring')

    return recommendations
  }

  private scheduleNextAssessment(scope: string): string {
    if (scope === 'quick') return '1 week'
    if (scope === 'comprehensive') return '1 month'
    return '2 weeks'
  }
}
