export type WorkItemIntakeSurface = 'dashboard' | 'vscode';

export interface WorkItemIntakeOption {
  id: string;
  label: string;
  description?: string;
}

export interface WorkItemIntakeModel {
  surface: WorkItemIntakeSurface;
  title: string;
  subtitle: string;
  submitLabel: string;
  cancelLabel: string;
  helperText: string;
  projectOptions: WorkItemIntakeOption[];
  sprintOptionsByProject: Record<string, WorkItemIntakeOption[]>;
  workTypeOptions: WorkItemIntakeOption[];
}

export interface WorkItemIntakeValues {
  projectId: string;
  sprintId: string;
  title: string;
  description: string;
  workType: string;
  priority: string;
  storyPoints: string;
}
