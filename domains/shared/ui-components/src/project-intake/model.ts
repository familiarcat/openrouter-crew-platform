import { ProjectIntakeModel, ProjectIntakeSurface, ProjectIntakeValues } from './types';

export const DEFAULT_PROJECT_INTAKE_VALUES: ProjectIntakeValues = {
  name: '',
  description: '',
  domainId: 'product-factory',
  template: 'standard',
  budgetUsd: '',
};

export function createProjectIntakeModel(surface: ProjectIntakeSurface): ProjectIntakeModel {
  return {
    surface,
    title: 'Project Intake',
    subtitle:
      surface === 'dashboard'
        ? 'Start a new project in the same operating system lane used by the CLI and the VS Code workbench.'
        : 'Use the same project intake lane you see in the dashboard, without leaving the editor.',
    submitLabel: 'Create Project',
    cancelLabel: 'Cancel',
    helperText:
      'Projects created here flow through the shared platform command path so dashboard, CLI, and VS Code stay aligned.',
    domainOptions: [
      {
        id: 'product-factory',
        label: 'Product Factory',
        description: 'Shared product planning, execution, and delivery work.',
      },
      {
        id: 'dj-booking',
        label: 'DJ Booking',
        description: 'Events, venues, artists, and operational coordination.',
      },
      {
        id: 'alex-ai-universal',
        label: 'Alex-AI Universal',
        description: 'Platform engineering, CLI workflows, and developer tools.',
      },
    ],
    templateOptions: [
      {
        id: 'standard',
        label: 'Standard Crew',
        description: 'Balanced setup for scoped product work.',
      },
      {
        id: 'research',
        label: 'Research & Analysis',
        description: 'Discovery-heavy work with more analysis upfront.',
      },
      {
        id: 'creative',
        label: 'Creative Studio',
        description: 'Creative pipeline and content-oriented projects.',
      },
      {
        id: 'dev',
        label: 'Development Team',
        description: 'Build-focused delivery with tighter implementation loops.',
      },
    ],
  };
}
