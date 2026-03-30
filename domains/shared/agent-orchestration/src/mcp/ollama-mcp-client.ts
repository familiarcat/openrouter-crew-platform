import { TriageResult } from './claude-with-crew.js';

/**
 * OllamaMCPClient facilitates local-first triage and meta-prompting.
 * By using a local LLM (like Llama 3.1), we eliminate the token cost 
 * of routing decisions and prompt expansion.
 */
export class OllamaMCPClient {
  private baseUrl: string;
  private model: string;

  constructor(options: { baseUrl?: string; model?: string } = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:11434';
    this.model = options.model || 'llama3.1';
  }

  /**
   * Health check to see if Ollama is running locally.
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Performs the triage pass locally using Ollama.
   */
  async triageTask(problem: string): Promise<TriageResult | null> {
    try {
      const systemPrompt = 'You are the Crew Triage Controller. Analyze the task and return a JSON object with: agentId (captain_picard, commander_data, worf, geordi_la_forge, counselor_troi, crusher, quark, uhura, chief_obrien, commander_riker), complexity (LOW, MEDIUM, HIGH), and recommendedModel (haiku, sonnet, opus).';
      
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: problem }
          ],
          stream: false,
          format: 'json'
        })
      });

      if (!response.ok) return null;

      const result = await response.json();
      const content = result.message?.content;

      if (!content) return null;

      // Ensure we parse the JSON correctly as Llama sometimes wraps in markdown blocks
      const jsonContent = content.includes('```json') 
        ? content.split('```json')[1].split('```')[0] 
        : content;

      return JSON.parse(jsonContent.trim()) as TriageResult;
    } catch (error) {
      console.error('[OllamaMCPClient] Triage failed:', error);
      return null;
    }
  }
}