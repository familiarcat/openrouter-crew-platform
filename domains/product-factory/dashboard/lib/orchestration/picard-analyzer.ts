/**
 * Picard's strategic task analysis module.
 *
 * Analyzes user requests to determine task complexity, required expertise,
 * and recommends optimal crew composition. Port of Python implementation
 * from src/rag_factory/orchestration/crew_orchestrator.py lines 191-292.
 */

import { TaskComplexity, TaskAnalysis } from "./types";

/**
 * Crew roster with specializations
 * Based on crew-members/*.json configs
 */
const CREW_ROSTER: Record<string, { name: string; specialization: string[] }> = {
  captain_picard: {
    name: "Captain Picard",
    specialization: ["strategy", "leadership", "architecture", "ethics"]
  },
  commander_riker: {
    name: "Commander Riker",
    specialization: ["tactical", "execution", "coordination", "workflow"]
  },
  commander_data: {
    name: "Commander Data",
    specialization: ["ai_ml", "analytics", "algorithms", "automation"]
  },
  geordi_la_forge: {
    name: "Geordi La Forge",
    specialization: ["infrastructure", "devops", "cloud", "systems"]
  },
  counselor_troi: {
    name: "Counselor Troi",
    specialization: ["ux", "accessibility", "design", "user_experience"]
  },
  lieutenant_worf: {
    name: "Lt. Worf",
    specialization: ["security", "testing", "reliability", "qa"]
  },
  chief_obrien: {
    name: "Chief O'Brien",
    specialization: ["implementation", "debugging", "coding", "hands_on"]
  },
  quark: {
    name: "Quark",
    specialization: ["business", "roi", "cost", "optimization"]
  },
  dr_crusher: {
    name: "Dr. Crusher",
    specialization: ["performance", "diagnostics", "health", "monitoring"]
  },
  lieutenant_uhura: {
    name: "Lt. Uhura",
    specialization: ["apis", "integration", "documentation", "communication"]
  }
};

/**
 * Keywords for complexity assessment
 */
const COMPLEXITY_KEYWORDS = {
  critical: [
    "architecture",
    "refactor",
    "security incident",
    "production down",
    "critical bug",
    "system failure"
  ],
  important: [
    "feature",
    "bug",
    "performance",
    "optimization",
    "implement",
    "enhancement"
  ],
  trivial: [
    "format",
    "typo",
    "simple",
    "quick",
    "minor",
    "fix spacing"
  ]
};

/**
 * Expertise mapping from keywords
 * Maps user request keywords to required crew specializations
 */
const EXPERTISE_MAP: Record<string, string[]> = {
  "ai": ["ai_ml", "analytics"],
  "ml": ["ai_ml", "analytics"],
  "machine learning": ["ai_ml", "analytics"],
  "infrastructure": ["infrastructure", "devops"],
  "cloud": ["infrastructure", "devops"],
  "devops": ["infrastructure", "devops"],
  "ux": ["ux", "design"],
  "ui": ["ux", "design"],
  "design": ["ux", "design"],
  "security": ["security", "testing"],
  "test": ["security", "testing"],
  "api": ["apis", "integration"],
  "integration": ["apis", "integration"],
  "performance": ["performance", "diagnostics"],
  "bug": ["implementation", "debugging"],
  "implement": ["implementation", "coding"],
  "code": ["implementation", "coding"],
  "cost": ["business", "roi"],
  "budget": ["business", "roi"],
  "strategy": ["strategy", "leadership"],
  "architecture": ["strategy", "architecture"]
};

/**
 * Analyze task complexity and recommend crew composition.
 *
 * This function implements Picard's strategic analysis to determine:
 * 1. Task complexity level
 * 2. Required areas of expertise
 * 3. Recommended crew members
 * 4. Optimal crew size
 *
 * @param userRequest - The user's task description
 * @param context - Optional additional context
 * @returns TaskAnalysis with Picard's assessment
 */
export function analyzePicardTask(
  userRequest: string,
  context?: Record<string, any>
): TaskAnalysis {
  const requestLower = userRequest.toLowerCase();

  // Step 1: Determine task complexity
  let complexity: TaskComplexity;
  let maxCrew: number;

  if (COMPLEXITY_KEYWORDS.critical.some(kw => requestLower.includes(kw))) {
    complexity = TaskComplexity.CRITICAL;
    maxCrew = 7;
  } else if (COMPLEXITY_KEYWORDS.important.some(kw => requestLower.includes(kw))) {
    complexity = TaskComplexity.IMPORTANT;
    maxCrew = 5;
  } else if (COMPLEXITY_KEYWORDS.trivial.some(kw => requestLower.includes(kw))) {
    complexity = TaskComplexity.TRIVIAL;
    maxCrew = 2;
  } else {
    complexity = TaskComplexity.ROUTINE;
    maxCrew = 3;
  }

  // Step 2: Identify required expertise from keywords
  const requiredExpertise: string[] = [];
  for (const [keyword, expertise] of Object.entries(EXPERTISE_MAP)) {
    if (requestLower.includes(keyword)) {
      requiredExpertise.push(...expertise);
    }
  }

  // Remove duplicates
  const uniqueExpertise = [...new Set(requiredExpertise)];

  // If no specific expertise found, default to tactical execution
  const finalExpertise = uniqueExpertise.length > 0
    ? uniqueExpertise
    : ["tactical", "execution"];

  // Step 3: Match crew members to required expertise
  // Always include Riker for coordination
  const recommendedCrew: string[] = ["commander_riker"];

  // Add crew members with matching expertise
  for (const [crewId, member] of Object.entries(CREW_ROSTER)) {
    if (crewId === "commander_riker") continue; // Already added

    // Check if crew member has any required expertise
    const hasRequiredExpertise = member.specialization.some(spec =>
      finalExpertise.includes(spec)
    );

    if (hasRequiredExpertise) {
      recommendedCrew.push(crewId);
    }
  }

  // Step 4: Limit crew size based on complexity
  const finalCrew = recommendedCrew.slice(0, maxCrew);

  // Step 5: Generate reasoning
  const reasoning = `Task complexity: ${complexity}. ` +
    `Required expertise: ${finalExpertise.join(", ")}. ` +
    `Recommended ${finalCrew.length} crew members for optimal efficiency. ` +
    `Riker will coordinate tactical execution.`;

  return {
    complexity,
    requiredExpertise: finalExpertise,
    recommendedCrew: finalCrew,
    reasoning,
    estimatedCrewSize: finalCrew.length
  };
}
