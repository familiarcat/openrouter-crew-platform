import { Command } from 'commander';
import chalk from 'chalk';
import { costOptimizer, OptimizationSuggestion } from '@openrouter-crew/shared-cost-tracking';
import { UsageTracker } from '@openrouter-crew/shared-cost-tracking';
import { LLMUsageEvent } from '@openrouter-crew/shared-schemas';
import { configService } from './config-service.js';
import { historyService } from './history-service.js';

// Mock tracker for now, in a real scenario this would connect to Supabase
// or fetch from an API endpoint
const tracker = new UsageTracker({
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || ''
});

export const optimizeCommand = new Command('optimize')
  .description('Analyze usage logs and apply cost optimizations');

optimizeCommand
  .command('analyze')
  .description('Analyze usage logs for optimization opportunities')
  .option('-p, --project <projectId>', 'Filter by project ID')
  .option('-d, --days <days>', 'Number of days to analyze', '30')
  .option('--since <date>', 'Start date for analysis (YYYY-MM-DD)')
  .action(async (options) => {
    console.log(chalk.blue('\n🔍 Analyzing usage patterns...'));

    try {
      // Fetch recent events from the database
      let events = await tracker.fetchEvents(1000);

      if (options.project) {
        events = events.filter((e: LLMUsageEvent) => e.project_id === options.project);
      }

      // Filter by date if needed (assuming events have timestamps)
      if (options.since) {
        const cutoff = new Date(options.since);
        if (isNaN(cutoff.getTime())) {
          throw new Error('Invalid date format for --since. Please use YYYY-MM-DD.');
        }
        events = events.filter((e: LLMUsageEvent) => new Date(e.created_at) >= cutoff);
      } else if (options.days) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - parseInt(options.days));
        events = events.filter((e: LLMUsageEvent) => new Date(e.created_at) >= cutoff);
      }

      if (events.length === 0) {
        console.log(chalk.yellow('\n⚠️  No usage events found for analysis.'));
        return;
      }

      const suggestions = await costOptimizer.analyzeUsage(events);

      if (suggestions.length === 0) {
        console.log(chalk.green('\n✅ No optimizations found. Your usage looks efficient!'));
        return;
      }

      console.log(chalk.green(`\nFound ${suggestions.length} optimization opportunities:\n`));

      suggestions.forEach((suggestion: OptimizationSuggestion, index: number) => {
        const impactColor = suggestion.impact === 'high' ? chalk.red :
                           suggestion.impact === 'medium' ? chalk.yellow : chalk.blue;

        console.log(`${index + 1}. ${chalk.bold(suggestion.type.toUpperCase())} - ${impactColor(suggestion.impact.toUpperCase())} IMPACT`);
        console.log(`   ${suggestion.description}`);
        console.log(`   Action: ${chalk.cyan(suggestion.action)}`);

        if (suggestion.potentialSavings > 0 || suggestion.type === 'batching' || suggestion.type === 'caching') {
          console.log(`   Potential Savings: ${chalk.green('~$' + suggestion.potentialSavings.toFixed(4))}`);
        }

        if (suggestion.context) {
          console.log(`   Context:`);
          if (suggestion.context.currentModel) {
            console.log(`     - Current Model: ${suggestion.context.currentModel}`);
          }
          if (suggestion.context.suggestedModel) {
            console.log(`     - Suggested Model: ${suggestion.context.suggestedModel}`);
          }
          if (suggestion.context.taskType) {
            console.log(`     - Task Type: ${suggestion.context.taskType}`);
          }
          if (suggestion.context.averageTokens !== undefined) {
            console.log(`     - Avg Tokens: ${Math.round(suggestion.context.averageTokens)}`);
          }
          if (suggestion.id) {
             console.log(`     - ID: ${chalk.dim(suggestion.id)}`);
          }
        }
        console.log('');
      });

      console.log(chalk.gray('To apply a suggestion, run: `crew optimize apply <ID>`'));

    } catch (error: any) {
      console.error(chalk.red(`❌ Error running optimization analysis: ${error.message}`));
      process.exit(1);
    }
  });

