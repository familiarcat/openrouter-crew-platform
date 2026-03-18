import {
  WorkItemIntakeModel,
  WorkItemIntakeOption,
  WorkItemIntakeSurface,
  WorkItemIntakeValues,
} from './types';

interface CreateWorkItemIntakeModelOptions {
  surface: WorkItemIntakeSurface;
  projectOptions: WorkItemIntakeOption[];
  sprintOptionsByProject: Record<string, WorkItemIntakeOption[]>;
}

export function getDefaultWorkItemIntakeValues(
  options: CreateWorkItemIntakeModelOptions,
): WorkItemIntakeValues {
  const defaultProjectId = options.projectOptions[0]?.id || '';
  const defaultSprintId = options.sprintOptionsByProject[defaultProjectId]?.[0]?.id || '';

  return {
    projectId: defaultProjectId,
    sprintId: defaultSprintId,
    title: '',
    description: '',
    workType: 'feature',
    priority: '2',
    storyPoints: '3',
  };
}

export function createWorkItemIntakeModel(
  options: CreateWorkItemIntakeModelOptions,
): WorkItemIntakeModel {
  const { surface, projectOptions, sprintOptionsByProject } = options;

  return {
    surface,
    title: 'Feature Intake',
    subtitle:
      surface === 'dashboard'
        ? 'Break work into shared sprint-ready items from the same planning lane the CLI and VS Code use.'
        : 'Capture sprint-ready feature work from the editor using the same intake structure as the dashboard.',
    submitLabel: 'Create Work Item',
    cancelLabel: 'Cancel',
    helperText:
      'Feature work created here lands in the shared sprint story system so dashboard, CLI, and VS Code stay aligned.',
    projectOptions,
    sprintOptionsByProject,
    workTypeOptions: [
      {
        id: 'feature',
        label: 'Feature',
        description: 'Customer-facing or user-visible capability work.',
      },
      {
        id: 'technical_task',
        label: 'Technical Task',
        description: 'Platform, infra, or engineering delivery work.',
      },
      {
        id: 'bug',
        label: 'Bug',
        description: 'Repair and stabilization work that belongs in sprint flow.',
      },
      {
        id: 'spike',
        label: 'Spike',
        description: 'Time-boxed discovery or research before implementation.',
      },
    ],
  };
}
