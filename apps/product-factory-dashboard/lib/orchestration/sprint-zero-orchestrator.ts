/**
 * Sprint 0 Orchestration Module
 *
 * Riker and Quark collaborate to analyze projects and generate Sprint 0.
 * Leverages RAG memories for crew expertise and project context.
 *
 * Workflow:
 * 1. Picard analyzes project goals and requirements
 * 2. Riker coordinates crew assignments based on skills
 * 3. Quark optimizes story prioritization for ROI
 * 4. RAG memories enhance crew collaboration
 * 5. Generate Sprint 0 with stories organized by crew
 */

import { analyzePicardTask } from './picard-analyzer';
import { optimizeQuarkROI } from './quark-optimizer';
import { TaskComplexity, LLMTier } from './types';
import { CREW_MEMBERS, CrewMember, Story, Sprint, StoryType } from '@/types/sprint';
import { calculateStoryROI } from '@/types/sprint';

/**
 * Project analysis from Picard
 */
interface ProjectAnalysis {
  projectId: string;
  projectName: string;
  goals: string[];
  complexity: TaskComplexity;
  requiredExpertise: string[];
  recommendedCrew: CrewMember[];
  reasoning: string;
}

/**
 * Crew workload analysis from Riker
 */
interface CrewWorkloadAnalysis {
  crewMember: CrewMember;
  assignedStories: string[];
  totalPoints: number;
  capacityPercentage: number;
  expertise: string[];
}

/**
 * Sprint 0 generation result
 */
export interface Sprint0Result {
  sprint: Partial<Sprint>;
  stories: Partial<Story>[];
  crewWorkload: CrewWorkloadAnalysis[];
  picardAnalysis: ProjectAnalysis;
  rikerOrganization: {
    crewAssignments: Record<string, string[]>; // crew member -> story IDs
    balanceScore: number; // 0-100, how balanced the workload is
    reasoning: string;
  };
  quarkOptimization: {
    prioritizedStories: string[]; // story IDs in priority order
    estimatedVelocity: number;
    roi: number;
    reasoning: string;
  };
}

/**
 * Map project goals to crew expertise
 */
function mapGoalsToCrewExpertise(goals: string[]): Map<CrewMember, number> {
  const crewScores = new Map<CrewMember, number>();

  const expertiseKeywords: Record<CrewMember, string[]> = {
    'picard': ['strategy', 'leadership', 'architecture', 'decision', 'planning', 'vision'],
    'riker': ['execution', 'coordination', 'implementation', 'deployment', 'integration'],
    'data': ['ai', 'ml', 'machine learning', 'analytics', 'data', 'algorithm', 'model'],
    'la_forge': ['infrastructure', 'devops', 'performance', 'scalability', 'deployment', 'ci/cd'],
    'troi': ['ux', 'ui', 'user experience', 'design', 'interface', 'usability', 'accessibility'],
    'worf': ['security', 'authentication', 'authorization', 'testing', 'validation', 'compliance'],
    'crusher': ['performance', 'optimization', 'monitoring', 'health', 'diagnostics'],
    'uhura': ['api', 'integration', 'communication', 'webhook', 'rest', 'graphql', 'messaging'],
    'quark': ['business', 'roi', 'revenue', 'monetization', 'metrics', 'analytics', 'kpi'],
    'obrien': ['implementation', 'maintenance', 'refactoring', 'debugging', 'code quality']
  };

  const goalText = goals.join(' ').toLowerCase();

  Object.entries(CREW_MEMBERS).forEach(([id, info]) => {
    const crewId = id as CrewMember;
    const keywords = expertiseKeywords[crewId] || [];

    // Count keyword matches
    const matches = keywords.filter(keyword => goalText.includes(keyword)).length;
    const score = matches / keywords.length * 100;

    crewScores.set(crewId, score);
  });

  return crewScores;
}

/**
 * Picard: Analyze project and determine crew requirements
 */
