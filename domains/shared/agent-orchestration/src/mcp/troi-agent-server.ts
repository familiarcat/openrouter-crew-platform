/**
 * Troi Agent MCP Server
 *
 * Star Trek Character: Deanna Troi (Ship's Counselor)
 * Specialization: User Experience & Organizational Impact
 * Style: Intuitive, empathetic, relationship-aware
 *
 * Expertise Areas:
 * - User experience evaluation
 * - Adoption rate prediction
 * - Organizational concern identification
 * - Consensus facilitation
 *
 * Tools:
 * 1. assess-impact - Evaluate user and organizational impact
 * 2. predict-adoption - Forecast adoption rates and timeline
 * 3. identify-concerns - Find stakeholder concerns and objections
 * 4. facilitate-consensus - Build agreement across teams
 */

import { BaseMCPServer } from './base-mcp-server'
import type { ToolResult } from './base-mcp-server'

interface ImpactAssessment {
  userExperienceScore: number // 0-100
  organizationalAlignmentScore: number // 0-100
  changeManagementComplexity: 'low' | 'medium' | 'high'
  affectedUserGroups: string[]
  estimatedDisruption: 'minimal' | 'moderate' | 'significant'
  recommendations: string[]
  confidence: number
}

interface AdoptionForecast {
  adoptionRate: number // percentage per week
  timeToFullAdoption: number // weeks
  phases: {
    early_adopters: { percentage: number; weeks: number }
    pragmatists: { percentage: number; weeks: number }
    laggards: { percentage: number; weeks: number }
  }
  riskFactors: string[]
  accelerators: string[]
  confidence: number
}

interface StakeholderConcern {
  stakeholder: string
  concern: string
  severity: 'low' | 'medium' | 'high'
  rootCause: string
  resolution: string
  ownerTeam: string
}

interface ConsensusPlan {
  strategy: string
  keyMessages: string[]
  communicationPlan: {
    channel: string
    timing: string
    audience: string
    message: string
  }[]
  keyInfluencers: string[]
  expectedAlignment: number // percentage
  confidence: number
}

export class TroiAgentServer extends BaseMCPServer {
  constructor() {
    super('counselor_troi', 'User Experience & Organizational Impact')
    this.registerTools()
  }

  registerTools(): void {
    this.registerTool({
      name: 'assess-impact',
      description: 'Evaluate user experience and organizational impact of a proposal',
      inputSchema: {
        type: 'object',
        properties: {
          proposal: {
            type: 'string',
            description: 'Description of the proposed change'
          },
          targetUsers: {
            type: 'array',
            items: { type: 'string' },
            description: 'User groups affected by the change'
          },
          affectedDepartments: {
            type: 'array',
            items: { type: 'string' },
            description: 'Departments impacted'
          },
          changeFrequency: {
            type: 'string',
            enum: ['one-time', 'recurring', 'ongoing'],
            description: 'How often the change occurs'
          }
        },
        required: ['proposal', 'targetUsers']
      },
      handler: (input: any) => this.assessImpact(input)
    })

    this.registerTool({
      name: 'predict-adoption',
      description: 'Forecast adoption rates and timeline for organizational changes',
      inputSchema: {
        type: 'object',
        properties: {
          change: {
            type: 'string',
            description: 'Description of the change'
          },
          organizationSize: {
            type: 'number',
            description: 'Total number of affected users'
          },
          complexityLevel: {
            type: 'string',
            enum: ['simple', 'moderate', 'complex'],
            description: 'Complexity of the change'
          },
          hasTraining: {
            type: 'boolean',
            description: 'Is training provided?'
          },
          hasSuperUserSupport: {
            type: 'boolean',
            description: 'Are super-users available for support?'
          }
        },
        required: ['change', 'organizationSize']
      },
      handler: (input: any) => this.predictAdoption(input)
    })

    this.registerTool({
      name: 'identify-concerns',
      description: 'Identify stakeholder concerns and potential objections',
      inputSchema: {
        type: 'object',
        properties: {
          proposal: {
            type: 'string',
            description: 'Description of the proposal'
          },
          stakeholders: {
            type: 'array',
            items: { type: 'string' },
            description: 'Key stakeholder groups'
          },
          organizationContext: {
            type: 'string',
            description: 'Relevant organizational background'
          }
        },
        required: ['proposal', 'stakeholders']
      },
      handler: (input: any) => this.identifyConcerns(input)
    })

    this.registerTool({
      name: 'facilitate-consensus',
      description: 'Build alignment and consensus across teams for a proposal',
      inputSchema: {
        type: 'object',
        properties: {
          proposal: {
            type: 'string',
            description: 'The proposal to build consensus around'
          },
          conflictingParties: {
            type: 'array',
            items: { type: 'string' },
            description: 'Teams or individuals with divergent views'
          },
          commonGoals: {
            type: 'array',
            items: { type: 'string' },
            description: 'Shared objectives all parties value'
          },
          timeline: {
            type: 'string',
            description: 'Timeline for decision-making'
          }
        },
        required: ['proposal', 'conflictingParties']
      },
      handler: (input: any) => this.facilitateConsensus(input)
    })
  }

