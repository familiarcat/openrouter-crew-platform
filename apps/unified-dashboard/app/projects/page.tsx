'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createProjectWorkbenchModel, WorkbenchProjectRecord } from '@openrouter-crew/shared-ui-components/project-workbench';
import { ProjectWorkbenchView } from '@openrouter-crew/shared-ui-components/project-workbench/react';
import { getMockProjectRecords, type ProjectPlatformRecord } from '@/lib/project-platform';

function mapProjectsToWorkbench(projects: ProjectPlatformRecord[]): WorkbenchProjectRecord[] {
  return projects.map((project) => ({
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status,
    domain: project.domain?.name || project.domainId,
    budgetAllocated: project.budgetAllocated,
    budgetSpent: project.budgetSpent,
    teamSize: project.teamSize,
    updatedAt: project.updatedAt,
  }))
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<WorkbenchProjectRecord[]>(() =>
    mapProjectsToWorkbench(getMockProjectRecords()),
  );

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects', {
          cache: 'no-store',
        });

        if (!response.ok) {
          return;
        }

        const payload = await response.json();
        if (!payload?.projects || !Array.isArray(payload.projects) || payload.projects.length === 0) {
          return;
        }

        setProjects(mapProjectsToWorkbench(payload.projects as ProjectPlatformRecord[]));
      } catch (error) {
        console.warn('Falling back to mock project data for workbench', error);
      }
    };

    fetchProjects();
  }, []);

  const model = useMemo(
    () => createProjectWorkbenchModel({ surface: 'dashboard', projects }),
    [projects]
  );

  return <ProjectWorkbenchView model={model} />;
}
