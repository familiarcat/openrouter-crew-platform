'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { createProjectWorkbenchModel, WorkbenchProjectRecord } from '@openrouter-crew/shared-ui-components/project-workbench';
import { ProjectWorkbenchView } from '@openrouter-crew/shared-ui-components/project-workbench/react';
import { DOMAINS, MOCK_PROJECTS, Project } from '@/lib/unified-mock-data';

function mapMockProjects(projects: Project[]): WorkbenchProjectRecord[] {
  return projects.map((project) => ({
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status,
    domain: DOMAINS.find((domain) => domain.id === project.domainId)?.name || project.domainId,
    budgetAllocated: project.budget.allocated,
    budgetSpent: project.budget.spent,
    teamSize: project.team.size,
    updatedAt: project.updatedAt,
  }));
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<WorkbenchProjectRecord[]>(() => mapMockProjects(MOCK_PROJECTS));

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        if (!sbUrl || !sbKey) {
          return;
        }

        const supabase = createClient(sbUrl, sbKey);
        const { data, error } = await supabase.from('projects').select('*').order('updated_at', { ascending: false });
        if (error || !data || data.length === 0) {
          return;
        }

        const mapped = data.map((project: any) => ({
          id: project.id,
          name: project.name,
          description: project.description || '',
          status: project.status || 'draft',
          domain: project.metadata?.domainId || project.type || 'Unassigned domain',
          budgetAllocated: project.metadata?.budget?.allocated ?? project.budget_usd ?? 0,
          budgetSpent: project.metadata?.budget?.spent ?? project.total_cost_usd ?? 0,
          teamSize: project.metadata?.team?.size ?? 0,
          updatedAt: project.updated_at,
        }));

        setProjects(mapped);
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
