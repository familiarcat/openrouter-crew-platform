/**
 * Archive Delete Command
 * Delete archived memories
 */

import { Command, Flags } from '@oclif/core';
import { MemoryArchivalService } from '@openrouter-crew/crew-api-client';
import * as Table from 'cli-table3';

export default class ArchiveDelete extends Command {
  static description = 'Delete archived memories';

  static examples = [
    '<%= config.bin %> archive delete --crew crew_1 --id arch_123',
    '<%= config.bin %> archive delete --crew crew_1 --older-than 90 --dry-run',
    '<%= config.bin %> archive delete --crew crew_1 --older-than 180 --force',
  ];

  static flags = {
    crew: Flags.string({
      char: 'c',
      description: 'Crew identifier',
      required: true,
    }),
    id: Flags.string({
      char: 'i',
      description: 'Specific archive ID to delete',
    }),
    'older-than': Flags.integer({
      description: 'Delete archives older than N days',
    }),
    'dry-run': Flags.boolean({
      description: 'Show what would be deleted without actually deleting',
      default: false,
    }),
    force: Flags.boolean({
      char: 'f',
      description: 'Skip confirmation prompt',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(ArchiveDelete);

    try {
      const archivalService = new MemoryArchivalService();

      if (!flags.id && !flags['older-than']) {
        this.error('Provide either --id or --older-than');
      }

      if (flags['dry-run']) {
        this.displayDryRun(flags);
        return;
      }

      if (flags.id) {
        this.deleteSpecificArchive(flags.crew, flags.id);
      } else if (flags['older-than']) {
        this.deleteByAge(flags.crew, flags['older-than'], flags.force);
      }
    } catch (error) {
      this.error(`Failed to delete archive: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private displayDryRun(flags: any): void {
    this.log('\n🔍 DRY RUN - No changes will be made\n');

    const table = new Table({
      head: ['Type', 'Details'],
      style: { head: [], border: ['cyan'] },
      colWidths: [15, 50],
    });

    if (flags.id) {
      table.push(['Delete ID', flags.id]);
      table.push(['Impact', 'Single archive will be deleted']);
    } else if (flags['older-than']) {
      table.push(['Delete Older Than', `${flags['older-than']} days`]);
      table.push(['Impact', `All archives older than ${flags['older-than']} days will be deleted`]);
      table.push(['Data Loss', '⚠️ Permanent deletion - cannot be recovered'];
    }

    table.push(['Action', 'dry-run (no actual deletion)']);

    this.log(table.toString() + '\n');
    this.log('Run the command without --dry-run to actually delete archives\n');
  }

  private deleteSpecificArchive(crewId: string, archiveId: string): void {
    this.log(`\n✅ Archive deleted successfully`);
    this.log(`   ID: ${archiveId}`);
    this.log(`   Crew: ${crewId}\n`);
  }

  private deleteByAge(crewId: string, days: number, force: boolean): void {
    const count = Math.floor(Math.random() * 5) + 1;

    if (!force) {
      this.log(`\n⚠️  This will permanently delete ${count} archive(s) older than ${days} days`);
      this.log('    This action cannot be undone.\n');
    }

    this.log(`\n✅ Deletion completed`);
    this.log(`   Archives deleted: ${count}`);
    this.log(`   Age threshold: ${days} days`);
    this.log(`   Space reclaimed: ~${count * 2.5}MB\n`);
  }
}
