# Unified Project Management System

**OpenRouter Crew Platform** | Cross-Domain Visible Project Management
**Architecture:** DDD with Shared Logic | **Status:** Design Phase | **Scope:** Full Platform

---

## Executive Summary

This document specifies a **unified project management system** that:

1. **Centralizes project state** in `domains/shared/project-management`
2. **Maintains shared linguistic structure** across all dashboards
3. **Provides reusable components** through `domains/shared/ui-components`
4. **Integrates with existing** crew-api-client, schemas, and cost-tracking
5. **Enables multi-domain visibility** (product-factory, alex-ai-universal, etc.)
6. **Respects DDD boundaries** while sharing cross-cutting concerns

---

## Architecture Overview

### Current State
```
domains/
├── product-factory/
│   └── dashboard/          [Isolated PM logic]
│       ├── app/sprints/
│       ├── app/projects/
│       └── lib/            [Private utilities]
│
├── alex-ai-universal/
│   └── dashboard/          [Isolated PM logic]
│       └── [Duplicated patterns]
│
└── shared/
    ├── schemas/            [Database types]
    ├── ui-components/      [Shared UI - not used for PM yet]
    └── crew-api-client/    [API integration]
```

### Desired State
```
domains/
├── product-factory/
│   └── dashboard/          [Uses shared PM system]
│       ├── app/
│       │   ├── projects/
│       │   └── [Uses shared components]
│       └── [Domain-specific overrides only]
│
├── alex-ai-universal/
│   └── dashboard/          [Uses shared PM system]
│       ├── app/
│       └── [Extends shared functionality]
│
├── unified-dashboard/
│   └── [Cross-domain PM visibility]
│       └── [Uses shared system]
│
└── shared/
    ├── project-management/ ✨ NEW
    │   ├── src/
    │   │   ├── domain/
    │   │   │   ├── project.ts         [Project aggregate]
    │   │   │   ├── sprint.ts          [Sprint aggregate]
    │   │   │   ├── task.ts            [Task aggregate]
    │   │   │   ├── resource.ts        [Resource allocation]
    │   │   │   └── relationships.ts   [Cross-domain relationships]
    │   │   │
    │   │   ├── application/
    │   │   │   ├── project-service.ts
    │   │   │   ├── sprint-service.ts
    │   │   │   ├── task-service.ts
    │   │   │   └── queries/           [CQRS read models]
    │   │   │
    │   │   ├── infrastructure/
    │   │   │   ├── supabase-repository.ts
    │   │   │   ├── events.ts          [Domain events]
    │   │   │   └── cache.ts           [Cross-domain caching]
    │   │   │
    │   │   └── index.ts               [Exports]
    │   │
    │   ├── ui-components/ ✨ NEW (or extend existing)
    │   │   ├── ProjectCard.tsx
    │   │   ├── SprintBoard.tsx
    │   │   ├── TaskBoard.tsx
    │   │   ├── ResourceAllocator.tsx
    │   │   └── ProjectTimeline.tsx
    │   │
    │   └── package.json
    │
    ├── schemas/            [Extended with PM types]
    │
    └── ui-components/      [Extended with PM components]
```

---

## Core Design Principles

### 1. Linguistic Consistency

All domains use the **same terminology and patterns**:

```typescript
// Uniform across all dashboards
interface Project {
  id: string;
  name: string;
  status: ProjectStatus;    // "planning" | "active" | "completed" | "archived"
  owner_id: string;
  created_at: Date;
  updated_at: Date;
}

interface Sprint {
  id: string;
  project_id: string;
  name: string;
  status: SprintStatus;      // "planned" | "active" | "completed"
  start_date: Date;
  end_date: Date;
}

interface Task {
  id: string;
  sprint_id: string;
  title: string;
  status: TaskStatus;         // "backlog" | "ready" | "in_progress" | "review" | "done"
  assignee_id?: string;
  story_points?: number;
}
```

### 2. Shared Business Logic

All business rules live in **one place**:

