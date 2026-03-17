import { Command } from 'commander';
import { MaintenanceService } from '../services/maintenance-service';

export function registerMaintenanceCommands(program: Command) {
  program.command('maintenance')
    .description('Run self-healing scripts to fix common build and runtime errors')
    .action(async () => {
      const service = new MaintenanceService();
      await service.runMaintenance();
    });
}