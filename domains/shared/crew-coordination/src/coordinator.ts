/**
 * Crew Coordinator
 *
 * Manages crew member selection and workload distribution
 * Based on patterns from alex-ai-universal and rag-refresh-product-factory
 */

import { CrewMember, WorkloadStatus, CostTier } from './types';
import { getCrewMember, getAvailableCrewMembers, getAllCrewMembers } from './members';

export class CrewCoordinator {
  /**
   * Select the best crew member for a task based on:
   * 1. Expertise match
   * 2. Current workload
   * 3. Cost tier preference
   */
  selectCrewMember(
    taskType: string,
    requiredExpertise: string[],
    preferredTier?: CostTier
  ): CrewMember | null {
    const available = getAvailableCrewMembers();

    if (available.length === 0) {
      return null;
    }

    // Score each crew member
    const scored = available.map(member => {
      let score = 0;

      // Expertise match (0-10 points)
      const matchingExpertise = member.expertise.filter(exp =>
        requiredExpertise.some(req => exp.includes(req) || req.includes(exp))
      );
      score += matchingExpertise.length * 2;

      // Workload (0-5 points, more points for less utilized)
      const utilization = member.workloadCurrent / member.workloadCapacity;
      score += (1 - utilization) * 5;

      // Cost tier match (0-3 points)
      if (preferredTier && member.costTier === preferredTier) {
        score += 3;
      }

      return { member, score };
    });

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    return scored[0].member;
  }

  /**
   * Get workload status for all crew members
   */
  getWorkloadStatus(): WorkloadStatus[] {
    return getAllCrewMembers().map(member => ({
      crewMember: member.name,
      current: member.workloadCurrent,
      capacity: member.workloadCapacity,
      utilizationPercent: (member.workloadCurrent / member.workloadCapacity) * 100,
      available: member.active && member.workloadCurrent < member.workloadCapacity
    }));
  }

  /**
   * Update crew member workload
   */
  updateWorkload(crewMemberName: string, delta: number): void {
    const member = getCrewMember(crewMemberName);
    if (member) {
      member.workloadCurrent = Math.max(
        0,
        Math.min(member.workloadCapacity, member.workloadCurrent + delta)
      );
    }
  }

  /**
   * Get recommended crew member for a project type
   */
  recommendForProjectType(projectType: string): CrewMember[] {
    const recommendations: Record<string, string[]> = {
      'dj-booking': ['captain_picard', 'lt_uhura', 'chief_obrien'],
      'product-factory': ['commander_data', 'counselor_troi', 'commander_riker'],
      'ai-assistant': ['captain_picard', 'commander_data', 'lt_worf'],
      'custom': ['commander_data', 'commander_riker', 'chief_obrien']
    };

    const recommended = recommendations[projectType] || recommendations['custom'];
    return recommended
      .map(name => getCrewMember(name))
      .filter((member): member is CrewMember => member !== undefined);
  }
}

// Export singleton instance
export const crewCoordinator = new CrewCoordinator();
