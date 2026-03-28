/**
 * Crew Collaboration API
 * 
 * Enables crew members to work together across projects,
 * coordinated by Commander Riker with RAG memory integration.
 */

import { NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { createRikerCoordinator, ProjectSnapshot, CollaborationOpportunity } from '@/lib/alex-ai/crew/riker-coordinator';
import { RAGMemory, crewRoster, getCrewMember } from '@/lib/alex-ai/crew/collaboration-engine';
import { Project } from '@/lib/projects';
import { addEvent } from '@/lib/store';

const PROJECTS_FILE = path.join(process.cwd(), 'data', 'projects.json');
const MEMORIES_FILE = path.join(process.cwd(), 'data', 'crew_memories.json');
const COLLABORATION_LOG = path.join(process.cwd(), 'data', 'collaboration_log.json');

interface ProjectsData {
  projects: Project[];
  meta?: Record<string, unknown>;
}

interface CollaborationLogEntry {
  id: string;
  timestamp: string;
  opportunityId: string;
  projectIds: string[];
  teamMemberIds: string[];
  progressDelta: number;
  insights: string[];
  memoriesCreated: string[];
}

/**
 * Load projects from file
 */
async function loadProjects(): Promise<Project[]> {
  try {
    const content = await readFile(PROJECTS_FILE, 'utf-8');
    const data: ProjectsData = JSON.parse(content);
    return data.projects || [];
  } catch {
    return [];
  }
}

/**
 * Save projects to file
 */
async function saveProjects(projects: Project[]): Promise<void> {
  const data: ProjectsData = {
    projects,
    meta: {
      version: '1.0',
      updatedAt: new Date().toISOString(),
    },
  };
  await writeFile(PROJECTS_FILE, JSON.stringify(data, null, 2));
}

/**
 * Load crew memories from file (local RAG cache)
 */
async function loadMemories(): Promise<RAGMemory[]> {
  try {
    const content = await readFile(MEMORIES_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    // Initialize with seed memories
    const seedMemories: RAGMemory[] = [
      {
        id: 'mem_data_rag_1',
        crewId: 'commander_data',
        content: 'RAG systems perform optimally with chunk sizes between 500-1000 tokens for semantic search accuracy.',
        type: 'lesson',
        createdAt: '2024-12-01T00:00:00Z',
      },
      {
        id: 'mem_geordi_infra_1',
        crewId: 'geordi_la_forge',
        content: 'Docker builds for Next.js should use standalone output mode for 3x smaller images.',
        type: 'pattern',
        createdAt: '2024-12-05T00:00:00Z',
      },
      {
        id: 'mem_troi_ux_1',
        crewId: 'counselor_troi',
        content: 'Users prefer progressive disclosure - show essential info first, details on demand.',
        type: 'pattern',
        createdAt: '2024-12-08T00:00:00Z',
      },
      {
        id: 'mem_quark_pricing_1',
        crewId: 'quark',
        content: 'Freemium with 3-tier pricing converts 5-8% of free users. Target $19-49 sweet spot for B2B SaaS.',
        type: 'lesson',
        createdAt: '2024-12-10T00:00:00Z',
      },
      {
        id: 'mem_worf_security_1',
        crewId: 'lieutenant_worf',
        content: 'Always validate auth tokens server-side. Never trust client-side validation for security.',
        type: 'warning',
        createdAt: '2024-12-12T00:00:00Z',
      },
      {
        id: 'mem_obrien_debug_1',
        crewId: 'chief_obrien',
        content: 'When SSM commands fail, check instance profile and IAM roles first - 90% of issues are permissions.',
        type: 'solution',
        createdAt: '2024-12-14T00:00:00Z',
      },
      {
        id: 'mem_picard_strategy_1',
        crewId: 'captain_picard',
        content: 'Start with one excellent feature rather than many mediocre ones. Quality begets trust.',
        type: 'decision',
        createdAt: '2024-12-15T00:00:00Z',
      },
    ];
    await writeFile(MEMORIES_FILE, JSON.stringify(seedMemories, null, 2));
    return seedMemories;
  }
}

/**
 * Save crew memories
 */
async function saveMemories(memories: RAGMemory[]): Promise<void> {
  await writeFile(MEMORIES_FILE, JSON.stringify(memories, null, 2));
}

/**
 * Load collaboration log
 */
async function loadCollaborationLog(): Promise<CollaborationLogEntry[]> {
  try {
    const content = await readFile(COLLABORATION_LOG, 'utf-8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

/**
 * Save collaboration log
 */
async function saveCollaborationLog(log: CollaborationLogEntry[]): Promise<void> {
  await writeFile(COLLABORATION_LOG, JSON.stringify(log, null, 2));
}

/**
 * Convert Project to ProjectSnapshot for coordinator
 */
function toProjectSnapshot(project: Project): ProjectSnapshot {
  return {
    id: project.id,
    name: project.name,
    status: project.status,
    progress: project.progress,
    domains: project.domains.map(d => ({
      slug: d.slug,
      name: d.name,
      status: d.status,
      progress: d.progress,
      features: d.features,
    })),
    crew: project.crew.map(c => ({
      memberId: c.crewMemberId || c.memberId,
      role: c.role,
      assignment: c.assignment || '',
    })),
    milestones: (project.milestones || []).map(m => ({
      id: m.id,
      name: m.name || m.title || 'Milestone',
      status: m.status,
      date: m.date || m.targetDate,
    })),
  };
}

/**
 * GET - Get coordination plan and collaboration opportunities
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  
  try {
    const projects = await loadProjects();
    const memories = await loadMemories();
    
    if (action === 'roster') {
      // Return full crew roster with availability
      return NextResponse.json({
        crew: crewRoster.map(m => ({
          ...m,
          currentProjectNames: m.currentProjects.map(pid => 
            projects.find(p => p.id === pid)?.name || pid
          ),
        })),
        totalMembers: crewRoster.length,
        averageAvailability: Math.round(
          crewRoster.reduce((sum, m) => sum + m.availability, 0) / crewRoster.length
        ),
      });
    }
    
    if (action === 'memories') {
      // Return crew memories for RAG
      return NextResponse.json({
        memories,
        totalMemories: memories.length,
        byCrewMember: crewRoster.map(m => ({
          id: m.id,
          name: m.name,
          memoryCount: memories.filter(mem => mem.crewId === m.id).length,
        })),
      });
    }
    
    if (action === 'history') {
      // Return collaboration history
      const log = await loadCollaborationLog();
      return NextResponse.json({
        collaborations: log.slice(-50),
        totalSessions: log.length,
        totalProgressGained: log.reduce((sum, l) => sum + l.progressDelta, 0),
      });
    }
    
    // Default: Generate coordination plan
    const coordinator = createRikerCoordinator(memories);
    const snapshots = projects.map(toProjectSnapshot);
    const plan = await coordinator.generateCoordinationPlan(snapshots);
    
    return NextResponse.json({
      plan,
      activeProjects: projects.filter(p => p.status === 'active').length,
      crewAvailable: crewRoster.filter(m => m.availability > 20).length,
    });
    
  } catch (error) {
    console.error('Collaboration GET error:', error);
    return NextResponse.json(
      { error: 'Failed to generate coordination plan' },
      { status: 500 }
    );
  }
}

/**
 * POST - Execute a collaboration session
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, opportunityId, projectIds, customTask } = body;
    
    const projects = await loadProjects();
    const memories = await loadMemories();
    const coordinator = createRikerCoordinator(memories);
    
    if (action === 'execute') {
      // Execute a specific collaboration opportunity
      const snapshots = projects.map(toProjectSnapshot);
      const plan = await coordinator.generateCoordinationPlan(snapshots);
      
      const opportunity = plan.opportunities.find(o => o.id === opportunityId);
      if (!opportunity) {
        return NextResponse.json(
          { error: 'Opportunity not found' },
          { status: 404 }
        );
      }
      
      // Execute the collaboration
      const session = await coordinator.executeCollaboration(opportunity);
      
      // Update project progress
      const updatedProjects = projects.map(project => {
        if (opportunity.projectIds.includes(project.id)) {
          const newProgress = Math.min(100, project.progress + session.progressDelta);
          
          // Also update the specific domain if applicable
          const updatedDomains = project.domains.map(domain => {
            if (domain.slug === opportunity.task.domainSlug) {
              return {
                ...domain,
                progress: Math.min(100, domain.progress + session.progressDelta * 1.5),
              };
            }
            return domain;
          });
          
          return {
            ...project,
            progress: newProgress,
            domains: updatedDomains,
            updatedAt: new Date().toISOString(),
          };
        }
        return project;
      });
      
      await saveProjects(updatedProjects);
      
      // Log the collaboration
      const log = await loadCollaborationLog();
      const logEntry: CollaborationLogEntry = {
        id: session.id,
        timestamp: session.startedAt,
        opportunityId: opportunity.id,
        projectIds: opportunity.projectIds,
        teamMemberIds: opportunity.suggestedTeam.map(m => m.id),
        progressDelta: session.progressDelta,
        insights: session.insights,
        memoriesCreated: [],
      };
      
      // Create new memory from collaboration
      if (session.insights.length > 0) {
        const leadMember = opportunity.suggestedTeam[0];
        const newMemory: RAGMemory = {
          id: `mem_collab_${Date.now()}`,
          crewId: leadMember.id,
          content: session.insights.join('. '),
          type: 'lesson',
          projectContext: opportunity.projectIds[0],
          createdAt: new Date().toISOString(),
        };
        memories.push(newMemory);
        await saveMemories(memories);
        logEntry.memoriesCreated.push(newMemory.id);
      }
      
      log.push(logEntry);
      await saveCollaborationLog(log);
      
      // Track event
      await addEvent({
        type: 'crew-collaboration',
        payload: {
          opportunityId: opportunity.id,
          projectIds: opportunity.projectIds,
          progressDelta: session.progressDelta,
          teamSize: opportunity.suggestedTeam.length,
        },
      });
      
      return NextResponse.json({
        success: true,
        session,
        projectsUpdated: opportunity.projectIds.length,
        newProgress: updatedProjects
          .filter(p => opportunity.projectIds.includes(p.id))
          .map(p => ({ id: p.id, name: p.name, progress: p.progress })),
        memoryCreated: logEntry.memoriesCreated.length > 0,
      });
    }
    
    if (action === 'auto-optimize') {
      // Riker automatically selects and executes the best opportunities
      const snapshots = projects.map(toProjectSnapshot);
      const plan = await coordinator.generateCoordinationPlan(snapshots);
      
      // Execute top 3 highest-priority opportunities
      const toExecute = plan.opportunities
        .filter(o => o.priority === 'critical' || o.priority === 'high')
        .slice(0, 3);
      
      const results = [];
      let totalProgressGained = 0;
      
      for (const opportunity of toExecute) {
        const session = await coordinator.executeCollaboration(opportunity);
        totalProgressGained += session.progressDelta;
        
        results.push({
          opportunity: opportunity.id,
          projects: opportunity.projectNames,
          team: opportunity.suggestedTeam.map(m => m.name),
          progressDelta: session.progressDelta,
          insights: session.insights,
        });
      }
      
      // Update all affected projects
      const affectedProjectIds = new Set(toExecute.flatMap(o => o.projectIds));
      const updatedProjects = projects.map(project => {
        if (affectedProjectIds.has(project.id)) {
          const avgProgress = Math.round(totalProgressGained / toExecute.length);
          return {
            ...project,
            progress: Math.min(100, project.progress + avgProgress),
            updatedAt: new Date().toISOString(),
          };
        }
        return project;
      });
      
      await saveProjects(updatedProjects);
      
      await addEvent({
        type: 'crew-auto-optimize',
        payload: {
          opportunitiesExecuted: toExecute.length,
          totalProgressGained,
          projectsAffected: affectedProjectIds.size,
        },
      });
      
      return NextResponse.json({
        success: true,
        rikerReport: plan.rikerBriefing,
        sessionsExecuted: results.length,
        results,
        totalProgressGained,
        message: `Commander Riker has coordinated ${results.length} collaboration sessions, advancing ${affectedProjectIds.size} projects.`,
      });
    }
    
    if (action === 'add-memory') {
      // Add a new crew memory
      const { crewId, content, type, projectContext } = body;
      
      if (!crewId || !content || !type) {
        return NextResponse.json(
          { error: 'crewId, content, and type are required' },
          { status: 400 }
        );
      }
      
      const member = getCrewMember(crewId);
      if (!member) {
        return NextResponse.json(
          { error: 'Crew member not found' },
          { status: 404 }
        );
      }
      
      const newMemory: RAGMemory = {
        id: `mem_${crewId}_${Date.now()}`,
        crewId,
        content,
        type,
        projectContext,
        createdAt: new Date().toISOString(),
      };
      
      memories.push(newMemory);
      await saveMemories(memories);
      
      return NextResponse.json({
        success: true,
        memory: newMemory,
        crewMember: member.name,
        totalMemories: memories.filter(m => m.crewId === crewId).length,
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid action. Use: execute, auto-optimize, add-memory' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Collaboration POST error:', error);
    return NextResponse.json(
      { error: 'Failed to execute collaboration' },
      { status: 500 }
    );
  }
}

