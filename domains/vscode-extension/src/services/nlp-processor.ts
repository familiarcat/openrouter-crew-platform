import { Intent, Complexity } from './llm-router.js';

export interface Entity {
  type: 'FILE' | 'FUNCTION' | 'CLASS' | 'VARIABLE' | 'UNKNOWN';
  name: string;
  position?: { start: number; end: number };
}

export interface DetectedIntent {
  intent: Intent;
  confidence: number;
  entities: Entity[];
  complexity: Complexity;
  suggestedModel: string;
}

export class NLPProcessor {
  
  /**
   * Detects the intent of a user prompt using keyword analysis and heuristics.
   */
  async detectIntent(prompt: string): Promise<DetectedIntent> {
    const lowerPrompt = prompt.toLowerCase();
    let intent: Intent = 'ASK';
    let confidence = 0.5;

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
    const complexity = await this.analyzeComplexity(intent, entities, prompt);

    return {
      intent,
      confidence,
      entities,
      complexity,
      suggestedModel: this.suggestModel(intent, complexity)
    };
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
  async analyzeComplexity(intent: Intent, entities: Entity[], prompt: string): Promise<Complexity> {
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
}