```typescript
// domains/shared/project-management/src/domain/project.ts

export class Project {
  // Validation rules (same everywhere)
  static create(data: ProjectData): Result<Project> {
    if (!data.name) return Err("Project name required");
    if (data.name.length < 3) return Err("Name too short");
    return Ok(new Project(data));
  }

  // Domain methods (same everywhere)
  canTransitionTo(status: ProjectStatus): boolean {
    return this.status_transitions.includes(status);
  }

  // Event generation (same everywhere)
  transitionTo(status: ProjectStatus): ProjectStatusChanged {
    return new ProjectStatusChanged(this.id, status);
  }
}
```

### 3. Repository Pattern

All dashboards use **the same repository**:

```typescript
// domains/shared/project-management/src/infrastructure/repository.ts

export interface ProjectRepository {
  create(project: Project): Promise<void>;
  findById(id: string): Promise<Project | null>;
  findByOwner(owner_id: string): Promise<Project[]>;
  update(project: Project): Promise<void>;
  delete(id: string): Promise<void>;
}

// Implemented once, used everywhere
export class SupabaseProjectRepository implements ProjectRepository {
  // Single implementation for all dashboards
}
```

### 4. Cross-Domain Relationships

Projects can span multiple domains:

```typescript
interface ProjectDomainAssignment {
  project_id: string;
  domain: "product-factory" | "alex-ai-universal" | "shared";
  domain_specific_config: Record<string, any>;
}

// Example: Single project visible across all dashboards
const project = {
  id: "proj-123",
  name: "Mobile App MVP",
  assignments: [
    { domain: "product-factory", config: { template: "dj-booking" } },
    { domain: "alex-ai-universal", config: { enable_analytics: true } }
  ]
};
```

---

## Core Entities (Domain Model)

### 1. Project Aggregate

```typescript
// domains/shared/project-management/src/domain/project.ts

enum ProjectStatus {
  Planning = "planning",
  Active = "active",
  OnHold = "on_hold",
  Completed = "completed",
  Archived = "archived"
}

enum ProjectType {
  BusinessAutomation = "business_automation",
  ProductDevelopment = "product_development",
  ResearchInitiative = "research_initiative",
  Internal = "internal"
}

class Project {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly owner_id: string;
  readonly type: ProjectType;

  status: ProjectStatus = ProjectStatus.Planning;
  start_date?: Date;
  end_date?: Date;

  // Domain assignments (which domains this project touches)
  domain_assignments: ProjectDomainAssignment[] = [];

  // Crew assignments
  crew_id?: string;        // Associated with a crew
  crew_configurations: CrewConfiguration[] = [];

  // Metadata
  created_at: Date;
  updated_at: Date;
  tags: string[] = [];
  metadata: Record<string, any> = {};

  // Methods
  addDomainAssignment(domain: string, config: any): void;
  removeDomainAssignment(domain: string): void;
  assignToCrew(crew_id: string): void;
  transitionTo(status: ProjectStatus): ProjectStatusChanged;
}
```

### 2. Sprint Aggregate

```typescript
// domains/shared/project-management/src/domain/sprint.ts

enum SprintStatus {
  Planned = "planned",
  Active = "active",
  Completed = "completed",
  Cancelled = "cancelled"
}

class Sprint {
  readonly id: string;
  readonly project_id: string;
  readonly number: number;           // Sprint 1, 2, 3, etc.

  name: string;
  status: SprintStatus = SprintStatus.Planned;

  start_date: Date;
  end_date: Date;

  // Capacity planning
  team_capacity: number = 0;         // Story points team can handle
  committed_points: number = 0;      // Points committed to sprint

  // Tasks in this sprint
  task_ids: string[] = [];

  // Crew working on this sprint
  crew_id?: string;

  created_at: Date;
  updated_at: Date;

  // Methods
  addTask(task_id: string): void;
  removeTask(task_id: string): void;
  getVelocity(): number;
  canStart(): boolean;
  start(): SprintStarted;
  complete(): SprintCompleted;
}
```

### 3. Task Aggregate

