/**
 * Riker Coordinator
 * 
 * Commander Riker serves as the Executive Officer, coordinating
 * crew assignments across all projects to maximize velocity
 * and knowledge sharing through collaboration.
 * 
 * "Make it so - but faster, with the whole crew working together."
 */

import {
  CrewMember,
  CollaborationTask,
  CollaborationSession,
  CollaborationPair,
  RAGMemory,
  crewRoster,
  findOptimalTeam,
  calculateCrewSynergy,
  calculateAcceleration,
  selectOptimalLLM,
  generateCollaborationInsights,
  getCrewMember,
} from './collaboration-engine';

export interface ProjectSnapshot {
  id: string;
  name: string;
  status: string;
  progress: number;
  domains: Array<{
    slug: string;
    name: string;
    status: string;
    progress: number;
    features: string[];
  }>;
  crew: Array<{
    memberId: string;
    role: string;
    assignment: string;
  }>;
  milestones: Array<{
    id: string;
    name: string;
    status: string;
    date?: string;
  }>;
}

export interface CollaborationOpportunity {
  id: string;
  projectIds: string[];
  projectNames: string[];
  type: 'skill-share' | 'parallel-work' | 'mentor-pair' | 'cross-pollinate';
  priority: 'critical' | 'high' | 'medium' | 'low';
  suggestedTeam: CrewMember[];
  pairs: CollaborationPair[];
  task: CollaborationTask;
  expectedAcceleration: {
    timeSaved: number;
    accelerationFactor: number;
  };
  llmRecommendation: {
    model: string;
    reasoning: string;
  };
  rikerNotes: string;
}

export interface CoordinationPlan {
  id: string;
  createdAt: string;
  opportunities: CollaborationOpportunity[];
  totalProjectsAnalyzed: number;
  totalTimeSavings: number;
  crewUtilization: Record<string, number>;
  rikerBriefing: string;
}

/**
 * Riker's Coordination Engine
 * Analyzes all projects and finds collaboration opportunities
 */
export class RikerCoordinator {
  private memories: RAGMemory[] = [];
  
  constructor(memories: RAGMemory[] = []) {
    this.memories = memories;
  }
  
