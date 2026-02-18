#!/usr/bin/env node
import 'dotenv/config';
import { Command } from 'commander';
import { optimizeCommand } from './commands/optimize';
import { budgetCommand } from './commands/budget';
import { memoryCommand } from './commands/memory';
import { analyticsCommand } from './commands/analytics';
import { upgradeCommand } from './commands/upgrade';
import { historyCommand } from './commands/history';
import { configCommand } from './commands/config';
import { helpCommand } from './commands/help';

const program = new Command();

program
  .name('crew')
  .description('OpenRouter Crew Platform CLI')
  .version('1.0.0');

program.addCommand(optimizeCommand);
program.addCommand(budgetCommand);
program.addCommand(memoryCommand);
program.addCommand(analyticsCommand);
program.addCommand(upgradeCommand);
program.addCommand(historyCommand);
program.addCommand(configCommand);
program.addCommand(helpCommand);

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}