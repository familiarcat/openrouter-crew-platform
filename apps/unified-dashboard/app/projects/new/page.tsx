'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  createProjectIntakeModel,
  DEFAULT_PROJECT_INTAKE_VALUES,
  ProjectIntakeValues,
} from '@openrouter-crew/shared-ui-components/project-intake';
import { ProjectIntakeView } from '@openrouter-crew/shared-ui-components/project-intake/react';

export default function NewProjectPage() {
  const router = useRouter();
  const [values, setValues] = useState<ProjectIntakeValues>(DEFAULT_PROJECT_INTAKE_VALUES);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const model = createProjectIntakeModel('dashboard');

  function updateValue(field: keyof ProjectIntakeValues, value: string) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const trimmedName = values.name.trim();
    if (!trimmedName) {
      setError('Project name is required.');
      return;
    }

    const parsedBudget = values.budgetUsd.trim() ? Number.parseFloat(values.budgetUsd) : undefined;
    if (typeof parsedBudget === 'number' && (!Number.isFinite(parsedBudget) || parsedBudget < 0)) {
      setError('Budget must be a positive number.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          name: trimmedName,
          description: values.description,
          domainId: values.domainId,
          template: values.template,
          budgetUsd: parsedBudget,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to create project');
      }

      router.push(`/projects/${payload.project.id}`);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ProjectIntakeView
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
