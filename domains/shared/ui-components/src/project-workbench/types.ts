export type WorkbenchSurface = 'dashboard' | 'vscode';

export interface WorkbenchProjectRecord {
  id: string;
  name: string;
  description?: string;
  status: string;
  domain?: string;
  budgetAllocated?: number;
  budgetSpent?: number;
  teamSize?: number;
  updatedAt?: string;
}

export interface WorkbenchAction {
  id: string;
  label: string;
  description: string;
  kind: 'primary' | 'secondary' | 'ghost';
  href?: string;
  commandId?: string;
}

export interface WorkbenchMetric {
  id: string;
  label: string;
  value: string;
  helper: string;
}

export interface WorkbenchStageCard {
  id: string;
  title: string;
  description: string;
  action: WorkbenchAction;
}

export interface WorkbenchStage {
  id: string;
  title: string;
  description: string;
  cards: WorkbenchStageCard[];
}

export interface WorkbenchProjectCard {
  id: string;
  name: string;
  description: string;
  status: string;
  domain: string;
  updatedLabel: string;
  budgetLabel: string;
  teamLabel: string;
  utilizationPercent: number;
}

export interface ProjectWorkbenchModel {
  surface: WorkbenchSurface;
  title: string;
  subtitle: string;
  heroActions: WorkbenchAction[];
  metrics: WorkbenchMetric[];
  stages: WorkbenchStage[];
  projects: WorkbenchProjectCard[];
}