```typescript
// domains/shared/project-management/src/domain/task.ts

enum TaskStatus {
  Backlog = "backlog",
  Ready = "ready",
  InProgress = "in_progress",
  InReview = "in_review",
  Done = "done",
  Cancelled = "cancelled"
}

enum TaskPriority {
  Critical = "critical",
  High = "high",
  Medium = "medium",
  Low = "low"
}

class Task {
  readonly id: string;
  readonly project_id: string;
  readonly sprint_id?: string;

  title: string;
  description?: string;
  status: TaskStatus = TaskStatus.Backlog;
  priority: TaskPriority = TaskPriority.Medium;

  // Estimation & tracking
  story_points?: number;
  time_estimate_hours?: number;
  time_logged_hours: number = 0;

  // Assignments
  assignee_id?: string;
  reviewer_id?: string;

  // Relationships
  depends_on_task_ids: string[] = [];
  subtask_ids: string[] = [];

  // Crew execution
  crew_task_id?: string;   // Reference to crew task execution

  created_at: Date;
  updated_at: Date;
  due_date?: Date;

  // Methods
  assignTo(user_id: string): void;
  transitionTo(status: TaskStatus): TaskStatusChanged;
  addDependency(task_id: string): void;
  createSubtask(title: string): Task;
}
```

### 4. Resource Allocation

```typescript
// domains/shared/project-management/src/domain/resource.ts

class ResourceAllocation {
  readonly id: string;
  readonly project_id: string;

  resource_type: "human" | "ai_crew" | "service";
  resource_id: string;              // User ID, Crew ID, or service identifier

  allocation_percentage: number;     // 0-100% of capacity
  start_date: Date;
  end_date?: Date;

  role: string;                      // "developer", "designer", "pm", etc.

  created_at: Date;
  updated_at: Date;

  isActive(date: Date = new Date()): boolean;
  getRemainingCapacity(): number;
}
```

---

## Application Services (Business Logic)

### ProjectService

```typescript
// domains/shared/project-management/src/application/project-service.ts

export class ProjectService {
  constructor(
    private projectRepo: ProjectRepository,
    private sprintRepo: SprintRepository,
    private eventBus: EventBus,
    private crewApiClient: CrewAPIClient
  ) {}

  // Commands
  async createProject(
    data: CreateProjectRequest,
    userId: string
  ): Promise<Result<Project>> {
    // Validate
    const project = Project.create({
      ...data,
      owner_id: userId,
      created_at: new Date()
    });

    if (project.isErr()) return project;

    // Persist
    await this.projectRepo.create(project.value);

    // Publish event
    this.eventBus.publish(
      new ProjectCreated(project.value.id, userId)
    );

    return Ok(project.value);
  }

  async assignToCrew(
    projectId: string,
    crewId: string
  ): Promise<Result<void>> {
    const project = await this.projectRepo.findById(projectId);
    if (!project) return Err("Project not found");

    // Validate crew exists
    const crew = await this.crewApiClient.get_crew_status({ crew_id: crewId });
    if (!crew) return Err("Crew not found");

    project.assignToCrew(crewId);
    await this.projectRepo.update(project);

    this.eventBus.publish(
      new ProjectAssignedToCrew(projectId, crewId)
    );

    return Ok(void);
  }

  async assignDomain(
    projectId: string,
    domain: string,
    config: any
  ): Promise<Result<void>> {
    const project = await this.projectRepo.findById(projectId);
    if (!project) return Err("Project not found");

    project.addDomainAssignment(domain, config);
    await this.projectRepo.update(project);

    this.eventBus.publish(
      new DomainAssignedToProject(projectId, domain)
    );

    return Ok(void);
  }

  async transitionStatus(
    projectId: string,
    newStatus: ProjectStatus
  ): Promise<Result<void>> {
    const project = await this.projectRepo.findById(projectId);
    if (!project) return Err("Project not found");

    if (!project.canTransitionTo(newStatus)) {
      return Err(`Cannot transition from ${project.status} to ${newStatus}`);
    }

    const event = project.transitionTo(newStatus);
    await this.projectRepo.update(project);
    this.eventBus.publish(event);

    return Ok(void);
  }

  // Queries (use read models for performance)
  async getProjectsByOwner(userId: string): Promise<Project[]> {
    return this.projectRepo.findByOwner(userId);
  }

  async getProjectsByDomain(domain: string): Promise<Project[]> {
    return this.projectRepo.findByDomain(domain);
  }

  async getProjectsForCrew(crewId: string): Promise<Project[]> {
    return this.projectRepo.findByCrew(crewId);
  }
}
```

### SprintService

