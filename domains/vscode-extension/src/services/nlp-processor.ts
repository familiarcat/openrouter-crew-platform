/**
 * NLP Processor Service
 *
 * Natural Language Processing for intent detection and entity extraction.
 * Analyzes user prompts to automatically detect:
 * - Intent (ASK, REVIEW, DEBUG, GENERATE, etc.)
 * - Entities (functions, variables, classes)
 * - Code language
 * - Urgency/sentiment
 * - Context clues
 *
 * This enables automatic routing without explicit intent specification.
 */

import { Intent, Complexity } from './llm-router';

/**
 * Detected intent with confidence score
 */
export interface IntentDetection {
  intent: Intent;
  confidence: number;  // 0-1, higher is more confident
  reasoning: string;   // Why this intent was detected
  alternatives: Array<{ intent: Intent; confidence: number }>;
}

/**
 * Extracted entity from prompt
 */
export interface Entity {
  type: 'function' | 'variable' | 'class' | 'file' | 'method' | 'module';
  name: string;
  context?: string;
}

/**
 * NLP analysis result
 */
export interface NLPAnalysis {
  originalPrompt: string;
  intent: IntentDetection;
  entities: Entity[];
  language?: string;  // Programming language (javascript, python, etc.)
  urgency: 'low' | 'medium' | 'high';  // Based on keywords
  sentiment: 'neutral' | 'positive' | 'negative' | 'frustrated';
  keywords: string[];  // Extracted keywords
  complexity: Complexity;
  confidence: number;  // Overall analysis confidence
}

/**
 * NLP Processor for intent detection
 */
export class NLPProcessor {
  /**
   * Intent keyword mappings
   * Each intent has keywords that strongly indicate that intent
   */
  private intentKeywords: Record<Intent, string[]> = {
    REVIEW: [
      'review', 'analyze', 'critique', 'review this', 'look at',
      'check this', 'examine', 'audit', 'code review', 'feedback',
      'find issues', 'find bugs', 'identify problems'
    ],
    DEBUG: [
      'debug', 'fix', 'broken', 'not working', 'error', 'crash',
      'exception', 'issue', 'problem', 'why is', 'what\'s wrong',
      'broken', 'failing', 'fix this', 'what\'s the issue'
    ],
    REFACTOR: [
      'refactor', 'improve', 'clean up', 'simplify', 'rewrite',
      'restructure', 'reorganize', 'optimize', 'make better',
      'performance', 'efficiency', 'maintainability'
    ],
    GENERATE: [
      'generate', 'write', 'create', 'build', 'implement',
      'code', 'function', 'method', 'class', 'script',
      'make a', 'write a', 'create a'
    ],
    TEST: [
      'test', 'unit test', 'test case', 'testing', 'coverage',
      'write test', 'generate test', 'test for', 'test this'
    ],
    EXPLAIN: [
      'explain', 'what does', 'how does', 'clarify', 'understand',
      'meaning', 'purpose', 'how it works', 'describe', 'break down'
    ],
    DOCUMENT: [
      'document', 'docstring', 'comment', 'document this',
      'add documentation', 'add comments', 'describe'
    ],
    OPTIMIZE: [
      'optimize', 'faster', 'performance', 'efficiency', 'speed up',
      'improve speed', 'reduce memory', 'complexity'
    ],
    ASK: [
      'what', 'how', 'why', 'question', 'help', 'tell me',
      'explain', 'info', 'information'
    ],
  };

  /**
   * Urgency keywords
   */
  private urgencyKeywords: Record<'low' | 'medium' | 'high', string[]> = {
    high: ['urgent', 'asap', 'now', 'critical', 'immediately', 'emergency', 'blocking', 'production'],
    medium: ['soon', 'important', 'needed', 'next', 'priority'],
    low: [],
  };

  /**
   * Sentiment indicators
   */
  private sentimentKeywords: Record<'positive' | 'negative' | 'frustrated', string[]> = {
    positive: ['excellent', 'great', 'good', 'nice', 'awesome', 'perfect'],
    negative: ['bad', 'terrible', 'awful', 'horrible', 'wrong', 'broken'],
    frustrated: ['broken', 'why', 'wtf', 'frustrating', 'annoying', 'keeps failing'],
  };

  /**
   * Language detection patterns
   */
  private languagePatterns: Record<string, RegExp> = {
    javascript: /\b(function|const|let|var|async|await|=>|require|import|module\.exports)\b/i,
    typescript: /\b(interface|type|generic|as const|abstract|private|public|protected)\b/i,
    python: /\b(def|class|import|from|self|__init__|@|elif|except)\b/i,
    java: /\b(public|private|class|void|String|int|new|extends|implements)\b/i,
    csharp: /\b(using|namespace|async|await|Task|public|private|class)\b/i,
    go: /\b(func|package|import|defer|go|chan|interface)\b/i,
    rust: /\b(fn|let|mut|impl|trait|pub|async|await)\b/i,
    sql: /\b(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|JOIN|GROUP BY)\b/i,
  };

