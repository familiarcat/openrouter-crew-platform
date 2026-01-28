/**
 * Crew Collaboration Engine
 * 
 * Enables crew members to work together across projects,
 * sharing knowledge and accelerating progress through
 * RAG memory integration and OpenRouter LLM optimization.
 * 
 * Leadership: Commander Riker (Tactical Coordination)
 */

export interface CrewMember {
  id: string;
  name: string;
  title: string;
  icon: string;
  specializations: string[];
  skills: Record<string, number>; // skill -> proficiency 1-10
  availability: number; // 0-100 capacity percentage
  currentProjects: string[];
  collaborationStyle: 'mentor' | 'partner' | 'specialist' | 'generalist';
  llmPreference: string; // OpenRouter model preference
}

export interface CollaborationTask {
  id: string;
  projectId: string;
  domainSlug: string;
  taskType: 'development' | 'review' | 'planning' | 'optimization' | 'research';
  description: string;
  requiredSkills: string[];
  estimatedHours: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed';
  deadline?: string;
}

export interface CollaborationPair {
  leadId: string;
  supportId: string;
  synergy: number; // 0-100
  sharedSkills: string[];
  complementarySkills: string[];
  reasoning: string;
}

export interface CollaborationSession {
  id: string;
  task: CollaborationTask;
  team: CollaborationPair[];
  llmModel: string;
  startedAt: string;
  completedAt?: string;
  progressDelta: number; // How much progress was made
  insights: string[];
  memoriesUsed: string[];
}

export interface RAGMemory {
  id: string;
  crewId: string;
  content: string;
  type: 'lesson' | 'decision' | 'pattern' | 'solution' | 'warning';
  projectContext?: string;
  relevanceScore?: number;
  createdAt: string;
}

