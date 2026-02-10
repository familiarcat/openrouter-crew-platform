/**
 * Budget Status Command
 * Display current budget status for a crew
 */

import { Command, Flags } from '@oclif/core';
import { CostOptimizationService } from '@openrouter-crew/crew-api-client';
import * as Table from 'cli-table3';

export default class BudgetStatus extends Command {
  static description = 'Show budget status for a crew';

  static examples = [
    '<%= config.bin %> budget status --crew crew_1',
    '<%= config.bin %> budget status --crew crew_1 --format json',
  ];

  static flags = {
    crew: Flags.string({
      char: 'c',
      description: 'Crew identifier',
      required: true,
    }),
    format: Flags.string({
      char: 'f',
      description: 'Output format',
      options: ['table', 'json', 'simple'],
      default: 'table',
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(BudgetStatus);

    try {
      const costService = new CostOptimizationService();
      const budget = costService.getBudget(flags.crew);

      if (!budget) {
        this.log(`❌ No budget found for ${flags.crew}`);
        return;
      }

      switch (flags.format) {
        case 'json':
          this.log(JSON.stringify(budget, null, 2));
          break;

        case 'simple':
          this.log(`Crew: ${budget.crewId}`);
          this.log(`Period: ${budget.period}`);
          this.log(`Limit: $${budget.limit.toFixed(2)}`);
          this.log(`Spent: $${budget.spent.toFixed(2)}`);
          this.log(`Remaining: $${budget.remaining.toFixed(2)}`);
          this.log(`Usage: ${budget.percentUsed.toFixed(1)}%`);
          break;

        case 'table':
        default:
          this.displayTable(budget);
      }
    } catch (error) {
      this.error(`Failed to get budget: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private displayTable(budget: any): void {
    const statusBar = this.getStatusBar(budget.percentUsed);
    const statusColor = this.getStatusColor(budget.percentUsed);

    const table = new Table({
      head: ['Property', 'Value'],
      style: { head: [], border: ['cyan'] },
      colWidths: [20, 60],
    });

    table.push(
      ['Crew ID', budget.crewId],
      ['Period', budget.period],
      ['Limit', `$${budget.limit.toFixed(2)}`],
      ['Spent', `$${budget.spent.toFixed(2)}`],
      ['Remaining', `$${budget.remaining.toFixed(2)}`],
      ['Usage', `${budget.percentUsed.toFixed(1)}% ${statusBar}`],
      ['Alert Threshold', budget.alertThresholdReached ? '⚠️  REACHED' : '✅ OK'],
    );

    this.log(table.toString());
  }

  private getStatusBar(percent: number): string {
    const filled = Math.round((percent / 100) * 20);
    const empty = 20 - filled;
    return `[${this.colorize('█', percent)}${' '.repeat(empty)}]`;
  }

  private colorize(char: string, percent: number): string {
    if (percent >= 90) return `\x1b[31m${char.repeat(Math.round((percent / 100) * 20))}\x1b[0m`; // Red
    if (percent >= 80) return `\x1b[33m${char.repeat(Math.round((percent / 100) * 20))}\x1b[0m`; // Yellow
    return `\x1b[32m${char.repeat(Math.round((percent / 100) * 20))}\x1b[0m`; // Green
  }

  private getStatusColor(percent: number): string {
    if (percent >= 90) return '🔴';
    if (percent >= 80) return '🟡';
    return '🟢';
  }
}
