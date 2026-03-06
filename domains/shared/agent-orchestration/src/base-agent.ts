/**
 * Base Agent Class
 *
 * Implements common functionality for all TNG crew agents
 * Handles decision-making, conflict resolution, and DDD execution
 */

import {
  Agent,
  Problem,
  Recommendation,
  SynthesizedSolution,
  FeasibilityAssessment,
  ExecutionResult,
  ImpactAssessment,
  CrewRole,
  TngPersona,
  DecisionStyle,
  ImplementationPlan,
  DddDomain
} from './types'

export abstract class BaseAgent implements Agent {
  abstract id: string
  abstract name: string
  abstract role: CrewRole
  abstract persona: TngPersona
  abstract expertise: string[]
  abstract decisionStyle: DecisionStyle

  /**
   * Each agent provides their recommendation based on their expertise
   * Subclasses should override this with role-specific logic
   */
  abstract recommend(problem: Problem): Promise<Recommendation>

  /**
   * Synthesize two conflicting recommendations into a unified solution
   * May require consultation with other agents
   */
  abstract synthesizeConflict(
    rec1: Recommendation,
    rec2: Recommendation
  ): Promise<SynthesizedSolution>

  /**
   * Assess whether a solution is feasible to implement
   * Used by Geordi, Infrastructure agents
   */
  abstract assessFeasibility(solution: SynthesizedSolution): Promise<FeasibilityAssessment>

  /**
   * Execute solution across DDD domains
   * Coordinates with other agents and domains
   */
  abstract execute(plan: ImplementationPlan): Promise<ExecutionResult>

  /**
   * Assess impact of solution on stakeholders
   * Used by Troi, User Experience agents
   */
  abstract assessImpact(solution: SynthesizedSolution): Promise<ImpactAssessment>

  /**
   * Calculate confidence score for a recommendation
   * Based on data quality, historical accuracy, etc.
   */
  protected calculateConfidence(
    dataQuality: number,
    historicalAccuracy: number,
    uncertaintyFactors: number = 0
  ): number {
    // Start with data quality (0-1)
    let confidence = dataQuality * 0.6 + historicalAccuracy * 0.4

    // Reduce by uncertainty factors (each factor reduces by 5%)
    confidence = Math.max(0, confidence - uncertaintyFactors * 0.05)

    // Floor at 0, ceiling at 1
    return Math.min(1, Math.max(0, confidence))
  }

  /**
   * Identify risks associated with a recommendation
   */
  protected identifyRisks(
    recommendation: Recommendation,
    constraints: string[]
  ): { description: string; severity: 'critical' | 'high' | 'medium' | 'low' }[] {
    const risks: { description: string; severity: 'critical' | 'high' | 'medium' | 'low' }[] = []

    // Check against constraints
    constraints.forEach(constraint => {
      if (recommendation.recommendation.toLowerCase().includes('reduce')) {
        risks.push({
          description: `Proposed reduction may violate "${constraint}" constraint`,
          severity: 'high'
        })
      }
    })

    return risks
  }

  /**
   * Calculate estimated impact on various metrics
   */
  protected calculateImpact(
    changeType: string,
    magnitude: number
  ): Record<string, number | string> {
    // Default impact calculation (subclasses can override)
    const impacts: Record<string, number | string> = {
      complexity_change: magnitude * 0.1,
      risk_level: 'medium'
    }

    return impacts
  }

  /**
   * Determine if this agent can make a final decision
   * or if captain approval is needed
   */
  protected requiresCaptainApproval(solution: SynthesizedSolution): boolean {
    // High-impact decisions require captain approval
    const criticalMetrics = ['cost', 'security', 'compliance', 'user-experience']
    const impactsCritical = Object.keys(solution.expectedOutcomes).some(key =>
      criticalMetrics.includes(key)
    )

    return impactsCritical
  }

  /**
   * Log agent decision for audit trail
   */
  protected async logDecision(
    action: string,
    reasoning: string,
    confidence: number
  ): Promise<void> {
    console.log(
      `[${this.persona}] ${action} (confidence: ${(confidence * 100).toFixed(0)}%) - ${reasoning}`
    )

    // In production, this would write to audit log in agent memory
    // await auditLog.record({
    //   agent: this.persona,
    //   action,
    //   reasoning,
    //   confidence,
    //   timestamp: new Date()
    // })
  }

  /**
   * Wait for another agent's recommendation/analysis
   * Used when agents consult with each other
   */
  protected async consultAgent(
    agentId: string,
    question: string
  ): Promise<string> {
    // In production, this would send a request to another agent
    // and wait for their response
    console.log(`[${this.persona}] Consulting ${agentId}: ${question}`)

    // Simulated response
    return `Response from agent ${agentId}`
  }

