import { Command } from 'commander';
import chalk from 'chalk';
import { historyService } from '../services/history-service';
import { formatTable } from '../lib/formatters';

export const historyCommand = new Command('history')
  .description('View historical logs for platform activities');

historyCommand
  .command('optimizations')
  .description('Show a log of applied and reverted optimizations')
  .option('--limit <number>', 'Number of entries to show', '20')
  .option('--action <type>', 'Filter by action type (apply or revert)')
  .action(async (options) => {
    console.log(chalk.blue('\n📜 Viewing optimization history...'));
    try {
      const limit = parseInt(options.limit, 10);
      let history = await historyService.getHistory(limit * 5); // Fetch more to filter

      if (options.action && ['apply', 'revert'].includes(options.action)) {
        history = history.filter(entry => entry.action === options.action);
      }
      history = history.slice(0, limit);

      if (history.length === 0) {
        console.log(chalk.yellow('\nNo optimization history found.'));
        return;
      }

      const headers = ['Timestamp', 'Action', 'Type', 'Details', 'Suggestion ID'];
      const rows = history.map(entry => {
        const actionColor = entry.action === 'apply' ? chalk.green : chalk.yellow;
        return [
          new Date(entry.timestamp).toLocaleString(),
          actionColor(entry.action.toUpperCase()),
          entry.suggestionType,
          entry.details,
          chalk.dim(entry.suggestionId)
        ];
      });

      console.log('');
      formatTable(headers, rows);
      console.log('');

    } catch (error: any) {
      console.error(chalk.red(`❌ Error fetching history: ${error.message}`));
    }
  });