/**
 * Conflict Detection Engine
 *
 * Analyzes recommendations from multiple agents to identify:
 * - Direct conflicts
 * - Indirect conflicts
 * - Resource tradeoffs
 * - Synergies and compatible solutions
 */

import { Recommendation, ConflictAnalysis, Conflict, Synergy } from './types'

export class ConflictDetector {
  /**
   * Analyze multiple recommendations for conflicts and synergies
   */
  async analyzeRecommendations(
    recommendations: Recommendation[]
  ): Promise<ConflictAnalysis> {
    const sessionId = `conflict_${Date.now()}`

    // Find all conflicts
    const conflicts = this.findConflicts(recommendations)

    // Find all synergies
    const synergies = this.findSynergies(recommendations)

    // Determine resolution strategy based on conflicts
    const resolutionStrategy = this.selectResolutionStrategy(conflicts, synergies)

    // Calculate overall analysis confidence
    const analysisConfidence = this.calculateAnalysisConfidence(conflicts, synergies)

    return {
      sessionId,
      conflicts,
      synergies,
      resolutionStrategy,
      analysisConfidence
    }
  }

  /**
   * Find conflicts between recommendations
   */
  private findConflicts(recommendations: Recommendation[]): Conflict[] {
    const conflicts: Conflict[] = []

    // Compare each pair of recommendations
    for (let i = 0; i < recommendations.length; i++) {
      for (let j = i + 1; j < recommendations.length; j++) {
        const rec1 = recommendations[i]; const rec2 = recommendations[j];
        if (!rec1 || !rec2) continue;
        const conflict = this.detectPairwiseConflict(rec1, rec2)
        if (conflict) {
          conflicts.push(conflict)
        }
      }
    }

    return conflicts
  }

  /**
   * Detect if two recommendations conflict
   */
  private detectPairwiseConflict(
    rec1: Recommendation,
    rec2: Recommendation
  ): Conflict | null {
    const agent1 = { id: rec1.agentId, name: rec1.agentName, role: rec1.agentRole }
    const agent2 = { id: rec2.agentId, name: rec2.agentName, role: rec2.agentRole }

    // Extract key terms from recommendations
    const terms1 = this.extractKeyTerms(rec1.recommendation)
    const terms2 = this.extractKeyTerms(rec2.recommendation)

    // Check for direct contradictions
    const contradictionPairs = [
      ['reduce', 'maintain'],
      ['increase', 'decrease'],
      ['change', 'stay-same'],
      ['downgrade', 'maintain-tier']
    ]

    for (const [term1, term2] of contradictionPairs) {
      if (
        (term1 && term2 && terms1.includes(term1) && terms2.includes(term2)) ||
        (term1 && term2 && terms1.includes(term2) && terms2.includes(term1))
      ) {
        return {
          id: `conflict_${rec1.agentId}_${rec2.agentId}`,
          agent1,
          agent2,
          conflictType: 'direct-contradiction',
          severity: this.calculateConflictSeverity(rec1, rec2),
          description: `${rec1.agentName} recommends "${rec1.recommendation.substring(0, 50)}..." but ${rec2.agentName} recommends "${rec2.recommendation.substring(0, 50)}..."`,
          affectedConstraints: this.findAffectedConstraints(rec1, rec2)
        }
      }
    }

    // Check for resource tradeoffs
    const impacts1 = Object.entries(rec1.estimatedImpact)
    const impacts2 = Object.entries(rec2.estimatedImpact)

    for (const [metric1, value1] of impacts1) {
      for (const [metric2, value2] of impacts2) {
        if (metric1 === metric2) {
          const numVal1 = typeof value1 === 'number' ? value1 : 0
          const numVal2 = typeof value2 === 'number' ? value2 : 0

          // Significant opposite impacts = tradeoff
          if (
            (numVal1 > 100 && numVal2 < -50) ||
            (numVal1 < -100 && numVal2 > 50)
          ) {
            return {
              id: `tradeoff_${rec1.agentId}_${rec2.agentId}`,
              agent1,
              agent2,
              conflictType: 'resource-tradeoff',
              severity: 0.6,
              description: `Tradeoff on ${metric1}: ${rec1.agentName} impact ${value1} vs ${rec2.agentName} impact ${value2}`,
              affectedConstraints: [metric1]
            }
          }
        }
      }
    }

    // Check for indirect conflicts based on confidence and risk
    const confidenceDiff = Math.abs(rec1.confidence - rec2.confidence)
    if (confidenceDiff > 0.2) {
      const moreDiverse = confidenceDiff > 0.3
      if (moreDiverse && this.areDiverseRoles(rec1.agentRole, rec2.agentRole)) {
        return {
          id: `indirect_${rec1.agentId}_${rec2.agentId}`,
          agent1,
          agent2,
          conflictType: 'indirect-conflict',
          severity: 0.4,
          description: `Implicit conflict: ${rec1.agentName} is ${(rec1.confidence * 100).toFixed(0)}% confident while ${rec2.agentName} is ${(rec2.confidence * 100).toFixed(0)}% confident`,
          affectedConstraints: ['confidence', 'trust']
        }
      }
    }

    return null
  }

