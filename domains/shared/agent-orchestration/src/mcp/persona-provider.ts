import fs from 'fs';
import path from 'path';

/**
 * PersonaProvider facilitates the dynamic injection of Star Trek crew identities
 * into MCP server system prompts, ensuring agents adhere to the Dark Forest Protocol.
 */
export class PersonaProvider {
  // Path relative to this package's location in the monorepo
  private static identitiesPath = path.resolve(__dirname, '../../../crew-identities.md');

  /**
   * Fetches the specific persona section for a crew member and wraps it in apriori context tags.
   * @param systemId The unique identifier (e.g., 'captain_picard') defined in crew-identities.md
   */
  static getSystemPrompt(systemId: string): string {
    try {
      // Fallback for development/production environment pathing
      const targetPath = fs.existsSync(this.identitiesPath) 
        ? this.identitiesPath 
        : path.join(process.cwd(), 'domains/shared/crew-identities.md');

      if (!fs.existsSync(targetPath)) {
        console.warn(`[PersonaProvider] Identities file not found at ${targetPath}`);
        return `You are an AI agent with system ID: ${systemId}.`;
      }

      const content = fs.readFileSync(targetPath, 'utf-8');
      
      // Regex to find the section starting with the number/name and containing the specific System ID
      const regex = new RegExp(`## \\d+\\.\\s+.*\\n- \\*\\*System ID:\\*\\* \`${systemId}\`([\\s\\S]*?)(?=\\n## |\\n---)`, 'g');
      const match = regex.exec(content);

      if (!match) {
        throw new Error(`Identity '${systemId}' not found in crew-identities.md`);
      }

      const personaBody = match[0].trim();

      return `
<apriori_context>
You are part of a specialized crew. 
${personaBody}

You must remain in character and prioritize your assigned domain while collaborating in the Observation Lounge.
</apriori_context>
`.trim();
    } catch (error) {
      console.error(`[PersonaProvider] Error loading persona for ${systemId}:`, error);
      return `You are the ${systemId} agent. Coordinate with the crew to maintain the Three-Body balance.`;
    }
  }
}