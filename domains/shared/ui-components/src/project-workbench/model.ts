import {
  ProjectWorkbenchModel,
  WorkbenchAction,
  WorkbenchProjectCard,
  WorkbenchProjectRecord,
  WorkbenchSurface,
} from './types';

interface CreateProjectWorkbenchModelOptions {
  surface: WorkbenchSurface;
  projects: WorkbenchProjectRecord[];
}

function formatRelativeTime(updatedAt?: string): string {
  if (!updatedAt) {
    return 'No recent update';
  }

  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) {
    return 'Updated recently';
  }

  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) {
    const minutes = Math.max(1, Math.round(diffMs / (1000 * 60)));
    return `Updated ${minutes}m ago`;
  }
  if (diffHours < 24) {
    return `Updated ${diffHours}h ago`;
  }
  const days = Math.round(diffHours / 24);
  return `Updated ${days}d ago`;
}

function buildHeroActions(surface: WorkbenchSurface): WorkbenchAction[] {
  if (surface === 'dashboard') {
    return [
      {
        id: 'create-project',
        label: 'Create Project',
        description: 'Start from a shared creation lane in the dashboard.',
        kind: 'primary',
        href: '#project-workbench-create',
      },
      {
        id: 'create-feature',
        label: 'Create Feature',
        description: 'Break work into deliverable slices before execution.',
        kind: 'secondary',
        href: '#project-workbench-plan',
      },
      {
        id: 'review-costs',
        label: 'Review Costs',
        description: 'Check budget and operating signals before committing.',
        kind: 'ghost',
        href: '/cost',
      },
    ];
  }

  return [
    {
      id: 'create-project',
      label: 'Create Project',
      description: 'Launch the same project intake path from inside VS Code.',
      kind: 'primary',
      commandId: 'openrouter-crew.project.create',
    },
    {
      id: 'create-feature',
      label: 'Create Feature',
      description: 'Add scoped feature work without leaving your editor.',
      kind: 'secondary',
      commandId: 'openrouter-crew.project.feature',
    },
    {
      id: 'refresh-projects',
      label: 'Refresh Projects',
      description: 'Sync the project list from platform state.',
      kind: 'ghost',
      commandId: 'openrouter-crew.project-view.refresh',
    },
  ];
}

function buildProjectCards(projects: WorkbenchProjectRecord[]): WorkbenchProjectCard[] {
  return projects.map((project) => {
    const allocated = project.budgetAllocated ?? 0;
    const spent = project.budgetSpent ?? 0;
    const utilizationPercent = allocated > 0 ? Math.min(100, Math.round((spent / allocated) * 100)) : 0;

    return {
      id: project.id,
      name: project.name,
      description: project.description || 'No description provided yet.',
      status: project.status || 'unknown',
      domain: project.domain || 'Unassigned domain',
      updatedLabel: formatRelativeTime(project.updatedAt),
      budgetLabel: allocated > 0 ? `$${spent.toLocaleString()} / $${allocated.toLocaleString()}` : 'Budget not set',
      teamLabel: project.teamSize ? `${project.teamSize} contributors` : 'Crew sizing pending',
      utilizationPercent,
    };
  });
}