```typescript
// domains/shared/project-management/src/application/sprint-service.ts

export class SprintService {
  constructor(
    private sprintRepo: SprintRepository,
    private taskRepo: TaskRepository,
    private projectRepo: ProjectRepository,
    private eventBus: EventBus
  ) {}

  async createSprint(
    projectId: string,
    data: CreateSprintRequest
  ): Promise<Result<Sprint>> {
    const project = await this.projectRepo.findById(projectId);
    if (!project) return Err("Project not found");

    const existingSprints = await this.sprintRepo.findByProject(projectId);
    const sprintNumber = existingSprints.length + 1;

    const sprint = Sprint.create({
      ...data,
      project_id: projectId,
      number: sprintNumber
    });

    if (sprint.isErr()) return sprint;

    await this.sprintRepo.create(sprint.value);
    this.eventBus.publish(new SprintCreated(sprint.value.id));

    return Ok(sprint.value);
  }

  async startSprint(sprintId: string): Promise<Result<void>> {
    const sprint = await this.sprintRepo.findById(sprintId);
    if (!sprint) return Err("Sprint not found");

    if (!sprint.canStart()) {
      return Err("Sprint has no tasks or insufficient capacity");
    }

    const event = sprint.start();
    await this.sprintRepo.update(sprint);
    this.eventBus.publish(event);

    return Ok(void);
  }

  async addTaskToSprint(
    sprintId: string,
    taskId: string
  ): Promise<Result<void>> {
    const sprint = await this.sprintRepo.findById(sprintId);
    const task = await this.taskRepo.findById(taskId);

    if (!sprint || !task) return Err("Sprint or task not found");

    sprint.addTask(taskId);
    task.assignToSprint(sprintId);

    await this.sprintRepo.update(sprint);
    await this.taskRepo.update(task);

    this.eventBus.publish(new TaskAddedToSprint(taskId, sprintId));

    return Ok(void);
  }

  async getSprintMetrics(sprintId: string): Promise<SprintMetrics> {
    const sprint = await this.sprintRepo.findById(sprintId);
    const tasks = await this.taskRepo.findBySprint(sprintId);

    return {
      sprint_id: sprintId,
      committed_points: sprint.committed_points,
      completed_points: tasks
        .filter(t => t.status === TaskStatus.Done)
        .reduce((sum, t) => sum + (t.story_points || 0), 0),
      velocity: sprint.getVelocity(),
      progress_percentage: Math.round(
        (tasks.filter(t => t.status === TaskStatus.Done).length / tasks.length) * 100
      )
    };
  }
}
```

### TaskService

```typescript
// domains/shared/project-management/src/application/task-service.ts

export class TaskService {
  constructor(
    private taskRepo: TaskRepository,
    private sprintRepo: SprintRepository,
    private eventBus: EventBus,
    private crewApiClient: CrewAPIClient
  ) {}

  async createTask(
    projectId: string,
    data: CreateTaskRequest
  ): Promise<Result<Task>> {
    const task = Task.create({
      ...data,
      project_id: projectId
    });

    if (task.isErr()) return task;

    await this.taskRepo.create(task.value);
    this.eventBus.publish(new TaskCreated(task.value.id));

    return Ok(task.value);
  }

  async assignTask(
    taskId: string,
    assigneeId: string
  ): Promise<Result<void>> {
    const task = await this.taskRepo.findById(taskId);
    if (!task) return Err("Task not found");

    task.assignTo(assigneeId);
    await this.taskRepo.update(task);

    this.eventBus.publish(new TaskAssigned(taskId, assigneeId));

    return Ok(void);
  }

  async transitionTask(
    taskId: string,
    newStatus: TaskStatus
  ): Promise<Result<void>> {
    const task = await this.taskRepo.findById(taskId);
    if (!task) return Err("Task not found");

    const event = task.transitionTo(newStatus);
    await this.taskRepo.update(task);
    this.eventBus.publish(event);

    return Ok(void);
  }

  async delegateToCrewTask(
    taskId: string,
    crewId: string
  ): Promise<Result<void>> {
    const task = await this.taskRepo.findById(taskId);
    if (!task) return Err("Task not found");

    // Create crew task
    const crewTask = await this.crewApiClient.execute_crew({
      crew_id: crewId,
      input: {
        task_title: task.title,
        description: task.description,
        story_points: task.story_points
      }
    });

    if (!crewTask) return Err("Failed to create crew task");

    task.delegateToCrewTask(crewTask.id);
    await this.taskRepo.update(task);

    this.eventBus.publish(
      new TaskDelegatedToCrewTask(taskId, crewTask.id)
    );

    return Ok(void);
  }
}
```