  /**
   * Find synergies between recommendations
   */
  private findSynergies(recommendations: Recommendation[]): Synergy[] {
    const synergies: Synergy[] = []

    for (let i = 0; i < recommendations.length; i++) {
      for (let j = i + 1; j < recommendations.length; j++) {
        const rec1 = recommendations[i]; const rec2 = recommendations[j];
        if (!rec1 || !rec2) continue;
        const synergy = this.detectPairwiseSynergy(rec1, rec2)
        if (synergy) {
          synergies.push(synergy)
        }
      }
    }

    return synergies
  }

  /**
   * Detect if two recommendations have synergy
   */
  private detectPairwiseSynergy(rec1: Recommendation, rec2: Recommendation): Synergy | null {
    const agent1 = { id: rec1.agentId, name: rec1.agentName, role: rec1.agentRole }
    const agent2 = { id: rec2.agentId, name: rec2.agentName, role: rec2.agentRole }

    // Check if recommendations are complementary
    const complementaryPairs = [
      ['reduce-cost', 'optimize-efficiency'],
      ['improve-security', 'maintain-compliance'],
      ['enhance-performance', 'reduce-latency'],
      ['implement-caching', 'optimize-routing']
    ]

    const terms1 = this.extractKeyTerms(rec1.recommendation)
    const terms2 = this.extractKeyTerms(rec2.recommendation)

    for (const [term1, term2] of complementaryPairs) {
      if (
        (term1 && term2 && terms1.includes(term1) && terms2.includes(term2)) ||
        (term1 && term2 && terms1.includes(term2) && terms2.includes(term1))
      ) {
        return {
          agent1,
          agent2,
          synergyType: 'synergistic',
          description: `${rec1.agentName} and ${rec2.agentName} recommendations work together to achieve shared goals`,
          combinedImpact: this.calculateCombinedImpact(rec1, rec2)
        }
      }
    }

    // Check if recommendations are orthogonal (independent)
    const overlap = this.calculateTermOverlap(terms1, terms2)
    if (overlap < 0.2) {
      // Very little overlap = orthogonal approaches
      return {
        agent1,
        agent2,
        synergyType: 'orthogonal',
        description: `${rec1.agentName} and ${rec2.agentName} address different aspects. Both can proceed in parallel.`,
        combinedImpact: this.calculateCombinedImpact(rec1, rec2)
      }
    }

    // Check if simply compatible
    if (
      rec1.risks.filter(r => r.severity === 'critical').length === 0 &&
      rec2.risks.filter(r => r.severity === 'critical').length === 0
    ) {
      return {
        agent1,
        agent2,
        synergyType: 'compatible',
        description: `${rec1.agentName} and ${rec2.agentName} recommendations are compatible and can coexist`,
        combinedImpact: this.calculateCombinedImpact(rec1, rec2)
      }
    }

    return null
  }

  /**
   * Extract key terms from recommendation text
   */
  private extractKeyTerms(text: string): string[] {
    const keywords = [
      'reduce',
      'increase',
      'maintain',
      'optimize',
      'implement',
      'remove',
      'add',
      'change',
      'improve',
      'enhance',
      'cost',
      'security',
      'compliance',
      'performance',
      'efficiency',
      'caching',
      'routing',
      'tier',
      'model'
    ]

    return keywords.filter(keyword => text.toLowerCase().includes(keyword))
  }

