/**
 * OpenRouter Crew Platform VSCode Extension
 *
 * The user-facing interface for the crew platform, integrated into VSCode.
 * This extension provides:
 * - Real-time cost tracking in status bar
 * - Crew status and management in sidebar
 * - Command palette integration for all crew commands
 * - Project management UI
 * - Cost analysis and optimization
 */

import * as vscode from 'vscode';
import { CLIExecutor } from './services/cli-executor';
import { CostMeterStatusBar } from './views/cost-meter-status-bar';
import { CrewTreeViewProvider } from './providers/crew-tree-provider';
import { CostTreeViewProvider } from './providers/cost-tree-provider';
import { ProjectTreeViewProvider } from './providers/project-tree-provider';
import { registerCommands } from './commands';

let extensionContext: vscode.ExtensionContext;
let cliExecutor: CLIExecutor;
let costMeter: CostMeterStatusBar;

/**
 * Extension activation
 */
export async function activate(context: vscode.ExtensionContext) {
  extensionContext = context;
  const outputChannel = vscode.window.createOutputChannel('Crew Platform');

  try {
    // Initialize CLI executor
    cliExecutor = new CLIExecutor(outputChannel);

    // Initialize status bar cost meter
    costMeter = new CostMeterStatusBar(cliExecutor);
    context.subscriptions.push(costMeter.statusBarItem);

    // Register tree view providers
    const crewProvider = new CrewTreeViewProvider(cliExecutor);
    vscode.window.registerTreeDataProvider('openrouter-crew.crew-view', crewProvider);
    context.subscriptions.push(crewProvider);

    const costProvider = new CostTreeViewProvider(cliExecutor);
    vscode.window.registerTreeDataProvider('openrouter-crew.cost-view', costProvider);
    context.subscriptions.push(costProvider);

    const projectProvider = new ProjectTreeViewProvider(cliExecutor);
    vscode.window.registerTreeDataProvider('openrouter-crew.project-view', projectProvider);
    context.subscriptions.push(projectProvider);

    // Register commands
    registerCommands(context, cliExecutor, crewProvider, costProvider, projectProvider);

    // Start auto-refresh
    startAutoRefresh(crewProvider, costProvider);

    outputChannel.appendLine('✓ OpenRouter Crew Platform extension activated');
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    outputChannel.appendLine(`✗ Failed to activate extension: ${errorMsg}`);
    vscode.window.showErrorMessage(
      `Failed to activate Crew Platform: ${errorMsg}`
    );
  }
}

/**
 * Extension deactivation
 */
export function deactivate() {
  // Cleanup resources if needed
}

/**
 * Start auto-refresh of UI elements
 */
function startAutoRefresh(
  crewProvider: CrewTreeViewProvider,
  costProvider: CostTreeViewProvider
) {
  const config = vscode.workspace.getConfiguration('openrouter-crew');
  const refreshInterval = config.get<number>('refreshInterval', 5000);

  setInterval(() => {
    crewProvider.refresh();
    costProvider.refresh();
    costMeter.update();
  }, refreshInterval);
}

/**
 * Get the CLI executor instance
 */
export function getCLIExecutor(): CLIExecutor {
  return cliExecutor;
}

/**
 * Get extension context
 */
export function getExtensionContext(): vscode.ExtensionContext {
  return extensionContext;
}
