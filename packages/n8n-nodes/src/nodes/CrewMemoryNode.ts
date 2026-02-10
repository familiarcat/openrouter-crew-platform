/**
 * N8N Custom Node for Crew API Memory Operations
 *
 * Provides CrewAPIClient operations within n8n workflows:
 * - Create, read, update, delete memories
 * - Search memories
 * - Check compliance
 * - Forecast expiration
 */

import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
} from 'n8n-workflow';
import { createClient } from '@supabase/supabase-js';
import { CrewAPIClient, MemoryDecayService } from '@openrouter-crew/crew-api-client';

export class CrewMemoryNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Crew Memory',
    name: 'crewMemory',
    group: ['transform'],
    version: 1,
    description: 'Manage crew memories with CrewAPIClient',
    defaults: {
      name: 'Crew Memory',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'supabaseApi',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Create Memory',
            value: 'create',
            description: 'Create a new crew memory',
          },
          {
            name: 'List Memories',
            value: 'list',
            description: 'List all crew memories with optional filtering',
          },
          {
            name: 'Search Memories',
            value: 'search',
            description: 'Search memories by text query',
          },
          {
            name: 'Update Memory',
            value: 'update',
            description: 'Update existing memory',
          },
          {
            name: 'Delete Memory',
            value: 'delete',
            description: 'Delete a memory (soft delete by default)',
          },
          {
            name: 'Restore Memory',
            value: 'restore',
            description: 'Restore a soft-deleted memory',
          },
          {
            name: 'Get Compliance Status',
            value: 'compliance',
            description: 'Check GDPR compliance status',
          },
          {
            name: 'Get Expiration Forecast',
            value: 'forecast',
            description: 'Forecast memory expiration',
          },
          {
            name: 'Get Retention Statistics',
            value: 'retention-stats',
            description: 'Get memory retention statistics and decay metrics',
          },
          {
            name: 'Find Expiring Memories',
            value: 'expiring-memories',
            description: 'Find memories expiring within specified days',
          },
          {
            name: 'Find Memories Ready for Deletion',
            value: 'memories-for-deletion',
            description: 'Find soft-deleted memories beyond recovery window',
          },
        ],
        default: 'create',
      },

      // Create/Update parameters
      {
        displayName: 'Content',
        name: 'content',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['create', 'update'],
          },
        },
        required: true,
        description: 'Memory content',
      },
      {
        displayName: 'Type',
        name: 'type',
        type: 'options',
        displayOptions: {
          show: {
            operation: ['create'],
          },
        },
        options: [
          { name: 'Story', value: 'story' },
          { name: 'Insight', value: 'insight' },
          { name: 'Pattern', value: 'pattern' },
          { name: 'Lesson', value: 'lesson' },
          { name: 'Best Practice', value: 'best-practice' },
        ],
        default: 'insight',
      },
      {
        displayName: 'Retention Tier',
        name: 'retention_tier',
        type: 'options',
        displayOptions: {
          show: {
            operation: ['create'],
          },
        },
        options: [
          { name: 'Eternal', value: 'eternal' },
          { name: 'Standard', value: 'standard' },
          { name: 'Temporary', value: 'temporary' },
          { name: 'Session', value: 'session' },
        ],
        default: 'standard',
      },
      {
        displayName: 'Tags',
        name: 'tags',
        type: 'string',
        typeOptions: {
          multipleValues: true,
        },
        displayOptions: {
          show: {
            operation: ['create'],
          },
        },
        description: 'Comma-separated tags',
      },

      // List/Search parameters
      {
        displayName: 'Filter',
        name: 'filter',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['list', 'search'],
          },
        },
        description: 'Filter text for searching',
      },
      {
        displayName: 'Limit',
        name: 'limit',
        type: 'number',
        displayOptions: {
          show: {
            operation: ['list', 'search'],
          },
        },
        default: 10,
        description: 'Maximum number of results',
      },
      {
        displayName: 'Retrieval Policy',
        name: 'policy',
        type: 'options',
        displayOptions: {
          show: {
            operation: ['list'],
          },
        },
        options: [
          { name: 'Default', value: 'default' },
          { name: 'Task Specific', value: 'task-specific' },
          { name: 'Budget Constrained', value: 'budget-constrained' },
          { name: 'Quality Focused', value: 'quality-focused' },
        ],
        default: 'default',
      },

      // Update/Delete/Restore parameters
      {
        displayName: 'Memory ID',
        name: 'id',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['update', 'delete', 'restore'],
          },
        },
        required: true,
        description: 'ID of the memory to operate on',
      },
      {
        displayName: 'Permanent Delete',
        name: 'permanent',
        type: 'boolean',
        displayOptions: {
          show: {
            operation: ['delete'],
          },
        },
        default: false,
        description: 'If true, permanently delete (cannot be recovered). If false, soft delete (30-day recovery)',
      },

      // Compliance/Forecast parameters
      {
        displayName: 'Period',
        name: 'period',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['compliance'],
          },
        },
        default: '30d',
        description: 'Period to check (e.g., 30d, 90d)',
      },

      // Decay metrics parameters
      {
        displayName: 'Days Until Expiration',
        name: 'days_until_expiration',
        type: 'number',
        displayOptions: {
          show: {
            operation: ['expiring-memories'],
          },
        },
        default: 7,
        description: 'Number of days to look ahead for expiring memories',
      },

      // Context parameters
      {
        displayName: 'Crew ID',
        name: 'crew_id',
        type: 'string',
        default: 'default-crew',
        description: 'Crew ID for operation context',
      },
      {
        displayName: 'User ID',
        name: 'user_id',
        type: 'string',
        default: 'n8n-automation',
        description: 'User ID for audit trail',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    // Get credentials
    const credentials = await this.getCredentials('supabaseApi');
    if (!credentials) {
      throw new NodeOperationError(this.getNode(), 'Supabase credentials are required');
    }

    // Initialize Supabase client
    const supabase = createClient(
      credentials.url as string,
      credentials.key as string
    );

    // Initialize CrewAPIClient
    const client = new CrewAPIClient(supabase);

    for (let i = 0; i < items.length; i++) {
      try {
        const operation = this.getNodeParameter('operation', i) as string;
        const crewId = this.getNodeParameter('crew_id', i, 'default-crew') as string;
        const userId = this.getNodeParameter('user_id', i, 'n8n-automation') as string;

        const context = {
          user_id: userId,
          crew_id: crewId,
          role: 'member' as const,
          surface: 'n8n' as const,
        };

        let result;

        switch (operation) {
          case 'create': {
            const content = this.getNodeParameter('content', i) as string;
            const type = this.getNodeParameter('type', i, 'insight') as any;
            const retention_tier = this.getNodeParameter('retention_tier', i, 'standard') as any;
            const tagsStr = this.getNodeParameter('tags', i) as string[];
            const tags = tagsStr ? (typeof tagsStr === 'string' ? tagsStr.split(',') : tagsStr) : [];

            result = await client.create_memory(
              {
                content,
                type,
                retention_tier,
                tags,
              },
              context
            );
            break;
          }

          case 'list': {
            const filter = this.getNodeParameter('filter', i) as string | undefined;
            const limit = this.getNodeParameter('limit', i) as number;
            const policy = this.getNodeParameter('policy', i, 'default') as any;

            result = await client.retrieve_memories(
              {
                crew_id: crewId,
                filter,
                limit,
                policy,
              },
              context
            );
            break;
          }

          case 'search': {
            const query = this.getNodeParameter('filter', i) as string;
            const limit = this.getNodeParameter('limit', i) as number;

            result = await client.search_memories(
              {
                query,
                limit,
              },
              context
            );
            break;
          }

          case 'update': {
            const id = this.getNodeParameter('id', i) as string;
            const content = this.getNodeParameter('content', i) as string;

            result = await client.update_memory(
              {
                id,
                content,
              },
              context
            );
            break;
          }

          case 'delete': {
            const id = this.getNodeParameter('id', i) as string;
            const permanent = this.getNodeParameter('permanent', i) as boolean;

            result = await client.delete_memory(
              {
                id,
                permanent,
              },
              context
            );
            break;
          }

          case 'restore': {
            const id = this.getNodeParameter('id', i) as string;

            result = await client.restore_memory(
              {
                id,
              },
              context
            );
            break;
          }

          case 'compliance': {
            const period = this.getNodeParameter('period', i) as string;

            result = await client.compliance_status(
              {
                crew_id: crewId,
                period,
              },
              context
            );
            break;
          }

          case 'forecast': {
            result = await client.expiration_forecast(
              {
                crew_id: crewId,
              },
              context
            );
            break;
          }

          case 'retention-stats': {
            const decayService = new MemoryDecayService(supabase);
            result = await decayService.getRetentionStatistics(crewId);
            break;
          }

          case 'expiring-memories': {
            const decayService = new MemoryDecayService(supabase);
            const daysUntilExpiration = this.getNodeParameter('days_until_expiration', i, 7) as number;
            result = await decayService.findExpiringMemories(crewId, daysUntilExpiration);
            break;
          }

          case 'memories-for-deletion': {
            const decayService = new MemoryDecayService(supabase);
            result = await decayService.findMemoriesReadyForHardDelete(crewId);
            break;
          }

          default:
            throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
        }

        returnData.push({
          json: result,
          pairedItem: { item: i },
        });
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: { error: error instanceof Error ? error.message : String(error) },
            pairedItem: { item: i },
          });
        } else {
          throw error;
        }
      }
    }

    return [returnData];
  }
}
