/**
 * Crew Assignment System
 * 
 * Manages crew member assignments to tasks and components.
 * Uses skills matching and workload balancing.
 */

export interface AssignmentScore {
  crewId: string;
  score: number;
  reasoning: string;
  matchedSkills: string[];
}

export interface CrewAssignment {
  taskId: string;
  crewId: string;
  role: string;
  assignedAt: string;
}

export class CrewAssignmentSystem {
  private assignments: Map<string, CrewAssignment[]> = new Map();

  /**
   * Score a crew member for a given task
   */
  scoreCrewForTask(crewId: string, taskDescription: string, requiredSkills: string[]): AssignmentScore {
    // Simple scoring based on crew specializations
    const crewSkillsMap: Record<string, string[]> = {
      'captain_picard': ['leadership', 'strategy', 'diplomacy', 'decision-making'],
      'commander_riker': ['execution', 'team-coordination', 'tactical', 'leadership'],
      'commander_data': ['analysis', 'technical', 'computation', 'logic'],
      'geordi_la_forge': ['engineering', 'infrastructure', 'optimization', 'systems'],
      'counselor_troi': ['ux', 'psychology', 'empathy', 'communication'],
      'lieutenant_worf': ['security', 'protocols', 'testing', 'reliability'],
      'dr_crusher': ['health-checks', 'diagnostics', 'documentation', 'science'],
      'chief_obrien': ['implementation', 'hands-on', 'maintenance', 'troubleshooting'],
      'quark': ['business', 'analytics', 'monetization', 'negotiation'],
    };

    const crewSkills = crewSkillsMap[crewId] || [];
    const matchedSkills = requiredSkills.filter(skill => 
      crewSkills.some(cs => cs.toLowerCase().includes(skill.toLowerCase()) || 
                           skill.toLowerCase().includes(cs.toLowerCase()))
    );

    const score = matchedSkills.length / Math.max(requiredSkills.length, 1);

    return {
      crewId,
      score,
      reasoning: matchedSkills.length > 0 
        ? `Matched ${matchedSkills.length}/${requiredSkills.length} required skills`
        : 'No direct skill matches, may need training',
      matchedSkills,
    };
  }

  /**
   * Assign crew members based on a query/task description
   */
  assignCrew(query: string): Array<{ crewMemberId: string; score: number; role: string }> {
    // Extract skills from query
    const queryLower = query.toLowerCase();
    const detectedSkills: string[] = [];
    
    if (queryLower.includes('analytics') || queryLower.includes('business')) {
      detectedSkills.push('business', 'analytics');
    }
    if (queryLower.includes('performance') || queryLower.includes('optimization')) {
      detectedSkills.push('engineering', 'optimization');
    }
    if (queryLower.includes('security') || queryLower.includes('protocol')) {
      detectedSkills.push('security', 'protocols');
    }
    if (queryLower.includes('user') || queryLower.includes('ux')) {
      detectedSkills.push('ux', 'psychology');
    }
    if (queryLower.includes('technical') || queryLower.includes('system')) {
      detectedSkills.push('technical', 'systems');
    }

    const scores = this.getOptimalCrew(detectedSkills.length > 0 ? detectedSkills : ['general'], 5);
    
    return scores.map(s => ({
      crewMemberId: s.crewId,
      score: s.score,
      role: s.matchedSkills.length > 0 ? s.matchedSkills[0] : 'general'
    }));
  }

  /**
   * Assign a specific crew member to a task (explicit assignment)
   */
  assignCrewMember(taskId: string, crewId: string, role: string): CrewAssignment {
    const assignment: CrewAssignment = {
      taskId,
      crewId,
      role,
      assignedAt: new Date().toISOString(),
    };

    const existing = this.assignments.get(taskId) || [];
    existing.push(assignment);
    this.assignments.set(taskId, existing);

    return assignment;
  }

  /**
   * Get all assignments for a task
   */
  getAssignmentsForTask(taskId: string): CrewAssignment[] {
    return this.assignments.get(taskId) || [];
  }

  /**
   * Get optimal crew for a set of required skills
   */
  getOptimalCrew(requiredSkills: string[], count: number = 3): AssignmentScore[] {
    const allCrew = [
      'captain_picard', 'commander_riker', 'commander_data',
      'geordi_la_forge', 'counselor_troi', 'lieutenant_worf',
      'dr_crusher', 'chief_obrien', 'quark'
    ];

    const scores = allCrew.map(crewId => 
      this.scoreCrewForTask(crewId, '', requiredSkills)
    );

    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, count);
  }
}