// Full crew roster with collaboration metadata
export const crewRoster: CrewMember[] = [
  {
    id: 'captain_picard',
    name: 'Captain Picard',
    title: 'Strategic Commander',
    icon: '🎖️',
    specializations: ['strategy', 'leadership', 'diplomacy', 'decision-making'],
    skills: {
      'strategic-planning': 10,
      'risk-assessment': 9,
      'stakeholder-management': 10,
      'architecture-decisions': 8,
      'team-leadership': 10,
      'conflict-resolution': 9,
    },
    availability: 60,
    currentProjects: ['factory'],
    collaborationStyle: 'mentor',
    llmPreference: 'anthropic/claude-3.5-sonnet',
  },
  {
    id: 'commander_riker',
    name: 'Commander Riker',
    title: 'Executive Officer & Coordinator',
    icon: '⚡',
    specializations: ['execution', 'team-coordination', 'tactical', 'project-management'],
    skills: {
      'team-coordination': 10,
      'execution-planning': 9,
      'resource-allocation': 9,
      'deadline-management': 8,
      'cross-project-synergy': 10,
      'crew-optimization': 9,
    },
    availability: 80,
    currentProjects: ['factory'],
    collaborationStyle: 'partner',
    llmPreference: 'anthropic/claude-3.5-sonnet',
  },
  {
    id: 'commander_data',
    name: 'Commander Data',
    title: 'Chief Science Officer',
    icon: '🤖',
    specializations: ['ai', 'analysis', 'computation', 'logic', 'rag'],
    skills: {
      'ai-integration': 10,
      'data-analysis': 10,
      'algorithm-design': 9,
      'prompt-engineering': 10,
      'rag-architecture': 10,
      'llm-optimization': 9,
      'code-review': 8,
    },
    availability: 90,
    currentProjects: ['AI Writing Assistant', 'DocuSearch Enterprise', 'Code Review Automation'],
    collaborationStyle: 'specialist',
    llmPreference: 'openai/gpt-4-turbo',
  },
  {
    id: 'geordi_la_forge',
    name: 'Lt. Cmdr. La Forge',
    title: 'Chief Engineer',
    icon: '🔧',
    specializations: ['engineering', 'infrastructure', 'optimization', 'systems'],
    skills: {
      'infrastructure-design': 10,
      'performance-optimization': 9,
      'ci-cd': 10,
      'docker': 9,
      'aws': 9,
      'terraform': 8,
      'debugging': 10,
      'system-integration': 9,
    },
    availability: 75,
    currentProjects: ['factory', 'DocuSearch Enterprise', 'Feedback Widget', 'Code Review Automation'],
    collaborationStyle: 'partner',
    llmPreference: 'anthropic/claude-3.5-sonnet',
  },
  {
    id: 'counselor_troi',
    name: 'Counselor Troi',
    title: 'Ship\'s Counselor',
    icon: '💭',
    specializations: ['ux', 'psychology', 'empathy', 'user-research'],
    skills: {
      'ux-design': 10,
      'user-research': 9,
      'accessibility': 8,
      'emotional-design': 10,
      'feedback-analysis': 9,
      'journey-mapping': 8,
      'usability-testing': 9,
    },
    availability: 85,
    currentProjects: ['AI Writing Assistant', 'Feedback Widget'],
    collaborationStyle: 'mentor',
    llmPreference: 'anthropic/claude-3.5-sonnet',
  },
  {
    id: 'lieutenant_worf',
    name: 'Lt. Worf',
    title: 'Chief of Security',
    icon: '⚔️',
    specializations: ['security', 'protocols', 'testing', 'reliability'],
    skills: {
      'security-audit': 10,
      'penetration-testing': 9,
      'auth-systems': 9,
      'compliance': 8,
      'error-handling': 9,
      'code-hardening': 9,
      'monitoring': 8,
    },
    availability: 70,
    currentProjects: ['Code Review Automation'],
    collaborationStyle: 'specialist',
    llmPreference: 'openai/gpt-4-turbo',
  },
  {
    id: 'dr_crusher',
    name: 'Dr. Crusher',
    title: 'Chief Medical Officer',
    icon: '💊',
    specializations: ['health-checks', 'diagnostics', 'documentation', 'science'],
    skills: {
      'system-health': 9,
      'diagnostics': 10,
      'documentation': 9,
      'testing-strategy': 8,
      'quality-assurance': 9,
      'metrics-analysis': 8,
      'root-cause-analysis': 9,
    },
    availability: 80,
    currentProjects: ['factory'],
    collaborationStyle: 'mentor',
    llmPreference: 'anthropic/claude-3.5-sonnet',
  },
  {
    id: 'chief_obrien',
    name: "Chief O'Brien",
    title: 'Transporter Chief',
    icon: '🛠️',
    specializations: ['implementation', 'hands-on', 'maintenance', 'troubleshooting'],
    skills: {
      'hands-on-coding': 10,
      'troubleshooting': 10,
      'maintenance': 9,
      'rapid-prototyping': 9,
      'legacy-integration': 8,
      'database-ops': 8,
      'practical-solutions': 10,
    },
    availability: 85,
    currentProjects: ['DocuSearch Enterprise'],
    collaborationStyle: 'generalist',
    llmPreference: 'openai/gpt-4-turbo',
  },
  {
    id: 'quark',
    name: 'Quark',
    title: 'Business Strategist',
    icon: '💰',
    specializations: ['business', 'analytics', 'monetization', 'negotiation'],
    skills: {
      'monetization-strategy': 10,
      'pricing': 9,
      'market-analysis': 9,
      'revenue-optimization': 10,
      'cost-analysis': 10,
      'customer-acquisition': 8,
      'competitive-analysis': 9,
    },
    availability: 90,
    currentProjects: ['factory', 'Code Review Automation'],
    collaborationStyle: 'specialist',
    llmPreference: 'openai/gpt-4-turbo',
  },
  {
    id: 'lieutenant_uhura',
    name: 'Lt. Uhura',
    title: 'Communications Officer',
    icon: '📻',
    specializations: ['communication', 'integration', 'api-design', 'documentation'],
    skills: {
      'api-design': 9,
      'documentation': 10,
      'integration': 9,
      'communication-protocols': 10,
      'error-messaging': 9,
      'i18n': 8,
      'developer-experience': 9,
    },
    availability: 75,
    currentProjects: [],
    collaborationStyle: 'partner',
    llmPreference: 'anthropic/claude-3.5-sonnet',
  },
];

/**
 * Calculate synergy between two crew members
 */
