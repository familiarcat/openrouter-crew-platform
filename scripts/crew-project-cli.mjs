#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

function parseArgs(argv) {
  const args = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[index + 1];
      if (!next || next.startsWith('--')) {
        args[key] = true;
      } else {
        args[key] = next;
        index += 1;
      }
      continue;
    }
    args._.push(arg);
  }
  return args;
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const normalized = trimmed.startsWith('export ') ? trimmed.slice(7) : trimmed;
    const separatorIndex = normalized.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }

    const key = normalized.slice(0, separatorIndex).trim();
    const value = normalized.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function preloadEnv() {
  const repoRoot = process.cwd();
  const homeDir = os.homedir();
  const candidates = [
    path.join(homeDir, '.alexai-secrets', 'api-keys.env'),
    path.join(repoRoot, '.env'),
    path.join(repoRoot, '.env.local'),
    path.join(repoRoot, '.env.production'),
  ];

  for (const candidate of candidates) {
    loadEnvFile(candidate);
  }
}

function asRecord(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }
  return {};
}

function inferDomainId(type, metadata) {
  const metadataRecord = asRecord(metadata);
  if (typeof metadataRecord.domainId === 'string' && metadataRecord.domainId.length > 0) {
    return metadataRecord.domainId;
  }
  if (type === 'dj-booking') return 'dj-booking';
  if (type === 'product-factory') return 'product-factory';
  if (type === 'ai-assistant') return 'alex-ai-universal';
  return 'product-factory';
}

function resolveProjectType(domainId, requestedType) {
  if (['dj-booking', 'product-factory', 'ai-assistant', 'custom'].includes(requestedType)) {
    return requestedType;
  }
  if (domainId === 'dj-booking') return 'dj-booking';
  if (domainId === 'alex-ai-universal') return 'ai-assistant';
  if (domainId === 'product-factory') return 'product-factory';
  return 'custom';
}

function normalizeProjectRecord(row) {
  const metadata = asRecord(row.metadata);
  const domainId = inferDomainId(row.type, row.metadata);
  const progress = typeof metadata.progress === 'number'
    ? Math.max(0, Math.min(100, metadata.progress))
    : row.status === 'completed'
      ? 100
      : row.status === 'active'
        ? 65
        : row.status === 'paused'
          ? 40
          : row.status === 'archived'
            ? 100
            : 10;

  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    tagline: typeof metadata.tagline === 'string' ? metadata.tagline : undefined,
    status: row.status,
    progress,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
    type: row.type,
    domainId,
    budgetAllocated: row.budget_usd || 0,
    budgetSpent: row.total_cost_usd || 0,
    teamSize: Array.isArray(row.team_members) ? row.team_members.length : 0,
    metadata,
  };
}

function normalizeStoryRecord(row) {
  return {
    id: row.id,
    projectId: row.project_id,
    sprintId: row.sprint_id,
    title: row.title,
    description: row.description || '',
    workType: row.story_type || 'feature',
    priority: typeof row.priority === 'number' ? row.priority : 2,
    storyPoints: typeof row.story_points === 'number' ? row.story_points : 0,
    status: row.status || 'backlog',
    assignee: row.assigned_crew_member || row.assignee || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Missing Supabase credentials for crew project CLI');
  }
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function listProjects(options) {
  const supabase = getSupabase();
  let query = supabase.from('projects').select('*').order('updated_at', { ascending: false });
  if (options.status) {
    query = query.eq('status', options.status);
  }
  if (options.limit) {
    query = query.limit(options.limit);
  }
  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to list projects: ${error.message}`);
  }
  return {
    projects: (data || []).map(normalizeProjectRecord),
    source: 'supabase',
  };
}

async function createProject(payload) {
  const supabase = getSupabase();
  const domainId = payload.domainId || 'product-factory';
  const type = resolveProjectType(domainId, payload.type);
  const metadata = {
    domainId,
    template: payload.template || 'standard',
    createdFrom: 'crew-project-cli',
  };

  const { data, error } = await supabase
    .from('projects')
    .insert({
      name: String(payload.name || '').trim(),
      description: typeof payload.description === 'string' ? payload.description.trim() || null : null,
      type,
      status: payload.status || 'draft',
      budget_usd: typeof payload.budgetUsd === 'number' ? payload.budgetUsd : null,
      total_cost_usd: 0,
      metadata,
      team_members: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to create project: ${error.message}`);
  }
  return { project: normalizeProjectRecord(data) };
}

