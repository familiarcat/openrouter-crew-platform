# Project Management System: Implementation Guide

**OpenRouter Crew Platform** | Step-by-Step Build Guide
**Estimated Time:** 1-2 weeks | **Complexity:** Medium | **Impact:** High

---

## Quick Start: 5 Phase Implementation

### Phase 1: Foundation (Days 1-2)

#### Step 1.1: Create Package Structure

```bash
# Create the package directory
mkdir -p domains/shared/project-management/{src,ui-components}

# Create subdirectories
mkdir -p domains/shared/project-management/src/{domain,application,infrastructure,types}

# Create package files
touch domains/shared/project-management/{package.json,tsconfig.json}
```

#### Step 1.2: Create package.json

**File:** `domains/shared/project-management/package.json`

```json
{
  "name": "@openrouter-crew/project-management",
  "version": "1.0.0",
  "description": "Unified project management system",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc -w",
    "test": "jest"
  },
  "dependencies": {
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/node": "^20.0.0"
  },
  "exports": {
    "./domain": "./dist/domain/index.js",
    "./application": "./dist/application/index.js",
    "./infrastructure": "./dist/infrastructure/index.js",
    "./ui": "./dist/ui-components/index.js",
    "./types": "./dist/types/index.js"
  }
}
```

#### Step 1.3: Create Domain Entities

**File:** `domains/shared/project-management/src/domain/project.ts`

```typescript
import { z } from 'zod';

export enum ProjectStatus {
  Planning = 'planning',
  Active = 'active',
  OnHold = 'on_hold',
  Completed = 'completed',
  Archived = 'archived'
}

export enum ProjectType {
  BusinessAutomation = 'business_automation',
  ProductDevelopment = 'product_development',
  ResearchInitiative = 'research_initiative',
  Internal = 'internal'
}

export class Project {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  type: ProjectType;
  status: ProjectStatus = ProjectStatus.Planning;
  start_date?: Date;
  end_date?: Date;
  crew_id?: string;
  domain_assignments: Array<{ domain: string; config: any }> = [];
  created_at: Date;
  updated_at: Date;
  tags: string[] = [];
  metadata: Record<string, any> = {};

  constructor(data: {
    id: string;
    name: string;
    owner_id: string;
    type: ProjectType;
    description?: string;
  }) {
    this.id = data.id;
    this.name = data.name;
    this.owner_id = data.owner_id;
    this.type = data.type;
    this.description = data.description;
    this.created_at = new Date();
    this.updated_at = new Date();
  }

  // Domain methods
  addDomainAssignment(domain: string, config: any): void {
    const existing = this.domain_assignments.find(a => a.domain === domain);
    if (!existing) {
      this.domain_assignments.push({ domain, config });
    }
  }

  removeDomainAssignment(domain: string): void {
    this.domain_assignments = this.domain_assignments.filter(
      a => a.domain !== domain
    );
  }

  assignToCrew(crewId: string): void {
    this.crew_id = crewId;
    this.updated_at = new Date();
  }

  canTransitionTo(newStatus: ProjectStatus): boolean {
    const validTransitions: Record<ProjectStatus, ProjectStatus[]> = {
      [ProjectStatus.Planning]: [ProjectStatus.Active, ProjectStatus.Archived],
      [ProjectStatus.Active]: [ProjectStatus.OnHold, ProjectStatus.Completed],
      [ProjectStatus.OnHold]: [ProjectStatus.Active, ProjectStatus.Archived],
      [ProjectStatus.Completed]: [ProjectStatus.Archived],
      [ProjectStatus.Archived]: []
    };

    return validTransitions[this.status]?.includes(newStatus) ?? false;
  }

  transitionTo(newStatus: ProjectStatus): void {
    if (this.canTransitionTo(newStatus)) {
      this.status = newStatus;
      this.updated_at = new Date();
    } else {
      throw new Error(
        `Cannot transition from ${this.status} to ${newStatus}`
      );
    }
  }

  // Validation
  static validate(data: unknown): data is Project {
    try {
      ProjectSchema.parse(data);
      return true;
    } catch {
      return false;
    }
  }
}

export const ProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  owner_id: z.string().uuid(),
  type: z.enum(['business_automation', 'product_development', 'research_initiative', 'internal']),
  description: z.string().optional(),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'archived']),
  crew_id: z.string().uuid().optional(),
  domain_assignments: z.array(z.object({
    domain: z.string(),
    config: z.record(z.unknown()).optional()
  })),
  created_at: z.date(),
  updated_at: z.date()
});

export type ProjectData = z.infer<typeof ProjectSchema>;
```

**File:** `domains/shared/project-management/src/domain/sprint.ts`

