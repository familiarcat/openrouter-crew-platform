export type ProjectIntakeSurface = 'dashboard' | 'vscode';

export interface ProjectIntakeOption {
  id: string;
  label: string;
  description: string;
}

export interface ProjectIntakeModel {
  surface: ProjectIntakeSurface;
  title: string;
  subtitle: string;
  submitLabel: string;
  cancelLabel: string;
  helperText: string;
  domainOptions: ProjectIntakeOption[];
  templateOptions: ProjectIntakeOption[];
}

export interface ProjectIntakeValues {
  name: string;
  description: string;
  domainId: string;
  template: string;
  budgetUsd: string;
}