  /**
   * Submit finding to observation lounge
   * Records lesson learned for future reference
   */
  protected async submitObservationLoungeFinding(
    finding: string,
    type: 'conflict-resolution' | 'synthesis' | 'pattern' | 'lesson',
    confidence: number
  ): Promise<void> {
    console.log(`[${this.persona}] Submitting to Observation Lounge (type: ${type}):`)
    console.log(`  ${finding}`)
    console.log(`  Confidence: ${(confidence * 100).toFixed(0)}%`)

    // In production, this would submit to the observation lounge system
    // await observationLounge.submitFinding({
    //   finding,
    //   type,
    //   confidence,
    //   submittedBy: this.name,
    //   agentRole: this.role
    // })
  }
}

/**
 * Data Agent - Star Trek TNG "Data"
 * Role: Pragmatic Solutions
 * Decision Style: Logical, risk-balanced, thorough
 */
export class DataAgent extends BaseAgent {
  id = 'agent_data'
  name = 'Data'
  role = 'pragmatic-solutions' as CrewRole
  persona = 'Data' as TngPersona
  expertise = ['logic', 'analysis', 'mathematics', 'optimization', 'algorithms']
  decisionStyle: DecisionStyle = {
    type: 'logical',
    speedVsAccuracy: 'thorough',
    riskTolerance: 'balanced'
  }

  async recommend(problem: Problem): Promise<Recommendation> {
    // Data provides logical, data-driven recommendations
    return {
      id: `rec_data_${Date.now()}`,
      agentId: this.id,
      agentName: this.name,
      agentRole: this.role,
      agentPersona: this.persona,
      problem,
      recommendation: 'Analyze all variables logically and recommend optimal solution',
      rationale: 'Based on mathematical analysis of constraints and objectives',
      estimatedImpact: {
        efficiency: '+15%',
        cost_reduction: '-$300/week'
      },
      confidence: 0.85,
      risks: [
        {
          description: 'Logical optimization may not account for human factors',
          severity: 'medium'
        }
      ],
      benefits: ['Cost optimized', 'Mathematically proven', 'Scalable'],
      submittedAt: new Date()
    }
  }

  async synthesizeConflict(
    rec1: Recommendation,
    rec2: Recommendation
  ): Promise<SynthesizedSolution> {
    // Data finds the mathematical optimum that satisfies both
    return {
      id: `syn_data_${Date.now()}`,
      sessionId: 'session_' + Date.now(),
      problem: rec1.problem,
      solution: 'Hybrid approach: Use both solutions where they are strongest',
      approach:
        'Allocate resources based on objective function that maximizes both constraints',
      rationale: 'Mathematical proof that both recommendations can coexist in unified solution',
      addressedConflicts: [],
      leveragedSynergies: [],
      expectedOutcomes: {
        combined_benefit: '+25%'
      },
      implementationPlan: [],
      riskMitigation: [],
      synthesisConfidence: 0.88,
      approvedBy: 'Picard',
      approvedAt: new Date()
    }
  }

  async assessFeasibility(solution: SynthesizedSolution): Promise<FeasibilityAssessment> {
    // Data assesses technical feasibility
    return {
      feasible: true,
      confidence: 0.85,
      timelineEstimate: 40,
      resourcesNeeded: ['development-time', 'server-resources'],
      blockers: [],
      alternativeApproaches: ['approach-b', 'approach-c']
    }
  }

  async execute(plan: ImplementationPlan): Promise<ExecutionResult> {
    throw new Error('Data does not execute directly. Geordi (Infrastructure) executes.')
  }

  async assessImpact(solution: SynthesizedSolution): Promise<ImpactAssessment> {
    // Data provides logical impact assessment (but may miss human factors)
    return {
      stakeholders: ['developers', 'users', 'operations'],
      emotionalImpact: 'neutral',
      adoptionLikelihood: 0.7,
      hiddenConcerns: [
        'May not account for organizational culture',
        'Human resistance to change not quantified'
      ],
      suggestions: ['Consult Troi for empathy assessment', 'Involve team in planning']
    }
  }
}

/**
 * Worf Agent - Star Trek TNG "Worf"
 * Role: Security & Compliance
 * Decision Style: Conservative, risk-averse
 */
export class WorfAgent extends BaseAgent {
  id = 'agent_worf'
  name = 'Worf'
  role = 'security-compliance' as CrewRole
  persona = 'Worf' as TngPersona
  expertise = ['security', 'compliance', 'risk-management', 'governance', 'ethics']
  decisionStyle: DecisionStyle = {
    type: 'conservative',
    speedVsAccuracy: 'thorough',
    riskTolerance: 'risk-averse'
  }