```typescript
export enum SprintStatus {
  Planned = 'planned',
  Active = 'active',
  Completed = 'completed',
  Cancelled = 'cancelled'
}

export class Sprint {
  id: string;
  project_id: string;
  number: number;
  name: string;
  status: SprintStatus = SprintStatus.Planned;
  start_date: Date;
  end_date: Date;
  team_capacity: number = 0;
  committed_points: number = 0;
  task_ids: string[] = [];
  crew_id?: string;
  created_at: Date;
  updated_at: Date;

  constructor(data: {
    id: string;
    project_id: string;
    number: number;
    name: string;
    start_date: Date;
    end_date: Date;
  }) {
    this.id = data.id;
    this.project_id = data.project_id;
    this.number = data.number;
    this.name = data.name;
    this.start_date = data.start_date;
    this.end_date = data.end_date;
    this.created_at = new Date();
    this.updated_at = new Date();
  }

  addTask(taskId: string): void {
    if (!this.task_ids.includes(taskId)) {
      this.task_ids.push(taskId);
      this.updated_at = new Date();
    }
  }

  removeTask(taskId: string): void {
    this.task_ids = this.task_ids.filter(id => id !== taskId);
    this.updated_at = new Date();
  }

  canStart(): boolean {
    return this.task_ids.length > 0 && this.team_capacity > 0;
  }

  start(): void {
    if (this.status === SprintStatus.Planned) {
      this.status = SprintStatus.Active;
      this.updated_at = new Date();
    }
  }

  complete(): void {
    if (this.status === SprintStatus.Active) {
      this.status = SprintStatus.Completed;
      this.updated_at = new Date();
    }
  }

  getVelocity(): number {
    // Calculate based on completed sprints
    return this.committed_points;
  }
}
```

**File:** `domains/shared/project-management/src/domain/task.ts`

```typescript
export enum TaskStatus {
  Backlog = 'backlog',
  Ready = 'ready',
  InProgress = 'in_progress',
  InReview = 'in_review',
  Done = 'done',
  Cancelled = 'cancelled'
}

export enum TaskPriority {
  Critical = 'critical',
  High = 'high',
  Medium = 'medium',
  Low = 'low'
}

export class Task {
  id: string;
  project_id: string;
  sprint_id?: string;
  title: string;
  description?: string;
  status: TaskStatus = TaskStatus.Backlog;
  priority: TaskPriority = TaskPriority.Medium;
  story_points?: number;
  time_estimate_hours?: number;
  time_logged_hours: number = 0;
  assignee_id?: string;
  reviewer_id?: string;
  depends_on_task_ids: string[] = [];
  subtask_ids: string[] = [];
  crew_task_id?: string;
  created_at: Date;
  updated_at: Date;
  due_date?: Date;

  constructor(data: {
    id: string;
    project_id: string;
    title: string;
    description?: string;
  }) {
    this.id = data.id;
    this.project_id = data.project_id;
    this.title = data.title;
    this.description = data.description;
    this.created_at = new Date();
    this.updated_at = new Date();
  }

  assignTo(userId: string): void {
    this.assignee_id = userId;
    this.updated_at = new Date();
  }

  assignToSprint(sprintId: string): void {
    this.sprint_id = sprintId;
    this.updated_at = new Date();
  }

  addDependency(taskId: string): void {
    if (!this.depends_on_task_ids.includes(taskId)) {
      this.depends_on_task_ids.push(taskId);
    }
  }

  canTransitionTo(newStatus: TaskStatus): boolean {
    const validTransitions: Record<TaskStatus, TaskStatus[]> = {
      [TaskStatus.Backlog]: [TaskStatus.Ready],
      [TaskStatus.Ready]: [TaskStatus.InProgress],
      [TaskStatus.InProgress]: [TaskStatus.InReview, TaskStatus.Done],
      [TaskStatus.InReview]: [TaskStatus.InProgress, TaskStatus.Done],
      [TaskStatus.Done]: [TaskStatus.Backlog],
      [TaskStatus.Cancelled]: []
    };

    return validTransitions[this.status]?.includes(newStatus) ?? false;
  }

  transitionTo(newStatus: TaskStatus): void {
    if (this.canTransitionTo(newStatus)) {
      this.status = newStatus;
      this.updated_at = new Date();
    } else {
      throw new Error(
        `Cannot transition task from ${this.status} to ${newStatus}`
      );
    }
  }

  delegateToCrewTask(crewTaskId: string): void {
    this.crew_task_id = crewTaskId;
    this.updated_at = new Date();
  }
}
```

#### Step 1.4: Create Repository Interface

**File:** `domains/shared/project-management/src/infrastructure/repository.ts`

