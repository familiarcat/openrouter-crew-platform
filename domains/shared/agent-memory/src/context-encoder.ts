/**
 * Context Encoder
 * Extracts key features from context strings (like edge detection in neural networks)
 * Converts raw text into structured features for memory retrieval
 */

import {
  EncodedContext,
  MemoryIntent,
  MemoryDomain,
} from './types';
import * as crypto from 'crypto';

/**
 * English stopwords to filter out
 */
const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'are', 'was', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'can', 'it', 'that', 'this', 'as',
  'if', 'so', 'because', 'then', 'which', 'who', 'what', 'where', 'when',
  'why', 'how', 'all', 'each', 'every', 'both', 'neither', 'either'
]);

/**
 * Domain-specific keyword patterns
 */
const DOMAIN_PATTERNS: Record<MemoryDomain, RegExp> = {
  typescript: /\b(typescript|ts|interface|type|generic|async|await|promise|type\s+guard)\b/gi,
  react: /\b(react|component|hook|use[a-z]+|jsx|state|props|effect|render|virtual)\b/gi,
  database: /\b(sql|query|table|schema|migration|index|join|aggregate|transaction)\b/gi,
  api: /\b(endpoint|rest|graphql|fetch|request|response|status|header|payload)\b/gi,
  cost: /\b(cost|budget|token|price|expense|spending|charge|bill)\b/gi,
  architecture: /\b(architecture|pattern|design|structure|module|layer|domain|boundary)\b/gi,
  general: /./gi,
};

/**
 * Intent pattern matching
 */
const INTENT_PATTERNS: Record<MemoryIntent, RegExp> = {
  generation: /\b(generate|create|write|make|build|produce|output|new)\b/gi,
  analysis: /\b(analyze|analyze|check|test|validate|verify|inspect|examine)\b/gi,
  debugging: /\b(debug|error|fix|bug|issue|problem|fail|wrong|incorrect)\b/gi,
  planning: /\b(plan|strategy|approach|design|implement|how\s+to|best\s+practice)\b/gi,
  communication: /\b(explain|describe|document|clarify|tell|show|display|list)\b/gi,
};

export class ContextEncoder {
  /**
   * Encode a raw context string into structured features
   */
  encode(context: string): EncodedContext {
    // Normalize and tokenize
    const normalized = context.toLowerCase();
    const tokens = this.tokenize(normalized);
    const keywords = this.extractKeywords(tokens);

    // Classify intent
    const intent = this.classifyIntent(normalized);

    // Identify domain tags
    const domainTags = this.classifyDomains(normalized);

    // Compute hash
    const contextHash = this.hashContext(normalized);

    // Generate summary
    const summary = context.slice(0, 200);

    return {
      keywords,
      intent,
      domainTags,
      contextHash,
      summary,
    };
  }

  /**
   * Compute semantic similarity between two encoded contexts
   * Returns 0-1 score based on keyword overlap and intent match
   */
  similarity(a: EncodedContext, b: EncodedContext): number {
    // Jaccard similarity on keywords
    const keywordSimilarity = this.jaccardSimilarity(a.keywords, b.keywords);

    // Intent bonus
    const intentBonus = a.intent === b.intent ? 0.2 : 0;

    // Domain overlap bonus
    const domainOverlap = a.domainTags.filter((d) => b.domainTags.includes(d)).length;
    const domainBonus = (domainOverlap / Math.max(a.domainTags.length, b.domainTags.length)) * 0.15;

    return Math.min(1, keywordSimilarity * 0.65 + intentBonus + domainBonus);
  }

  /**
   * Tokenize context into words
   */
  private tokenize(text: string): string[] {
    return text
      .split(/\s+/)
      .map((token) => token.replace(/[^\w]/g, ''))
      .filter((token) => token.length > 2);
  }

  /**
   * Extract meaningful keywords (remove stopwords, short tokens)
   */
  private extractKeywords(tokens: string[]): string[] {
    return tokens
      .filter((token) => !STOPWORDS.has(token) && token.length > 2)
      .slice(0, 20);
  }

  /**
   * Classify primary intent
   */
  private classifyIntent(text: string): MemoryIntent {
    const intents: MemoryIntent[] = ['generation', 'analysis', 'debugging', 'planning', 'communication'];

    const scores = intents.map((intent) => {
      const pattern = INTENT_PATTERNS[intent];
      const matches = (text.match(pattern) || []).length;
      return { intent, score: matches };
    });

    const best = scores.sort((a, b) => b.score - a.score)[0];
    return best && best.score > 0 ? best.intent : ('general' as MemoryIntent);
  }

  /**
   * Classify relevant domains
   */
  private classifyDomains(text: string): MemoryDomain[] {
    const domains: MemoryDomain[] = ['typescript', 'react', 'database', 'api', 'cost', 'architecture'];
    const detected: MemoryDomain[] = [];

    for (const domain of domains) {
      const pattern = DOMAIN_PATTERNS[domain];
      const matches = (text.match(pattern) || []).length;
      if (matches > 0) {
        detected.push(domain);
      }
    }

    return detected.length > 0 ? detected : ['general'];
  }

  /**
   * Compute SHA-256 hash of context (first 16 chars)
   */
  private hashContext(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex').slice(0, 16);
  }

  /**
   * Jaccard similarity: |intersection| / |union|
   */
  private jaccardSimilarity(a: string[], b: string[]): number {
    const setA = new Set(a);
    const setB = new Set(b);

    const intersection = [...setA].filter((x) => setB.has(x)).length;
    const union = new Set([...a, ...b]).size;

    return union === 0 ? 0 : intersection / union;
  }
}