  /**
   * Analyze a prompt for intent, entities, and other NLP features
   */
  analyze(prompt: string, context?: { selectedCode?: string }): NLPAnalysis {
    const lowerPrompt = prompt.toLowerCase();

    // Detect intent
    const intent = this.detectIntent(prompt);

    // Extract entities
    const entities = this.extractEntities(prompt, context?.selectedCode);

    // Detect language
    const language = this.detectLanguage(prompt, context?.selectedCode);

    // Detect urgency
    const urgency = this.detectUrgency(prompt);

    // Detect sentiment
    const sentiment = this.detectSentiment(prompt);

    // Extract keywords
    const keywords = this.extractKeywords(prompt);

    // Estimate complexity
    const complexity = this.estimateComplexity(prompt, context?.selectedCode);

    // Overall confidence
    const confidence = Math.min(
      intent.confidence,
      Math.max(0.5, 1 - entities.length * 0.1)
    );

    return {
      originalPrompt: prompt,
      intent,
      entities,
      language,
      urgency,
      sentiment,
      keywords,
      complexity,
      confidence,
    };
  }

  /**
   * Detect intent from prompt
   */
  private detectIntent(prompt: string): IntentDetection {
    const lowerPrompt = prompt.toLowerCase();
    const scores: Record<Intent, number> = {
      ASK: 0,
      REVIEW: 0,
      DEBUG: 0,
      GENERATE: 0,
      REFACTOR: 0,
      TEST: 0,
      EXPLAIN: 0,
      DOCUMENT: 0,
      OPTIMIZE: 0,
    };

    // Score each intent based on keyword matches
    for (const [intent, keywords] of Object.entries(this.intentKeywords)) {
      for (const keyword of keywords) {
        if (lowerPrompt.includes(keyword)) {
          scores[intent as Intent] += 1;
        }
      }
    }

    // Normalize scores
    const maxScore = Math.max(...Object.values(scores));
    const normalizedScores: Record<Intent, number> = {} as Record<Intent, number>;

    for (const [intent, score] of Object.entries(scores)) {
      normalizedScores[intent as Intent] = maxScore > 0 ? score / maxScore : 0;
    }

    // Find top intent
    const topIntent = (Object.entries(normalizedScores).sort(
      ([, a], [, b]) => b - a
    )[0][0]) as Intent;

    // If no clear intent, default to ASK
    const topScore = normalizedScores[topIntent];
    const selectedIntent = topScore > 0.2 ? topIntent : 'ASK';
    const confidence = selectedIntent === topIntent ? topScore : 0.5;

    // Get alternatives
    const alternatives = (Object.entries(normalizedScores) as Array<[Intent, number]>)
      .filter(([intent]) => intent !== selectedIntent)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2)
      .map(([intent, score]) => ({ intent, confidence: score }));