  async recommend(problem: Problem): Promise<Recommendation> {
    // Worf recommends the safest approach
    return {
      id: `rec_worf_${Date.now()}`,
      agentId: this.id,
      agentName: this.name,
      agentRole: this.role,
      agentPersona: this.persona,
      problem,
      recommendation: 'Maintain current posture with enhanced monitoring',
      rationale: 'Security and compliance must not be compromised',
      estimatedImpact: {
        risk_reduction: '+20%',
        compliance: 'maintained'
      },
      confidence: 0.92,
      risks: [
        {
          description: 'May be overly conservative, limiting growth',
          severity: 'low'
        }
      ],
      benefits: ['Zero compliance risk', 'Enhanced security', 'Audit trail maintained'],
      submittedAt: new Date()
    }
  }

  async synthesizeConflict(
    rec1: Recommendation,
    rec2: Recommendation
  ): Promise<SynthesizedSolution> {
    // Worf ensures security requirements are met in synthesis
    return {
      id: `syn_worf_${Date.now()}`,
      sessionId: 'session_' + Date.now(),
      problem: rec1.problem,
      solution: 'Implement with mandatory security controls and compliance verification',
      approach: 'Add compliance layer to solution while maintaining risk posture',
      rationale: 'Both solutions can proceed with proper security implementation',
      addressedConflicts: [],
      leveragedSynergies: [],
      expectedOutcomes: {
        compliance: 'verified',
        security_risk: 'minimal'
      },
      implementationPlan: [],
      riskMitigation: [],
      synthesisConfidence: 0.89,
      approvedBy: 'Picard',
      approvedAt: new Date()
    }
  }

  async assessFeasibility(solution: SynthesizedSolution): Promise<FeasibilityAssessment> {
    return {
      feasible: true,
      confidence: 0.88,
      timelineEstimate: 60,  // Worf adds compliance verification time
      resourcesNeeded: ['security-audit', 'compliance-verification'],
      blockers: [],
      alternativeApproaches: []
    }
  }

  async execute(plan: ImplementationPlan): Promise<ExecutionResult> {
    throw new Error('Worf does not execute directly. Works with other agents.')
  }

  async assessImpact(solution: SynthesizedSolution): Promise<ImpactAssessment> {
    return {
      stakeholders: ['security-team', 'compliance-officers', 'management'],
      emotionalImpact: 'neutral',
      adoptionLikelihood: 0.85,
      hiddenConcerns: [],
      suggestions: ['Maintain audit trail', 'Regular compliance reviews']
    }
  }
}

/**
 * Troi Agent - Star Trek TNG "Deanna Troi"
 * Role: User Experience
 * Decision Style: Intuitive, empathetic
 */
export class TroiAgent extends BaseAgent {
  id = 'agent_troi'
  name = 'Deanna Troi'
  role = 'user-experience' as CrewRole
  persona = 'Troi' as TngPersona
  expertise = ['empathy', 'human-factors', 'communication', 'mediation', 'psychology']
  decisionStyle: DecisionStyle = {
    type: 'empathetic',
    speedVsAccuracy: 'balanced',
    riskTolerance: 'balanced'
  }

  async recommend(problem: Problem): Promise<Recommendation> {
    return {
      id: `rec_troi_${Date.now()}`,
      agentId: this.id,
      agentName: this.name,
      agentRole: this.role,
      agentPersona: this.persona,
      problem,
      recommendation:
        'Find solution that honors all stakeholder needs and values',
      rationale: 'The crew will adopt solutions they understand and agree with',
      estimatedImpact: {
        adoption: '+30%',
        team_morale: 'improved'
      },
      confidence: 0.78,
      risks: [
        {
          description: 'May recommend emotionally-driven decisions over optimal ones',
          severity: 'medium'
        }
      ],
      benefits: ['High adoption rate', 'Team buy-in', 'Sustainable change'],
      submittedAt: new Date()
    }
  }

  async synthesizeConflict(
    rec1: Recommendation,
    rec2: Recommendation
  ): Promise<SynthesizedSolution> {
    // Troi finds solution that honors what both agents really care about
    return {
      id: `syn_troi_${Date.now()}`,
      sessionId: 'session_' + Date.now(),
      problem: rec1.problem,
      solution:
        'Hybrid solution where both values are honored; addresses underlying needs',
      approach: 'Layer solutions so they reinforce each other rather than compete',
      rationale: 'Both agents are protecting important values; both can coexist',
      addressedConflicts: [],
      leveragedSynergies: [],
      expectedOutcomes: {
        stakeholder_satisfaction: '+40%',
        team_alignment: 'improved'
      },
      implementationPlan: [],
      riskMitigation: [],
      synthesisConfidence: 0.82,
      approvedBy: 'Picard',
      approvedAt: new Date()
    }
  }