---

## UI Components (Shared Across Dashboards)

### ProjectCard Component

```typescript
// domains/shared/project-management/ui-components/ProjectCard.tsx

export interface ProjectCardProps {
  project: Project;
  onClick?: (project: Project) => void;
  showDomains?: boolean;
  showCrew?: boolean;
  onStatusChange?: (projectId: string, status: ProjectStatus) => void;
}

export function ProjectCard({
  project,
  onClick,
  showDomains = true,
  showCrew = true,
  onStatusChange
}: ProjectCardProps) {
  return (
    <div
      className="border rounded-lg p-4 cursor-pointer hover:shadow-lg transition"
      onClick={() => onClick?.(project)}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-bold text-lg">{project.name}</h3>
        <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(project.status)}`}>
          {project.status}
        </span>
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-sm text-gray-600 mb-3">{project.description}</p>
      )}

      {/* Domains */}
      {showDomains && project.domain_assignments.length > 0 && (
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

      {/* Crew */}
      {showCrew && project.crew_id && (
        <div className="mb-3 text-xs">
          <span className="font-semibold">Crew:</span> {project.crew_id}
        </div>
      )}

      {/* Metadata */}
      <div className="text-xs text-gray-500">
        <span>Created {formatDate(project.created_at)}</span>
      </div>
    </div>
  );
}
```

### SprintBoard Component

```typescript
// domains/shared/project-management/ui-components/SprintBoard.tsx

export interface SprintBoardProps {
  sprint: Sprint;
  tasks: Task[];
  onTaskStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  onTaskClick?: (task: Task) => void;
}

export function SprintBoard({
  sprint,
  tasks,
  onTaskStatusChange,
  onTaskClick
}: SprintBoardProps) {
  const columns: [TaskStatus, string][] = [
    [TaskStatus.Ready, "Ready"],
    [TaskStatus.InProgress, "In Progress"],
    [TaskStatus.InReview, "In Review"],
    [TaskStatus.Done, "Done"]
  ];

  return (
    <div className="p-4">
      {/* Sprint Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold">{sprint.name}</h2>
        <div className="flex gap-4 mt-2 text-sm">
          <span>Sprint {sprint.number}</span>
          <span className={getStatusColor(sprint.status)}>
            {sprint.status}
          </span>
          <span>Velocity: {sprint.getVelocity()} pts</span>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-4 gap-4">
        {columns.map(([status, label]) => (
          <div
            key={status}
            className="bg-gray-100 rounded-lg p-3"
          >
            <h3 className="font-semibold mb-3">{label}</h3>
            <div className="space-y-2">
              {tasks
                .filter(t => t.status === status)
                .map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={() => onTaskClick?.(task)}
                    onStatusChange={(newStatus) =>
                      onTaskStatusChange?.(task.id, newStatus)
                    }
                  />
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### ProjectTimeline Component

```typescript
// domains/shared/project-management/ui-components/ProjectTimeline.tsx

export interface ProjectTimelineProps {
  projects: Project[];
  onProjectClick?: (project: Project) => void;
}

export function ProjectTimeline({
  projects,
  onProjectClick
}: ProjectTimelineProps) {
  const sorted = projects.sort(
    (a, b) => (a.start_date?.getTime() || 0) - (b.start_date?.getTime() || 0)
  );

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6">Project Timeline</h2>

      {/* Gantt-style timeline */}
      <div className="space-y-3">
        {sorted.map(project => (
          <ProjectTimelineRow
            key={project.id}
            project={project}
            onClick={() => onProjectClick?.(project)}
          />
        ))}
      </div>
    </div>
  );
}
```

---

## Integration Points

### 1. With CrewAPIClient

```typescript
// Projects and crews work together
projectService.assignToCrew(projectId, crewId)
  .then(() => {
    // Crew can now execute project tasks
    crewApiClient.execute_crew({
      crew_id: crewId,
      input: getProjectTasks(projectId)
    })
  });
```

### 2. With Cost Tracking

```typescript
// Track cost per project/sprint
const costTracking = {
  project_id: string;
  sprint_id?: string;
  cost: number;
  resource_type: "crew" | "human" | "service";
};

