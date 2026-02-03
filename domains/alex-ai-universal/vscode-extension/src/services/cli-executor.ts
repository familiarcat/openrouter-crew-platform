/**
 * CLI Executor Service
 *
 * Spawns crew CLI commands and returns results
 * All VSCode extension functionality ultimately goes through this service
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import * as vscode from 'vscode';

const execFileAsync = promisify(execFile);

export interface CLIResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  raw: string;
}

/**
 * CLI Executor - Spawns and manages crew CLI commands
 */
export class CLIExecutor {
  private cliPath: string;
  private outputChannel: vscode.OutputChannel;

  constructor(outputChannel: vscode.OutputChannel) {
    this.outputChannel = outputChannel;
    const config = vscode.workspace.getConfiguration('openrouter-crew');
    this.cliPath = config.get<string>('cliPath', 'crew');
  }

  /**
   * Execute a crew CLI command
   */
  async execute(args: string[]): Promise<CLIResult<any>> {
    try {
      this.outputChannel.appendLine(`$ crew ${args.join(' ')}`);

      const { stdout, stderr } = await execFileAsync(this.cliPath, args, {
        timeout: 30000, // 30 second timeout
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });

      if (stderr && !stderr.includes('(node:')) {
        // Ignore Node warnings
        this.outputChannel.appendLine(`Warning: ${stderr}`);
      }

      // Try to parse JSON output
      try {
        const data = JSON.parse(stdout);
        return { success: true, data, raw: stdout };
      } catch {
        // If not JSON, return raw output
        return { success: true, data: stdout, raw: stdout };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.outputChannel.appendLine(`Error: ${errorMsg}`);

      return {
        success: false,
        error: errorMsg,
        raw: errorMsg,
      };
    }
  }

  /**
   * Get crew roster
   */
  async getCrewRoster(): Promise<CLIResult<any>> {
    return this.execute(['crew', 'roster', '--json']);
  }

  /**
   * Get cost report
   */
  async getCostReport(days: number = 30): Promise<CLIResult<any>> {
    return this.execute(['cost', 'report', '--period', String(days), '--json']);
  }

  /**
   * Consult a crew member
   */
  async consultCrew(
    member: string,
    task: string,
    async_: boolean = false
  ): Promise<CLIResult<any>> {
    const args = ['crew', 'consult', member, task];
    if (async_) args.push('--async');
    args.push('--json');
    return this.execute(args);
  }

  /**
   * Get request status
   */
  async getRequestStatus(requestId: string): Promise<CLIResult<any>> {
    return this.execute(['crew', 'status', requestId, '--json']);
  }

  /**
   * Wait for request completion
   */
  async waitForRequest(requestId: string, timeout: number = 300): Promise<CLIResult<any>> {
    return this.execute(['crew', 'wait', requestId, '--timeout', String(timeout), '--json']);
  }

  /**
   * List projects
   */
  async listProjects(): Promise<CLIResult<any>> {
    return this.execute(['project', 'list', '--json']);
  }

  /**
   * Create feature
   */
  async createFeature(name: string, description?: string, budget?: number): Promise<CLIResult<any>> {
    const args = ['project', 'feature', name];
    if (description) args.push('--description', description);
    if (budget) args.push('--budget', String(budget));
    args.push('--json');
    return this.execute(args);
  }

  /**
   * Optimize costs
   */
  async optimizeCosts(member: string, task: string): Promise<CLIResult<any>> {
    return this.execute(['cost', 'optimize', member, task, '--json']);
  }

  /**
   * Get extension output channel
   */
  getOutputChannel(): vscode.OutputChannel {
    return this.outputChannel;
  }
}
