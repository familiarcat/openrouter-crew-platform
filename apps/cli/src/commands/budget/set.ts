/**
 * Budget Set Command
 * Configure budget limits for a crew
 */

import { Command, Flags } from '@oclif/core';
import { CostOptimizationService } from '@openrouter-crew/crew-api-client';

export default class BudgetSet extends Command {
  static description = 'Set budget limit for a crew';

  static examples = [
    '<%= config.bin %> budget set --crew crew_1 --amount 100',
    '<%= config.bin %> budget set --crew crew_1 --amount 500 --period monthly',
  ];

  static flags = {
    crew: Flags.string({
      char: 'c',
      description: 'Crew identifier',
      required: true,
    }),
    amount: Flags.integer({
      char: 'a',
      description: 'Budget limit in dollars',
      required: true,
    }),
    period: Flags.string({
      char: 'p',
      description: 'Billing period',
      options: ['daily', 'weekly', 'monthly'],
      default: 'monthly',
    }),
    force: Flags.boolean({
      char: 'f',
      description: 'Force override existing budget',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(BudgetSet);

    try {
      // Initialize service
      const costService = new CostOptimizationService();

      // Check if budget already exists
      const existingBudget = costService.getBudget(flags.crew);
      if (existingBudget && !flags.force) {
        this.log(`⚠️  Budget already exists for ${flags.crew}`);
        this.log(`   Current: $${existingBudget.spent.toFixed(2)} / $${existingBudget.limit.toFixed(2)} (${existingBudget.period})`);
        this.log('   Use --force to override');
        return;
      }

      // Set the budget
      costService.setBudget(flags.crew, flags.amount, flags.period as 'daily' | 'weekly' | 'monthly');

      // Confirm
      this.log(`✅ Budget set for ${flags.crew}`);
      this.log(`   Amount: $${flags.amount}`);
      this.log(`   Period: ${flags.period}`);
      this.log(`   Alert threshold: 80%`);

      if (existingBudget && flags.force) {
        this.log(`   ℹ️  Previous budget of $${existingBudget.limit} has been overridden`);
      }
    } catch (error) {
      this.error(`Failed to set budget: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
