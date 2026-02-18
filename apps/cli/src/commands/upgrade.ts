import { Command } from 'commander';
import chalk from 'chalk';
import { upgradeService } from '../services/upgrade-service';

export const upgradeCommand = new Command('upgrade')
  .description('Manage subscription tier');

upgradeCommand
  .command('status')
  .description('Check current subscription status')
  .action(async () => {
    const status = await upgradeService.getStatus();
    const limits = upgradeService.getLimits();

    console.log(chalk.cyan('\n💎 Subscription Status\n'));
    console.log(`  ${chalk.bold('Tier:')}          ${status.tier.toUpperCase()}`);
    console.log(`  ${chalk.bold('Status:')}        ${status.active ? chalk.green('Active') : chalk.red('Inactive')}`);
    if (status.expiresAt) {
      console.log(`  ${chalk.bold('Expires:')}       ${status.expiresAt.toLocaleDateString()}`);
    }
    console.log('');
    console.log(chalk.bold('  Current Limits:'));
    console.log(`  • Crews: ${limits.maxCrews === Infinity ? 'Unlimited' : limits.maxCrews}`);
    console.log(`  • Memories: ${limits.maxMemories === Infinity ? 'Unlimited' : limits.maxMemories}`);
    console.log(`  • History: ${limits.historyDays} days`);
    console.log('');
  });

upgradeCommand
  .command('pro')
  .description('Upgrade to Professional Tier ($29/mo)')
  .action(async () => {
    const status = await upgradeService.getStatus();
    
    if (status.tier !== 'starter') {
      console.log(chalk.yellow(`You are already on the ${status.tier} tier.`));
      return;
    }

    console.log(chalk.cyan('\n🚀 Upgrading to Professional...'));
    console.log(chalk.gray('Unlocking: Auto-archival, Advanced Analytics, 5 Crews, 100k Memories\n'));

    try {
      // Mock payment method
      await upgradeService.upgradeToProfessional('pm_mock_123');
      
      console.log(chalk.green('✅ Upgrade Successful! Welcome to Professional.'));
      console.log('Run `crew upgrade status` to verify your new limits.\n');
    } catch (error: any) {
      console.error(chalk.red(`Upgrade failed: ${error.message}`));
    }
  });