export function calculateCrewSynergy(member1: CrewMember, member2: CrewMember): CollaborationPair {
  const skills1 = Object.keys(member1.skills);
  const skills2 = Object.keys(member2.skills);
  
  // Find shared skills (both have proficiency >= 7)
  const sharedSkills = skills1.filter(skill => 
    member1.skills[skill] >= 7 && 
    skills2.includes(skill) && 
    member2.skills[skill] >= 7
  );
  
  // Find complementary skills (one has, other lacks)
  const complementarySkills = [
    ...skills1.filter(s => !skills2.includes(s) && member1.skills[s] >= 8),
    ...skills2.filter(s => !skills1.includes(s) && member2.skills[s] >= 8),
  ];
  
  // Calculate synergy score
  const sharedScore = sharedSkills.length * 10;
  const complementaryScore = complementarySkills.length * 15;
  const styleBonus = getStyleCompatibility(member1.collaborationStyle, member2.collaborationStyle);
  const availabilityFactor = Math.min(member1.availability, member2.availability) / 100;
  
  const synergy = Math.min(100, Math.round((sharedScore + complementaryScore + styleBonus) * availabilityFactor));
  
  // Determine lead based on experience and style
  const lead = member1.collaborationStyle === 'mentor' || 
               (member1.collaborationStyle === 'specialist' && member2.collaborationStyle === 'generalist')
    ? member1.id : member2.id;
  const support = lead === member1.id ? member2.id : member1.id;
  
  return {
    leadId: lead,
    supportId: support,
    synergy,
    sharedSkills,
    complementarySkills,
    reasoning: generateSynergyReasoning(member1, member2, sharedSkills, complementarySkills, synergy),
  };
}

function getStyleCompatibility(style1: string, style2: string): number {
  const compatibilityMatrix: Record<string, Record<string, number>> = {
    'mentor': { 'mentor': 10, 'partner': 15, 'specialist': 20, 'generalist': 25 },
    'partner': { 'mentor': 15, 'partner': 20, 'specialist': 15, 'generalist': 20 },
    'specialist': { 'mentor': 20, 'partner': 15, 'specialist': 10, 'generalist': 25 },
    'generalist': { 'mentor': 25, 'partner': 20, 'specialist': 25, 'generalist': 15 },
  };
  return compatibilityMatrix[style1]?.[style2] || 10;
}

function generateSynergyReasoning(
  m1: CrewMember, 
  m2: CrewMember, 
  shared: string[], 
  complementary: string[],
  synergy: number
): string {
  const parts: string[] = [];
  
  if (shared.length > 0) {
    parts.push(`Strong collaboration on ${shared.slice(0, 3).join(', ')}`);
  }
  
  if (complementary.length > 0) {
    parts.push(`${m1.name} brings ${complementary.slice(0, 2).join(', ')} while ${m2.name} contributes different strengths`);
  }
  
  if (synergy >= 80) {
    parts.push('Exceptional team synergy expected');
  } else if (synergy >= 60) {
    parts.push('Good collaboration potential');
  }
  
  return parts.join('. ') || 'Standard collaboration pairing';
}

/**
 * Find optimal team for a task
 */
export function findOptimalTeam(
  task: CollaborationTask,
  maxTeamSize: number = 3
): { team: CrewMember[]; pairs: CollaborationPair[] } {
  // Score each crew member for the task
  const scores = crewRoster.map(member => {
    const skillMatch = task.requiredSkills.reduce((score, skill) => {
      const memberSkill = Object.entries(member.skills).find(([s]) => 
        s.toLowerCase().includes(skill.toLowerCase()) || 
        skill.toLowerCase().includes(s.toLowerCase())
      );
      return score + (memberSkill ? memberSkill[1] : 0);
    }, 0);
    
    const availabilityBonus = member.availability / 10;
    const specializationBonus = member.specializations.some(s => 
      task.requiredSkills.some(rs => s.includes(rs) || rs.includes(s))
    ) ? 20 : 0;
    
    return {
      member,
      score: skillMatch + availabilityBonus + specializationBonus,
    };
  });
  
  // Sort by score and take top candidates
  scores.sort((a, b) => b.score - a.score);
  const team = scores.slice(0, maxTeamSize).map(s => s.member);
  
  // Generate collaboration pairs
  const pairs: CollaborationPair[] = [];
  for (let i = 0; i < team.length; i++) {
    for (let j = i + 1; j < team.length; j++) {
      pairs.push(calculateCrewSynergy(team[i], team[j]));
    }
  }
  
  return { team, pairs };
}

