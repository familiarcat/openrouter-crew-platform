import { Command } from 'commander';
import dotenv from 'dotenv';
import { registerReportCommands } from './commands/report';

dotenv.config();

const program = new Command();

program
  .name('crew')
  .description('OpenRouter Crew Platform CLI')
  .version('0.0.1');

const project = program.command('project')
  .description('Manage projects');

project.command('new')
  .description('Create a new project')
  .action(() => {
    console.log('Creating new project... (Implementation pending)');
  });

program.command('deploy')
  .description('Deploy the platform')
  .action(() => {
    console.log('Deploying platform... (Implementation pending)');
  });

program.command('logs')
  .description('View system logs')
  .action(() => {
    console.log('Fetching logs... (Implementation pending)');
  });

// Register new commands
registerReportCommands(program);

program.parse(process.argv);