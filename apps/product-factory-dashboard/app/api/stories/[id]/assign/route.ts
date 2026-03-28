/**
 * Crew Assignment API Endpoint
 *
 * POST /api/stories/[id]/assign - Get AI crew assignment recommendations
 *
 * This endpoint analyzes a story and recommends the best crew member(s)
 * to assign based on:
 *   - Skill match (story type, technical complexity)
 *   - Persona affinity (preferred crew member)
 *   - Workload balance (current capacity)
 *   - Historical performance (past velocity)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import type {
  Story,
  Persona,
  CrewWorkload,
  CrewAssignmentRecommendation,
  CrewAssignmentResponse,
  CrewMember
} from '@/types/sprint';
import { CREW_MEMBERS } from '@/types/sprint';



interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Crew Assignment Algorithm
 *
 * Score = (skillMatch × 1.0) +
 *         (personaAffinity × 1.3) +
 *         (workloadBalance × 0.7) +
 *         (historicalPerformance × 0.5)
 *
 * Factors:
 *   - Skill Match: How well crew member's specialty matches story requirements
 *   - Persona Affinity: Persona's preferred crew member gets bonus
 *   - Workload Balance: Lower current workload = higher score
 *   - Historical Performance: Past velocity and completion rate
 */

/**
 * POST /api/stories/[id]/assign
 *
 * Get crew assignment recommendations for a story
 *
 * Request body: {} (empty)
 *
 * Response:
 * {
 *   "story": {...},
 *   "recommendations": [
 *     {
 *       "crew_member": "data",
 *       "crew_member_name": "Commander Data",
 *       "score": 87,
 *       "reasoning": {
 *         "skill_match": 90,
 *         "persona_affinity": 100,
 *         "workload_balance": 75,
 *         "historical_performance": 85
 *       },
 *       "current_workload": 21,
 *       "capacity_percentage": 62
 *     }
 *   ],
 *   "auto_assigned": "data" // if confidence > 80%
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id: storyId } = await params;

    // Fetch story with persona
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select(`
        *,
        persona:personas (*)
      `)
      .eq('id', storyId)
      .single();

    if (storyError || !story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }

    // If story has no sprint, we can't calculate workload
    // Use default workload assumptions
    let crewWorkloads: CrewWorkload[] = [];

    if (story.sprint_id) {
      const { data: workloads } = await supabase
        .from('crew_workload')
        .select('*')
        .eq('sprint_id', story.sprint_id);

      crewWorkloads = workloads || [];
    }

    // Calculate recommendations for each crew member
    const recommendations: CrewAssignmentRecommendation[] = [];

    for (const [crewKey, crewInfo] of Object.entries(CREW_MEMBERS)) {
      const crewMember = crewKey as CrewMember;

      // Get current workload for this crew member
      const workload = crewWorkloads.find(w => w.crew_member === crewMember);
      const currentWorkload = workload?.total_story_points || 0;
      const capacityPercentage = workload?.capacity_percentage || 0;

      // Calculate scoring factors
      const skillMatch = calculateSkillMatch(story, crewMember);
      const personaAffinity = calculatePersonaAffinity(story.persona, crewMember);
      const workloadBalance = calculateWorkloadBalance(capacityPercentage);
      const historicalPerformance = calculateHistoricalPerformance(crewMember);

      // Calculate total score
      const score = Math.round(
        (skillMatch * 1.0) +
        (personaAffinity * 1.3) +
        (workloadBalance * 0.7) +
        (historicalPerformance * 0.5)
      );

      recommendations.push({
        crew_member: crewMember,
        crew_member_name: crewInfo.name,
        score,
        reasoning: {
          skill_match: skillMatch,
          persona_affinity: personaAffinity,
          workload_balance: workloadBalance,
          historical_performance: historicalPerformance
        },
        current_workload: currentWorkload,
        capacity_percentage: capacityPercentage
      });
    }

    // Sort by score descending
    recommendations.sort((a, b) => b.score - a.score);

    // Auto-assign if top recommendation has score > 80%
    const topRecommendation = recommendations[0];
    let autoAssigned: string | undefined;

    if (topRecommendation.score >= 260) { // 80% of max score (325)
      autoAssigned = topRecommendation.crew_member;

      // Update story with auto-assignment
      await supabase
        .from('stories')
        .update({ assigned_crew_member: autoAssigned })
        .eq('id', storyId);
    }

    const response: CrewAssignmentResponse = {
      story: story as Story,
      recommendations,
      auto_assigned: autoAssigned
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Unexpected error in POST /api/stories/[id]/assign:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// Scoring Functions
// ============================================================================

/**
 * Calculate skill match score (0-100)
 *
 * Matches story type and technical requirements to crew member specialty
 */
