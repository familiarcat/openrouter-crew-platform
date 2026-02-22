import * as vscode from 'vscode';
import { CLIExecutor } from '../services/cli-executor';
import { ProjectTreeViewProvider } from '../providers/project-tree-provider';

export async function createProjectCommand(cliExecutor: CLIExecutor, projectProvider: ProjectTreeViewProvider): Promise<void> {
  const name = await vscode.window.showInputBox({
    placeHolder: 'Project name',
    title: 'Create Project',
    validateInput: (value) => {
      if (!value) return 'Project name is required';
      if (!/^[a-z0-9-]+$/.test(value)) return 'Project name must be lowercase alphanumeric with hyphens';
      return null;
    }
  });

  if (!name) return;

  const description = await vscode.window.showInputBox({
    placeHolder: 'Project description (optional)',
    title: 'Project Description',
  });

  // In a real implementation, this would call cliExecutor.createProject(name, description)
  // For now, we'll simulate it since CLIExecutor doesn't have createProject yet
  vscode.window.showInformationMessage(`Creating project: ${name}`);
  
  // Refresh the project view
  projectProvider.refresh();
}

export async function createFeatureCommand(cliExecutor: CLIExecutor, projectProvider: ProjectTreeViewProvider): Promise<void> {
  const name = await vscode.window.showInputBox({
    placeHolder: 'Feature name',
    title: 'Create Feature',
    validateInput: (value) => {
      if (!value) return 'Feature name is required';
      return null;
    }
  });

  if (!name) return;

  const description = await vscode.window.showInputBox({
    placeHolder: 'Feature description (optional)',
    title: 'Feature Description',
  });

  const budgetStr = await vscode.window.showInputBox({
    placeHolder: 'Budget in USD (optional)',
    title: 'Feature Budget',
    validateInput: (value) => {
      if (!value) return null;
      if (isNaN(parseFloat(value))) return 'Must be a number';
      return null;
    },
  });

  const result = await cliExecutor.createFeature(
    name,
    description,
    budgetStr ? parseFloat(budgetStr) : undefined
  );

  if (result.success) {
    vscode.window.showInformationMessage(`Feature created: ${name}`);
    projectProvider.refresh();
  } else {
    vscode.window.showErrorMessage(`Failed to create feature: ${result.error}`);
  }
}