    return {
      intent: selectedIntent,
      confidence: Math.min(confidence, 1),
      reasoning: `Detected from keywords. Top matches: ${
        Object.entries(normalizedScores)
          .filter(([, s]) => s > 0.2)
          .map(([i]) => i)
          .join(', ')
      }`,
      alternatives,
    };
  }

  /**
   * Extract entities from prompt and code context
   */
  private extractEntities(
    prompt: string,
    selectedCode?: string
  ): Entity[] {
    const entities: Entity[] = [];
    const combined = selectedCode ? `${prompt} ${selectedCode}` : prompt;

    // Function names (common patterns)
    const functionMatches = combined.matchAll(
      /\b([a-z_][a-z0-9_]*)\s*\(/gi
    );
    for (const match of functionMatches) {
      const name = match[1];
      if (!this.isCommonWord(name)) {
        entities.push({
          type: 'function',
          name,
          context: 'function call detected',
        });
      }
    }

    // Variable names (camelCase or snake_case)
    const varMatches = combined.matchAll(
      /\b([a-z_][a-z0-9_]*)\b(?!\()/gi
    );
    for (const match of varMatches) {
      const name = match[1];
      if (!this.isCommonWord(name) && name.length > 2) {
        entities.push({
          type: 'variable',
          name,
        });
      }
    }

    // Class names (PascalCase)
    const classMatches = combined.matchAll(/\b([A-Z][a-zA-Z0-9]*)\b/g);
    for (const match of classMatches) {
      const name = match[1];
      if (name.length > 2) {
        entities.push({
          type: 'class',
          name,
        });
      }
    }

    // File references
    const fileMatches = combined.matchAll(
      /\b([a-z0-9_-]+\.(js|ts|py|java|cs|go|rs|sql|jsx|tsx))\b/gi
    );
    for (const match of fileMatches) {
      entities.push({
        type: 'file',
        name: match[1],
      });
    }

    // Deduplicate entities
    const uniqueEntities = Array.from(
      new Map(
        entities.map(e => [
          `${e.type}:${e.name.toLowerCase()}`,
          e,
        ])
      ).values()
    );

    return uniqueEntities.slice(0, 10);  // Cap at 10 entities
  }

  /**
   * Detect programming language from code or keywords
   */
  private detectLanguage(
    prompt: string,
    selectedCode?: string
  ): string | undefined {
    const combined = selectedCode ? `${prompt} ${selectedCode}` : prompt;

    const scores: Record<string, number> = {};

    for (const [lang, pattern] of Object.entries(this.languagePatterns)) {
      const matches = combined.match(pattern);
      scores[lang] = matches ? matches.length : 0;
    }

    const topLang = Object.entries(scores).sort(([, a], [, b]) => b - a)[0];
    return topLang && topLang[1] > 0 ? topLang[0] : undefined;
  }

  /**
   * Detect urgency from keywords
   */
  private detectUrgency(prompt: string): 'low' | 'medium' | 'high' {
    const lower = prompt.toLowerCase();

    if (
      this.urgencyKeywords.high.some(keyword =>
        lower.includes(keyword)
      )
    ) {
      return 'high';
    }

    if (
      this.urgencyKeywords.medium.some(keyword =>
        lower.includes(keyword)
      )
    ) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Detect sentiment from keywords
   */
  private detectSentiment(
    prompt: string
  ): 'neutral' | 'positive' | 'negative' | 'frustrated' {
    const lower = prompt.toLowerCase();

    if (this.sentimentKeywords.frustrated.some(k => lower.includes(k))) {
      return 'frustrated';
    }

    if (this.sentimentKeywords.negative.some(k => lower.includes(k))) {
      return 'negative';
    }

    if (this.sentimentKeywords.positive.some(k => lower.includes(k))) {
      return 'positive';
    }

    return 'neutral';
  }

  /**
   * Extract important keywords from prompt
   */
  private extractKeywords(prompt: string): string[] {
    const lowerPrompt = prompt.toLowerCase();
    const keywords: Set<string> = new Set();

    // Extract words > 3 chars that aren't common
    const words = prompt.match(/\b\w{4,}\b/g) || [];
    for (const word of words) {
      if (!this.isCommonWord(word.toLowerCase())) {
        keywords.add(word.toLowerCase());
      }
    }

    // Add technical keywords found
    for (const keyword of Object.values(this.intentKeywords).flat()) {
      if (lowerPrompt.includes(keyword)) {
        keywords.add(keyword);
      }
    }

    return Array.from(keywords).slice(0, 10);
  }

  /**
   * Estimate complexity from prompt and context
   */
  private estimateComplexity(
    prompt: string,
    selectedCode?: string
  ): Complexity {
    let score = 0;

    // Length-based scoring
    if (prompt.length > 2000) score += 2;
    else if (prompt.length > 500) score += 1;

    // Code context size
    if (selectedCode) {
      const lines = selectedCode.split('\n').length;
      if (lines > 100) score += 2;
      else if (lines > 30) score += 1;
    }

    // Complex keywords
    const complexKeywords = [
      'algorithm', 'architecture', 'performance', 'optimization',
      'race condition', 'async', 'concurrent', 'distributed',
      'security', 'encryption', 'design pattern'
    ];
    const lowerPrompt = prompt.toLowerCase();
    const complexMatches = complexKeywords.filter(k =>
      lowerPrompt.includes(k)
    ).length;
    score += complexMatches;

    if (score >= 5) return 'HIGH';
    if (score >= 2) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Check if a word is a common English word (to avoid noise)
   */
  private isCommonWord(word: string): boolean {
    const commonWords = new Set([
      'the', 'and', 'or', 'not', 'is', 'are', 'was', 'were',
      'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
      'did', 'will', 'would', 'could', 'should', 'may', 'might',
      'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he',
      'she', 'it', 'we', 'they', 'what', 'which', 'who', 'when',
      'where', 'why', 'how', 'all', 'each', 'every', 'both',
      'any', 'some', 'no', 'none', 'if', 'then', 'else', 'as',
      'in', 'on', 'at', 'to', 'from', 'of', 'for', 'with', 'by',
      'there', 'here', 'now', 'then', 'my', 'your', 'his', 'her',
      'our', 'their', 'a', 'an', 'but', 'get', 'set', 'use', 'add'
    ]);
    return commonWords.has(word.toLowerCase());
  }
}