  private async assessImpact(input: any): Promise<ToolResult> {
    try {
      const {
        proposal,
        targetUsers = [],
        affectedDepartments = [],
        changeFrequency = 'one-time'
      } = input

      // Simulate impact assessment based on change characteristics
      const userExperienceScore = this.calculateUXScore(proposal, targetUsers.length)
      const organizationalAlignmentScore = this.calculateAlignmentScore(affectedDepartments)

      const disruption = this.estimateDisruption(
        changeFrequency,
        userExperienceScore,
        organizationalAlignmentScore
      )

      const assessment: ImpactAssessment = {
        userExperienceScore,
        organizationalAlignmentScore,
        changeManagementComplexity: this.assessComplexity(affectedDepartments.length),
        affectedUserGroups: targetUsers,
        estimatedDisruption: disruption,
        recommendations: this.generateRecommendations(
          userExperienceScore,
          organizationalAlignmentScore,
          disruption
        ),
        confidence: 0.87
      }

      return { success: true, data: assessment }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      return { success: false, error: errorMsg }
    }
  }

  private async predictAdoption(input: any): Promise<ToolResult> {
    try {
      const {
        change,
        organizationSize = 100,
        complexityLevel = 'moderate',
        hasTraining = false,
        hasSuperUserSupport = false
      } = input

      // Calculate base adoption rate based on complexity
      let baseRate = 0
      if (complexityLevel === 'simple') baseRate = 15
      else if (complexityLevel === 'moderate') baseRate = 8
      else baseRate = 5

      // Adjust for support factors
      if (hasTraining) baseRate += 4
      if (hasSuperUserSupport) baseRate += 3

      // Calculate phases using diffusion of innovation model
      const forecast: AdoptionForecast = {
        adoptionRate: baseRate,
        timeToFullAdoption: Math.ceil(100 / baseRate) + (hasTraining ? -2 : 0),
        phases: {
          early_adopters: {
            percentage: 13.5,
            weeks: Math.ceil(4 / baseRate)
          },
          pragmatists: {
            percentage: 34,
            weeks: Math.ceil(16 / baseRate)
          },
          laggards: {
            percentage: 16,
            weeks: Math.ceil(30 / baseRate)
          }
        },
        riskFactors: this.identifyAdoptionRisks(complexityLevel, organizationSize),
        accelerators: this.identifyAccelerators(hasTraining, hasSuperUserSupport),
        confidence: 0.84
      }

      return { success: true, data: forecast }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      return { success: false, error: errorMsg }
    }
  }