  /**
   * Calculate conflict severity (0-1)
   */
  private calculateConflictSeverity(rec1: Recommendation, rec2: Recommendation): number {
    let severity = 0

    // Higher confidence mismatch = higher severity
    const confidenceDiff = Math.abs(rec1.confidence - rec2.confidence)
    severity += confidenceDiff * 0.3

    // More risks = higher severity
    const criticalRisks =
      (rec1.risks.filter(r => r.severity === 'critical').length +
        rec2.risks.filter(r => r.severity === 'critical').length) /
      2
    severity += Math.min(0.5, criticalRisks * 0.1)

    // Higher impact difference = higher severity
    const impacts1 = Object.values(rec1.estimatedImpact).filter(v => typeof v === 'number')
    const impacts2 = Object.values(rec2.estimatedImpact).filter(v => typeof v === 'number')
    const impactDiff =
      impacts1.reduce((a, b) => a + Math.abs(Number(b)), 0) +
      impacts2.reduce((a, b) => a + Math.abs(Number(b)), 0)
    severity += Math.min(0.2, impactDiff * 0.0001)

    return Math.min(1, severity)
  }

  /**
   * Find constraints affected by conflict
   */
  private findAffectedConstraints(rec1: Recommendation, rec2: Recommendation): string[] {
    const constraints: Set<string> = new Set()

    // Look at impacts
    Object.keys(rec1.estimatedImpact).forEach(key => constraints.add(key))
    Object.keys(rec2.estimatedImpact).forEach(key => constraints.add(key))

    // Look at risks
    rec1.risks.forEach(r => {
      if (r.severity === 'critical') {
        constraints.add(r.description)
      }
    })
    rec2.risks.forEach(r => {
      if (r.severity === 'critical') {
        constraints.add(r.description)
      }
    })

    return Array.from(constraints)
  }

  /**
   * Check if two roles are diverse enough to have different perspectives
   */
  private areDiverseRoles(role1: string, role2: string): boolean {
    const diversePairs = [
      ['pragmatic-solutions', 'security-compliance'],
      ['pragmatic-solutions', 'user-experience'],
      ['security-compliance', 'infrastructure'],
      ['data-analytics', 'user-experience']
    ]

    return diversePairs.some(
      pair =>
        (pair[0] === role1 && pair[1] === role2) || (pair[0] === role2 && pair[1] === role1)
    )
  }

  /**
   * Calculate combined impact of two recommendations
   */
  private calculateCombinedImpact(
    rec1: Recommendation,
    rec2: Recommendation
  ): Record<string, number | string> {
    const combined: Record<string, number | string> = {}

    // Add numeric impacts
    const allKeys = new Set([
      ...Object.keys(rec1.estimatedImpact),
      ...Object.keys(rec2.estimatedImpact)
    ])

    allKeys.forEach(key => {
      const val1 = rec1.estimatedImpact[key]
      const val2 = rec2.estimatedImpact[key]

      const num1 = typeof val1 === 'number' ? val1 : 0
      const num2 = typeof val2 === 'number' ? val2 : 0

      if (num1 !== 0 || num2 !== 0) {
        combined[key] = num1 + num2
      }
    })

    return combined
  }

  /**
   * Calculate term overlap between two recommendation sets
   */
  private calculateTermOverlap(terms1: string[], terms2: string[]): number {
    if (terms1.length === 0 || terms2.length === 0) return 0

    const intersection = terms1.filter(t => terms2.includes(t))
    const union = new Set([...terms1, ...terms2])

    return intersection.length / union.size
  }

  /**
   * Select best resolution strategy based on conflict analysis
   */
  private selectResolutionStrategy(
    conflicts: Conflict[],
    synergies: Synergy[]
  ): 'weighted-average' | 'synthesis' | 'tradeoff' | 'constraint-satisfaction' {
    // If we have synergies, use synthesis (combine both)
    if (synergies.length > conflicts.length) {
      return 'synthesis'
    }

    // If we have many direct conflicts, need constraint satisfaction
    const directConflicts = conflicts.filter(c => c.conflictType === 'direct-contradiction')
    if (directConflicts.length > 0) {
      return 'constraint-satisfaction'
    }

    // If we have tradeoffs, need explicit tradeoff analysis
    const tradeoffs = conflicts.filter(c => c.conflictType === 'resource-tradeoff')
    if (tradeoffs.length > 0) {
      return 'tradeoff'
    }

    // Default: weighted average of recommendations
    return 'weighted-average'
  }

  /**
   * Calculate confidence in the conflict analysis
   */
  private calculateAnalysisConfidence(conflicts: Conflict[], synergies: Synergy[]): number {
    // More data = higher confidence
    const dataPoints = conflicts.length + synergies.length
    const confidence = Math.min(1, 0.5 + dataPoints * 0.1)

    return confidence
  }
}

export default ConflictDetector
