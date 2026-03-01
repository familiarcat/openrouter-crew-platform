import { Command } from 'commander';
import chalk from 'chalk';
import { createClient } from '@supabase/supabase-js';
import { CrewAPIClient, MemoryDecayService, CreateMemoryResponse, RetrieveMemoriesResponse, SearchMemoriesResponse, DeleteMemoryResponse } from '@openrouter-crew/crew-api-client';
import { formatTable, formatCost } from '../lib/formatters.js';

interface Memory {
  id: string;
  content: string;
  type: string;
  confidence_level: number;
  created_at: string;
}

const memory = new Command('memory').description('Manage crew memories');

/**
 * Initialize Supabase and CrewAPIClient
 */
function getClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  const userId = process.env.USER_ID || 'cli-user';
  const crewId = process.env.CREW_ID || 'default-crew';

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_URL and SUPABASE_KEY environment variables required');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const client = new CrewAPIClient({
    baseUrl: process.env.API_URL || 'http://localhost:3000/api',
    apiKey: process.env.API_KEY
  });
  const decayService = new MemoryDecayService(supabase);

  return {
    client,
    decayService,
    context: {
      user_id: userId,
      crew_id: crewId,
      role: 'member' as const,
      surface: 'cli' as const,
    },
  };
}

/**
 * memory create <content> - Create a new memory
 */
