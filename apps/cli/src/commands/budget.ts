import { Command } from 'commander';
import chalk from 'chalk';
import { CostOptimizationService } from '@openrouter-crew/shared-cost-tracking';
import { formatCost } from '../lib/formatters';

// In a real app, this would be initialized with a proper config,
// likely connecting to a backend to persist state. For now, it's in-memory.
const costService = new CostOptimizationService();

// Pre-seed some data for demonstration
costService.setBudget('crew-1', 500, 'monthly');
costService.updateBudget('crew-1', 125.50);

export const budgetCommand = new Command('budget')
  .description('View and set project/crew budgets');

budgetCommand
  .command('view <crewId>')
  .description('View the budget for a specific crew')
  .action(async (crewId) => {
    console.log(chalk.blue(`\n🔎 Viewing budget for crew: ${chalk.bold(crewId)}`));

    try {
      const budget = costService.getBudget(crewId);

      if (!budget) {
        console.log(chalk.yellow(`\n⚠️ No budget found for crew '${crewId}'.`));
        console.log(chalk.gray(`   Set one using: crew budget set ${crewId} <amount>\n`));
        return;
      }

      const utilization = budget.percentUsed * 100;
      let utilizationColor = chalk.green;
      if (utilization > 75) utilizationColor = chalk.red;
      else if (utilization > 50) utilizationColor = chalk.yellow;

      console.log(chalk.cyan('\n💼 Budget Status\n'));
      console.log(`  ${chalk.bold('Crew ID:')}      ${budget.crewId}`);
      console.log(`  ${chalk.bold('Period:')}       ${budget.period}`);
      console.log(`  ${chalk.bold('Limit:')}        ${formatCost(budget.limit)}`);
      console.log(`  ${chalk.bold('Spent:')}        ${formatCost(budget.spent)}`);
      console.log(`  ${chalk.bold('Remaining:')}    ${formatCost(budget.remaining)}`);
      console.log(`  ${chalk.bold('Utilization:')}  ${utilizationColor(`${utilization.toFixed(1)}%`)}`);
      console.log('');

    } catch (error: any) {
      console.error(chalk.red(`❌ Error viewing budget: ${error.message}`));
      process.exit(1);
    }
  });

budgetCommand
  .command('set <crewId> <amount>')
  .description('Set the budget for a specific crew')
  .option('-p, --period <period>', 'Budget period (daily, weekly, monthly)', 'monthly')
  .action(async (crewId, amountStr, options) => {
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount < 0) {
      console.error(chalk.red('❌ Invalid budget amount. Must be a positive number.'));
      process.exit(1);
    }

    const period = options.period;
    if (!['daily', 'weekly', 'monthly'].includes(period)) {
      console.error(chalk.red('❌ Invalid period. Must be one of: daily, weekly, monthly.'));
      process.exit(1);
    }

    try {
      costService.setBudget(crewId, amount, period as 'daily' | 'weekly' | 'monthly');
      console.log(chalk.green(`\n✅ Budget for crew '${crewId}' set to ${formatCost(amount)} per ${period}.\n`));
    } catch (error: any) {
      console.error(chalk.red(`❌ Error setting budget: ${error.message}`));
      process.exit(1);
    }
  });