```typescript
import { Project } from '../domain/project';
import { Sprint } from '../domain/sprint';
import { Task } from '../domain/task';

export interface ProjectRepository {
  create(project: Project): Promise<void>;
  findById(id: string): Promise<Project | null>;
  findByOwner(owner_id: string): Promise<Project[]>;
  findByDomain(domain: string): Promise<Project[]>;
  findByCrew(crew_id: string): Promise<Project[]>;
  update(project: Project): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface SprintRepository {
  create(sprint: Sprint): Promise<void>;
  findById(id: string): Promise<Sprint | null>;
  findByProject(project_id: string): Promise<Sprint[]>;
  update(sprint: Sprint): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface TaskRepository {
  create(task: Task): Promise<void>;
  findById(id: string): Promise<Task | null>;
  findBySprint(sprint_id: string): Promise<Task[]>;
  findByProject(project_id: string): Promise<Task[]>;
  findByAssignee(assignee_id: string): Promise<Task[]>;
  update(task: Task): Promise<void>;
  delete(id: string): Promise<void>;
}
```

### Phase 2: Services & API (Days 3-4)

**File:** `domains/shared/project-management/src/application/project-service.ts`

```typescript
import { Project, ProjectStatus, ProjectType } from '../domain/project';
import { ProjectRepository } from '../infrastructure/repository';

export class ProjectService {
  constructor(private projectRepo: ProjectRepository) {}

  async createProject(
    data: {
      name: string;
      owner_id: string;
      type: ProjectType;
      description?: string;
    }
  ): Promise<Project> {
    const project = new Project({
      id: crypto.randomUUID(),
      name: data.name,
      owner_id: data.owner_id,
      type: data.type,
      description: data.description
    });

    await this.projectRepo.create(project);
    return project;
  }

  async getProject(id: string): Promise<Project | null> {
    return this.projectRepo.findById(id);
  }

  async getUserProjects(userId: string): Promise<Project[]> {
    return this.projectRepo.findByOwner(userId);
  }

  async assignDomain(
    projectId: string,
    domain: string,
    config: any
  ): Promise<void> {
    const project = await this.projectRepo.findById(projectId);
    if (!project) throw new Error('Project not found');

    project.addDomainAssignment(domain, config);
    await this.projectRepo.update(project);
  }

  async assignCrew(projectId: string, crewId: string): Promise<void> {
    const project = await this.projectRepo.findById(projectId);
    if (!project) throw new Error('Project not found');

    project.assignToCrew(crewId);
    await this.projectRepo.update(project);
  }

  async updateStatus(
    projectId: string,
    newStatus: ProjectStatus
  ): Promise<void> {
    const project = await this.projectRepo.findById(projectId);
    if (!project) throw new Error('Project not found');

    project.transitionTo(newStatus);
    await this.projectRepo.update(project);
  }
}
```

### Phase 3: UI Components (Days 5-6)

**File:** `domains/shared/project-management/ui-components/ProjectCard.tsx`

```tsx
import React from 'react';
import { Project, ProjectStatus } from '../src/domain/project';

export interface ProjectCardProps {
  project: Project;
  onClick?: (project: Project) => void;
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const getStatusColor = (status: ProjectStatus) => {
    const colors: Record<ProjectStatus, string> = {
      [ProjectStatus.Planning]: 'bg-yellow-100 text-yellow-800',
      [ProjectStatus.Active]: 'bg-green-100 text-green-800',
      [ProjectStatus.OnHold]: 'bg-orange-100 text-orange-800',
      [ProjectStatus.Completed]: 'bg-blue-100 text-blue-800',
      [ProjectStatus.Archived]: 'bg-gray-100 text-gray-800'
    };
    return colors[status];
  };

  return (
    <div
      className="border rounded-lg p-4 cursor-pointer hover:shadow-lg transition"
      onClick={() => onClick?.(project)}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-bold text-lg">{project.name}</h3>
        <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(project.status)}`}>
          {project.status}
        </span>
      </div>

      {project.description && (
        <p className="text-sm text-gray-600 mb-3">{project.description}</p>
      )}

      {project.domain_assignments.length > 0 && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {project.domain_assignments.map(assignment => (
            <span
              key={assignment.domain}
              className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
            >
              {assignment.domain}
            </span>
          ))}
        </div>
      )}

      {project.crew_id && (
        <div className="mb-3 text-xs">
          <span className="font-semibold">Crew:</span> {project.crew_id}
        </div>
      )}

      <div className="text-xs text-gray-500">
        {project.created_at?.toLocaleDateString()}
      </div>
    </div>
  );
}
```

### Phase 4: Dashboard Integration (Days 7-8)

**File:** `domains/product-factory/dashboard/app/projects/page.tsx` (updated)

```tsx
'use client';

