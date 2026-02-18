import { Command } from 'commander';
import chalk from 'chalk';
import { MemoryAnalyticsService, MemoryService } from '@openrouter-crew/crew-api-client';
import { formatCost } from '../lib/formatters';
import { enforceFeatureAccess } from '../lib/tier-limits';

const analyticsService = new MemoryAnalyticsService();
const memoryService = new MemoryService();

export const analyticsCommand = new Command('analytics')
  .description('View basic analytics (Starter Tier)');

analyticsCommand
  .command('summary')
  .description('View basic cost and memory metrics')
  .option('-c, --crew <crewId>', 'Filter by crew ID')
  .action(async (options) => {
    console.log(chalk.blue('📊 Generating basic summary...'));
    
    try {
      const crewId = options.crew || 'default';
      
      // Fetch real memories
      const memories = await memoryService.getRecentMemories(crewId, 1000);
      
      // Generate analytics
      const analytics = analyticsService.generateAnalytics(crewId, memories);
      
      const stats = {
        totalMemories: analytics.totalMemories,
        // In a real scenario, cost would come from CostOptimizationService
        activeCrew: 1, 
        storageUsed: `${(JSON.stringify(memories).length / 1024 / 1024).toFixed(2)} MB`
      };

      console.log(chalk.cyan('\n📈 Platform Usage (Starter)'));
      console.log(`  ${chalk.bold('Total Memories:')}   ${stats.totalMemories} / 1000`);
      console.log(`  ${chalk.bold('Active Crew:')}      ${stats.activeCrew} / 1`);
      console.log(`  ${chalk.bold('Est. Storage:')}     ${stats.storageUsed}`);
      console.log('');

    } catch (error: any) {
      console.error(chalk.red(`Error: ${error.message}`));
    }
  });

analyticsCommand
  .command('insights')
  .description('View advanced AI insights (Professional Feature)')
  .option('-c, --crew <crewId>', 'Filter by crew ID')
  .action(async (options) => {
    try {
      enforceFeatureAccess('advancedAnalytics');
      
      const crewId = options.crew || 'default';
      console.log(chalk.blue(`🧠 Generating insights for crew: ${crewId}...`));
      
      const memories = await memoryService.getRecentMemories(crewId, 1000);
      const insights = analyticsService.generateInsights(memories);
      
      if (insights.length === 0) {
        console.log(chalk.green('\n✅ No critical insights found. System is healthy.'));
        return;
      }
      
      console.log(chalk.cyan('\n💡 AI Insights\n'));
      
      insights.forEach(insight => {
        const color = insight.type === 'warning' ? chalk.yellow : 
                      insight.type === 'opportunity' ? chalk.green : chalk.blue;
                      
        console.log(`${color(chalk.bold(insight.title))} [${insight.type.toUpperCase()}]`);
        console.log(`  ${insight.description}`);
        console.log(`  👉 ${chalk.italic(insight.recommendation)}`);
        if (insight.affected.length > 0) {
          console.log(`  Affected: ${insight.affected.length} memories`);
        }
        console.log('');
      });

    } catch (error: any) {
      console.error(chalk.red(`Error: ${error.message}`));
      if (error.message.includes('Professional')) {
        console.log(chalk.gray('\nAdvanced insights include:'));
        console.log(chalk.gray('  • Topic clustering analysis'));
        console.log(chalk.gray('  • Confidence decay trends'));
        console.log(chalk.gray('  • Optimization recommendations'));
        console.log(chalk.gray('  • Anomaly detection'));
      }
    }
  });