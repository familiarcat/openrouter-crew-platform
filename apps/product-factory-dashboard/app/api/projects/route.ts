import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { 
  Project, 
  ProjectSummary, 
  toProjectSummary, 
  createProject,
  calculateProjectScores,
  calculateProjectProgress,
  ProjectSource 
} from '../../../lib/projects';
import { appendEvent } from '../../../lib/store';

const PROJECTS_FILE = path.join(process.cwd(), 'data/projects.json');

interface ProjectsData {
  projects: Project[];
  meta: {
    version: string;
    createdAt: string;
    description: string;
  };
}

async function loadProjects(): Promise<ProjectsData> {
  try {
    const data = await fs.readFile(PROJECTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {
      projects: [],
      meta: {
        version: '1.0',
        createdAt: new Date().toISOString(),
        description: 'Projects managed by the RAG Refresh Product Factory',
      },
    };
  }
}

async function saveProjects(data: ProjectsData): Promise<void> {
  await fs.writeFile(PROJECTS_FILE, JSON.stringify(data, null, 2));
}

/**
 * GET /api/projects - List all projects (returns summaries)
 * GET /api/projects?id=xxx - Get full project details
 * GET /api/projects?status=active - Filter by status
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const status = searchParams.get('status');
  
  const data = await loadProjects();
  
  // Get single project by ID
  if (id) {
    const project = data.projects.find(p => p.id === id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    return NextResponse.json({ project });
  }
  
  // Filter by status if provided
  let projects = data.projects;
  if (status) {
    projects = projects.filter(p => p.status === status);
  }
  
  // Return summaries for list view
  const summaries: ProjectSummary[] = projects.map(toProjectSummary);
  
  return NextResponse.json({
    projects: summaries,
    total: summaries.length,
    meta: data.meta,
  });
}

/**
 * POST /api/projects - Create a new project
 */
export async function POST(req: Request) {
  const body = await req.json();
  const { 
    name, 
    category, 
    source = 'conceptualize',
    ...options 
  } = body;
  
  if (!name) {
    return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
  }
  
  const data = await loadProjects();
  
  // Create new project
  const project = createProject(name, category || '', source as ProjectSource, options);
  
  data.projects.push(project);
  await saveProjects(data);
  
  // Log event
  await appendEvent({
    type: 'project-created',
    at: new Date().toISOString(),
    projectId: project.id,
    name: project.name,
    source: project.source,
    category: project.primaryCategory,
  });
  
  return NextResponse.json({ 
    ok: true, 
    project: toProjectSummary(project),
    id: project.id,
  });
}

/**
 * PUT /api/projects - Update a project
 */
export async function PUT(req: Request) {
  const body = await req.json();
  const { id, ...updates } = body;
  
  if (!id) {
    return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
  }
  
  const data = await loadProjects();
  const index = data.projects.findIndex(p => p.id === id);
  
  if (index === -1) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }
  
  // Update project
  const project = data.projects[index];
  const updatedProject: Project = {
    ...project,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  // Recalculate scores and progress if domains changed
  if (updates.domains) {
    updatedProject.scores = calculateProjectScores(updatedProject.domains);
    updatedProject.progress = calculateProjectProgress(updatedProject.domains);
  }
  
  data.projects[index] = updatedProject;
  await saveProjects(data);
  
  // Log event
  await appendEvent({
    type: 'project-updated',
    at: new Date().toISOString(),
    projectId: id,
    updates: Object.keys(updates),
  });
  
  return NextResponse.json({ 
    ok: true, 
    project: updatedProject,
  });
}

/**
 * DELETE /api/projects - Delete (archive) a project
 */
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const permanent = searchParams.get('permanent') === 'true';
  
  if (!id) {
    return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
  }
  
  const data = await loadProjects();
  const index = data.projects.findIndex(p => p.id === id);
  
  if (index === -1) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }
  
  if (permanent) {
    // Permanently delete
    data.projects.splice(index, 1);
  } else {
    // Archive (soft delete)
    data.projects[index].status = 'archived';
    data.projects[index].updatedAt = new Date().toISOString();
  }
  
  await saveProjects(data);
  
  // Log event
  await appendEvent({
    type: permanent ? 'project-deleted' : 'project-archived',
    at: new Date().toISOString(),
    projectId: id,
  });
  
  return NextResponse.json({ 
    ok: true, 
    action: permanent ? 'deleted' : 'archived',
  });
}