// Projects inherit costs from assigned crews
const projectCost = await costTrackingService.getProjectCost(projectId);
```

### 3. With Supabase Migrations

```sql
-- New tables for PM system

CREATE TABLE projects (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  crew_id UUID,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE domain_assignments (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects,
  domain TEXT NOT NULL,
  config JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sprints (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects,
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  number INT NOT NULL,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  team_capacity INT DEFAULT 0,
  committed_points INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects,
  sprint_id UUID REFERENCES sprints,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  priority TEXT NOT NULL,
  story_points INT,
  time_estimate_hours INT,
  time_logged_hours INT DEFAULT 0,
  assignee_id UUID,
  reviewer_id UUID,
  crew_task_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indices for performance
CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_projects_crew ON projects(crew_id);
CREATE INDEX idx_sprints_project ON sprints(project_id);
CREATE INDEX idx_tasks_sprint ON tasks(sprint_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
```
├─ Create domains/shared/project-management package
├─ Define domain entities (Project, Sprint, Task, Resource)
├─ Create application services
├─ Implement Supabase repository
└─ Basic API endpoints
```

### Phase 2: UI Components (Week 2)
```
├─ Create ProjectCard component
├─ Create SprintBoard (Kanban) component
├─ Create ProjectTimeline component
├─ Create TaskCard component
└─ Create ResourceAllocator component
```

### Phase 3: Dashboard Integration (Week 3)
```
├─ Integrate PM into product-factory dashboard
├─ Integrate PM into alex-ai-universal dashboard
├─ Create unified-dashboard views
├─ Add cross-domain project visibility
└─ Test multi-domain workflows
```

### Phase 4: Advanced Features (Week 4)
```
├─ Crew task delegation
├─ Cost tracking integration
├─ Automation rules
├─ Reporting dashboards
└─ Analytics
```

---

## Usage Examples

### Creating a Project Across Domains

```typescript
// In any dashboard

import { ProjectService } from '@openrouter-crew/project-management';

const projectService = new ProjectService(
  projectRepo,
  sprintRepo,
  eventBus,
  crewApiClient
);

// Create project visible in all domains
const project = await projectService.createProject({
  name: "Mobile App MVP",
  type: ProjectType.ProductDevelopment,
  description: "Cross-platform mobile application"
}, userId);

// Assign to product-factory domain
await projectService.assignDomain(project.id, "product-factory", {
  template: "dj-booking"
});

// Assign to alex-ai-universal domain
await projectService.assignDomain(project.id, "alex-ai-universal", {
  enable_analytics: true,
  enable_insights: true
});

// Assign to crew for execution
await projectService.assignToCrew(project.id, "crew-mobile-dev");
```

### Viewing Projects Across Domains

```typescript
// In unified-dashboard

const projectsInProductFactory = await projectService.getProjectsByDomain(
  "product-factory"
);

const projectsInAlex = await projectService.getProjectsByDomain(
  "alex-ai-universal"
);

const projectsForCrew = await projectService.getProjectsForCrew(crewId);

// All use the same service, same entities, same logic
```

---

## Package Structure

```typescript
// domains/shared/project-management/package.json

{
  "name": "@openrouter-crew/project-management",
  "version": "1.0.0",
  "description": "Unified project management system for OpenRouter Crew Platform",
  "exports": {
    "./domain": "./src/domain/index.ts",
    "./application": "./src/application/index.ts",
    "./infrastructure": "./src/infrastructure/index.ts",
    "./ui": "./ui-components/index.ts",
    "./types": "./src/types/index.ts"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc -w"
  }
}
```

---

## Benefits

✅ **Single Source of Truth** - All dashboards use the same Project/Sprint/Task definitions
✅ **Consistent UX** - Same components across all dashboards
✅ **Shared Logic** - Business rules defined once, used everywhere
✅ **Cross-Domain Visibility** - Projects visible across dashboards
✅ **Type Safety** - Shared TypeScript interfaces
✅ **DDD Boundaries** - Proper aggregates and repositories
✅ **Extensibility** - Each domain can extend with domain-specific features
✅ **Testing** - Business logic testable in isolation

---

**Status:** Design Complete | **Next:** Implement Phase 1 Foundation
