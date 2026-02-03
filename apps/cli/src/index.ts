#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';

// Load environment
require('dotenv').config();

// Import command modules
import crewCommand from './commands/crew';
import projectCommand from './commands/project';
import costCommand from './commands/cost';

// Version
const version = '1.0.0';

// CLI metadata
program
  .name('crew')
  .description('OpenRouter Crew Platform CLI - The gravitational center for crew coordination')
  .version(version, '-v, --version', 'display version');

// Global options
program.option('--debug', 'enable debug logging');

// Add command namespaces
program.addCommand(crewCommand);
program.addCommand(projectCommand);
program.addCommand(costCommand);

// Help text
program.on('--help', () => {
  console.log('');
  console.log(chalk.cyan('Examples:'));
  console.log('  crew status                    # Show crew status and availability');
  console.log('  crew consult picard "task"     # Consult Captain Picard');
  console.log('  crew activate data             # Activate Data for a task');
  console.log('  project feature my-feature     # Create a new feature');
  console.log('  cost report                    # Show cost summary');
  console.log('  cost optimize picard "task"    # Check optimization options');
  console.log('');
});

// Handle unknown commands
program.on('command:*', () => {
  console.error(chalk.red('✗ Unknown command. Use "crew --help" for available commands.'));
  process.exit(1);
});

// Parse arguments
program.parse(process.argv);

// Show help if no arguments
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