async function getProject(id) {
  const supabase = getSupabase();
  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !project) {
    throw new Error(`Project not found: ${error?.message || id}`);
  }

  const [{ data: sprints }, { count: storyCount }] = await Promise.all([
    supabase
      .from('sprints')
      .select('*')
      .eq('project_id', id)
      .order('sprint_number', { ascending: true }),
    supabase
      .from('stories')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', id),
  ]);

  return {
    project: {
      ...normalizeProjectRecord(project),
      sprints: sprints || [],
      storyCount: storyCount || 0,
    },
  };
}

async function updateProject(id, payload) {
  const supabase = getSupabase();
  const { data: existing, error: existingError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (existingError || !existing) {
    throw new Error(`Project not found: ${existingError?.message || id}`);
  }

  const existingMetadata = asRecord(existing.metadata);
  const domainId = typeof payload.domainId === 'string' && payload.domainId
    ? payload.domainId
    : inferDomainId(existing.type, existing.metadata);

  const updates = {
    updated_at: new Date().toISOString(),
    name: typeof payload.name === 'string' && payload.name.trim() ? payload.name.trim() : existing.name,
    description: typeof payload.description === 'string' ? payload.description.trim() || null : existing.description,
    status: typeof payload.status === 'string' && payload.status ? payload.status : existing.status,
    budget_usd: typeof payload.budgetUsd === 'number' ? payload.budgetUsd : existing.budget_usd,
    type: resolveProjectType(domainId, payload.type || existing.type),
    metadata: {
      ...existingMetadata,
      domainId,
      template: typeof payload.template === 'string' && payload.template ? payload.template : existingMetadata.template,
    },
  };

  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`Failed to update project: ${error?.message || 'Unknown error'}`);
  }
  return { project: normalizeProjectRecord(data) };
}

async function deleteProject(id) {
  const supabase = getSupabase();
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) {
    throw new Error(`Failed to delete project: ${error.message}`);
  }
  return { success: true, deletedId: id };
}

async function listSprints(projectId) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('sprints')
    .select('*')
    .eq('project_id', projectId)
    .order('sprint_number', { ascending: true });
  if (error) {
    throw new Error(`Failed to list sprints: ${error.message}`);
  }
  return { data: data || [] };
}

async function createSprint(payload) {
  const supabase = getSupabase();
  if (!payload.projectId || !payload.name) {
    throw new Error('projectId and name are required to create a sprint');
  }

  const { data: existingSprints, error: existingError } = await supabase
    .from('sprints')
    .select('sprint_number')
    .eq('project_id', payload.projectId)
    .order('sprint_number', { ascending: false })
    .limit(1);

  if (existingError) {
    throw new Error(`Failed to inspect existing sprints: ${existingError.message}`);
  }

  const durationDays = typeof payload.durationDays === 'number' && payload.durationDays > 0
    ? payload.durationDays
    : 14;
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setUTCDate(endDate.getUTCDate() + durationDays);

  const sprintNumber = existingSprints && existingSprints.length > 0
    ? Number(existingSprints[0].sprint_number || 0) + 1
    : 1;

  const { data, error } = await supabase
    .from('sprints')
    .insert({
      project_id: payload.projectId,
      name: payload.name,
      sprint_number: sprintNumber,
      start_date: startDate.toISOString().slice(0, 10),
      end_date: endDate.toISOString().slice(0, 10),
      goals: payload.goal ? [payload.goal] : [],
      status: 'planning',
      velocity_target: 0,
      velocity_actual: 0,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`Failed to create sprint: ${error?.message || 'Unknown error'}`);
  }
  return { sprint: data };
}

async function listStories(sprintId) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .eq('sprint_id', sprintId)
    .order('priority', { ascending: true });

  if (error) {
    throw new Error(`Failed to list stories: ${error.message}`);
  }

  return {
    stories: (data || []).map(normalizeStoryRecord),
  };
}

async function getStory(storyId) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .eq('id', storyId)
    .single();

  if (error || !data) {
    throw new Error(`Story not found: ${error?.message || storyId}`);
  }

  return {
    story: normalizeStoryRecord(data),
  };
}

