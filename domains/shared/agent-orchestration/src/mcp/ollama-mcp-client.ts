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

  /**
   * Phase 1.5: Local Prompt Engineering (The Prompt Architect)
   * Transforms raw user problems into detailed engineering briefs locally.
   */
  async refinePrompt(problem: string, triage: TriageResult): Promise<string> {
    try {
      const architectPrompt = `
<system_role>
You are the Crew Prompt Architect. Your goal is to expand a user task into a high-fidelity technical execution brief.
</system_role>

<context>
Target Agent: ${triage.agentId}
Complexity Level: ${triage.complexity}
Character Personas: Reflected in domains/shared/crew-identities.md
</context>

<task>
Refine the user problem into a structured command. Use technical Star Trek terminology where appropriate.
Include specific execution steps and expected output formats.
Return ONLY a JSON object with the key "refined_prompt".
</task>

<few_shot_example>
User Input: "Deploy the latest dashboard build to production."
Target Agent: chief_obrien
JSON Output: {
  "refined_prompt": "CHIEF O'BRIEN: Initiating deployment sequence for Unified Dashboard. 1. Run Level 4 diagnostic on current production containers to establish baseline telemetry. 2. Re-route traffic through the standby ALB buffer to ensure zero-downtime transition. 3. Purge the CloudFront plasma conduits (CDN cache invalidation). 4. Inject the standalone container image into the ECS Fargate clusters. 5. Monitor logs for any heap-memory fluctuations or handshake failures. Report readiness status to the bridge once throughput stabilizes."
}
</few_shot_example>
<few_shot_example>
User Input: "Generate a lead-capture strategy for a new STL restaurant."
Target Agent: quark
JSON Output: {
  "refined_prompt": "QUARK: Analyzing the Latinum-flow for the STL market. 1. Use Data Agent to scrape local hospitality permits for the 'Awareness' stage leads. 2. Design a 'Consideration' funnel using Counselor Troi's sentiment analysis on competitor reviews. 3. Architect an automated 'Action' trigger via n8n that delivers a personalized ROI-based business plan to the lead. 4. Ensure the total token cost per outreach remains under 500 units to preserve our margins."
}
</few_shot_example>
`;

      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: architectPrompt },
            { role: 'user', content: problem }
          ],
          stream: false,
          format: 'json'
        })
      });

      if (!response.ok) return problem;
      const result = await response.json();
      return JSON.parse(result.message?.content || '{}').refined_prompt || problem;
    } catch (error) {
      console.error('[OllamaMCPClient] Refinement failed:', error);
      return problem;
    }
  }
}