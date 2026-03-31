import { ToolDefinition } from '../services/types';

/**
 * fsTools
 * Standard file system tools for agents, enforcing the Dark Forest Protocol.
 */
export const fsTools: ToolDefinition[] = [
    {
        schema: {
            function: {
                name: 'propose_change',
                description: 'Propose a change to a file for human review. This is the required method for modifying existing files or creating new ones.',
                parameters: {
                    type: 'object',
                    properties: {
                        path: { type: 'string', description: 'Relative path to the file within the workspace' },
                        content: { type: 'string', description: 'The complete new content of the file' },
                        estimatedCost: { type: 'number', description: 'Optional cost metadata' }
                    },
                    required: ['path', 'content']
                }
            }
        },
        execute: async (args, agent, deps) => {
            const { path, content, estimatedCost } = args;
            // Use ProposeChangeService instead of direct fileManager write
            const accepted = await deps.proposeChangeService.propose(path, content, estimatedCost);
            return accepted ? `Success: Changes applied to ${path}` : `Rejected: Changes to ${path} were not applied by the user.`;
        }
    }
];