/**
 * Command Registration
 *
 * Register all VSCode commands that interact with the CLI
 */

import * as vscode from 'vscode';
import { CLIExecutor } from '../services/cli-executor';
import { CrewAPIService } from '../services/crew-api-service';
import { CrewTreeViewProvider } from '../providers/crew-tree-provider';
import { CostTreeViewProvider } from '../providers/cost-tree-provider';
import { ProjectTreeViewProvider } from '../providers/project-tree-provider';

export function registerCommands(
  context: vscode.ExtensionContext,
  cliExecutor: CLIExecutor,
  crewProvider: CrewTreeViewProvider,
  costProvider: CostTreeViewProvider,
  projectProvider: ProjectTreeViewProvider
): void {
  // Initialize CrewAPIService
  const outputChannel = vscode.window.createOutputChannel('Crew API');
  const crewAPIService = new CrewAPIService(outputChannel);

  // Crew Commands
  context.subscriptions.push(
    vscode.commands.registerCommand('openrouter-crew.crew.roster', async () => {
      const result = await cliExecutor.getCrewRoster();
      if (result.success) {
        vscode.window.showInformationMessage('Crew roster loaded');
        crewProvider.refresh();
      } else {
        vscode.window.showErrorMessage(`Failed to load crew roster: ${result.error}`);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('openrouter-crew.crew.consult', async (member?: string) => {
      if (!member) {
        member = await vscode.window.showInputBox({
          placeHolder: 'Enter crew member name (e.g., picard, data, riker)',
          title: 'Consult Crew Member',
        });
        if (!member) return;
      }

      const task = await vscode.window.showInputBox({
        placeHolder: 'Describe your task or question',
        title: `Consult ${member}`,
      });

      if (!task) return;

      const result = await cliExecutor.consultCrew(member, task);
      if (result.success) {
        vscode.window.showInformationMessage(`Response from ${member}: ${result.data}`);
      } else {
        vscode.window.showErrorMessage(`Failed to consult ${member}: ${result.error}`);
      }
    })
  );

  // Memory Commands (via CrewAPIClient)
  context.subscriptions.push(
    vscode.commands.registerCommand('openrouter-crew.memory.create', async () => {
      await crewAPIService.createMemory();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('openrouter-crew.memory.search', async () => {
      await crewAPIService.searchMemories();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('openrouter-crew.memory.compliance', async () => {
      await crewAPIService.getComplianceStatus();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('openrouter-crew.memory.forecast', async () => {
      await crewAPIService.getExpirationForecast();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('openrouter-crew.crew.execute', async () => {
      await crewAPIService.executeCrew();
    })
  );

  // Project Commands
  context.subscriptions.push(
    vscode.commands.registerCommand('openrouter-crew.project.create', async () => {
      const name = await vscode.window.showInputBox({
        placeHolder: 'Project name',
        title: 'Create Project',
      });

      if (!name) return;

      const description = await vscode.window.showInputBox({
        placeHolder: 'Project description (optional)',
        title: 'Project Description',
      });

      vscode.window.showInformationMessage(`Creating project: ${name}`);
      projectProvider.refresh();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('openrouter-crew.project.feature', async () => {
      const name = await vscode.window.showInputBox({
        placeHolder: 'Feature name',
        title: 'Create Feature',
      });

      if (!name) return;

      const description = await vscode.window.showInputBox({
        placeHolder: 'Feature description (optional)',
      });

      const budgetStr = await vscode.window.showInputBox({
        placeHolder: 'Budget in USD (optional)',
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
    })
  );

  // Cost Commands
  context.subscriptions.push(
    vscode.commands.registerCommand('openrouter-crew.cost.report', async () => {
      const result = await cliExecutor.getCostReport(30);
      if (result.success) {
        const text = JSON.stringify(result.data, null, 2);
        const panel = vscode.window.createWebviewPanel(
          'costReport',
          'Cost Report',
          vscode.ViewColumn.One,
          {}
        );
        panel.webview.html = `
          <html>
            <head>
              <style>
                body { font-family: monospace; padding: 20px; }
                pre { background: #f0f0f0; padding: 10px; border-radius: 5px; }
              </style>
            </head>
            <body>
              <h1>Cost Report</h1>
              <pre>${text}</pre>
            </body>
          </html>
        `;
        costProvider.refresh();
      } else {
        vscode.window.showErrorMessage(`Failed to load cost report: ${result.error}`);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('openrouter-crew.cost.optimize', async () => {
      const member = await vscode.window.showInputBox({
        placeHolder: 'Crew member name',
        title: 'Optimize Costs',
      });

      if (!member) return;

      const task = await vscode.window.showInputBox({
        placeHolder: 'Task description',
      });

      if (!task) return;

      const result = await cliExecutor.optimizeCosts(member, task);
      if (result.success) {
        vscode.window.showInformationMessage('Cost optimization analysis complete');
      } else {
        vscode.window.showErrorMessage(`Failed to optimize costs: ${result.error}`);
      }
    })
  );
}
