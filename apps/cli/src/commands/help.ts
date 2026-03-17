import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';

export const helpCommand = new Command('help')
  .description('Interactive guide to available commands')
  .action(async () => {
    console.log(chalk.cyan('\n👋 Welcome to the OpenRouter Crew Platform CLI!\n'));
    console.log('This interactive guide will help you explore the available commands.\n');

    const { category } = await inquirer.prompt([
      {
        type: 'list',
        name: 'category',
        message: 'Which category would you like to explore?',
        choices: [
          { name: '💰 Cost Management (budget, track, report)', value: 'cost' },
          { name: '🧠 Memory Management (list, search, archive)', value: 'memory' },
          { name: '👥 Crew Management (roster, consult, activate)', value: 'crew' },
          { name: '📁 Project Management (list, feature, sprint)', value: 'project' },
          { name: '📊 Analytics (summary, insights)', value: 'analytics' },
          { name: '⚙️  Configuration (view, set, reset)', value: 'config' },
          { name: '📜 History (optimizations)', value: 'history' },
          { name: '💎 Subscription (status, upgrade)', value: 'upgrade' },
          { name: 'Exit', value: 'exit' }
        ]
      }
    ]);

    if (category === 'exit') {
      console.log('Goodbye! 👋');
      return;
    }

    console.log(chalk.blue(`\nAvailable commands for ${category.toUpperCase()}:\n`));

    const commands: Record<string, string[]> = {
      cost: [
        'crew cost report --period <days>      Show cost summary and trends',
        'crew cost optimize <member> <task>    Check optimization options',
        'crew cost track --interval <seconds>  Track costs in real-time',
        'crew budget view <crewId>             View budget for a crew',
        'crew budget set <crewId> <amount>     Set budget for a crew'
      ],
      memory: [
        'crew memory list                      List active memories',
        'crew memory search <query>            Search memories',
        'crew memory create <content>          Create a new memory',
        'crew memory archive <id>              Archive a memory',
        'crew memory restore <id>              Restore a memory from archive',
        'crew memory decay-metrics <id>        Show decay metrics for a memory'
      ],
      crew: [
        'crew roster                           Show crew roster and availability',
        'crew consult <member> <task>          Consult a crew member',
        'crew activate <member>                Activate a crew member',
        'crew coordinate <task>                Coordinate crew for multi-agent task',
        'crew status <requestId>               Check async request status'
      ],
      project: [
        'crew project list                     List all projects',
        'crew project info <id>                Display detailed project info',
        'crew project feature <name>           Create a new feature',
        'crew project story <name>             Create a new story',
        'crew project sprint <name>            Create a new sprint'
      ],
      analytics: [
        'crew analytics summary                View basic cost and memory metrics',
        'crew analytics insights               View advanced AI insights'
      ],
      config: [
        'crew config view                      View current configuration',
        'crew config set <key> <value>         Set a configuration value',
        'crew config unset <key>               Remove a configuration value',
        'crew config reset                     Reset configuration to defaults'
      ],
      history: [
        'crew history optimizations            Show log of applied/reverted optimizations'
      ],
      upgrade: [
        'crew upgrade status                   Check subscription status',
        'crew upgrade pro                      Upgrade to Professional Tier'
      ]
    };

    if (commands[category]) {
      commands[category].forEach(cmd => console.log(`  ${chalk.green(cmd.split('  ')[0])} ${cmd.split('  ').slice(1).join('  ')}`));
    }

    console.log('');
  });