  private async identifyConcerns(input: any): Promise<ToolResult> {
    try {
      const {
        proposal,
        stakeholders = [],
        organizationContext = ''
      } = input

      const concerns: StakeholderConcern[] = []

      // Map stakeholder types to likely concerns
      const concernMap: Record<string, any[]> = {
        'engineering': [
          {
            concern: 'Technical feasibility and implementation timeline',
            severity: 'high',
            rootCause: 'Need confidence in technical approach'
          },
          {
            concern: 'Impact on existing systems and dependencies',
            severity: 'high',
            rootCause: 'Risk of breaking changes'
          }
        ],
        'product': [
          {
            concern: 'User adoption and feature usage',
            severity: 'high',
            rootCause: 'ROI depends on adoption'
          },
          {
            concern: 'Competitive positioning impact',
            severity: 'medium',
            rootCause: 'Market dynamics'
          }
        ],
        'finance': [
          {
            concern: 'Cost implications and ROI',
            severity: 'high',
            rootCause: 'Budget constraints'
          },
          {
            concern: 'Timeline to cost recovery',
            severity: 'medium',
            rootCause: 'Budget planning'
          }
        ],
        'security': [
          {
            concern: 'Security and compliance implications',
            severity: 'critical',
            rootCause: 'Organizational risk'
          },
          {
            concern: 'Data handling and privacy',
            severity: 'critical',
            rootCause: 'Regulatory requirements'
          }
        ],
        'operations': [
          {
            concern: 'Operational disruption and support load',
            severity: 'high',
            rootCause: 'Staffing constraints'
          },
          {
            concern: 'Training and change management',
            severity: 'medium',
            rootCause: 'Capacity planning'
          }
        ]
      }

      // Build concerns list
      for (const stakeholder of stakeholders) {
        const stakeholderLower = stakeholder.toLowerCase()
        const stakeholderConcerns = concernMap[stakeholderLower] || []

        for (const concern of stakeholderConcerns) {
          concerns.push({
            stakeholder,
            concern: concern.concern,
            severity: concern.severity,
            rootCause: concern.rootCause,
            resolution: this.suggestResolution(concern.concern),
            ownerTeam: stakeholder
          })
        }
      }

      const result = {
        totalConcerns: concerns.length,
        byScore: {
          critical: concerns.filter(c => (c.severity as string) === 'critical').length,
          high: concerns.filter(c => c.severity === 'high').length,
          medium: concerns.filter(c => c.severity === 'medium').length,
          low: concerns.filter(c => c.severity === 'low').length
        },
        concerns,
        confidence: 0.89
      }

      return { success: true, data: result }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      return { success: false, error: errorMsg }
    }
  }

  private async facilitateConsensus(input: any): Promise<ToolResult> {
    try {
      const {
        proposal,
        conflictingParties = [],
        commonGoals = [],
        timeline = '2 weeks'
      } = input

      // Build consensus strategy
      const strategy = this.buildConsensusStrategy(
        proposal,
        conflictingParties,
        commonGoals
      )

      const communicationPlan = this.createCommunicationPlan(
        conflictingParties,
        commonGoals,
        timeline
      )

      const plan: ConsensusPlan = {
        strategy,
        keyMessages: this.identifyKeyMessages(proposal, commonGoals),
        communicationPlan,
        keyInfluencers: this.identifyInfluencers(conflictingParties),
        expectedAlignment: this.estimateAlignment(
          conflictingParties.length,
          commonGoals.length
        ),
        confidence: 0.86
      }

      return { success: true, data: plan }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      return { success: false, error: errorMsg }
    }
  }

  // Helper methods
  private calculateUXScore(proposal: string, userCount: number): number {
    // Base score on proposal type
    let score = 50

    if (proposal.toLowerCase().includes('simplify') ||
        proposal.toLowerCase().includes('improve')) {
      score += 20
    }
    if (proposal.toLowerCase().includes('complex')) {
      score -= 15
    }

    // Adjust for user count
    if (userCount > 100) score -= 5

    return Math.min(100, Math.max(0, score))
  }

  private calculateAlignmentScore(departments: string[]): number {
    // Base score
    let score = 60

    // More departments = harder to align
    score -= Math.min(20, departments.length * 3)

    return Math.min(100, Math.max(0, score))
  }

  private estimateDisruption(
    frequency: string,
    uxScore: number,
    alignmentScore: number
  ): 'minimal' | 'moderate' | 'significant' {
    const avgScore = (uxScore + alignmentScore) / 2

    if (avgScore > 75) return 'minimal'
    if (avgScore > 50) return 'moderate'
    return 'significant'
  }

