#!/usr/bin/env node
import 'dotenv/config';
import { Command } from 'commander';
import { optimizeCommand } from './commands/optimize';
import './commands/budget.js';
import './commands/memory.js';
import './commands/analytics.js';
import './commands/upgrade.js';
import './commands/history.js';
import './commands/config.js';
import './commands/help.js';

const program = new Command();

program
  .name('crew')
  .description('OpenRouter Crew Platform CLI')
  .version('1.0.0');

program.addCommand(optimizeCommand);
// Other commands are added via side-effect imports

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}