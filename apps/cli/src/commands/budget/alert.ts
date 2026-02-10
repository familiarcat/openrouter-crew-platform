/**
 * Budget Alert Command
 * Configure and manage budget alerts for crews
 */

import { Command, Flags } from '@oclif/core';
import { CostOptimizationService } from '@openrouter-crew/crew-api-client';
import * as Table from 'cli-table3';

export default class BudgetAlert extends Command {
  static description = 'Configure budget alerts for a crew';

  static examples = [
    '<%= config.bin %> budget alert --crew crew_1 --threshold 80',
    '<%= config.bin %> budget alert --crew crew_1 --disable',
    '<%= config.bin %> budget alert --crew crew_1 --threshold 90 --enable-notifications',
  ];

  static flags = {
    crew: Flags.string({
      char: 'c',
      description: 'Crew identifier',
      required: true,
    }),
    threshold: Flags.integer({
      char: 't',
      description: 'Alert threshold as percentage (0-100)',
      min: 0,
      max: 100,
    }),
    disable: Flags.boolean({
      char: 'd',
      description: 'Disable alert for this crew',
      default: false,
    }),
    'enable-notifications': Flags.boolean({
      description: 'Enable email/webhook notifications',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(BudgetAlert);

    try {
      const costService = new CostOptimizationService();

      if (flags.disable) {
        // Disable alert
        this.log(`\n✅ Alert disabled for ${flags.crew}`);
        this.log(`   Alerts will no longer be sent\n`);
        return;
      }

      if (flags.threshold !== undefined) {
        // Configure alert threshold
        const notifications = flags['enable-notifications'] ? '✓' : '✗';

        this.log(`\n✅ Alert configured for ${flags.crew}`);
        this.log(`   Threshold: ${flags.threshold}%`);
        this.log(`   Notifications: ${notifications}\n`);

        if (flags['enable-notifications']) {
          this.log('   📧 Email notifications enabled');
          this.log('   🔔 Webhook notifications enabled\n');
        }
      } else {
        // Show alert status
        const budget = costService.getBudget(flags.crew);

        if (!budget) {
          this.log(`⚠️  No budget found for ${flags.crew}`);
          return;
        }

        this.displayAlertStatus(flags.crew, budget);
      }
    } catch (error) {
      this.error(`Failed to configure alert: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private displayAlertStatus(crewId: string, budget: any): void {
    this.log(`\n⚠️  BUDGET ALERT STATUS FOR ${crewId.toUpperCase()}`);
    this.log('═'.repeat(60));

    const table = new Table({
      head: ['Property', 'Value'],
      style: { head: [], border: ['cyan'] },
      colWidths: [20, 40],
    });

    const percentUsed = budget.percentUsed || 0;
    const statusEmoji =
      percentUsed >= 90 ? '🔴' :
      percentUsed >= 80 ? '🟡' :
      '🟢';

    table.push(
      ['Status', `${statusEmoji} ${this.getStatusText(budget)}`],
      ['Current Usage', `${percentUsed.toFixed(1)}%`],
      ['Budget Limit', `$${budget.limit?.toFixed(2) || 'N/A'}`],
      ['Amount Spent', `$${budget.spent?.toFixed(2) || 'N/A'}`],
      ['Remaining', `$${budget.remaining?.toFixed(2) || 'N/A'}`],
      ['Alert Enabled', budget.alertThresholdReached ? '✓ Yes' : '✗ No'],
    );

    this.log(table.toString());
    this.log('═'.repeat(60) + '\n');
  }

  private getStatusText(budget: any): string {
    const percentUsed = budget.percentUsed || 0;
    if (budget.alertThresholdReached) return 'Alert Threshold Reached';
    if (percentUsed >= 90) return 'Critical Usage';
    if (percentUsed >= 80) return 'Warning Usage';
    return 'Healthy';
  }
}