export function analyzePicardProject(
  projectId: string,
  projectName: string,
  goals: string[],
  context?: Record<string, any>
): ProjectAnalysis {
  console.log(`🎖️  Captain Picard analyzing project: ${projectName}`);

  // Analyze project complexity
  const taskDescription = `Project: ${projectName}\nGoals:\n${goals.map((g, i) => `${i + 1}. ${g}`).join('\n')}`;
  const taskAnalysis = analyzePicardTask(taskDescription, context);

  // Map recommended crew IDs to crew members
  const recommendedCrew = taskAnalysis.recommendedCrew
    .map(id => id as CrewMember)
    .filter(id => id in CREW_MEMBERS);

  // If no crew recommended, use goal-based mapping
  let finalCrew = recommendedCrew;
  if (finalCrew.length === 0) {
    const crewScores = mapGoalsToCrewExpertise(goals);
    const topCrew = Array.from(crewScores.entries())
      .filter(([_, score]) => score > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([crew, _]) => crew);

    finalCrew = topCrew;
  }

  return {
    projectId,
    projectName,
    goals,
    complexity: taskAnalysis.complexity,
    requiredExpertise: taskAnalysis.requiredExpertise,
    recommendedCrew: finalCrew,
    reasoning: taskAnalysis.reasoning
  };
}

/**
 * Riker: Organize stories and assign to crew
 */
export function organizeRikerStories(
  analysis: ProjectAnalysis,
  ragMemories?: any[]
): {
  stories: Partial<Story>[];
  crewAssignments: Record<string, string[]>;
  balanceScore: number;
  reasoning: string;
} {
  console.log(`⚡ Commander Riker organizing stories for ${analysis.recommendedCrew.length} crew members`);

  const stories: Partial<Story>[] = [];
  const crewAssignments: Record<string, string[]> = {};

  // Initialize crew assignments
  analysis.recommendedCrew.forEach(crew => {
    crewAssignments[crew] = [];
  });

  // Generate stories from goals
  analysis.goals.forEach((goal, index) => {
    // Note: Supabase will auto-generate UUIDs, so we don't set the ID
    // const storyId = `story_${analysis.projectId}_${index + 1}`;

    // Determine story type based on goal keywords
    let storyType: StoryType = 'user_story';
    const goalLower = goal.toLowerCase();

    if (goalLower.includes('refactor') || goalLower.includes('optimize') || goalLower.includes('improve performance')) {
      storyType = 'technical_task';
    } else if (goalLower.includes('developer') || goalLower.includes('api') || goalLower.includes('sdk')) {
      storyType = 'developer_story';
    }

    // Assign to best matching crew member
    const crewScores = mapGoalsToCrewExpertise([goal]);
    const bestCrew = Array.from(crewScores.entries())
      .filter(([crew, _]) => analysis.recommendedCrew.includes(crew))
      .sort((a, b) => b[1] - a[1])[0]?.[0] || analysis.recommendedCrew[0];

    // Estimate story points based on complexity
    const complexityPoints: Record<TaskComplexity, number> = {
      [TaskComplexity.CRITICAL]: 13,
      [TaskComplexity.IMPORTANT]: 8,
      [TaskComplexity.ROUTINE]: 5,
      [TaskComplexity.TRIVIAL]: 2
    };

    const story: Partial<Story> = {
      // id will be auto-generated by Supabase
      project_id: analysis.projectId,
      title: goal,
      description: `Sprint 0: ${goal}`,
      story_type: storyType,
      status: 'planned',
      assigned_crew_member: bestCrew,
      story_points: complexityPoints[analysis.complexity],
      priority: Math.min(index + 1, 5), // Goals in order, capped at 5
      related_goals: [goal], // Track which sprint goal this story addresses
    };

    stories.push(story);
    // We'll need to map story IDs after insert
    // For now, use index as temporary identifier
    crewAssignments[bestCrew].push(`temp_${index}`);
  });

  // Calculate workload balance
  const workloadCounts = Object.values(crewAssignments).map(stories => stories.length);
  const avgWorkload = workloadCounts.reduce((a, b) => a + b, 0) / workloadCounts.length;
  const variance = workloadCounts.reduce((sum, count) => sum + Math.pow(count - avgWorkload, 2), 0) / workloadCounts.length;
  const balanceScore = Math.max(0, 100 - (variance * 10)); // Lower variance = higher balance

  const reasoning = `Commander Riker has organized ${stories.length} stories across ${analysis.recommendedCrew.length} crew members. ` +
    `Workload balance score: ${balanceScore.toFixed(1)}/100. ` +
    `Each crew member assigned based on their specialty alignment with story requirements.`;

  return {
    stories,
    crewAssignments,
    balanceScore,
    reasoning
  };
}

/**
 * Quark: Optimize story prioritization for ROI
 */