/**
 * Get crew member by ID
 */
export function getCrewMember(id: string): CrewMember | undefined {
  return crewRoster.find(m => m.id === id);
}

/**
 * Calculate project acceleration from collaboration
 */
export function calculateAcceleration(
  pairs: CollaborationPair[],
  taskHours: number
): { newHours: number; timeSaved: number; accelerationFactor: number } {
  // Average synergy determines acceleration
  const avgSynergy = pairs.reduce((sum, p) => sum + p.synergy, 0) / Math.max(pairs.length, 1);
  
  // Synergy of 100 = 50% time reduction, 50 = 25%, 0 = 0%
  const accelerationFactor = 1 + (avgSynergy / 200);
  const newHours = Math.round(taskHours / accelerationFactor);
  const timeSaved = taskHours - newHours;
  
  return { newHours, timeSaved, accelerationFactor };
}

/**
 * Select optimal LLM for task type
 */
export function selectOptimalLLM(
  taskType: CollaborationTask['taskType'],
  team: CrewMember[]
): { model: string; reasoning: string } {
  // Map task types to optimal models
  const taskModelMap: Record<string, { model: string; reasoning: string }> = {
    'development': {
      model: 'anthropic/claude-3.5-sonnet',
      reasoning: 'Claude excels at code generation and understanding context',
    },
    'review': {
      model: 'openai/gpt-4-turbo',
      reasoning: 'GPT-4 provides thorough analysis and catches edge cases',
    },
    'planning': {
      model: 'anthropic/claude-3.5-sonnet',
      reasoning: 'Claude handles complex planning and multi-step reasoning well',
    },
    'optimization': {
      model: 'openai/gpt-4-turbo',
      reasoning: 'GPT-4 is effective at identifying optimization opportunities',
    },
    'research': {
      model: 'anthropic/claude-3.5-sonnet',
      reasoning: 'Claude excels at synthesizing information and research',
    },
  };
  
  // Check if team has consensus on LLM preference
  const llmVotes: Record<string, number> = {};
  team.forEach(m => {
    llmVotes[m.llmPreference] = (llmVotes[m.llmPreference] || 0) + 1;
  });
  
  const maxVotes = Math.max(...Object.values(llmVotes));
  const consensusLLM = Object.entries(llmVotes).find(([, votes]) => votes === maxVotes);
  
  if (consensusLLM && maxVotes >= team.length * 0.6) {
    return {
      model: consensusLLM[0],
      reasoning: `Team consensus (${maxVotes}/${team.length} members prefer this model)`,
    };
  }
  
  return taskModelMap[taskType] || taskModelMap['development'];
}

/**
 * Generate collaboration insights
 */
export function generateCollaborationInsights(
  session: Partial<CollaborationSession>,
  team: CrewMember[]
): string[] {
  const insights: string[] = [];
  
  // Team composition insight
  const specializations = new Set(team.flatMap(m => m.specializations));
  insights.push(`Team covers ${specializations.size} specialization areas`);
  
  // Availability insight
  const avgAvailability = team.reduce((sum, m) => sum + m.availability, 0) / team.length;
  if (avgAvailability > 80) {
    insights.push('High team availability enables rapid iteration');
  } else if (avgAvailability < 50) {
    insights.push('Consider scheduling collaboration sessions to work around limited availability');
  }
  
  // LLM optimization insight
  if (session.llmModel) {
    insights.push(`Using ${session.llmModel.split('/')[1]} for optimal task performance`);
  }
  
  // Cross-project insight
  const projectOverlap = team.filter(m => m.currentProjects.length > 1).length;
  if (projectOverlap > 0) {
    insights.push(`${projectOverlap} team members can apply cross-project learnings`);
  }
  
  return insights;
}