function calculateSkillMatch(story: any, crewMember: CrewMember): number {
  const storyType = story.story_type;
  const title = story.title?.toLowerCase() || '';
  const description = story.description?.toLowerCase() || '';

  // Crew member skill mappings
  const skillMappings: Record<CrewMember, { keywords: string[], storyTypes: string[] }> = {
    picard: {
      keywords: ['strategy', 'architecture', 'leadership', 'planning', 'roadmap'],
      storyTypes: []
    },
    riker: {
      keywords: ['execution', 'coordination', 'integration', 'workflow'],
      storyTypes: []
    },
    data: {
      keywords: ['ai', 'ml', 'machine learning', 'algorithm', 'data', 'analytics', 'api', 'backend'],
      storyTypes: ['developer_story']
    },
    la_forge: {
      keywords: ['infrastructure', 'devops', 'deployment', 'ci/cd', 'docker', 'kubernetes', 'aws'],
      storyTypes: ['technical_task']
    },
    troi: {
      keywords: ['ux', 'ui', 'user experience', 'interface', 'design', 'accessibility', 'frontend'],
      storyTypes: ['user_story']
    },
    worf: {
      keywords: ['security', 'testing', 'qa', 'test', 'vulnerability', 'auth', 'encryption'],
      storyTypes: ['bug_fix']
    },
    crusher: {
      keywords: ['performance', 'optimization', 'monitoring', 'health', 'metrics'],
      storyTypes: ['technical_task']
    },
    uhura: {
      keywords: ['api', 'integration', 'webhook', 'external', 'communication', 'rest', 'graphql'],
      storyTypes: ['developer_story']
    },
    quark: {
      keywords: ['business', 'roi', 'cost', 'revenue', 'pricing', 'analytics'],
      storyTypes: []
    },
    obrien: {
      keywords: ['implementation', 'maintenance', 'bug', 'fix', 'refactor'],
      storyTypes: ['bug_fix', 'technical_task']
    }
  };

  const mapping = skillMappings[crewMember];

  // Check story type match
  let score = 50; // Base score

  if (mapping.storyTypes.includes(storyType)) {
    score += 30;
  }

  // Check keyword match
  const keywordMatches = mapping.keywords.filter(keyword =>
    title.includes(keyword) || description.includes(keyword)
  ).length;

  score += Math.min(keywordMatches * 10, 20);

  return Math.min(score, 100);
}

/**
 * Calculate persona affinity score (0-100)
 *
 * Persona's preferred crew member gets bonus
 */
function calculatePersonaAffinity(persona: Persona | null, crewMember: CrewMember): number {
  if (!persona || !persona.preferred_crew_member) {
    return 50; // Neutral score
  }

  if (persona.preferred_crew_member === crewMember) {
    return 100; // Perfect match
  }

  return 40; // Penalty for non-preferred
}

/**
 * Calculate workload balance score (0-100)
 *
 * Lower capacity = higher score (prefer less busy crew members)
 */
function calculateWorkloadBalance(capacityPercentage: number): number {
  if (capacityPercentage === 0) {
    return 100; // Completely available
  }

  if (capacityPercentage >= 100) {
    return 0; // At or over capacity
  }

  // Linear inverse: 100% capacity = 0 score, 0% capacity = 100 score
  return Math.round(100 - capacityPercentage);
}

/**
 * Calculate historical performance score (0-100)
 *
 * Based on past velocity and completion rate
 * TODO: Implement real historical tracking
 */
function calculateHistoricalPerformance(crewMember: CrewMember): number {
  // For now, return baseline scores based on crew member
  // In production, this would query historical sprint data

  const performanceBaselines: Record<CrewMember, number> = {
    picard: 90,
    riker: 88,
    data: 95,      // Highest reliability
    la_forge: 87,
    troi: 89,
    worf: 92,      // Very consistent
    crusher: 85,
    uhura: 86,
    quark: 75,     // Variable performance
    obrien: 91     // Very dependable
  };

  return performanceBaselines[crewMember];
}