  async assessFeasibility(solution: SynthesizedSolution): Promise<FeasibilityAssessment> {
    return {
      feasible: true,
      confidence: 0.75,
      timelineEstimate: 50,
      resourcesNeeded: ['team-involvement', 'communication'],
      blockers: [],
      alternativeApproaches: ['approach-d']
    }
  }

  async execute(plan: ImplementationPlan): Promise<ExecutionResult> {
    throw new Error('Troi does not execute directly. Facilitates team adoption.')
  }

  async assessImpact(solution: SynthesizedSolution): Promise<ImpactAssessment> {
    return {
      stakeholders: ['all-crew', 'users', 'management'],
      emotionalImpact: 'positive',
      adoptionLikelihood: 0.9,
      hiddenConcerns: [
        'May create new tensions if communication is poor',
        'Team needs to understand the reasoning'
      ],
      suggestions: ['Communicate clearly', 'Involve team in decisions', 'Celebrate wins']
    }
  }
}

/**
 * Geordi Agent - Star Trek TNG "Geordi La Forge"
 * Role: Infrastructure
 * Decision Style: Pragmatic, hands-on
 */
export class GeordiAgent extends BaseAgent {
  id = 'agent_geordi'
  name = 'Geordi La Forge'
  role = 'infrastructure' as CrewRole
  persona = 'Geordi' as TngPersona
  expertise = ['systems', 'engineering', 'implementation', 'optimization', 'troubleshooting']
  decisionStyle: DecisionStyle = {
    type: 'pragmatic',
    speedVsAccuracy: 'balanced',
    riskTolerance: 'balanced'
  }

  async recommend(problem: Problem): Promise<Recommendation> {
    return {
      id: `rec_geordi_${Date.now()}`,
      agentId: this.id,
      agentName: this.name,
      agentRole: this.role,
      agentPersona: this.persona,
      problem,
      recommendation: 'Implement with proven infrastructure patterns',
      rationale: 'We have tools and methods that work; lets build on them',
      estimatedImpact: {
        implementation_time: '-30%',
        reliability: '+25%'
      },
      confidence: 0.88,
      risks: [
        {
          description: 'May prioritize implementation over innovation',
          severity: 'low'
        }
      ],
      benefits: ['Quick implementation', 'Proven reliability', 'Team expertise exists'],
      submittedAt: new Date()
    }
  }

  async synthesizeConflict(
    rec1: Recommendation,
    rec2: Recommendation
  ): Promise<SynthesizedSolution> {
    return {
      id: `syn_geordi_${Date.now()}`,
      sessionId: 'session_' + Date.now(),
      problem: rec1.problem,
      solution: 'Layer both solutions using proven infrastructure patterns',
      approach: 'Build in phases, each with proven technology stack',
      rationale:
        'Infrastructure can support both approaches; implement incrementally',
      addressedConflicts: [],
      leveragedSynergies: [],
      expectedOutcomes: {
        time_to_implementation: '8 weeks',
        infrastructure_efficiency: '+20%'
      },
      implementationPlan: [],
      riskMitigation: [],
      synthesisConfidence: 0.87,
      approvedBy: 'Picard',
      approvedAt: new Date()
    }
  }

  async assessFeasibility(solution: SynthesizedSolution): Promise<FeasibilityAssessment> {
    return {
      feasible: true,
      confidence: 0.92,
      timelineEstimate: 240,  // 6 weeks for infrastructure
      resourcesNeeded: ['servers', 'bandwidth', 'deployment-pipeline'],
      blockers: [],
      alternativeApproaches: []
    }
  }

  async execute(plan: ImplementationPlan): Promise<ExecutionResult> {
    // Geordi actually executes infrastructure work
    console.log(`[Geordi] Executing infrastructure plan across DDD domains...`)

    const result: ExecutionResult = {
      domain: 'shared',
      domainAgent: { id: this.id, name: this.name, role: this.role },
      tasks: [],
      overallSuccess: true,
      metrics: {
        deployment_time: '120 minutes',
        uptime: '99.99%',
        performance: '+18%'
      },
      duration: 120000,
      errors: [],
      recommendations: ['Monitor for 24 hours', 'Plan rollback']
    }

    await this.submitObservationLoungeFinding(
      'Infrastructure deployment successful. Ready for next phase.',
      'pattern',
      0.92
    )

    return result
  }

  async assessImpact(solution: SynthesizedSolution): Promise<ImpactAssessment> {
    return {
      stakeholders: ['operations', 'developers', 'users'],
      emotionalImpact: 'neutral',
      adoptionLikelihood: 0.88,
      hiddenConcerns: [
        'Deployment requires downtime window',
        'Team needs runbook for troubleshooting'
      ],
      suggestions: [
        'Schedule deployment during low-traffic window',
        'Train ops team before deployment',
        'Plan rollback'
      ]
    }
  }
}
