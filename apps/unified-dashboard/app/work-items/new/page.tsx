'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  createWorkItemIntakeModel,
  getDefaultWorkItemIntakeValues,
  WorkItemIntakeOption,
  WorkItemIntakeValues,
} from '@openrouter-crew/shared-ui-components/work-item-intake';
import { WorkItemIntakeView } from '@openrouter-crew/shared-ui-components/work-item-intake/react';

interface ProjectRecord {
  id: string;
  name: string;
  description?: string;
}

interface SprintRecord {
  id: string;
  name: string;
  goal?: string;
  status?: string;
}

function mapProjectOptions(projects: ProjectRecord[]): WorkItemIntakeOption[] {
  return projects.map((project) => ({
    id: project.id,
    label: project.name,
    description: project.description || 'Shared project lane',
  }));
}

function mapSprintOptions(sprints: SprintRecord[]): WorkItemIntakeOption[] {
  return sprints.map((sprint) => ({
    id: sprint.id,
    label: sprint.name,
    description: sprint.goal || sprint.status || 'Shared sprint lane',
  }));
}

export default function NewWorkItemPage() {
  const router = useRouter();
  const [projectOptions, setProjectOptions] = useState<WorkItemIntakeOption[]>([]);
  const [sprintOptionsByProject, setSprintOptionsByProject] = useState<Record<string, WorkItemIntakeOption[]>>({});
  const [values, setValues] = useState<WorkItemIntakeValues>({
    projectId: '',
    sprintId: '',
    title: '',
    description: '',
    workType: 'feature',
    priority: '2',
    storyPoints: '3',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await fetch('/api/projects', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Failed to load projects');
        }

        const payload = await response.json();
        const nextProjectOptions = mapProjectOptions(payload.projects || []);
        setProjectOptions(nextProjectOptions);
        setValues((current) => {
          const defaults = getDefaultWorkItemIntakeValues({
            surface: 'dashboard',
            projectOptions: nextProjectOptions,
            sprintOptionsByProject: {},
          });
          return {
            ...defaults,
            title: current.title,
            description: current.description,
            workType: current.workType,
            priority: current.priority,
            storyPoints: current.storyPoints,
          };
        });
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load projects');
      }
    };

    void loadProjects();
  }, []);

  useEffect(() => {
    if (!values.projectId || sprintOptionsByProject[values.projectId]) {
      return;
    }

    const loadSprints = async () => {
      try {
        const response = await fetch(`/api/sprints?projectId=${encodeURIComponent(values.projectId)}`, {
          cache: 'no-store',
        });
        if (!response.ok) {
          throw new Error('Failed to load sprints');
        }

        const payload = await response.json();
        const nextSprintOptions = mapSprintOptions(payload.data || []);
        setSprintOptionsByProject((current) => ({
          ...current,
          [values.projectId]: nextSprintOptions,
        }));
        setValues((current) => {
          if (current.projectId !== values.projectId) {
            return current;
          }

          return {
            ...current,
            sprintId: current.sprintId || nextSprintOptions[0]?.id || '',
          };
        });
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load sprints');
      }
    };

    void loadSprints();
  }, [sprintOptionsByProject, values.projectId]);

  const model = useMemo(
    () =>
      createWorkItemIntakeModel({
        surface: 'dashboard',
        projectOptions,
        sprintOptionsByProject,
      }),
    [projectOptions, sprintOptionsByProject],
  );

  function updateValue(field: keyof WorkItemIntakeValues, value: string) {
    setValues((current) => {
      const nextValues = {
        ...current,
        [field]: value,
      };

      if (field === 'projectId') {
        nextValues.sprintId = sprintOptionsByProject[value]?.[0]?.id || '';
      }

      return nextValues;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const trimmedTitle = values.title.trim();
    if (!trimmedTitle) {
      setError('Work item title is required.');
      return;
    }

    if (!values.projectId || !values.sprintId) {
      setError('Choose a project and sprint before creating work.');
      return;
    }

    const parsedPriority = Number.parseInt(values.priority, 10);
    const parsedPoints = Number.parseInt(values.storyPoints, 10);
    if (Number.isNaN(parsedPriority) || Number.isNaN(parsedPoints)) {
      setError('Priority and story points must be valid numbers.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/sprints/${values.sprintId}/stories`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          project_id: values.projectId,
          title: trimmedTitle,
          description: values.description,
          story_type: values.workType,
          priority: parsedPriority,
          story_points: parsedPoints,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to create work item');
      }

      router.push(`/projects/${values.projectId}`);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to create work item');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <WorkItemIntakeView
      model={model}
      values={values}
      error={error}
      isSubmitting={isSubmitting}
      backHref="/projects"
      onChange={updateValue}
      onSubmit={handleSubmit}
    />
  );
}
