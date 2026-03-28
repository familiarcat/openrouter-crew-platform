/**
 * RAG Memory Integration for Crew Collaboration
 *
 * Integrates with the RAG system to:
 * 1. Query crew member expertise and memories
 * 2. Store sprint planning decisions for future reference
 * 3. Enhance crew assignments with historical performance
 * 4. Build institutional knowledge across projects
 */

import { supabase } from '@/lib/supabase';
import { CrewMember } from '@/types/sprint';

/**
 * Crew memory from RAG system
 */
export interface CrewMemory {
  crewMember: CrewMember;
  actionType: string;
  description: string;
  outcome: string;
  context: Record<string, any>;
  timestamp: string;
  successScore: number; // 0-100
}

/**
 * Sprint planning memory
 */
export interface SprintPlanningMemory {
  sprintId: string;
  projectId: string;
  projectName: string;
  goals: string[];
  crewAssignments: Record<string, string[]>;
  velocityTarget: number;
  velocityActual?: number;
  picardAnalysis: string;
  rikerOrganization: string;
  quarkOptimization: string;
  timestamp: string;
}

/**
 * Minimal row shapes to avoid `never` typing issues until supabase types are fully generated.
 * These are intentionally lightweight and compile-safe.
 */
type CrewActionRow = {
  crew_member?: string | null;
  action_type?: string | null;
  description?: string | null;
  outcome?: string | null;
  context?: Record<string, any> | null;
  created_at?: string | null;
  success_score?: number | null;
};

type SprintPlanningMemoryInsert = {
  sprint_id: string;
  project_id: string;
  project_name: string;
  goals: string[];
  crew_assignments: Record<string, string[]>;
  velocity_target: number;
  picard_analysis: string;
  riker_organization: string;
  quark_optimization: string;
};

/**
 * Query RAG for crew member expertise relevant to project goals
 */
export async function queryCrewExpertise(
  goals: string[],
  limit: number = 10
): Promise<CrewMemory[]> {
  try {
    const searchQuery = goals.join(' ');

    const { data, error } = await supabase
      .from(('crew_actions' as any))
      .select('*')
      .textSearch('description', searchQuery)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error querying crew expertise:', error);
      return [];
    }

    const rows = (data || []) as CrewActionRow[];

    const memories: CrewMemory[] = rows.map((action) => ({
      crewMember: (action.crew_member || 'unknown') as CrewMember,
      actionType: action.action_type || 'unknown',
      description: action.description || '',
      outcome: action.outcome || '',
      context: action.context || {},
      timestamp: action.created_at || new Date().toISOString(),
      successScore: action.success_score ?? 50,
    }));

    console.log(`📚 Retrieved ${memories.length} crew memories from RAG`);
    return memories;
  } catch (error) {
    console.error('Error querying crew expertise:', error);
    return [];
  }
}

/**
 * Query RAG for similar sprint planning examples
 */
export async function querySimilarSprints(
  projectGoals: string[],
  limit: number = 5
): Promise<SprintPlanningMemory[]> {
  try {
    const searchQuery = projectGoals.join(' ');

    const { data, error } = await supabase
      .from(('sprint_planning_memories' as any))
      .select('*')
      // NOTE: textSearch on arrays may not behave as intended depending on schema;
      // leaving as-is for now.
      .textSearch('goals', searchQuery)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error querying similar sprints:', error);
      return [];
    }

    console.log(`📊 Retrieved ${data?.length || 0} similar sprint planning examples`);
    return (data || []) as SprintPlanningMemory[];
  } catch (error) {
    console.error('Error querying similar sprints:', error);
    return [];
  }
}

/**
 * Get crew member success rate for specific expertise areas
 */
export async function getCrewSuccessRate(
  crewMember: CrewMember,
  expertiseArea: string
): Promise<number> {
  try {
    const { data, error } = await supabase
      .from(('crew_actions' as any))
      .select('success_score')
      .eq('crew_member', crewMember)
      .textSearch('description', expertiseArea)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error || !data || (data as any[]).length === 0) return 50;

    const rows = data as Array<{ success_score?: number | null }>;

    const avgScore =
      rows.reduce((sum, a) => sum + (a.success_score ?? 50), 0) / rows.length;

    return avgScore;
  } catch (error) {
    console.error('Error getting crew success rate:', error);
    return 50;
  }
}

