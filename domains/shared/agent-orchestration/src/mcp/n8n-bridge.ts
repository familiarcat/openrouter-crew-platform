import { z } from 'zod';

// Helper to convert Zod schema to JSON Schema (simplified for this context)
// In a full implementation, consider using 'zod-to-json-schema'
function zodToJsonSchema(schema: z.ZodType<any>): any {
  // Basic reflection for demonstration; enables the LLM to see parameter structure
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape;
    const properties: any = {};
    const required: string[] = [];
    
    for (const [key, value] of Object.entries(shape)) {
      properties[key] = { type: 'string', description: (value as any).description };
      if (!(value as any).isOptional()) required.push(key);
    }
    
    return {
      type: 'object',
      properties,
      required
    };
  }
  return { type: 'object' };
}

export interface N8nWorkflowConfig {
  id: string;
  name: string;
  description: string;
  webhookUrl: string;
  schema: z.ZodObject<any>;
}

/**
 * Bridges the gap between sovereign MCP agents and deterministic n8n workflows.
 * Allows agents to "see" and "trigger" workflows as if they were native tools.
 */
export class N8nBridge {
  /**
   * Converts an n8n workflow definition into an MCP Tool structure
   */
  static toTool(config: N8nWorkflowConfig) {
    return {
      name: config.name,
      description: `[Automation] ${config.description} (Executes via n8n)`,
      inputSchema: zodToJsonSchema(config.schema),
      handler: async (args: any) => {
        console.log(`[N8nBridge] Triggering workflow: ${config.id}`);
        
        try {
          const response = await fetch(config.webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Webhook-Secret': process.env.N8N_WEBHOOK_SECRET || '',
            },
            body: JSON.stringify(args)
          });

          if (!response.ok) {
            throw new Error(`n8n responded with ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  status: 'success',
                  workflowId: config.id,
                  result: data
                }, null, 2)
              }
            ]
          };
        } catch (error: any) {
          console.error(`[N8nBridge] Error executing ${config.id}:`, error);
          return {
            content: [
              {
                type: "text",
                text: `Failed to execute workflow '${config.name}'. Error: ${error.message}`
              }
            ],
            isError: true
          };
        }
      }
    };
  }
}