export function createProjectWorkbenchModel(
  options: CreateProjectWorkbenchModelOptions
): ProjectWorkbenchModel {
  const { surface, projects } = options;
  const projectCards = buildProjectCards(projects);
  const activeProjects = projects.filter((project) => project.status === 'active').length;
  const atRiskProjects = projects.filter((project) => {
    if (!project.budgetAllocated || project.budgetAllocated <= 0) {
      return false;
    }
    return (project.budgetSpent ?? 0) / project.budgetAllocated >= 0.8;
  }).length;
  const domainCount = new Set(projects.map((project) => project.domain).filter(Boolean)).size;

  return {
    surface,
    title: 'Project Workbench',
    subtitle:
      'Use the same creation, planning, and operating lanes across the web dashboard and VS Code so project work feels consistent everywhere.',
    heroActions: buildHeroActions(surface),
    metrics: [
      {
        id: 'total-projects',
        label: 'Projects',
        value: String(projects.length),
        helper: 'Total tracked initiatives',
      },
      {
        id: 'active-projects',
        label: 'Active',
        value: String(activeProjects),
        helper: 'Currently moving workstreams',
      },
      {
        id: 'at-risk',
        label: 'At Risk',
        value: String(atRiskProjects),
        helper: 'Budget or delivery pressure',
      },
      {
        id: 'domains',
        label: 'Domains',
        value: String(domainCount),
        helper: 'Organizational coverage',
      },
    ],
    stages: [
      {
        id: 'project-workbench-create',
        title: 'Define',
        description: 'Capture the project shape before execution starts.',
        cards: [
          {
            id: 'stage-create-project',
            title: 'Create Project Brief',
            description: 'Name the initiative, set its domain, and establish ownership.',
            action: surface === 'dashboard'
              ? {
                  id: 'dashboard-create-project',
                  label: 'Use Dashboard Flow',
                  description: 'Stay in the shared dashboard workbench.',
                  kind: 'primary',
                  href: '#project-workbench-create',
                }
              : {
                  id: 'vscode-create-project',
                  label: 'Run Create Project',
                  description: 'Open the editor-side intake flow.',
                  kind: 'primary',
                  commandId: 'openrouter-crew.project.create',
                },
          },
          {
            id: 'stage-template',
            title: 'Choose a Working Pattern',
            description: 'Start from a product, platform, or domain-specific template instead of a blank state.',
            action: surface === 'dashboard'
              ? {
                  id: 'dashboard-domain-overview',
                  label: 'Review Domains',
                  description: 'Use domain context before choosing a template.',
                  kind: 'secondary',
                  href: '/domains',
                }
              : {
                  id: 'vscode-open-workbench',
                  label: 'Stay In Workbench',
                  description: 'Keep template choices visible while you build.',
                  kind: 'secondary',
                  commandId: 'openrouter-crew.project.workbench',
                },
          },
        ],
      },
      {
        id: 'project-workbench-plan',
        title: 'Plan',
        description: 'Break the project into actionable, crew-friendly units.',
        cards: [
          {
            id: 'stage-create-feature',
            title: 'Define Features',
            description: 'Turn a project into prioritized work packages with budgets and ownership.',
            action: surface === 'dashboard'
              ? {
                  id: 'dashboard-feature-planning',
                  label: 'Plan Features',
                  description: 'Use the shared planning lane.',
                  kind: 'primary',
                  href: '#project-workbench-plan',
                }
              : {
                  id: 'vscode-create-feature',
                  label: 'Run Create Feature',
                  description: 'Add work items directly from the editor.',
                  kind: 'primary',
                  commandId: 'openrouter-crew.project.feature',
                },
          },
          {
            id: 'stage-crew',
            title: 'Coordinate Crew',
            description: 'Line up roles, memories, and cost constraints before execution.',
            action: surface === 'dashboard'
              ? {
                  id: 'dashboard-crew',
                  label: 'Open Crew Views',
                  description: 'Check crew readiness from the dashboard.',
                  kind: 'secondary',
                  href: '/settings',
                }
              : {
                  id: 'vscode-crew-roster',
                  label: 'Open Crew Roster',
                  description: 'Inspect available crew from the sidebar.',
                  kind: 'secondary',
                  commandId: 'openrouter-crew.crew.roster',
                },
          },
        ],
      },
      {
        id: 'project-workbench-operate',
        title: 'Operate',
        description: 'Watch budget, memory, and project health with one operating picture.',
        cards: [
          {
            id: 'stage-budget',
            title: 'Budget and Health',
            description: 'Use a single operating rhythm for spend, status, and risk signals.',
            action: surface === 'dashboard'
              ? {
                  id: 'dashboard-cost',
                  label: 'Open Cost View',
                  description: 'Review project costs in the dashboard.',
                  kind: 'primary',
                  href: '/cost',
                }
              : {
                  id: 'vscode-cost',
                  label: 'Open Cost Report',
                  description: 'Review operating costs inside VS Code.',
                  kind: 'primary',
                  commandId: 'openrouter-crew.showCostReport',
                },
          },
          {
            id: 'stage-memory',
            title: 'Memory and History',
            description: 'Keep prior decisions and supporting context accessible in both platforms.',
            action: surface === 'dashboard'
              ? {
                  id: 'dashboard-history',
                  label: 'Review Activity',
                  description: 'Stay on the operating picture for current work.',
                  kind: 'secondary',
                  href: '#project-workbench-operate',
                }
              : {
                  id: 'vscode-memory',
                  label: 'Search Memories',
                  description: 'Pull relevant context from crew memory.',
                  kind: 'secondary',
                  commandId: 'openrouter-crew.memory.search',
                },
          },
        ],
      },
    ],
    projects: projectCards,
  };
}