async function createStory(payload) {
  const supabase = getSupabase();
  if (!payload.projectId || !payload.sprintId || !payload.title) {
    throw new Error('projectId, sprintId, and title are required to create a story');
  }

  const priority = Number.parseInt(String(payload.priority ?? '2'), 10);
  const storyPoints = Number.parseInt(String(payload.storyPoints ?? '0'), 10);

  const { data, error } = await supabase
    .from('stories')
    .insert({
      project_id: payload.projectId,
      sprint_id: payload.sprintId,
      title: String(payload.title).trim(),
      description: typeof payload.description === 'string' ? payload.description.trim() || null : null,
      story_type: typeof payload.workType === 'string' && payload.workType ? payload.workType : 'feature',
      priority: Number.isNaN(priority) ? 2 : priority,
      story_points: Number.isNaN(storyPoints) ? 0 : storyPoints,
      status: typeof payload.status === 'string' && payload.status ? payload.status : 'backlog',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`Failed to create story: ${error?.message || 'Unknown error'}`);
  }

  return {
    story: normalizeStoryRecord(data),
  };
}

async function updateStory(storyId, payload) {
  const supabase = getSupabase();
  const { data: existing, error: existingError } = await supabase
    .from('stories')
    .select('*')
    .eq('id', storyId)
    .single();

  if (existingError || !existing) {
    throw new Error(`Story not found: ${existingError?.message || storyId}`);
  }

  const nextPriority = payload.priority !== undefined
    ? Number.parseInt(String(payload.priority), 10)
    : existing.priority;
  const nextStoryPoints = payload.storyPoints !== undefined
    ? Number.parseInt(String(payload.storyPoints), 10)
    : existing.story_points;

  const updates = {
    updated_at: new Date().toISOString(),
    status: typeof payload.status === 'string' && payload.status ? payload.status : existing.status,
    title: typeof payload.title === 'string' && payload.title.trim() ? payload.title.trim() : existing.title,
    description: typeof payload.description === 'string' ? payload.description.trim() || null : existing.description,
    story_type: typeof payload.workType === 'string' && payload.workType ? payload.workType : existing.story_type,
    priority: Number.isNaN(nextPriority) ? existing.priority : nextPriority,
    story_points: Number.isNaN(nextStoryPoints) ? existing.story_points : nextStoryPoints,
    assigned_crew_member: typeof payload.assignee === 'string' ? payload.assignee : existing.assigned_crew_member,
  };

  const { data, error } = await supabase
    .from('stories')
    .update(updates)
    .eq('id', storyId)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`Failed to update story: ${error?.message || 'Unknown error'}`);
  }

  return {
    story: normalizeStoryRecord(data),
  };
}

async function main() {
  preloadEnv();
  const args = parseArgs(process.argv.slice(2));
  const [command] = args._;

  try {
    let result;
    if (command === 'list') {
      result = await listProjects({
        status: typeof args.status === 'string' ? args.status : undefined,
        limit: typeof args.limit === 'string' ? Number.parseInt(args.limit, 10) : undefined,
      });
    } else if (command === 'create') {
      const payload = JSON.parse(String(args.payload || '{}'));
      if (!payload.name || !String(payload.name).trim()) {
        throw new Error('Project name is required');
      }
      result = await createProject(payload);
    } else if (command === 'get') {
      if (typeof args.id !== 'string' || !args.id) {
        throw new Error('Project id is required');
      }
      result = await getProject(args.id);
    } else if (command === 'update') {
      if (typeof args.id !== 'string' || !args.id) {
        throw new Error('Project id is required');
      }
      result = await updateProject(args.id, JSON.parse(String(args.payload || '{}')));
    } else if (command === 'delete') {
      if (typeof args.id !== 'string' || !args.id) {
        throw new Error('Project id is required');
      }
      result = await deleteProject(args.id);
    } else if (command === 'list-sprints') {
      if (typeof args['project-id'] !== 'string' || !args['project-id']) {
        throw new Error('project-id is required');
      }
      result = await listSprints(args['project-id']);
    } else if (command === 'create-sprint') {
      result = await createSprint(JSON.parse(String(args.payload || '{}')));
    } else if (command === 'list-stories') {
      if (typeof args['sprint-id'] !== 'string' || !args['sprint-id']) {
        throw new Error('sprint-id is required');
      }
      result = await listStories(args['sprint-id']);
    } else if (command === 'get-story') {
      if (typeof args.id !== 'string' || !args.id) {
        throw new Error('Story id is required');
      }
      result = await getStory(args.id);
    } else if (command === 'create-story') {
      result = await createStory(JSON.parse(String(args.payload || '{}')));
    } else if (command === 'update-story') {
      if (typeof args.id !== 'string' || !args.id) {
        throw new Error('Story id is required');
      }
      result = await updateStory(args.id, JSON.parse(String(args.payload || '{}')));
    } else {
      throw new Error(`Unsupported command: ${command || 'none'}`);
    }

    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }
}

await main();
