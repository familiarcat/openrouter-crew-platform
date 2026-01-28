/**
 * Projects API with RBAC Integration
 *
 * Hybrid approach:
 * - File system (data/projects.json) for rich project data and quick access
 * - Supabase for RBAC metadata, permissions, and audit logging
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import {
  Project,
  ProjectSummary,
  toProjectSummary,
  createProject,
  calculateProjectScores,
  calculateProjectProgress,
  ProjectSource,
} from '../../../lib/projects';
import { appendEvent } from '../../../lib/store';
import {
  requireAuth,
  requirePermission,
  canAccessProject,
} from '../../../lib/auth/middleware';
import { supabase, logAudit, checkSupabaseConnection } from '../../../lib/supabase';

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
 * Sync project metadata to Supabase
 * (Optional - for RBAC and cross-instance sync)
 */
async function syncProjectToSupabase(
  project: Project,
  ownerId: string
): Promise<void> {
  const isConnected = await checkSupabaseConnection();
  if (!isConnected) {
    console.log('[Projects] Supabase not connected, skipping sync');
    return;
  }

  try {
    const { error } = await supabase.from('projects').upsert({
      id: project.id,
      name: project.name,
      tagline: project.tagline || null,
      description: project.description || null,
      owner_id: ownerId,
      category_slug: project.primaryCategory || null,
      status: (project.status as any) || 'active',
    });

    if (error) {
      console.error('[Projects] Supabase sync failed:', error);
    }
  } catch (err) {
    console.error('[Projects] Supabase sync error:', err);
  }
}

/**
 * GET /api/projects - List all projects
 * GET /api/projects?id=xxx - Get single project
 * GET /api/projects?status=active - Filter by status
 *
 * Authentication: Optional (shows only accessible projects if authenticated)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const status = searchParams.get('status');

  // Try to get user (optional authentication)
  const authResult = await requireAuth(req);
  const user = authResult instanceof NextResponse ? null : authResult.user;

  const data = await loadProjects();

  // Get single project by ID
  if (id) {
    const project = data.projects.find((p) => p.id === id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check access if authenticated
    if (user) {
      const hasAccess = await canAccessProject(user.id, id);
      if (!hasAccess) {
        await logAudit(
          user.id,
          'access_project',
          'project',
          id,
          'project:read',
          false
        );
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      await logAudit(
        user.id,
        'access_project',
        'project',
        id,
        'project:read',
        true
      );
    }

    return NextResponse.json({ project });
  }

  // Filter by status if provided
  let projects = data.projects;
  if (status) {
    projects = projects.filter((p) => p.status === status);
  }

  // If authenticated, filter to accessible projects only
  if (user) {
    const accessibleProjects = [];
    for (const project of projects) {
      const hasAccess = await canAccessProject(user.id, project.id);
      if (hasAccess) {
        accessibleProjects.push(project);
      }
    }
    projects = accessibleProjects;
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
 *
 * Authentication: Required
 * Permission: project:create
 */
export async function POST(req: NextRequest) {
  // Require authentication and project:create permission
  const authResult = await requirePermission(req, 'project:create');
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user } = authResult;

  const body = await req.json();
  const { name, category, source = 'conceptualize', ...options } = body;

  if (!name) {
    return NextResponse.json(
      { error: 'Project name is required' },
      { status: 400 }
    );
  }

  const data = await loadProjects();

  // Create new project
  const project = createProject(
    name,
    category || '',
    source as ProjectSource,
    options
  );

  // Add to file system
  data.projects.push(project);
  await saveProjects(data);

  // Sync to Supabase
  await syncProjectToSupabase(project, user.id);

  // Log event (file-based)
  await appendEvent({
    type: 'project-created',
    at: new Date().toISOString(),
    projectId: project.id,
    name: project.name,
    source: project.source,
    category: project.primaryCategory,
  });

  // Log to audit (Supabase)
  await logAudit(
    user.id,
    'create_project',
    'project',
    project.id,
    'project:create',
    true,
    { project_name: project.name, category }
  );

  return NextResponse.json({
    ok: true,
    project: toProjectSummary(project),
    id: project.id,
  });
}

/**
 * PUT /api/projects - Update a project
 *
 * Authentication: Required
 * Permission: project:write (for the specific project)
 */
export async function PUT(req: NextRequest) {
  // Require authentication first
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user } = authResult;

  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json(
      { error: 'Project ID is required' },
      { status: 400 }
    );
  }

  // Check project-specific write permission
  const hasPermission = await canAccessProject(user.id, id);
  if (!hasPermission) {
    await logAudit(
      user.id,
      'update_project',
      'project',
      id,
      'project:write',
      false
    );
    return NextResponse.json(
      { error: 'You do not have permission to update this project' },
      { status: 403 }
    );
  }

  const data = await loadProjects();
  const index = data.projects.findIndex((p) => p.id === id);

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

  // Sync to Supabase
  await syncProjectToSupabase(updatedProject, user.id);

  // Log event (file-based)
  await appendEvent({
    type: 'project-updated',
    at: new Date().toISOString(),
    projectId: id,
    updates: Object.keys(updates),
  });

  // Log to audit (Supabase)
  await logAudit(
    user.id,
    'update_project',
    'project',
    id,
    'project:write',
    true,
    { fields_updated: Object.keys(updates) }
  );

  return NextResponse.json({
    ok: true,
    project: updatedProject,
  });
}

/**
 * DELETE /api/projects - Delete (archive) a project
 *
 * Authentication: Required
 * Permission: project:delete (for permanent), project:configure (for archive)
 */
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const permanent = searchParams.get('permanent') === 'true';

  if (!id) {
    return NextResponse.json(
      { error: 'Project ID is required' },
      { status: 400 }
    );
  }

  // Permanent delete requires project:delete, archive requires project:configure
  const requiredPermission = permanent ? 'project:delete' : 'project:configure';

  const authResult = await requirePermission(req, requiredPermission, id);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user } = authResult;

  const data = await loadProjects();
  const index = data.projects.findIndex((p) => p.id === id);

  if (index === -1) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  if (permanent) {
    // Permanently delete from file system
    data.projects.splice(index, 1);

    // Delete from Supabase
    const isConnected = await checkSupabaseConnection();
    if (isConnected) {
      await supabase.from('projects').delete().eq('id', id);
    }
  } else {
    // Archive (soft delete) in file system
    data.projects[index].status = 'archived';
    data.projects[index].updatedAt = new Date().toISOString();

    // Update in Supabase
    const isConnected = await checkSupabaseConnection();
    if (isConnected) {
      await supabase
        .from('projects')
        .update({ status: 'archived' })
        .eq('id', id);
    }
  }

  await saveProjects(data);

  // Log event (file-based)
  await appendEvent({
    type: permanent ? 'project-deleted' : 'project-archived',
    at: new Date().toISOString(),
    projectId: id,
  });

  // Log to audit (Supabase)
  await logAudit(
    user.id,
    permanent ? 'delete_project' : 'archive_project',
    'project',
    id,
    requiredPermission,
    true,
    { permanent }
  );

  return NextResponse.json({
    ok: true,
    action: permanent ? 'deleted' : 'archived',
  });
}