  /**
   * Analyze all projects and generate coordination plan
   */
  async generateCoordinationPlan(projects: ProjectSnapshot[]): Promise<CoordinationPlan> {
    const opportunities: CollaborationOpportunity[] = [];
    const crewUtilization: Record<string, number> = {};
    
    // Initialize crew utilization tracking
    crewRoster.forEach(member => {
      crewUtilization[member.id] = 100 - member.availability;
    });
    
    // Analyze each project for collaboration opportunities
    for (const project of projects.filter(p => p.status === 'active')) {
      const projectOpportunities = await this.analyzeProject(project, projects);
      opportunities.push(...projectOpportunities);
    }
    
    // Find cross-project synergies
    const crossProjectOpps = await this.findCrossProjectSynergies(projects);
    opportunities.push(...crossProjectOpps);
    
    // Sort by priority and expected impact
    opportunities.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.expectedAcceleration.timeSaved - a.expectedAcceleration.timeSaved;
    });
    
    // Calculate total time savings
    const totalTimeSavings = opportunities.reduce(
      (sum, opp) => sum + opp.expectedAcceleration.timeSaved, 
      0
    );
    
    return {
      id: `coord_${Date.now()}`,
      createdAt: new Date().toISOString(),
      opportunities,
      totalProjectsAnalyzed: projects.length,
      totalTimeSavings,
      crewUtilization,
      rikerBriefing: this.generateBriefing(opportunities, projects, totalTimeSavings),
    };
  }
  
  /**
   * Analyze a single project for collaboration needs
   */
  private async analyzeProject(
    project: ProjectSnapshot,
    allProjects: ProjectSnapshot[]
  ): Promise<CollaborationOpportunity[]> {
    const opportunities: CollaborationOpportunity[] = [];
    
    // Find domains that need help (low progress, in-progress status)
    const needyDomains = project.domains.filter(d => 
      d.status === 'in-progress' && d.progress < 50
    );
    
    for (const domain of needyDomains) {
      // Determine required skills from domain features
      const requiredSkills = this.inferSkillsFromFeatures(domain.features);
      
      // Create collaboration task
      const task: CollaborationTask = {
        id: `task_${project.id}_${domain.slug}`,
        projectId: project.id,
        domainSlug: domain.slug,
        taskType: this.inferTaskType(domain),
        description: `Accelerate ${domain.name} development in ${project.name}`,
        requiredSkills,
        estimatedHours: Math.round((100 - domain.progress) * 0.4), // Rough estimate
        priority: domain.progress < 25 ? 'high' : 'medium',
        status: 'pending',
      };
      
      // Find optimal team
      const { team, pairs } = findOptimalTeam(task, 3);
      
      // Calculate acceleration
      const acceleration = calculateAcceleration(pairs, task.estimatedHours);
      
      // Select LLM
      const llmRecommendation = selectOptimalLLM(task.taskType, team);
      
      opportunities.push({
        id: `opp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        projectIds: [project.id],
        projectNames: [project.name],
        type: this.determineCollaborationType(team),
        priority: task.priority,
        suggestedTeam: team,
        pairs,
        task,
        expectedAcceleration: {
          timeSaved: acceleration.timeSaved,
          accelerationFactor: acceleration.accelerationFactor,
        },
        llmRecommendation,
        rikerNotes: this.generateRikerNotes(project, domain, team, acceleration),
      });
    }
    
    return opportunities;
  }
  
  /**
   * Find synergies between projects
   */
  private async findCrossProjectSynergies(
    projects: ProjectSnapshot[]
  ): Promise<CollaborationOpportunity[]> {
    const opportunities: CollaborationOpportunity[] = [];
    const activeProjects = projects.filter(p => p.status === 'active');
    
    // Compare each pair of projects
    for (let i = 0; i < activeProjects.length; i++) {
      for (let j = i + 1; j < activeProjects.length; j++) {
        const proj1 = activeProjects[i];
        const proj2 = activeProjects[j];
        
        // Check for shared crew members (knowledge bridge)
        const sharedCrew = proj1.crew.filter(c1 => 
          proj2.crew.some(c2 => c2.memberId === c1.memberId)
        );
        
        if (sharedCrew.length > 0) {
          // Find similar domains that could benefit from knowledge sharing
          const similarDomains = this.findSimilarDomains(proj1.domains, proj2.domains);
          
          if (similarDomains.length > 0) {
            const requiredSkills = similarDomains.flatMap(d => 
              this.inferSkillsFromFeatures(d.features)
            );
            
            const task: CollaborationTask = {
              id: `cross_${proj1.id}_${proj2.id}`,
              projectId: `${proj1.id},${proj2.id}`,
              domainSlug: similarDomains[0].slug,
              taskType: 'optimization',
              description: `Cross-pollinate learnings between ${proj1.name} and ${proj2.name}`,
              requiredSkills: [...new Set(requiredSkills)],
              estimatedHours: 8, // Knowledge transfer session
              priority: 'medium',
              status: 'pending',
            };
            
            const { team, pairs } = findOptimalTeam(task, 4);
            const acceleration = calculateAcceleration(pairs, task.estimatedHours);
            const llmRecommendation = selectOptimalLLM(task.taskType, team);
            
            opportunities.push({
              id: `opp_cross_${Date.now()}`,
              projectIds: [proj1.id, proj2.id],
              projectNames: [proj1.name, proj2.name],
              type: 'cross-pollinate',
              priority: 'medium',
              suggestedTeam: team,
              pairs,
              task,
              expectedAcceleration: {
                timeSaved: acceleration.timeSaved * 2, // Cross-project multiplier
                accelerationFactor: acceleration.accelerationFactor,
              },
              llmRecommendation,
              rikerNotes: `${sharedCrew.map(c => getCrewMember(c.memberId)?.name || c.memberId).join(' and ')} ` +
                `can bridge knowledge between ${proj1.name} and ${proj2.name}. ` +
                `Similar domain patterns in ${similarDomains.map(d => d.name).join(', ')} ` +
                `offer significant acceleration potential.`,
            });
          }
        }
      }
    }
    
    return opportunities;
  }
  
  /**
   * Infer required skills from domain features
   */
  private inferSkillsFromFeatures(features: string[]): string[] {
    const skillMap: Record<string, string[]> = {
      'ai': ['ai-integration', 'prompt-engineering', 'llm-optimization'],
      'api': ['api-design', 'integration', 'backend'],
      'ui': ['ux-design', 'frontend', 'accessibility'],
      'auth': ['security', 'auth-systems'],
      'database': ['database-ops', 'performance-optimization'],
      'deploy': ['ci-cd', 'infrastructure-design', 'docker'],
      'test': ['testing-strategy', 'quality-assurance'],
      'search': ['algorithm-design', 'performance-optimization'],
      'monitor': ['monitoring', 'diagnostics', 'system-health'],
      'doc': ['documentation', 'communication'],
    };
    
    const detectedSkills: string[] = [];
    const featuresLower = features.map(f => f.toLowerCase()).join(' ');
    
    for (const [keyword, skills] of Object.entries(skillMap)) {
      if (featuresLower.includes(keyword)) {
        detectedSkills.push(...skills);
      }
    }
    
    return [...new Set(detectedSkills)];
  }
  
  /**
   * Infer task type from domain
   */
  private inferTaskType(domain: { status: string; progress: number; features: string[] }): CollaborationTask['taskType'] {
    if (domain.progress < 20) return 'planning';
    if (domain.progress < 60) return 'development';
    if (domain.progress < 80) return 'optimization';
    return 'review';
  }
  
  /**
   * Determine collaboration type from team composition
   */
  private determineCollaborationType(team: CrewMember[]): CollaborationOpportunity['type'] {
    const hasMentor = team.some(m => m.collaborationStyle === 'mentor');
    const hasSpecialist = team.some(m => m.collaborationStyle === 'specialist');
    
    if (hasMentor && team.length >= 2) return 'mentor-pair';
    if (hasSpecialist) return 'skill-share';
    return 'parallel-work';
  }
  
  /**
   * Find similar domains between projects
   */
  private findSimilarDomains(
    domains1: ProjectSnapshot['domains'],
    domains2: ProjectSnapshot['domains']
  ): ProjectSnapshot['domains'][0][] {
    const similar: ProjectSnapshot['domains'][0][] = [];
    
    for (const d1 of domains1) {
      for (const d2 of domains2) {
        // Check for feature overlap
        const overlap = d1.features.filter(f1 => 
          d2.features.some(f2 => 
            f1.toLowerCase().includes(f2.toLowerCase()) ||
            f2.toLowerCase().includes(f1.toLowerCase())
          )
        );
        
        if (overlap.length >= 2) {
          similar.push(d1);
          break;
        }
      }
    }
    
    return similar;
  }
  
  /**
   * Generate Riker's notes for an opportunity
   */
  private generateRikerNotes(
    project: ProjectSnapshot,
    domain: ProjectSnapshot['domains'][0],
    team: CrewMember[],
    acceleration: { timeSaved: number; accelerationFactor: number }
  ): string {
    const leadMember = team[0];
    const notes: string[] = [];
    
    notes.push(`${leadMember.name} should lead the ${domain.name} acceleration.`);
    
    if (team.length > 1) {
      notes.push(`${team.slice(1).map(m => m.name).join(' and ')} provide crucial support.`);
    }
    
    if (acceleration.timeSaved > 10) {
      notes.push(`Potential to save ${acceleration.timeSaved}+ hours through this collaboration.`);
    }
    
    // Add memory-based insights
    const relevantMemories = this.memories.filter(m => 
      m.projectContext === project.id || 
      m.content.toLowerCase().includes(domain.slug)
    );
    
    if (relevantMemories.length > 0) {
      notes.push(`RAG memories available: ${relevantMemories.length} relevant learnings from past work.`);
    }
    
    return notes.join(' ');
  }
  
  /**
   * Generate executive briefing
   */
  private generateBriefing(
    opportunities: CollaborationOpportunity[],
    projects: ProjectSnapshot[],
    totalTimeSavings: number
  ): string {
    const criticalCount = opportunities.filter(o => o.priority === 'critical').length;
    const highCount = opportunities.filter(o => o.priority === 'high').length;
    const crossProjectCount = opportunities.filter(o => o.type === 'cross-pollinate').length;
    
    let briefing = `Commander Riker's Coordination Briefing\n`;
    briefing += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    briefing += `**Status Report:**\n`;
    briefing += `• ${projects.filter(p => p.status === 'active').length} active projects analyzed\n`;
    briefing += `• ${opportunities.length} collaboration opportunities identified\n`;
    briefing += `• Estimated time savings: ${totalTimeSavings} hours\n\n`;
    
    if (criticalCount > 0) {
      briefing += `⚠️ **Critical:** ${criticalCount} opportunity(s) require immediate attention\n`;
    }
    if (highCount > 0) {
      briefing += `📋 **High Priority:** ${highCount} opportunity(s) recommended this week\n`;
    }
    if (crossProjectCount > 0) {
      briefing += `🔗 **Cross-Project:** ${crossProjectCount} knowledge-sharing opportunity(s)\n\n`;
    }
    
    // Top 3 recommendations
    briefing += `**Top Recommendations:**\n`;
    opportunities.slice(0, 3).forEach((opp, i) => {
      briefing += `${i + 1}. ${opp.task.description}\n`;
      briefing += `   Team: ${opp.suggestedTeam.map(m => m.name).join(', ')}\n`;
      briefing += `   Impact: ${opp.expectedAcceleration.timeSaved}h saved (${Math.round((opp.expectedAcceleration.accelerationFactor - 1) * 100)}% faster)\n\n`;
    });
    
    briefing += `"Number One, make it so." – Captain Picard`;
    
    return briefing;
  }
  
  /**
   * Execute a collaboration session
   */
  async executeCollaboration(
    opportunity: CollaborationOpportunity
  ): Promise<CollaborationSession> {
    const session: CollaborationSession = {
      id: `session_${Date.now()}`,
      task: opportunity.task,
      team: opportunity.pairs,
      llmModel: opportunity.llmRecommendation.model,
      startedAt: new Date().toISOString(),
      progressDelta: 0,
      insights: [],
      memoriesUsed: [],
    };
    
    // Generate insights from the collaboration
    session.insights = generateCollaborationInsights(session, opportunity.suggestedTeam);
    
    // Calculate progress improvement
    const baseProgress = 10; // Base progress from collaboration
    const synergyBonus = Math.round(
      opportunity.pairs.reduce((sum, p) => sum + p.synergy, 0) / 
      Math.max(opportunity.pairs.length, 1) / 10
    );
    session.progressDelta = baseProgress + synergyBonus;
    
    // Find and reference relevant memories
    const relevantMemories = this.memories
      .filter(m => opportunity.suggestedTeam.some(t => t.id === m.crewId))
      .slice(0, 5);
    session.memoriesUsed = relevantMemories.map(m => m.id);
    
    return session;
  }
  
  /**
   * Update crew availability after collaboration
   */
  updateCrewAvailability(
    crewId: string,
    hoursUsed: number
  ): void {
    const member = crewRoster.find(m => m.id === crewId);
    if (member) {
      // Reduce availability (rough: 8 hours = 10% capacity)
      const capacityUsed = (hoursUsed / 8) * 10;
      member.availability = Math.max(0, member.availability - capacityUsed);
    }
  }
  
  /**
   * Add project to crew member's current projects
   */
  assignCrewToProject(crewId: string, projectId: string): void {
    const member = crewRoster.find(m => m.id === crewId);
    if (member && !member.currentProjects.includes(projectId)) {
      member.currentProjects.push(projectId);
    }
  }
}

/**
 * Create a singleton coordinator with Riker at the helm
 */
export function createRikerCoordinator(memories: RAGMemory[] = []): RikerCoordinator {
  return new RikerCoordinator(memories);
}





