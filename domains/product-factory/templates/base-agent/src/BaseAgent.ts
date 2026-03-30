/**
 * BaseAgent — shared foundation for all OpenRouter Crew agents
 * Extend this class to create domain-specific agents.
 *
 * Architecture: March 2026 best practices
 *  - XML-delimited prompts via buildSystemPrompt()
 *  - Complexity-based model routing
 *  - OpenRouter as the LLM gateway
 *  - MCP SDK for tool registration
 */
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from 'pg';
import winston from 'winston';

export interface AgentConfig {
  name: string;
  role: string;
  openrouterApiKey: string;
  supabaseUrl?: string;
  dbConnectionString?: string;
  budgetLimitUSD?: number;
}

export interface AgentMessage {
  role: 'user' | 'assistant';
  content: string;
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()]
});

export abstract class BaseAgent {
  protected config: AgentConfig;
  protected client: Anthropic;
  protected conversationHistory: AgentMessage[] = [];
  protected totalCostUSD = 0;

  // Override in subclass to define the agent's expertise
  protected abstract get agentExpertise(): string;
  protected abstract get agentCapabilities(): string[];

  constructor(config: AgentConfig) {
    this.config = config;
    this.client = new Anthropic({
      apiKey: config.openrouterApiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://github.com/familiarcat/openrouter-crew-platform',
        'X-Title': `Crew Agent: ${config.name}`,
      }
    });
  }

  /**
   * Build XML-delimited system prompt (2026 best practice)
   * Subclasses can override to extend.
   */
  protected buildSystemPrompt(): string {
    return `<system_role>
You are ${this.config.name}, a specialised AI agent in the OpenRouter Crew platform.
Role: ${this.config.role}
Expertise: ${this.agentExpertise}
</system_role>

<capabilities>
${this.agentCapabilities.map(c => `- ${c}`).join('\n')}
</capabilities>

<behaviour>
- Think step-by-step before responding (chain-of-thought)
- State your reasoning before your conclusion
- If uncertain, say so and propose alternatives
- Keep responses structured and actionable
- When generating code, follow TypeScript strict mode conventions
</behaviour>

<output_format>
Structure responses with clear sections.
Use JSON for structured data, Markdown for documents.
</output_format>`;
  }

  /**
   * Route to cheapest model that can handle the task
   * Based on complexity scoring (March 2026 pattern)
   */
  protected selectModel(prompt: string): string {
    const len = prompt.length;
    const hasCode = /```|function|class|interface/.test(prompt);
    const hasReasoning = /why|explain|analyse|compare|design/.test(prompt.toLowerCase());
    const complexityScore = (len > 2000 ? 0.4 : 0.1) + (hasCode ? 0.3 : 0) + (hasReasoning ? 0.3 : 0);

    if (complexityScore < 0.3) return 'anthropic/claude-haiku-4-5';
    if (complexityScore < 0.7) return 'anthropic/claude-sonnet-4-5';
    return 'anthropic/claude-sonnet-4-5';
  }

  /**
   * Core chat method with budget tracking
   */
  async chat(userMessage: string): Promise<string> {
    if (this.config.budgetLimitUSD && this.totalCostUSD >= this.config.budgetLimitUSD) {
      throw new Error(`Budget limit $${this.config.budgetLimitUSD} reached`);
    }

    const model = this.selectModel(userMessage);
    this.conversationHistory.push({ role: 'user', content: userMessage });

    const response = await this.client.messages.create({
      model,
      max_tokens: 4096,
      system: this.buildSystemPrompt(),
      messages: this.conversationHistory.map(m => ({
        role: m.role,
        content: m.content
      }))
    });

    const content = response.content[0];
    const text = content.type === 'text' ? content.text : '';

    this.conversationHistory.push({ role: 'assistant', content: text });

    // Cost tracking (rough estimates)
    const tokIn = response.usage.input_tokens;
    const tokOut = response.usage.output_tokens;
    const costPer1K = model.includes('haiku') ? 0.00025 : 0.003;
    this.totalCostUSD += (tokIn + tokOut) * costPer1K / 1000;

    logger.info('Agent response', {
      agent: this.config.name,
      model,
      tokIn,
      tokOut,
      totalCostUSD: this.totalCostUSD
    });

    return text;
  }

  getCostSummary() {
    return {
      agent: this.config.name,
      totalCostUSD: this.totalCostUSD,
      turns: this.conversationHistory.length / 2
    };
  }
}
