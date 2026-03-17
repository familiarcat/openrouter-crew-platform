import { Command } from 'commander';
import { LogService } from '../services/log-service';

export function registerLogCommands(program: Command) {
  program.command('logs')
    .description('View system logs from CloudWatch')
    .option('-e, --env <environment>', 'Environment (staging, production)', 'staging')
    .option('-r, --region <region>', 'AWS Region', 'us-east-2')
    .option('-t, --tail', 'Tail logs in real-time')
    .option('-l, --limit <number>', 'Number of lines to show', '50')
    .option('--since <minutes>', 'Show logs since X minutes ago', '60')
    .option('--filter <pattern>', 'Filter pattern (e.g., "ERROR")')
    .action(async (options) => {
      const service = new LogService(options.region);
      
      // Construct log group name based on convention
      // /ecs/openrouter-crew-platform is defined in infrastructure/ecs.tf
      const logGroupName = `/ecs/openrouter-crew-platform`; 

      try {
        if (options.tail) {
          await service.tailLogs(logGroupName, {
            filterPattern: options.filter
          });
        } else {
          const startTime = Date.now() - (parseInt(options.since) * 60 * 1000);
          const events = await service.fetchLogs(logGroupName, {
            startTime,
            limit: parseInt(options.limit),
            filterPattern: options.filter
          });

          if (events.length === 0) {
            console.log('No logs found in the specified time range.');
          } else {
            events.forEach(event => {
              const timestamp = new Date(event.timestamp!).toISOString();
              console.log(`[${timestamp}] ${event.message?.trim()}`);
            });
          }
        }
      } catch (error: any) {
        console.error(`❌ Error fetching logs: ${error.message}`);
        process.exit(1);
      }
    });
}