  private assessComplexity(departmentCount: number): 'low' | 'medium' | 'high' {
    if (departmentCount <= 2) return 'low'
    if (departmentCount <= 4) return 'medium'
    return 'high'
  }

  private generateRecommendations(
    uxScore: number,
    alignmentScore: number,
    disruption: string
  ): string[] {
    const recommendations: string[] = []

    if (uxScore < 60) {
      recommendations.push('Invest in UX improvement before rollout')
    }
    if (alignmentScore < 50) {
      recommendations.push('Increase stakeholder engagement and communication')
    }
    if (disruption === 'significant') {
      recommendations.push('Implement phased rollout to minimize impact')
    }

    recommendations.push('Plan comprehensive training program')
    recommendations.push('Assign change champions from each department')

    return recommendations
  }

  private identifyAdoptionRisks(complexity: string, size: number): string[] {
    const risks: string[] = []

    if (complexity === 'complex') {
      risks.push('Complexity may slow adoption among power users')
    }
    if (size > 500) {
      risks.push('Large organization may have pockets of resistance')
    }

    risks.push('Early technical issues could damage adoption')
    risks.push('Lack of training could delay adoption')

    return risks
  }

  private identifyAccelerators(training: boolean, support: boolean): string[] {
    const accelerators: string[] = []

    if (training) {
      accelerators.push('Structured training program speeds adoption')
    }
    if (support) {
      accelerators.push('Super-user support reduces friction')
    }

    accelerators.push('Early adopter testimonials influence others')
    accelerators.push('Gamification and incentives boost adoption')

    return accelerators
  }

  private suggestResolution(concern: string): string {
    const resolutions: Record<string, string> = {
      'feasibility': 'Conduct technical spike to validate approach',
      'cost': 'Perform ROI analysis to justify investment',
      'adoption': 'Implement comprehensive change management plan',
      'compliance': 'Engage security team in design review',
      'disruption': 'Plan phased rollout with fallback plan'
    }

    for (const [key, value] of Object.entries(resolutions)) {
      if (concern.toLowerCase().includes(key)) return value
    }

    return 'Address through stakeholder dialogue and iteration'
  }

  private buildConsensusStrategy(
    proposal: string,
    parties: string[],
    goals: string[]
  ): string {
    if (goals.length === 0) {
      return 'Build alignment by identifying shared objectives'
    }

    return `Leverage shared goals (${goals.join(', ')}) to find common ground and build consensus`
  }

  private createCommunicationPlan(
    parties: string[],
    goals: string[],
    timeline: string
  ): any[] {
    return [
      {
        channel: 'Leadership alignment meeting',
        timing: 'Week 1',
        audience: 'Executive sponsors',
        message: 'Strategic rationale and expected benefits'
      },
      {
        channel: 'Team meetings',
        timing: 'Week 1',
        audience: 'All departments',
        message: 'How this change supports shared goals'
      },
      {
        channel: 'FAQ and documentation',
        timing: 'Week 1-2',
        audience: 'All users',
        message: 'Detailed information and addressing concerns'
      },
      {
        channel: 'Progress updates',
        timing: 'Ongoing',
        audience: 'All stakeholders',
        message: 'Implementation progress and impact'
      }
    ]
  }

  private identifyKeyMessages(proposal: string, goals: string[]): string[] {
    return [
      `This change directly supports our ${goals.length > 0 ? 'key goals' : 'strategic direction'}`,
      'We\'ve listened to your concerns and incorporated feedback',
      'Success depends on our collaboration and mutual support',
      'We\'re committed to making this transition smooth'
    ]
  }

  private identifyInfluencers(parties: string[]): string[] {
    const influencers: string[] = []

    for (const party of parties) {
      influencers.push(`${party} champion`)
    }

    return influencers
  }

  private estimateAlignment(partyCount: number, goalCount: number): number {
    // Start at 70%
    let alignment = 70

    // Reduce by number of parties with different views
    alignment -= partyCount * 5

    // Increase by number of common goals
    alignment += goalCount * 8

    return Math.min(95, Math.max(20, alignment))
  }
}
