import { Command } from 'commander';
import chalk from 'chalk';
import { MCPClient } from '../lib/mcp-client';
import { formatTable } from '../lib/formatters';

const project = new Command('project')
  .description('Manage projects and workflows');

const mcpClient = new MCPClient();

/**
 * project list - List all projects
 */
project
  .command('list')
  .alias('ls')
  .description('List all projects')
  .option('--json', 'output as JSON')
  .action(async (options) => {
    try {
      const projects = await mcpClient.getProjects();

      if (options.json) {
        console.log(JSON.stringify(projects, null, 2));
        return;
      }

      console.log(chalk.cyan('\n📁 Projects\n'));

      if (projects.length === 0) {
        console.log(chalk.gray('No projects found. Create one with: crew project feature <name>\n'));
        return;
      }

      const headers = ['Name', 'Type', 'Status', 'Budget', 'Used'];
      const rows = projects.map((p: any) => [
        chalk.bold(p.name),
        p.type,
        p.status,
        `$${p.budget.toFixed(2)}`,
        `$${(p.budget - p.remaining).toFixed(2)}`,
      ]);

      formatTable(headers, rows);
      console.log('');
    } catch (error) {
      console.error(chalk.red('✗ Failed to list projects:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

/**
 * project feature <name> - Create a feature
 */
project
  .command('feature <name>')
  .description('Create a new feature')
  .option('--description <text>', 'feature description')
  .option('--budget <amount>', 'budget in USD')
  .action(async (name, options) => {
    try {
      console.log(chalk.cyan(`\n✨ Creating feature: ${chalk.bold(name)}\n`));

      const feature = await mcpClient.createFeature({
        name,
        description: options.description,
        budget: options.budget ? parseFloat(options.budget) : undefined,
      });

      console.log(chalk.green('✓ Feature created'));
      console.log(`${chalk.dim('ID:')} ${feature.id}`);
      console.log(`${chalk.dim('Name:')} ${feature.name}`);
      console.log(`${chalk.dim('Status:')} ${feature.status}`);
      if (feature.budget) {
        console.log(`${chalk.dim('Budget:')} $${feature.budget.toFixed(2)}`);
      }
      console.log('');
    } catch (error) {
      console.error(chalk.red('✗ Failed to create feature:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

/**
 * project story <name> - Create a story
 */
project
  .command('story <name>')
  .description('Create a new story')
  .option('--feature <id>', 'parent feature ID')
  .option('--description <text>', 'story description')
  .option('--acceptance <criteria>', 'acceptance criteria')
  .action(async (name, options) => {
    try {
      console.log(chalk.cyan(`\n📖 Creating story: ${chalk.bold(name)}\n`));

      const story = await mcpClient.createStory({
        name,
        featureId: options.feature,
        description: options.description,
        acceptanceCriteria: options.acceptance,
      });

      console.log(chalk.green('✓ Story created'));
      console.log(`${chalk.dim('ID:')} ${story.id}`);
      console.log(`${chalk.dim('Name:')} ${story.name}`);
      console.log(`${chalk.dim('Status:')} ${story.status}`);
      console.log('');
    } catch (error) {
      console.error(chalk.red('✗ Failed to create story:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

/**
 * project sprint <name> - Create a sprint
 */
project
  .command('sprint <name>')
  .description('Create a new sprint')
  .option('--duration <days>', 'sprint duration in days (default: 14)', '14')
  .option('--goal <text>', 'sprint goal')
  .action(async (name, options) => {
    try {
      console.log(chalk.cyan(`\n🏃 Creating sprint: ${chalk.bold(name)}\n`));

      const sprint = await mcpClient.createSprint({
        name,
        duration: parseInt(options.duration),
        goal: options.goal,
      });

      console.log(chalk.green('✓ Sprint created'));
      console.log(`${chalk.dim('ID:')} ${sprint.id}`);
      console.log(`${chalk.dim('Name:')} ${sprint.name}`);
      console.log(`${chalk.dim('Duration:')} ${sprint.duration} days`);
      console.log(`${chalk.dim('Start:')} ${new Date(sprint.startDate).toLocaleDateString()}`);
      console.log(`${chalk.dim('End:')} ${new Date(sprint.endDate).toLocaleDateString()}`);
      console.log('');
    } catch (error) {
      console.error(chalk.red('✗ Failed to create sprint:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

export default project;