optimizeCommand
  .command('revert <suggestionId>')
  .description('Revert an applied optimization')
  .action(async (suggestionId) => {
    console.log(chalk.blue(`\n⏪ Reverting optimization: ${suggestionId}`));

    try {
      // Re-run analysis to find the suggestion details
      const events = await tracker.fetchEvents(1000);
      const suggestions = await costOptimizer.analyzeUsage(events);
      const suggestion = suggestions.find((s: OptimizationSuggestion) => s.id === suggestionId);

      if (!suggestion) {
        console.error(chalk.red(`\n❌ Optimization suggestion with ID '${suggestionId}' not found.`));
        process.exit(1);
      }

      console.log(chalk.cyan(`   Reverting suggestion: "${suggestion.description}"`));

      switch (suggestion.type) {
        case 'model_switch':
          if (suggestion.context?.currentModel) {
            const taskType = suggestion.context.taskType || 'small-tasks';
            await configService.updateModelConfiguration(taskType, suggestion.context.currentModel);
            await historyService.logAction(suggestion, 'revert');
            console.log(chalk.green(`\n✅ Successfully reverted model configuration for '${taskType}' to '${suggestion.context.currentModel}'.`));
          } else {
            throw new Error('Model switch suggestion is missing the original model context to revert to.');
          }
          break;

        case 'batching':
        case 'caching':
          console.log(chalk.yellow('\n⚠️  This optimization was a manual implementation.'));
          console.log(chalk.gray('   Guidance: To revert, you must manually remove the batching or caching logic from your application code.'));
          break;

        default:
          throw new Error(`Unknown optimization type: ${(suggestion as any).type}`);
      }

      console.log('');

    } catch (error: any) {
      console.error(chalk.red(`\n❌ Error reverting optimization: ${error.message}`));
      process.exit(1);
    }
  });

optimizeCommand
  .command('apply <suggestionId>')
  .description('Apply a specific optimization suggestion')
  .action(async (suggestionId) => {
    console.log(chalk.blue(`\n⚙️  Applying optimization: ${suggestionId}`));

    try {
      // Re-run analysis to find the suggestion. In a real app, this might be cached or fetched.
      const events = await tracker.fetchEvents(1000);
      const suggestions = await costOptimizer.analyzeUsage(events);
      const suggestion = suggestions.find((s: OptimizationSuggestion) => s.id === suggestionId);

      if (!suggestion) {
        console.error(chalk.red(`\n❌ Optimization suggestion with ID '${suggestionId}' not found.`));
        console.log(chalk.gray('   Run `crew optimize analyze` to see available suggestions.'));
        process.exit(1);
      }

      console.log(chalk.cyan(`   Applying suggestion: "${suggestion.description}"`));

      switch (suggestion.type) {
        case 'model_switch':
          if (suggestion.context?.suggestedModel) {
            // Assuming a global or project-level config for task types
            const taskType = suggestion.context.taskType || 'small-tasks';
            await configService.updateModelConfiguration(taskType, suggestion.context.suggestedModel);
            await historyService.logAction(suggestion, 'apply');
            console.log(chalk.green(`\n✅ Successfully updated model configuration.`));
          } else {
            throw new Error('Model switch suggestion is missing a suggested model.');
          }
          break;

        case 'batching':
          console.log(chalk.yellow('\n⚠️  This optimization requires manual implementation.'));
          console.log(chalk.gray('   Guidance: Modify your application logic to group multiple small API calls into a single batch request.'));
          console.log(chalk.gray('   This is often effective for data processing or enrichment tasks.'));
          break;

        case 'caching':
          console.log(chalk.yellow('\n⚠️  This optimization requires manual implementation.'));
          console.log(chalk.gray('   Guidance: Implement a caching layer (e.g., Redis, in-memory cache) for frequent, identical requests.'));
          console.log(chalk.gray('   Use a hash of the request payload as the cache key.'));
          break;

        default:
          throw new Error(`Unknown optimization type: ${(suggestion as any).type}`);
      }

      console.log('');

    } catch (error: any) {
      console.error(chalk.red(`\n❌ Error applying optimization: ${error.message}`));
      process.exit(1);
    }
  });