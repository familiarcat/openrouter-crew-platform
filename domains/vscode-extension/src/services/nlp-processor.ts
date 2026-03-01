import { Intent, Complexity, LLMRequest, LLMRouter } from './llm-router.js';

export interface Entity {
  type: 'FILE' | 'FUNCTION' | 'CLASS' | 'VARIABLE' | 'UNKNOWN';
  name: string;
  position?: { start: number; end: number };
}

export interface DetectedIntent {
  intent: Intent;
  confidence: number;
  entities: Entity[];
  keywords: string[];
  complexity: Complexity;
  suggestedModel: string;
  /**
   * The Saussurean "Signified" - a stable, structural representation of the user's intent (Signifier).
   */
  canonicalForm: string;
}

export class NLPProcessor {

  constructor(private llmRouter?: LLMRouter) {}
  
  /**
   * Detects the intent of a user prompt using keyword analysis and heuristics.
   */
  async detectIntent(prompt: string): Promise<DetectedIntent> {
    const lowerPrompt = prompt.toLowerCase();
    let intent: Intent = 'ASK';
    let confidence = 0.5;
    const keywords: string[] = [];

    // Keyword matching heuristics
    if (/\b(fix|debug|error|issue|bug|fail|crash|exception)\b/.test(lowerPrompt)) {
      intent = 'DEBUG';
      confidence = 0.9;
    } else if (/\b(test|spec|unit test|coverage)\b/.test(lowerPrompt)) {
      intent = 'TEST';
      confidence = 0.9;
    } else if (/\b(explain|what does|how does|understand|meaning)\b/.test(lowerPrompt)) {
      intent = 'EXPLAIN';
      confidence = 0.85;
    } else if (/\b(refactor|improve|clean up|structure|rewrite)\b/.test(lowerPrompt)) {
      intent = 'REFACTOR';
      confidence = 0.8;
    } else if (/\b(optimize|faster|performance|speed|memory)\b/.test(lowerPrompt)) {
      intent = 'OPTIMIZE';
      confidence = 0.85;
    } else if (/\b(review|analyze|check|audit|critique)\b/.test(lowerPrompt)) {
      intent = 'REVIEW';
      confidence = 0.8;
    } else if (/\b(generate|create|write|make|implement|scaffold)\b/.test(lowerPrompt)) {
      intent = 'GENERATE';
      confidence = 0.8;
    } else if (/\b(doc|comment|document|jsdoc|tsdoc)\b/.test(lowerPrompt)) {
      intent = 'DOCUMENT';
      confidence = 0.9;
    } else if (/\b(complete|finish)\b/.test(lowerPrompt)) {
      intent = 'COMPLETE';
      confidence = 0.7;
    }

    const entities = await this.extractEntities(prompt);

    // If confidence is low and we have the router, use AI to classify
    if (confidence < 0.7 && this.llmRouter) {
        return this.detectIntentWithAI(prompt, entities);
    }

    const complexity = this.analyzeComplexity(intent, entities, prompt);

    // Construct the Canonical Form (The Signified)
    // Example: "DEBUG :: FILE(app.ts) + FUNCTION(processData)"
    const entityString = entities.length > 0 ? entities.map(e => `${e.type}(${e.name})`).join(' + ') : 'GLOBAL';
    const canonicalForm = `${intent} :: ${entityString}`;

    return {
      intent,
      confidence,
      entities,
      keywords,
      complexity,
      suggestedModel: this.suggestModel(intent, complexity),
      canonicalForm
    };
  }

  /**
   * Uses the LLM Router to detect intent with higher accuracy.
   */
  private async detectIntentWithAI(prompt: string, entities: Entity[]): Promise<DetectedIntent> {
      if (!this.llmRouter) throw new Error("LLMRouter not initialized in NLPProcessor");

      const systemPrompt = `
You are an intent classification engine for a coding assistant.
Classify the user's prompt into one of these intents:
ASK, REVIEW, EXPLAIN, REFACTOR, GENERATE, DEBUG, TEST, DOCUMENT, COMPLETE, OPTIMIZE.

Return ONLY a JSON object:
{
  "intent": "INTENT_NAME",
  "confidence": 0.95,
  "complexity": "LOW" | "MEDIUM" | "HIGH"
}
`;

      try {
          const response = await this.llmRouter.route({
              prompt: `${systemPrompt}\n\nUser Prompt: "${prompt}"`,
              intent: 'ASK', // Meta-intent
              complexity: 'LOW'
          });

          const result = JSON.parse(response.content.replace(/```json|```/g, '').trim());
          
          // Re-extract entities as they are structural
          const extractedEntities = await this.extractEntities(prompt);
          const entityString = extractedEntities.length > 0 ? extractedEntities.map(e => `${e.type}(${e.name})`).join(' + ') : 'GLOBAL';

          return {
              intent: result.intent,
              confidence: result.confidence,
              entities: extractedEntities,
              keywords: [],
              complexity: result.complexity,
              suggestedModel: this.suggestModel(result.intent, result.complexity),
              canonicalForm: `${result.intent} :: ${entityString}`
          };
      } catch (e) {
          // Fallback to default if AI fails
          return {
              intent: 'ASK',
              confidence: 0.5,
              entities: [],
              keywords: [],
              complexity: 'MEDIUM',
              suggestedModel: 'google/gemini-flash-1.5',
              canonicalForm: 'ASK :: GLOBAL'
          };
      }
  }

  /**
   * Extracts relevant entities (files, functions) from the prompt.
   */
  async extractEntities(prompt: string): Promise<Entity[]> {
    const entities: Entity[] = [];
    
    // Regex for file extensions
    const fileRegex = /\b[\w-]+\.(ts|js|py|java|go|rs|md|json|html|css)\b/g;
    let match;
    while ((match = fileRegex.exec(prompt)) !== null) {
      entities.push({ type: 'FILE', name: match[0], position: { start: match.index, end: match.index + match[0].length } });
    }

    // Regex for potential function calls or camelCase variables
    const codeEntityRegex = /\b[a-z][a-zA-Z0-9]*\([^\)]*\)/g;
    while ((match = codeEntityRegex.exec(prompt)) !== null) {
      entities.push({ type: 'FUNCTION', name: match[0], position: { start: match.index, end: match.index + match[0].length } });
    }

    return entities;
  }

  /**
   * Analyzes the complexity of the request.
   */
  analyzeComplexity(intent: Intent, entities: Entity[], prompt: string): Complexity {
    if (intent === 'DEBUG' || intent === 'REFACTOR' || intent === 'OPTIMIZE') return 'HIGH';
    if (prompt.length > 1000) return 'HIGH';
    if (prompt.length > 300 || entities.length > 2) return 'MEDIUM';
    return 'LOW';
  }

  private suggestModel(intent: Intent, complexity: Complexity): string {
    if (intent === 'REVIEW') return 'gpt-4-turbo';
    if (intent === 'DEBUG' || complexity === 'HIGH' || complexity === 'MEDIUM') return 'claude-3-5-sonnet';
    return 'gemini-flash-1.5';
  }

  /**
   * Prepares an LLMRequest from a raw prompt
   */
  async prepareRequest(prompt: string, context?: any): Promise<LLMRequest> {
      const detection = await this.detectIntent(prompt);
      
      return {
          prompt,
          intent: detection.intent,
          complexity: detection.complexity,
          files: context?.files,
          canonicalForm: detection.canonicalForm
      };
  }
}