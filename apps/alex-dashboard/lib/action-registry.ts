export interface UniversalAction {
  id: string;
  label: string;
  description: string;
  script: string;
  args: {
    name: string;
    flag?: string;
    required?: boolean;
    description?: string;
    type?: 'string' | 'boolean' | 'select';
    options?: string[];
  }[];
}

export const UNIVERSAL_ACTIONS: Record<string, UniversalAction> = {
  'domain:create': {
    id: 'domain:create',
    label: 'Create Domain',
    description: 'Scaffold a new Domain structure following DDD principles.',
    script: 'scripts/domain/create-domain.sh',
    args: [
      { name: 'name', required: true, description: 'Domain Name', type: 'string' }
    ]
  },
  'sync:all': {
    id: 'sync:all',
    label: 'Universal Sync',
    description: 'Sync Database Schema, TypeScript Types, and n8n Workflows.',
    script: 'scripts/system/sync-all.sh',
    args: [
      { name: 'n8n_direction', flag: '--n8n', description: 'n8n Sync Direction', type: 'select', options: ['push', 'pull', 'skip'] },
      { name: 'db_push', flag: '--db-push', description: 'Push DB Migrations', type: 'boolean' }
    ]
  },
  'story:create': {
    id: 'story:create',
    label: 'Create Story',
    description: 'Create a new Agile Story branch.',
    script: 'scripts/agile/create-story.sh',
    args: [
      { name: 'name', required: true, description: 'Story Name', type: 'string' },
      { name: 'project', flag: '--project', description: 'Project Domain', type: 'string' },
      { name: 'sprint', flag: '--sprint', description: 'Sprint ID', type: 'string' }
    ]
  }
};
