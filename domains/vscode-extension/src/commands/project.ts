import * as vscode from 'vscode';
import { CLIExecutor } from '../services/cli-executor.js';

export async function createProjectCommand(cliExecutor: CLIExecutor): Promise<void> {
  const name = await vscode.window.showInputBox({
    placeHolder: 'Project name',
    title: 'Create Project',
    validateInput: (value) => {
      if (!value?.trim()) return 'Project name is required';
      return null;
    }
  });

  if (!name) return;

  const description = await vscode.window.showInputBox({
    placeHolder: 'Project description (optional)',
    title: 'Project Description',
  });

  const domain = await vscode.window.showQuickPick(
    [
      {
        label: 'Product Factory',
        description: 'Shared product planning and delivery lane',
        value: 'product-factory',
      },
      {
        label: 'DJ Booking',
        description: 'Events, venues, and artist coordination',
        value: 'dj-booking',
      },
      {
        label: 'Alex-AI Universal',
        description: 'CLI, VS Code, and platform engineering',
        value: 'alex-ai-universal',
      },
    ],
    {
      title: 'Project Domain',
      placeHolder: 'Choose the project domain',
    }
  );

  if (!domain) return;

  const budgetStr = await vscode.window.showInputBox({
    placeHolder: 'Budget in USD (optional)',
    title: 'Project Budget',
    validateInput: (value) => {
      if (!value) return null;
      if (isNaN(parseFloat(value))) return 'Must be a number';
      return null;
    },
  });

  const result = await cliExecutor.createProject(name.trim(), {
    description,
    domainId: domain.value,
    budget: budgetStr ? parseFloat(budgetStr) : undefined,
  });

  if (result.success) {
    vscode.window.showInformationMessage(`Project created: ${name}`);
    await vscode.commands.executeCommand('openrouter-crew.project-view.refresh');
    return;
  }

  vscode.window.showErrorMessage(`Failed to create project: ${result.error}`);
}

export async function createFeatureCommand(cliExecutor: CLIExecutor): Promise<void> {
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
    vscode.commands.executeCommand('openrouter-crew.project-view.refresh');
  } else {
    vscode.window.showErrorMessage(`Failed to create feature: ${result.error}`);
  }
}
