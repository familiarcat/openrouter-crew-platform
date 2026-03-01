/**
 * Type definitions for the Agent Memory Weighted Interpolation System
 * Inspired by Hinton's distributed neural representations
 */

/**
 * Memory hierarchy layers (like feature detection in neural networks)
 * Layer 1: Raw observations (direct interactions)
 * Layer 2: Patterns (regularities across observations)
 * Layer 3: Strategies (successful decision patterns)
 * Layer 4: Institutional knowledge (cross-project generalizations)
 */
export type MemoryLayer = 1 | 2 | 3 | 4;

/**
 * Retention tiers with different decay rates
 * eternal: 0.0001/day (essentially permanent)
 * standard: 0.001/day (30 days half-life)
 * temporary: 0.01/day (3 days half-life)
 * session: 0.1/day (10 hours half-life)
 */
export type RetentionTier = 'eternal' | 'standard' | 'temporary' | 'session';

/**
 * Task outcome for reinforcement learning
 */
export type MemoryOutcome = 'success' | 'failure' | 'partial';

/**
 * Memory intent classification
 */
export type MemoryIntent = 'generation' | 'analysis' | 'debugging' | 'planning' | 'communication';

/**
 * Domain classification for context
 */
export type MemoryDomain = 'typescript' | 'react' | 'database' | 'api' | 'cost' | 'architecture' | 'general';

/**
 * A single memory node in the distributed memory graph
 * Each node represents a fact/observation/pattern/strategy
 */
export interface MemoryNode {
  id: string;
  createdAt: Date;
  updatedAt: Date;

  // Attribution (all crew members can read, project_id scopes the pool)
  crewId?: string;
  projectId?: string;

  // Hierarchical classification
  layer: MemoryLayer;

  // Content
  content: string;          // full memory text
  summary?: string;         // short summary for prompt injection
  tags: string[];          // semantic tags

  // Memory lifecycle
  retentionTier: RetentionTier;
  confidenceWeight: number; // 0-1, strength of this memory
  activationCount: number;  // how many times used
  lastActivatedAt?: Date;   // recency bonus in retrieval
  expiresAt?: Date;         // hard delete after expiry
  deletedAt?: Date;         // soft delete marker

  // Context association
  contextKeywords: string[];    // extracted keywords
  legacyMemoryId?: string;      // migration bridge
}

/**
 * A weighted directed edge between two memory nodes
 * Edges strengthen when memories are co-activated (like synaptic strengthening)
 */
export interface MemoryEdge {
  id: string;

  sourceId: string;
  targetId: string;

  weight: number;                // 0-1, strength of connection
  coActivationCount: number;     // times both activated together
  lastCoActivatedAt: Date;
}

/**
 * A memory retrieved with relevance scoring
 * Combines node properties, edge weights, and context similarity
 */
export interface WeightedMemory {
  node: MemoryNode;
  relevanceScore: number;  // 0-1, combined ranking score
  edgeWeight: number;      // weight of edge from retrieval context
}

/**
 * Options for retrieving memories
 */
export interface MemoryRetrievalOptions {
  projectId: string;       // required - retrieval is scoped to shared project pool
  context: string;         // the request/question to find related memories for
  requestingCrewId?: string;    // for logging only
  layers?: MemoryLayer[];       // restrict to specific layers (default: all)
  maxResults?: number;          // default 10
  minConfidence?: number;       // minimum confidence to include (default 0.1)
  includeExpired?: boolean;     // include soft-deleted memories
}

/**
 * Options for inserting a new memory
 */
export interface MemoryInsertOptions {
  crewId?: string;
  layer: MemoryLayer;
  content: string;
  summary?: string;
  tags?: string[];
  retentionTier?: RetentionTier;
  projectId?: string;
  contextKeywords?: string[];
  legacyMemoryId?: string;
}

/**
 * Outcome report for reinforcement learning
 * Updates weights based on task success/failure
 */
export interface OutcomeReport {
  sessionId: string;
  activatedNodeIds: string[];
  outcome: MemoryOutcome;
  outcomeDelta: number;      // confidence weight adjustment
  crewMember?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Context as decoded/encoded by ContextEncoder
 * Extracts semantic features from raw text
 */
export interface EncodedContext {
  keywords: string[];
  intent: MemoryIntent;
  domainTags: MemoryDomain[];
  contextHash: string;
  summary: string;
}

/**
 * Result from memory retrieval with formatting
 */
export interface MemoryRetrievalResult {
  memories: WeightedMemory[];
  promptSection: string;      // formatted for prompt injection
  contextId: string;          // for later outcome reporting
}

/**
 * Decay configuration per retention tier
 */
export interface DecayConfig {
  eternal: number;     // 0.0001
  standard: number;    // 0.001
  temporary: number;   // 0.01
  session: number;     // 0.1
}

/**
 * Options for prompt building
 */
export interface PromptBuilderOptions {
  maxMemories?: number;
  includeConfidence?: boolean;
  includeLayer?: boolean;
  separator?: string;
}

/**
 * Service error types
 */
export class MemoryServiceError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'MemoryServiceError';
  }
}
