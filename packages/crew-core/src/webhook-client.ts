/**
 * Webhook Client
 *
 * HTTP client for calling n8n crew member webhooks
 * Based on patterns from all projects
 */

import { CrewRequest, CrewResponse } from './types';
import { getCrewMember } from './members';

export interface WebhookConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
}

export class CrewWebhookClient {
  private config: WebhookConfig;

  constructor(config: WebhookConfig) {
    this.config = {
      timeout: 30000,
      ...config
    };
  }

  /**
   * Call a crew member's webhook
   */
  async call(request: CrewRequest): Promise<CrewResponse> {
    const member = getCrewMember(request.crewMember);
    if (!member) {
      throw new Error(`Unknown crew member: ${request.crewMember}`);
    }

    const webhookUrl = member.webhookUrl || this.buildWebhookUrl(member.name);
    const startTime = Date.now();

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'X-N8N-API-KEY': this.config.apiKey })
        },
        body: JSON.stringify({
          project_id: request.projectId,
          message: request.message,
          context: request.context || {},
          max_tokens: request.maxTokens,
          temperature: request.temperature
        }),
        signal: AbortSignal.timeout(this.config.timeout!)
      });

      if (!response.ok) {
        throw new Error(`Webhook call failed: ${response.statusText}`);
      }

      const data = await response.json();
      const executionTime = Date.now() - startTime;

      return {
        crewMember: request.crewMember,
        content: data.content || data.response || '',
        model: data.model || member.defaultModel,
        tokensUsed: data.tokens_used || data.total_tokens || 0,
        estimatedCost: data.estimated_cost || data.cost || 0,
        executionTime,
        metadata: data.metadata || {}
      };
    } catch (error) {
      throw new Error(
        `Failed to call crew member ${request.crewMember}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Build webhook URL from crew member name
   */
  private buildWebhookUrl(crewMemberName: string): string {
    return `${this.config.baseUrl}/webhook/crew-${crewMemberName}`;
  }

  /**
   * Test connectivity to a crew member webhook
   */
  async testConnection(crewMemberName: string): Promise<boolean> {
    try {
      const member = getCrewMember(crewMemberName);
      if (!member) return false;

      const webhookUrl = member.webhookUrl || this.buildWebhookUrl(member.name);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'X-N8N-API-KEY': this.config.apiKey })
        },
        body: JSON.stringify({
          test: true,
          message: 'Connection test'
        }),
        signal: AbortSignal.timeout(5000)
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}
