import OpenAI from 'openai';
import { OllamaMCPClient } from './ollama-mcp-client.js';
import { PersonaProvider } from './persona-provider.js';
import { TriageResult } from './claude-with-crew.js';

export interface MissionBrief {
  refinedPrompt: string;
  selectedModel: string;
  agentId: string;
  agentPersona: string;
  complexity: 'LOW' | 'MEDIUM' | 'HIGH';
}

/**
 * Layer 2 (Infrastructure) Service: PromptManager
 * Centralizes the "Prompt Architect" logic to ensure LLM Agnosticism
 * and cost-optimization across all entry points.
 */
export class PromptManager {
  constructor(
    private openai: OpenAI,
    private ollama: OllamaMCPClient
  ) {}

  /**
   * Dual-Pass Architecture:
   * 1. Triage (Who handles this?)
   * 2. Refinement (How should they handle it?)
   */
  async architectMission(problem: string, projectId?: string): Promise<MissionBrief> {
    // Pass 1: Triage
    const triage = await this.getTriage(problem);
    
    // Pass 2: Local Refinement (Cost-Free Prompt Engineering)
    const refinedPrompt = await this.ollama.refinePrompt(problem, triage);
    
    // Pass 3: Persona Loading
    const agentPersona = PersonaProvider.getSystemPrompt(triage.agentId);

    // Pass 4: Model Mapping (Three-Body Balance)
    const modelMap: Record<string, string> = {
      'cheap': process.env.MODEL_CHEAP || 'anthropic/claude-3-haiku',
      'balanced': process.env.MODEL_MID || 'anthropic/claude-3.5-sonnet',
      'powerful': process.env.MODEL_POWERFUL || 'anthropic/claude-3-opus'
    };

    return {
      refinedPrompt,
      agentId: triage.agentId,
      agentPersona,
      complexity: triage.complexity,
      selectedModel: modelMap[triage.recommendedModel.toLowerCase()] || modelMap.balanced
    };
  }

  private async getTriage(problem: string): Promise<TriageResult> {
    // Prefer local Ollama for Triage to hit $0 decision cost
    if (process.env.USE_LOCAL_TRIAGE === 'true') {
      const isAvailable = await this.ollama.isAvailable();
      if (isAvailable) {
        const localTriage = await this.ollama.triageTask(problem);
        if (localTriage) return localTriage;
      }
    }

    // Fallback to Gemini Flash (Ultra-cheap cloud triage)
    const response = await this.openai.chat.completions.create({
      model: 'google/gemini-flash-1.5',
      messages: [
        { 
          role: 'system', 
          content: 'You are the Crew Triage Controller. Analyze the task and return a JSON object with: agentId (captain_picard, commander_data, worf, geordi_la_forge, counselor_troi, crusher, quark, uhura, chief_obrien, commander_riker), complexity (LOW, MEDIUM, HIGH), and recommendedModel (cheap, balanced, powerful). Any task requiring file manipulation (read/write/edit) must be classified as HIGH complexity and assigned to geordi_la_forge or chief_obrien.' 
        },
        { role: 'user', content: problem }
      ],
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    // Default to Picard if triage fails
    return { agentId: result.agentId || 'captain_picard', complexity: result.complexity || 'MEDIUM', recommendedModel: result.recommendedModel || 'balanced' };
  }
}