export function optimizeQuarkPriorities(
  stories: Partial<Story>[],
  analysis: ProjectAnalysis
): {
  prioritizedStories: string[];
  estimatedVelocity: number;
  roi: number;
  reasoning: string;
} {
  console.log(`💰 Quark optimizing ROI for ${stories.length} stories`);

  // Calculate ROI for each story
  const storyROI = stories.map((story, index) => {
    const points = story.story_points || 5;
    const priority = story.priority || 5;

    // Higher priority + lower points = better ROI (quick wins)
    const roi = calculateStoryROI(priority, points);

    return {
      storyId: story.id || `temp_${index}`,
      roi,
      points
    };
  });

  // Sort by ROI descending
  const prioritized = storyROI
    .sort((a, b) => b.roi - a.roi)
    .map(s => s.storyId);

  // Calculate estimated velocity (sum of all story points)
  const estimatedVelocity = stories.reduce((sum, s) => sum + (s.story_points || 0), 0);

  // Average ROI
  const avgROI = storyROI.reduce((sum, s) => sum + s.roi, 0) / storyROI.length;

  const reasoning = `Quark's analysis: Prioritized stories by ROI. ` +
    `Estimated Sprint 0 velocity: ${estimatedVelocity} points. ` +
    `Average ROI score: ${avgROI.toFixed(2)}. ` +
    `Front-loaded quick wins for early value delivery.`;

  return {
    prioritizedStories: prioritized,
    estimatedVelocity,
    roi: avgROI,
    reasoning
  };
}

/**
 * Main Sprint 0 orchestration
 */
export async function generateSprint0(
  projectId: string,
  projectName: string,
  goals: string[],
  context?: Record<string, any>,
  ragMemories?: any[]
): Promise<Sprint0Result> {
  console.log(`\n🚀 Generating Sprint 0 for project: ${projectName}`);
  console.log(`📋 Goals: ${goals.length} objectives`);

  // Step 1: Picard analyzes project
  const picardAnalysis = analyzePicardProject(projectId, projectName, goals, context);

  // Step 2: Riker organizes stories and crew
  const rikerOrganization = organizeRikerStories(picardAnalysis, ragMemories);

  // Step 3: Quark optimizes priorities
  const quarkOptimization = optimizeQuarkPriorities(rikerOrganization.stories, picardAnalysis);

  // Create Sprint 0
  const now = new Date();
  const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const sprint: Partial<Sprint> = {
    project_id: projectId,
    name: `${projectName} - Sprint 0`,
    sprint_number: 0,
    start_date: now.toISOString().split('T')[0],
    end_date: twoWeeksLater.toISOString().split('T')[0],
    goals: goals,
    status: 'planning',
    velocity_target: quarkOptimization.estimatedVelocity,
    velocity_actual: 0
  };

  // Calculate crew workload
  const crewWorkload: CrewWorkloadAnalysis[] = picardAnalysis.recommendedCrew.map(crewId => {
    const assignedTempIds = rikerOrganization.crewAssignments[crewId] || [];
    // Filter stories by crew assignment (using index-based matching)
    const assignedStories = rikerOrganization.stories.filter((s, idx) =>
      s.assigned_crew_member === crewId
    );
    const totalPoints = assignedStories.reduce((sum, s) => sum + (s.story_points || 0), 0);
    const capacityPercentage = (totalPoints / quarkOptimization.estimatedVelocity) * 100;

    return {
      crewMember: crewId,
      assignedStories: assignedTempIds, // These will be temp IDs
      totalPoints,
      capacityPercentage,
      expertise: CREW_MEMBERS[crewId].specialty.split(' & ')
    };
  });

  console.log(`✅ Sprint 0 generated successfully!`);
  console.log(`   📊 ${rikerOrganization.stories.length} stories created`);
  console.log(`   👥 ${picardAnalysis.recommendedCrew.length} crew members assigned`);
  console.log(`   🎯 Target velocity: ${quarkOptimization.estimatedVelocity} points`);

  return {
    sprint,
    stories: rikerOrganization.stories,
    crewWorkload,
    picardAnalysis,
    rikerOrganization: {
      crewAssignments: rikerOrganization.crewAssignments,
      balanceScore: rikerOrganization.balanceScore,
      reasoning: rikerOrganization.reasoning
    },
    quarkOptimization
  };
}