memory
  .command('create <content>')
  .description('Create a new crew memory')
  .option('--type <type>', 'memory type (story, insight, pattern, lesson, best-practice)', 'story')
  .option('--tier <tier>', 'retention tier (eternal, standard, temporary, session)', 'standard')
  .option('--tags <tags>', 'comma-separated tags')
  .option('--json', 'output as JSON')
  .action(async (content, options) => {
    try {
      const { client, context } = getClient();

      const tags = options.tags ? options.tags.split(',').map((t: string) => t.trim()) : [];

      console.log(chalk.cyan('\n💾 Creating memory...\n'));

      const response: CreateMemoryResponse = await client.create_memory(
        {
          content,
          type: options.type,
          retention_tier: options.tier,
          crew_id: context.crew_id,
          // tags, // 'tags' is not a valid property
        }
      );

      if (options.json) {
        console.log(JSON.stringify(response, null, 2));
        return;
      }

      console.log(chalk.green('✓ Memory created'));
      console.log(`${chalk.dim('ID:')} ${response.id}`);
      // Other properties like type, created_at, cost are not on the response
    } catch (error) {
      console.error(chalk.red('✗ Failed to create memory:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });


/**
 * memory list - List all memories
 */
memory
  .command('list')
  .description('List crew memories')
  .option('--filter <text>', 'filter by text content')
  .option('--limit <number>', 'max results (default: 20)', '20')
  .option('--show-decay', 'include decay metrics in output')
  .option('--json', 'output as JSON')
  .action(async (options) => {
    try {
      const { client, decayService, context } = getClient();

      console.log(chalk.cyan('\n📖 Fetching memories...\n'));

      const response: RetrieveMemoriesResponse = await client.retrieve_memories(
        {
          crew_id: context.crew_id,
          filter: options.filter || '',
          policy: 'default', // Default policy required by RetrieveMemoriesParams
          // limit: parseInt(options.limit), // 'limit' is not a valid property
        }
      );

      const memories = response.memories || [];

      if (options.json) {
        console.log(JSON.stringify(memories, null, 2));
        return;
      }

      if (memories.length === 0) {
        console.log(chalk.yellow('No memories found\n'));
        return;
      }

      if (options.showDecay) {
        const headers = ['ID', 'Content', 'Type', 'Confidence', 'Days Remaining', 'Status', 'Created'];
        const rows = memories.map((m: Memory) => {
          const metrics = decayService.getDecayMetrics(m as any);
          const status = metrics.isExpired
            ? chalk.red('EXPIRED')
            : metrics.daysUntilExpiration < 7
              ? chalk.yellow('EXPIRING')
              : chalk.green('ACTIVE');
          return [
            chalk.dim(m.id.substring(0, 8)),
            m.content.substring(0, 30) + (m.content.length > 30 ? '...' : ''),
            m.type,
            `${(m.confidence_level * 100).toFixed(0)}%`,
            `${Math.ceil(metrics.daysUntilExpiration)}d`,
            status,
            new Date(m.created_at).toLocaleDateString(),
          ];
        });

        formatTable(headers, rows);
      } else {
        const headers = ['ID', 'Content', 'Type', 'Confidence', 'Created'];
        const rows = memories.map((m: Memory) => [
          chalk.dim(m.id.substring(0, 8)),
          m.content.substring(0, 40) + (m.content.length > 40 ? '...' : ''),
          m.type,
          `${(m.confidence_level * 100).toFixed(0)}%`,
          new Date(m.created_at).toLocaleDateString(),
        ]);

        formatTable(headers, rows);
      }

      console.log(chalk.dim(`\nTotal: ${memories.length} memories\n`));
    } catch (error) {
      console.error(chalk.red('✗ Failed to list memories:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

/**
 * memory search <query> - Search memories
 */
memory
  .command('search <query>')
  .description('Search crew memories')
  .option('--limit <number>', 'max results (default: 10)', '10')
  .option('--json', 'output as JSON')
  .action(async (query, options) => {
    try {
      const { client, context } = getClient();

      console.log(chalk.cyan('\n🔍 Searching memories...\n'));

      const response: SearchMemoriesResponse = await client.search_memories(
        {
          query,
          limit: parseInt(options.limit),
        }
      );

      const results = response.memories || [];
      
      if (options.json) {
        console.log(JSON.stringify(results, null, 2));
        return;
      }

      if (results.length === 0) {
        console.log(chalk.yellow('No matching memories found\n'));
        return;
      }

      const headers = ['ID', 'Content', 'Type', 'Confidence'];
      const rows = results.map((m: Memory) => [
        chalk.dim(m.id.substring(0, 8)),
        m.content.substring(0, 50) + (m.content.length > 50 ? '...' : ''),
        m.type,
        `${(m.confidence_level * 100).toFixed(0)}%`,
      ]);

      formatTable(headers, rows);
      console.log(chalk.dim(`\nFound: ${results.length} memories\n`));
    } catch (error) {
      console.error(chalk.red('✗ Failed to search memories:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

/**
 * memory delete <id> - Delete a memory (soft delete)
 */
memory
  .command('delete <id>')
  .description('Delete a crew memory (soft delete, recoverable for 30 days)')
  .option('--permanent', 'permanently delete (cannot be recovered)')
  .action(async (id, options) => {
    try {
      const { client, context } = getClient();

      console.log(chalk.yellow(`\n🗑️  Deleting memory ${id}...\n`));

      const result: DeleteMemoryResponse = await client.delete_memory(
        {
          id,
          soft: !options.permanent,
        }
      );

      console.log(
        chalk.green('✓ Memory deleted'),
        options.permanent ? chalk.red('(permanently)') : chalk.dim('(soft delete, recoverable)')
      );
    } catch (error) {
      console.error(chalk.red('✗ Failed to delete memory:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

/**
 * memory compliance - Check compliance status
 */
memory
  /* Temporarily disabled due to API changes
  .command('compliance')
  .description('Check crew memory compliance status (GDPR)')
  .option('--period <period>', 'period to check (e.g., 30d, 90d)', '30d')
  .option('--json', 'output as JSON')
  .action(async (options) => {
    try {
      const { client, context } = getClient();

      console.log(chalk.cyan('\n📋 Checking compliance status...\n'));

      // const status = await client.compliance_status(
      //   {
      //     crew_id: context.crew_id,
      //     period: options.period,
      //   },
      //   context
      // );

      if (options.json) {
        console.log(JSON.stringify(status, null, 2));
        return;
      }

      console.log(chalk.bold('Compliance Status'));
      console.log(`${chalk.dim('Period:')} ${status.period}`);
      console.log(`${chalk.dim('Total Memories:')} ${status.total_memories}`);
      console.log(`${chalk.dim('Deleted Memories:')} ${status.deleted_memories}`);
      console.log(`${chalk.dim('Recovery Window:')} ${status.recovery_window_days} days`);
      console.log(
        `${chalk.dim('GDPR Compliant:')} ${status.gdpr_compliant ? chalk.green('✓ Yes') : chalk.red('✗ No')}\n`
      );
    } catch (error) {
      console.error(chalk.red('✗ Failed to check compliance:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });*/
  .command('compliance')
  .description('[Temporarily Disabled] Check crew memory compliance status (GDPR)');

/**
 * memory forecast - Forecast memory expiration
 */
memory
  /*
  .command('forecast')
  .description('Forecast memory expiration based on confidence decay')
  .option('--json', 'output as JSON')
  .action(async (options) => {
    try {
      const { client, context } = getClient();

      console.log(chalk.cyan('\n📊 Forecasting memory expiration...\n'));

      // const forecast = await client.expiration_forecast(
      //   {
      //     crew_id: context.crew_id,
      //   },
      //   context
      // );

      if (options.json) {
        console.log(JSON.stringify(forecast, null, 2));
        return;
      }

      console.log(chalk.bold('Memory Expiration Forecast'));
      console.log(`${chalk.dim('Expiring Soon:')} ${chalk.red(String(forecast.expiring_soon))} memories`);
      console.log(`${chalk.dim('Expiring in 30 days:')} ${chalk.yellow(String(forecast.expiring_30days))} memories`);
      console.log(
        `${chalk.dim('Expiring in 90 days:')} ${chalk.dim(String(forecast.expiring_90days))} memories\n`
      );
    } catch (error) {
      console.error(chalk.red('✗ Failed to forecast expiration:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  }); */
  .command('forecast')
  .description('[Temporarily Disabled] Forecast memory expiration based on confidence decay')
  .action(() => {
      console.log(chalk.yellow('This command is temporarily disabled due to API updates.'));
  });

/**
 * memory export - Export crew memories
 */
memory
  .command('export')
  .description('Export crew memories to JSON or CSV')
  .option('--format <format>', 'export format (json, csv)', 'json')
  .option('--output <file>', 'output file (if not specified, prints to stdout)')
  .action(async (options) => {
    try {
      const { client, context } = getClient();

      console.log(chalk.cyan(`\n📤 Exporting memories as ${options.format}...\n`));

      const data = await client.export_crew_data(
        {
          crew_id: context.crew_id,
          format: options.format as 'json' | 'csv',
        }
      );

      if (options.output) {
        const fs = await import('fs/promises');
        // Data must be stringified if it's an object
        const contentToWrite = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
        await fs.writeFile(options.output, contentToWrite);
        console.log(chalk.green('✓ Memories exported to'), chalk.bold(options.output) + '\n');
      } else {
        console.log(data);
        console.log('');
      }
    } catch (error) {
      console.error(chalk.red('✗ Failed to export memories:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

/**
 * memory decay-metrics <id> - Show decay metrics for a memory
 */
memory
  .command('decay-metrics <id>')
  .description('Show decay metrics for a specific memory')
  .option('--json', 'output as JSON')
  .action(async (id, options) => {
    try {
      const { client, decayService, context } = getClient();

      console.log(chalk.cyan(`\n📉 Fetching decay metrics for ${id}...\n`));

      // Fetch the memory
      const response = await client.retrieve_memories(
        {
          crew_id: context.crew_id,
          filter: '',
          policy: 'default',
          // limit: 1000, // 'limit' is not a valid property
        }
      );

      const memory = response.memories.find((m) => m.id === id);
      if (!memory) {
        console.error(chalk.red('✗ Memory not found\n'));
        process.exit(1);
      }

      // Get decay metrics
      const metrics = decayService.getDecayMetrics(memory as any);
      if (options.json) {
        console.log(JSON.stringify(metrics, null, 2));
        return;
      }

      console.log(chalk.bold('Decay Metrics'));
      console.log(`${chalk.dim('Memory ID:')} ${metrics.id}`);
      console.log(`${chalk.dim('Current Confidence:')} ${chalk.cyan(`${(metrics.currentConfidence * 100).toFixed(1)}%`)}`);
      console.log(`${chalk.dim('Days Since Created:')} ${chalk.cyan(String(Math.floor(metrics.daysSinceCreated)))}`);
      console.log(`${chalk.dim('Days Until Expiration:')} ${chalk.cyan(String(Math.ceil(metrics.daysUntilExpiration)))}`);
      console.log(
        `${chalk.dim('Status:')} ${
          metrics.isExpired
            ? chalk.red('✗ EXPIRED')
            : chalk.green('✓ Active')
        }`
      );
      if (metrics.expirationReason) {
        console.log(`${chalk.dim('Reason:')} ${metrics.expirationReason}`);
      }
      console.log('');
    } catch (error) {
      console.error(chalk.red('✗ Failed to get decay metrics:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

/**
 * memory decay-stats - Show retention statistics
 */
memory
  .command('decay-stats')
  .description('Show memory retention statistics for the crew')
  .option('--json', 'output as JSON')
  .action(async (options) => {
    try {
      const { decayService, context } = getClient();

      console.log(chalk.cyan('\n📊 Fetching retention statistics...\n'));

      const stats = await decayService.getRetentionStatistics(context.crew_id);

      if (options.json) {
        console.log(JSON.stringify(stats, null, 2));
        return;
      }

      console.log(chalk.bold('Retention Statistics'));
      console.log(`${chalk.dim('Total Memories:')} ${stats.totalMemories}`);
      console.log(`${chalk.dim('Active Memories:')} ${chalk.green(String(stats.activeMemories))}`);
      console.log(`${chalk.dim('Soft-Deleted Memories:')} ${chalk.yellow(String(stats.softDeletedMemories))}`);
      console.log(`${chalk.dim('Expiring in 7 days:')} ${chalk.red(String(stats.expiringIn7Days))}`);
      console.log(`${chalk.dim('Expiring in 30 days:')} ${chalk.yellow(String(stats.expiringIn30Days))}`);

      console.log(chalk.bold('\nBy Retention Tier:'));
      Object.entries(stats.memoryByTier).forEach(([tier, count]) => {
        console.log(`${chalk.dim(`  ${tier}:`)} ${count}`);
      });

      console.log(`${chalk.dim('\nAverage Confidence:')} ${chalk.cyan(`${(stats.averageConfidence * 100).toFixed(1)}%`)}\n`);
    } catch (error) {
      console.error(chalk.red('✗ Failed to get retention statistics:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

export default memory;