/**
 * Store sprint planning decision as a memory
 */
export async function storeSprint0Memory(
  sprintId: string,
  projectId: string,
  projectName: string,
  goals: string[],
  crewAssignments: Record<string, string[]>,
  velocityTarget: number,
  picardAnalysis: string,
  rikerOrganization: string,
  quarkOptimization: string
): Promise<boolean> {
  try {
    // Kept for caller logic / future use (even though DB uses snake_case)
    const _memory: Omit<SprintPlanningMemory, 'timestamp'> = {
      sprintId,
      projectId,
      projectName,
      goals,
      crewAssignments,
      velocityTarget,
      picardAnalysis,
      rikerOrganization,
      quarkOptimization,
    };

    const insertPayload: SprintPlanningMemoryInsert = {
      sprint_id: sprintId,
      project_id: projectId,
      project_name: projectName,
      goals,
      crew_assignments: crewAssignments,
      velocity_target: velocityTarget,
      picard_analysis: picardAnalysis,
      riker_organization: rikerOrganization,
      quark_optimization: quarkOptimization,
    };

    const { error } = await supabase
      .from(('sprint_planning_memories' as any))
      .insert((insertPayload as any));

    if (error) {
      console.error('Error storing sprint planning memory:', error);
      return false;
    }

    console.log(`💾 Stored Sprint 0 planning memory for ${projectName}`);
    return true;
  } catch (error) {
    console.error('Error storing sprint planning memory:', error);
    return false;
  }
}

/**
 * Enhance crew assignments with RAG memory insights
 */
export async function enhanceCrewAssignments(
  initialAssignments: Record<string, string[]>,
  goals: string[]
): Promise<{
  enhancedAssignments: Record<string, string[]>;
  insights: string[];
}> {
  const insights: string[] = [];

  try {
    const crewMemories = await queryCrewExpertise(goals, 20);

    const crewPerformance: Record<string, { count: number; avgScore: number }> = {};

    crewMemories.forEach((memory) => {
      const key = memory.crewMember;
      if (!crewPerformance[key]) crewPerformance[key] = { count: 0, avgScore: 0 };
      crewPerformance[key].count++;
      crewPerformance[key].avgScore += memory.successScore;
    });

    Object.keys(crewPerformance).forEach((crew) => {
      const perf = crewPerformance[crew];
      perf.avgScore = perf.avgScore / perf.count;

      if (perf.avgScore > 80) {
        insights.push(
          `${crew} has exceptional performance (${perf.avgScore.toFixed(1)}%) in similar tasks`
        );
      } else if (perf.avgScore < 40) {
        insights.push(
          `${crew} may need support for this type of work (${perf.avgScore.toFixed(1)}% success rate)`
        );
      }
    });

    return { enhancedAssignments: initialAssignments, insights };
  } catch (error) {
    console.error('Error enhancing crew assignments:', error);
    return {
      enhancedAssignments: initialAssignments,
      insights: ['Unable to retrieve crew performance data'],
    };
  }
}

/**
 * Get recommended crew for new project based on similar projects
 */
export async function getRecommendedCrewForNewProject(
  projectGoals: string[]
): Promise<{
  recommendedCrew: CrewMember[];
  reasoning: string;
}> {
  try {
    const similarSprints = await querySimilarSprints(projectGoals, 5);

    if (similarSprints.length === 0) {
      return {
        recommendedCrew: [],
        reasoning: 'No similar projects found in memory. Using default crew analysis.',
      };
    }

    const crewCounts: Record<string, number> = {};

    similarSprints.forEach((sprint) => {
      Object.keys(sprint.crewAssignments || {}).forEach((crew) => {
        crewCounts[crew] = (crewCounts[crew] || 0) + 1;
      });
    });

    const recommendedCrew = Object.entries(crewCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([crew]) => crew as CrewMember);

    const reasoning =
      `Based on ${similarSprints.length} similar projects, ` +
      `the following crew members were most frequently assigned: ${recommendedCrew.join(', ')}`;

    return { recommendedCrew, reasoning };
  } catch (error) {
    console.error('Error getting recommended crew:', error);
    return {
      recommendedCrew: [],
      reasoning: 'Error retrieving crew recommendations from memory.',
    };
  }
}
