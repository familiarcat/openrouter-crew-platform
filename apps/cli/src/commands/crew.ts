import { Command } from 'commander';
import chalk from 'chalk';
import { MCPClient } from '../lib/mcp-client';
import { formatTable, formatCost } from '../lib/formatters';

const crew = new Command('crew')
  .description('Manage and consult crew members');

const mcpClient = new MCPClient();

/**
 * crew roster - Show crew roster and availability
 */
crew
  .command('roster')
  .description('Show crew roster and availability')
  .option('--json', 'output as JSON')
  .action(async (options) => {
    try {
      const roster = await mcpClient.getCrewRoster();

      if (options.json) {
        console.log(JSON.stringify(roster, null, 2));
        return;
      }

      console.log(chalk.cyan('\n📋 Crew Roster Status\n'));

      const headers = ['Member', 'Role', 'Status', 'Workload', 'Model'];
      const rows = roster.map((member: any) => [
        chalk.bold(member.name),
        member.role,
        member.available ? chalk.green('Available') : chalk.yellow('Busy'),
        `${member.workload}%`,
        member.model,
      ]);

      formatTable(headers, rows);
      console.log('');
    } catch (error) {
      console.error(chalk.red('✗ Failed to fetch crew status:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

/**
 * crew consult <member> <task> - Consult a crew member
 */
crew
  .command('consult <member> <task>')
  .description('Consult a crew member for assistance')
  .option('--async', 'execute asynchronously (returns request ID)')
  .option('--wait', 'wait for async result (default: wait)')
  .option('--timeout <seconds>', 'timeout for async operations', '300')
  .option('--json', 'output as JSON')
  .action(async (member, task, options) => {
    try {
      const async_ = options.async || options.wait === false;

      console.log(chalk.cyan(`\n🤝 Consulting ${chalk.bold(member)}...\n`));

      const result = await mcpClient.consultCrew(member, task, {
        async: async_,
        timeout: parseInt(options.timeout) * 1000,
      });

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }

      if (result.status === 'pending' && async_) {
        console.log(chalk.yellow(`⏳ Request submitted (ID: ${result.requestId})`));
        console.log(chalk.gray(`Use 'crew status ${result.requestId}' to check progress\n`));
        return;
      }

      console.log(chalk.green('✓ Response from'), chalk.bold(member));
      console.log('');
      console.log(result.response);
      console.log('');

      if (result.cost) {
        console.log(chalk.dim(`Cost: ${formatCost(result.cost)}`));
      }
    } catch (error) {
      console.error(chalk.red('✗ Failed to consult crew member:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

/**
 * crew activate <member> - Activate a crew member for a task
 */
crew
  .command('activate <member>')
  .description('Activate a crew member for a task')
  .option('--duration <hours>', 'duration for activation (default: 1)', '1')
  .action(async (member, options) => {
    try {
      const duration = parseInt(options.duration);

      console.log(chalk.cyan(`\n⚡ Activating ${chalk.bold(member)}...\n`));

      const result = await mcpClient.activateCrew(member, { duration });

      console.log(chalk.green('✓ Crew member activated'));
      console.log(`${chalk.dim('Member:')} ${result.member}`);
      console.log(`${chalk.dim('Duration:')} ${duration} hour(s)`);
      console.log(`${chalk.dim('Active until:')} ${new Date(result.expiresAt).toLocaleString()}\n`);
    } catch (error) {
      console.error(chalk.red('✗ Failed to activate crew member:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

/**
 * crew coordinate - Coordinate crew for multi-agent task
 */
crew
  .command('coordinate <task>')
  .description('Coordinate crew for multi-agent task')
  .option('--members <list>', 'specific crew members (comma-separated)')
  .option('--async', 'execute asynchronously')
  .action(async (task, options) => {
    try {
      console.log(chalk.cyan('\n🌐 Coordinating crew...\n'));

      const members = options.members ? options.members.split(',').map((m: string) => m.trim()) : undefined;

      const result = await mcpClient.coordinateCrew(task, {
        members,
        async: options.async,
      });

      console.log(chalk.green('✓ Coordination initiated'));
      console.log(`${chalk.dim('Task ID:')} ${result.taskId}`);
      console.log(`${chalk.dim('Members:')} ${result.members.join(', ')}`);
      console.log(`${chalk.dim('Status:')} ${result.status}\n`);
    } catch (error) {
      console.error(chalk.red('✗ Failed to coordinate crew:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

/**
 * crew status <request-id> - Check async request status
 */
crew
  .command('status <requestId>')
  .description('Check status of an async workflow request')
  .option('--json', 'output as JSON')
  .option('--watch', 'watch for updates')
  .action(async (requestId, options) => {
    try {
      console.log(chalk.cyan(`\n📊 Request Status: ${chalk.bold(requestId)}\n`));

      // This is a simplified implementation
      // In production, would use the PollingService from shared-crew-coordination
      console.log(chalk.gray('Status tracking requires Supabase connection'));
      console.log(chalk.gray('Use "crew wait <request-id>" to wait for completion\n'));
    } catch (error) {
      console.error(chalk.red('✗ Failed to check request status:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

/**
 * crew wait <request-id> - Wait for async request completion
 */
crew
  .command('wait <requestId>')
  .description('Wait for an async workflow request to complete')
  .option('--timeout <seconds>', 'timeout in seconds (default: 300)', '300')
  .option('--json', 'output as JSON')
  .action(async (requestId, options) => {
    try {
      const timeoutSeconds = parseInt(options.timeout);

      console.log(chalk.cyan(`\n⏳ Waiting for request: ${chalk.bold(requestId)}`));
      console.log(chalk.gray(`Timeout: ${timeoutSeconds} seconds\n`));

      // This is a simplified implementation
      // In production, would use the PollingService from shared-crew-coordination
      console.log(chalk.gray('Request tracking requires Supabase connection'));
      console.log(chalk.gray('In production, this would poll the workflow_requests table\n'));
    } catch (error) {
      console.error(chalk.red('✗ Failed to wait for request:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

export default crew;
