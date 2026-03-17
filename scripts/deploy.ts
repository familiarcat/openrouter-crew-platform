import { Command } from 'commander';
import * as readline from 'readline';
import chalk from 'chalk';
import { DeploymentService } from '../services/deployment-service';

function askForConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(['y', 'yes'].includes(answer.toLowerCase()));
    });
  });
}

export function registerDeployCommands(program: Command) {
  program.command('deploy')
    .description('Deploy the platform to AWS')
    .option('-e, --env <environment>', 'Deployment environment', 'staging')
    .option('--region <region>', 'AWS Region', 'us-east-2')
    .action(async (options) => {
      if (options.env === 'production' || options.env === 'prod') {
        console.log(chalk.yellow.bold('🚨 WARNING: You are about to deploy to the PRODUCTION environment.'));
        const confirmed = await askForConfirmation('Are you sure you want to continue? (y/n) ');
        if (!confirmed) {
          console.log(chalk.blue('Deployment to production cancelled.'));
          process.exit(0);
        }
      }

      const service = new DeploymentService();
      await service.deploy(options.env, options.region);
    });
}