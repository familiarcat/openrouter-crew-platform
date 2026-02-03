import { Command } from 'commander';
import chalk from 'chalk';
import { MCPClient } from '../lib/mcp-client';
import { CostOptimizer } from '../lib/cost-optimizer';
import { formatTable, formatCost } from '../lib/formatters';

const cost = new Command('cost')
  .description('Manage costs and optimize expenses');

const mcpClient = new MCPClient();
const optimizer = new CostOptimizer();

/**
 * cost report - Show cost summary
 */
cost
  .command('report')
  .description('Show cost summary and trends')
  .option('--period <days>', 'report period in days (default: 30)', '30')
  .option('--json', 'output as JSON')
  .action(async (options) => {
    try {
      const period = parseInt(options.period);
      const report = await mcpClient.getCostReport(period);

      if (options.json) {
        console.log(JSON.stringify(report, null, 2));
        return;
      }

      console.log(chalk.cyan(`\n💰 Cost Report (Last ${period} days)\n`));

      console.log(chalk.bold('Summary'));
      console.log(`  Total: ${formatCost(report.summary.total)}`);
      console.log(`  Average/day: ${formatCost(report.summary.averagePerDay)}`);
      console.log(`  Projected/month: ${formatCost(report.summary.projectedPerMonth)}`);
      console.log('');

      if (report.byMember.length > 0) {
        console.log(chalk.bold('By Crew Member'));
        const headers = ['Member', 'Calls', 'Cost', '%'];
        const rows = report.byMember.map((m: any) => [
          m.member,
          String(m.count),
          formatCost(m.cost),
          `${((m.cost / report.summary.total) * 100).toFixed(1)}%`,
        ]);
        formatTable(headers, rows);
        console.log('');
      }

      if (report.byModel.length > 0) {
        console.log(chalk.bold('By Model'));
        const headers = ['Model', 'Calls', 'Cost', '%'];
        const rows = report.byModel.map((m: any) => [
          m.model,
          String(m.count),
          formatCost(m.cost),
          `${((m.cost / report.summary.total) * 100).toFixed(1)}%`,
        ]);
        formatTable(headers, rows);
        console.log('');
      }
    } catch (error) {
      console.error(chalk.red('✗ Failed to fetch cost report:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

/**
 * cost optimize <member> <task> - Check optimization options
 */
cost
  .command('optimize <member> <task>')
  .description('Check cost optimization options for a task')
  .option('--json', 'output as JSON')
  .action(async (member, task, options) => {
    try {
      console.log(chalk.cyan(`\n🔍 Analyzing cost optimization for ${chalk.bold(member)}...\n`));

      const optimization = await optimizer.analyze(member, task);

      if (options.json) {
        console.log(JSON.stringify(optimization, null, 2));
        return;
      }

      console.log(chalk.bold('Current Option'));
      console.log(`  Member: ${optimization.current.member}`);
      console.log(`  Model: ${optimization.current.model}`);
      console.log(`  Estimated cost: ${formatCost(optimization.current.estimatedCost)}`);
      console.log('');

      if (optimization.alternatives && optimization.alternatives.length > 0) {
        console.log(chalk.bold('Alternatives'));
        const headers = ['Member', 'Model', 'Est. Cost', 'Savings', 'Recommended'];
        const rows = optimization.alternatives.map((alt: any) => {
          const savings = optimization.current.estimatedCost - alt.estimatedCost;
          const savingsPercent = ((savings / optimization.current.estimatedCost) * 100).toFixed(1);
          return [
            alt.member,
            alt.model,
            formatCost(alt.estimatedCost),
            `-${formatCost(savings)} (${savingsPercent}%)`,
            alt.recommended ? chalk.green('✓') : '',
          ];
        });
        formatTable(headers, rows);
        console.log('');
      }

      if (!optimization.withinBudget) {
        console.log(chalk.yellow('⚠️ Warning: Task exceeds budget'));
        console.log(`${chalk.dim('Budget:')} ${formatCost(optimization.budget)}`);
        console.log(`${chalk.dim('Required:')} ${formatCost(optimization.current.estimatedCost)}`);
        console.log('');
      }
    } catch (error) {
      console.error(chalk.red('✗ Failed to analyze optimization:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

/**
 * cost budget - Manage budgets
 */
cost
  .command('budget')
  .description('Manage project budgets')
  .action(() => {
    console.log(chalk.cyan('\n💼 Budget Management\n'));
    console.log('Subcommands:');
    console.log('  crew budget set <project> <amount>     - Set project budget');
    console.log('  crew budget view <project>            - View project budget');
    console.log('  crew budget alert <project> <percent> - Set budget alert\n');
  });

/**
 * cost track - Track costs in real-time
 */
cost
  .command('track')
  .description('Track costs in real-time')
  .option('--interval <seconds>', 'refresh interval in seconds (default: 5)', '5')
  .action(async (options) => {
    try {
      const interval = parseInt(options.interval) * 1000;

      console.log(chalk.cyan('\n📊 Real-time Cost Tracking\n'));
      console.log(chalk.gray('Press Ctrl+C to stop\n'));

      const refreshMetrics = async () => {
        const metrics = await mcpClient.getCostMetrics();

        // Clear screen and redraw
        console.clear();
        console.log(chalk.cyan('📊 Real-time Cost Tracking\n'));

        console.log(chalk.bold('Current Rate'));
        console.log(`  Per minute: ${formatCost(metrics.perMinute)}`);
        console.log(`  Per hour: ${formatCost(metrics.perHour)}`);
        console.log('');

        console.log(chalk.bold('Today'));
        console.log(`  Spent: ${formatCost(metrics.today.spent)}`);
        console.log(`  Budget: ${formatCost(metrics.today.budget)}`);
        console.log(`  Remaining: ${formatCost(metrics.today.remaining)}`);
        console.log('');

        console.log(chalk.gray('Press Ctrl+C to stop'));
      };

      await refreshMetrics();

      setInterval(refreshMetrics, interval);
    } catch (error) {
      console.error(chalk.red('✗ Failed to track costs:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

export default cost;
