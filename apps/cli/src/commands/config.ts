import { Command } from 'commander';
import chalk from 'chalk';
import { configService } from '../services/config-service';

export const configCommand = new Command('config')
  .description('View and edit the local crew configuration file (.mock-crew-config.json)');

configCommand
  .command('view')
  .description('Display the contents of the configuration file')
  .action(async () => {
    console.log(chalk.blue('\n📄 Viewing configuration...\n'));
    try {
      const config = await configService.getConfig();
      console.log(chalk.green(JSON.stringify(config, null, 2)));
      console.log('');
    } catch (error: any) {
      console.error(chalk.red(`❌ Error reading config: ${error.message}`));
    }
  });

configCommand
  .command('set <key> <value>')
  .description('Set a configuration value using dot notation (e.g., "features.caching" "true")')
  .action(async (key, value) => {
    console.log(chalk.blue(`\n✍️  Setting config: ${key} = ${value}\n`));
    try {
      await configService.setConfigValue(key, value);
      console.log(chalk.green('✅ Configuration updated successfully.'));
      
      const updatedConfig = await configService.getConfig();
      console.log(chalk.dim('\nNew configuration:'));
      console.log(chalk.dim(JSON.stringify(updatedConfig, null, 2)));
      console.log('');

    } catch (error: any) {
      console.error(chalk.red(`❌ Error setting config: ${error.message}`));
    }
  });

configCommand
  .command('unset <key>')
  .description('Remove a configuration value')
  .action(async (key) => {
    console.log(chalk.blue(`\n🗑️  Removing config: ${key}\n`));
    try {
      await configService.unsetConfigValue(key);
      console.log(chalk.green('✅ Configuration updated successfully.'));
      
      const updatedConfig = await configService.getConfig();
      console.log(chalk.dim('\nNew configuration:'));
      console.log(chalk.dim(JSON.stringify(updatedConfig, null, 2)));
      console.log('');

    } catch (error: any) {
      console.error(chalk.red(`❌ Error removing config: ${error.message}`));
    }
  });

configCommand
  .command('reset')
  .description('Reset configuration to defaults')
  .action(async () => {
    console.log(chalk.blue('\n🔄 Resetting configuration to defaults...\n'));
    try {
      await configService.resetConfig();
      console.log(chalk.green('✅ Configuration reset successfully.'));
      
      const config = await configService.getConfig();
      console.log(chalk.dim('\nDefault configuration:'));
      console.log(chalk.dim(JSON.stringify(config, null, 2)));
      console.log('');
    } catch (error: any) {
      console.error(chalk.red(`❌ Error resetting config: ${error.message}`));
    }
  });