import { useEffect, useState } from 'react';
import { ProjectService } from '@openrouter-crew/project-management/application';
import { ProjectCard } from '@openrouter-crew/project-management/ui';
import { Project } from '@openrouter-crew/project-management/domain';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        // Initialize service with repository
        const service = new ProjectService(repositoryInstance);

        // Get user projects (would come from auth context in real implementation)
        const userId = 'current-user-id'; // From auth
        const projects = await service.getUserProjects(userId);

        setProjects(projects);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Projects</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map(project => (
          <ProjectCard
            key={project.id}
            project={project}
            onClick={(p) => {
              // Navigate to project detail
              window.location.href = `/projects/${p.id}`;
            }}
          />
        ))}
      </div>

      <button
        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded"
        onClick={() => window.location.href = '/projects/new'}
      >
        New Project
      </button>
    </div>
  );
}
```

### Phase 5: Cross-Domain Visibility (Days 9-10)

**File:** `apps/unified-dashboard/app/projects/page.tsx` (new)

```tsx
'use client';

import { useEffect, useState } from 'react';
import { ProjectService } from '@openrouter-crew/project-management/application';
import { Project } from '@openrouter-crew/project-management/domain';
import { ProjectCard } from '@openrouter-crew/project-management/ui';

export default function UnifiedProjectsPage() {
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);

  useEffect(() => {
    const loadProjects = async () => {
      const service = new ProjectService(repositoryInstance);

      if (selectedDomain) {
        const projects = await service.getDomainProjects(selectedDomain);
        setAllProjects(projects);
      } else {
        // Get all projects
        const userId = 'current-user-id';
        const projects = await service.getUserProjects(userId);
        setAllProjects(projects);
      }
    };

    loadProjects();
  }, [selectedDomain]);

  const domains = ['product-factory', 'alex-ai-universal', 'shared'];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">All Projects</h1>

      {/* Domain Filter */}
      <div className="mb-6 flex gap-2">
        <button
          className={`px-4 py-2 rounded ${!selectedDomain ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setSelectedDomain(null)}
        >
          All Domains
        </button>
        {domains.map(domain => (
          <button
            key={domain}
            className={`px-4 py-2 rounded ${selectedDomain === domain ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setSelectedDomain(domain)}
          >
            {domain}
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allProjects.map(project => (
          <ProjectCard
            key={project.id}
            project={project}
            onClick={(p) => {
              window.location.href = `/projects/${p.id}`;
            }}
          />
        ))}
      </div>
    </div>
  );
}
```

---

## Migration Path from Existing Code

If you have existing sprint/project code in `product-factory/dashboard`:

```bash
# 1. Keep old code temporarily (for reference)
cp domains/product-factory/dashboard/app/sprints \
   domains/product-factory/dashboard/app/sprints.backup

# 2. Create new pages that use shared system
touch domains/product-factory/dashboard/app/projects-new/page.tsx

# 3. Gradually migrate:
#    - Week 1: Run old and new in parallel
#    - Week 2: Switch primary view to new
#    - Week 3: Delete old code

# 4. Update tests to use new service layer
```

---

## Testing Strategy

**File:** `domains/shared/project-management/src/domain/project.test.ts`

```typescript
import { describe, it, expect } from '@jest/globals';
import { Project, ProjectStatus, ProjectType } from './project';

describe('Project Domain', () => {
  it('should create a project', () => {
    const project = new Project({
      id: '123',
      name: 'Test Project',
      owner_id: 'user-123',
      type: ProjectType.ProductDevelopment
    });

    expect(project.name).toBe('Test Project');
    expect(project.status).toBe(ProjectStatus.Planning);
  });

  it('should transition from Planning to Active', () => {
    const project = new Project({
      id: '123',
      name: 'Test Project',
      owner_id: 'user-123',
      type: ProjectType.ProductDevelopment
    });

    project.transitionTo(ProjectStatus.Active);
    expect(project.status).toBe(ProjectStatus.Active);
  });

  it('should add domain assignments', () => {
    const project = new Project({
      id: '123',
      name: 'Test Project',
      owner_id: 'user-123',
      type: ProjectType.ProductDevelopment
    });

    project.addDomainAssignment('product-factory', { template: 'dj-booking' });
    expect(project.domain_assignments).toHaveLength(1);
  });
});
```

---

## Success Checklist

- [ ] Package created and compiles
- [ ] Domain entities pass tests
- [ ] Repositories implement all methods
- [ ] Services work with repositories
- [ ] UI components render correctly
- [ ] Dashboard integrates components
- [ ] Projects visible across domains
- [ ] Crew assignment works
- [ ] Task workflow functional
- [ ] Migrations applied to Supabase

---

**Status:** Implementation Ready | **Effort:** 1-2 weeks | **Impact:** Platform-wide project visibility
