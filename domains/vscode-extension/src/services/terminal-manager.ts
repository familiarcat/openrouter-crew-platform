import * as vscode from 'vscode';

/**
 * Terminal Manager Service
 * 
 * Safely executes shell commands suggested by the AI.
 * Enforces user confirmation for all commands to prevent accidental execution.
 * Manages terminal instances to keep the workspace clean.
 */
export class TerminalManager implements vscode.Disposable {
  private terminals: Map<string, vscode.Terminal> = new Map();
  private disposables: vscode.Disposable[] = [];

  constructor() {
    // Listen for terminal closures to clean up our map
    this.disposables.push(
      vscode.window.onDidCloseTerminal((closedTerminal) => {
        for (const [name, terminal] of this.terminals.entries()) {
          if (terminal === closedTerminal) {
            this.terminals.delete(name);
            break;
          }
        }
      })
    );
  }

  /**
   * Execute a shell command safely
   * @param command The command string to execute
   * @param reason Context/reason for execution (displayed to user)
   * @param terminalName Name of the terminal to use (default: 'OpenRouter Crew')
   */
  async executeCommand(
    command: string,
    reason?: string,
    terminalName: string = 'OpenRouter Crew'
  ): Promise<boolean> {
    // 1. Safety Check: Always ask for confirmation
    const action = 'Execute';
    const cancel = 'Cancel';
    
    const message = reason 
      ? `OpenRouter Crew suggests executing: ${command}\n\nReason: ${reason}`
      : `OpenRouter Crew suggests executing: ${command}`;

    const selection = await vscode.window.showInformationMessage(
      message,
      { modal: true }, // Modal dialog for safety
      action,
      cancel
    );

    if (selection !== action) {
      return false;
    }

    // 2. Get or create terminal
    const terminal = this.getTerminal(terminalName);

    // 3. Execute
    terminal.show();
    terminal.sendText(command);
    
    return true;
  }

  /**
   * Get an existing terminal or create a new one
   */
  private getTerminal(name: string): vscode.Terminal {
    let terminal = this.terminals.get(name);

    if (!terminal || terminal.exitStatus !== undefined) {
      // Create new terminal
      terminal = vscode.window.createTerminal(name);
      this.terminals.set(name, terminal);
    }

    return terminal;
  }

  /**
   * Create a dedicated terminal for a specific task
   */
  createTaskTerminal(name: string): vscode.Terminal {
    const terminal = vscode.window.createTerminal(name);
    // We don't track task terminals in the main map as they might be ephemeral
    return terminal;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.disposables.forEach(d => d.dispose());
    this.terminals.forEach(t => t.dispose());
    this.terminals.clear();
  }
}