# Cost Optimization Patterns for $1 Daily Budget

**Platform:** OpenRouter Crew Platform | **Budget:** $1.00 USD/day | **Implementation Guide**

---

## 📊 Quick Math: What $1 Buys You

```
OpenRouter API Pricing (2026-03):
┌──────────────────────────────────────────────────┐
│ Claude 3.5 Haiku:  $0.035 input,  $0.140 output  │
│ Claude 3.5 Sonnet: $0.300 input,  $1.200 output  │
│ Claude 3.5 Opus:   $1.500 input,  $6.000 output  │
│ GPT-4o:            $0.500 input,  $1.500 output  │
│ Llama 3.1 70B:     $0.035 input,  $0.140 output  │
└──────────────────────────────────────────────────┘

$1.00 Budget Breakdown:
├─ 28,571 calls to Haiku (1M tokens at $0.035/1K)
├─ 3,333 calls to Sonnet (333K tokens at $0.3/1K)
├─ 667 calls to Opus (67K tokens at $1.5/1K)
└─ Mixed: ~1000 productive queries with 70% cache hit

Example Allocation:
├─ 600 Haiku calls ($0.21)
├─ 300 Sonnet calls ($0.30)
├─ 30 Opus calls ($0.45)
├─ Cache operations ($0.00)
└─ Reserve buffer ($0.04)
   = $1.00 total
```

---

## 🎯 Strategy 1: Complexity-Based Routing

### Pattern: Model Selector Middleware

```typescript
// File: domains/shared/crew-api-client/src/middleware/cost-router.ts

export enum ModelChoice {
  HAIKU = 'claude-3-5-haiku-20241022',
  SONNET = 'claude-3-5-sonnet-20241022',
  OPUS = 'claude-3-5-opus-20250514',
  CACHE = 'cache_hit',
  LOCAL = 'local_resolution'
}

export interface ComplexityAnalysis {
  score: number;           // 0.0 to 1.0
  estimatedTokens: number;
  estimatedCost: number;   // in USD
  reasoning: string;
  model: ModelChoice;
}

/**
 * Classify query complexity to choose optimal model
 * Lower complexity → cheaper model (Haiku)
 * Higher complexity → more capable model (Opus)
 */
export async function analyzeComplexity(
  query: string,
  context?: {
    projectId?: string;
    userId?: string;
    conversationHistory?: string[];
    estimatedOutputTokens?: number;
  }
): Promise<ComplexityAnalysis> {
  // Quick tokenization estimate
  const estimatedInputTokens = Math.ceil(query.length / 4);
  const estimatedOutputTokens = context?.estimatedOutputTokens ||
                               Math.ceil(query.length / 2);
  const totalTokens = estimatedInputTokens + estimatedOutputTokens;

  // Complexity heuristics
  const factors = {
    hasReasoning: /analyze|explain|why|how|compare|contrast/.test(query.toLowerCase()),
    isMultiStep: /then|subsequently|next|finally|step|sequence/.test(query.toLowerCase()),
    requiresContext: (context?.conversationHistory?.length ?? 0) > 3,
    isCreative: /generate|create|write|compose|invent|brainstorm/.test(query.toLowerCase()),
    needsAccuracy: /legal|financial|medical|critical|exact|precise|payment|transaction/.test(query.toLowerCase()),
    isLongForm: query.length > 500,
    isInfraRelated: /provision|deploy|terraform|delete|infrastructure/.test(query.toLowerCase()),
  };

  const weight = Object.values(factors).filter(Boolean).length;
  const complexityScore = factors.isInfraRelated ? 1.0 : weight / 7;

  // Determine model
  let model = ModelChoice.HAIKU;
  if (complexityScore > 0.66) {
    model = ModelChoice.OPUS;  // Complex: use most capable
  } else if (complexityScore > 0.33) {
    model = ModelChoice.SONNET;  // Medium: balanced
  }

  // Calculate cost
  const costs = {
    [ModelChoice.HAIKU]: (totalTokens * 0.035) / 1000,
    [ModelChoice.SONNET]: (totalTokens * 0.3) / 1000,
    [ModelChoice.OPUS]: (totalTokens * 1.5) / 1000,
  };

  return {
    score: complexityScore,
    estimatedTokens: totalTokens,
    estimatedCost: costs[model],
    reasoning: generateReasoningString(factors),
    model,
  };
}

function generateReasoningString(factors: Record<string, boolean>): string {
  return Object.entries(factors)
    .filter(([_, has]) => has)
    .map(([key]) => key)
    .join(', ');
}
```

### Usage in CrewAPIClient

```typescript
// File: domains/shared/crew-api-client/src/CrewAPIClient.ts (modified)

export class CrewAPIClient {
  private complexityAnalyzer: ComplexityAnalyzer;
  private budgetManager: BudgetManager;

  async execute_crew(
    params: ExecuteCrewParams,
    options?: RequestOptions
  ): Promise<ExecuteCrewResponse> {
    // Step 1: Check budget
    const budget = await this.budgetManager.getRemainingBudget();
    if (budget <= 0) {
      throw new BudgetExhaustedError('Daily budget exhausted');
    }

    // Step 2: Analyze complexity
    const complexity = await this.complexityAnalyzer.analyzeComplexity(
      params.input,
      { projectId: params.project_id }
    );
    
    // Step 2.5: Check for Project-Level Circuit Breaker (set by n8n)
    const projectConfig = await this.getProjectConfig(params.project_id);
    if (projectConfig?.force_budget_model) {
      console.info(`[Circuit Breaker] Project ${params.project_id} over variance limit. Forcing Haiku.`);
      complexity.model = ModelChoice.HAIKU;
    }

    // Step 3: Check cache first (0 cost)
    const cached = await this.cacheManager.get(
      this.hashQuery(params.input)
    );
    if (cached && this.isCacheValid(cached)) {
      console.log('✓ Cache hit (0 cost)');
      return cached;
    }

    // Step 4: Route to appropriate model
    if (complexity.estimatedCost > budget) {
      // Budget insufficient - downgrade model
      const downgradedModel = this.downgradeModel(complexity.model);
      console.warn(
        `⚠️  Downgrading: ${complexity.model} → ${downgradedModel} ` +
        `(cost: $${complexity.estimatedCost} > budget: $${budget})`
      );
      complexity.model = downgradedModel;
      complexity.estimatedCost = this.calculateCost(complexity.model, complexity.estimatedTokens);
    }

    // Step 5: Execute with tracked cost
    const startTime = Date.now();
    try {
      const response = await this.executeWithModel(
        params,
        complexity.model,
        options
      );

      // Step 6: Update budget and cache
      await this.budgetManager.deduct(complexity.estimatedCost);
      await this.cacheManager.set(
        this.hashQuery(params.input),
        response,
        this.getTTL(complexity.model) // Haiku: 24h, Sonnet: 12h, Opus: 1h
      );

      return response;
    } catch (error) {
      // Only deduct on success to avoid penalizing failures
      throw error;
    }
  }

  private downgradeModel(currentModel: ModelChoice): ModelChoice {
    const chain = [ModelChoice.OPUS, ModelChoice.SONNET, ModelChoice.HAIKU];
    const currentIndex = chain.indexOf(currentModel);
    if (currentIndex >= chain.length - 1) return ModelChoice.HAIKU;
    return chain[currentIndex + 1];
  }

  private calculateCost(model: ModelChoice, tokens: number): number {
    const rates = {
      [ModelChoice.HAIKU]: 0.035,
      [ModelChoice.SONNET]: 0.3,
      [ModelChoice.OPUS]: 1.5,
    };
    return (tokens * rates[model]) / 1000;
  }

  private getTTL(model: ModelChoice): number {
    return {
      [ModelChoice.HAIKU]: 24 * 60 * 60 * 1000,    // 24 hours
      [ModelChoice.SONNET]: 12 * 60 * 60 * 1000,   // 12 hours
      [ModelChoice.OPUS]: 60 * 60 * 1000,          // 1 hour
    }[model];
  }
}
```

---

## 🎯 Strategy 2: Aggressive Caching

### Pattern: Multi-Layer Cache

```typescript
// File: domains/shared/crew-api-client/src/cache/multi-layer-cache.ts

export interface CacheLayer {
  name: string;
  get(key: string): Promise<any | null>;
  set(key: string, value: any, ttl: number): Promise<void>;
  delete(key: string): Promise<void>;
}

export class MemoryCacheLayer implements CacheLayer {
  name = 'memory';
  private store = new Map<string, { value: any; expiry: number }>();

  async get(key: string): Promise<any | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: any, ttl: number): Promise<void> {
    this.store.set(key, { value, expiry: Date.now() + ttl });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }
}

export class SupabaseCacheLayer implements CacheLayer {
  name = 'supabase';

  constructor(private client: SupabaseClient) {}

  async get(key: string): Promise<any | null> {
    const { data, error } = await this.client
      .from('cache_store')
      .select('value')
      .eq('key', key)
      .gte('expiry', new Date().toISOString())
      .single();

    if (error) return null;
    return data?.value;
  }

  async set(key: string, value: any, ttl: number): Promise<void> {
    const expiry = new Date(Date.now() + ttl).toISOString();
    await this.client
      .from('cache_store')
      .upsert({ key, value, expiry }, { onConflict: 'key' });
  }

  async delete(key: string): Promise<void> {
    await this.client.from('cache_store').delete().eq('key', key);
  }
}

export class RedisCacheLayer implements CacheLayer {
  name = 'redis';

  constructor(private client: Redis) {}

  async get(key: string): Promise<any | null> {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(key: string, value: any, ttl: number): Promise<void> {
    await this.client.setex(key, Math.ceil(ttl / 1000), JSON.stringify(value));
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }
}

/**
 * Multi-layer cache: Memory → Supabase → Redis
 * Tries each layer in order, returns on hit
 * Writes to all layers on set
 */
export class MultiLayerCache {
  private layers: CacheLayer[] = [];

  constructor(
    memory: MemoryCacheLayer,
    supabase: SupabaseCacheLayer,
    redis?: RedisCacheLayer
  ) {
    this.layers = [memory, supabase];
    if (redis) this.layers.unshift(redis); // Redis first if available
  }

  async get(key: string): Promise<any | null> {
    for (const layer of this.layers) {
      const value = await layer.get(key);
      if (value !== null) {
        console.log(`✓ Cache hit (${layer.name})`);
        return value;
      }
    }
    return null;
  }

  async set(key: string, value: any, ttl: number): Promise<void> {
    // Write to all layers in parallel
    await Promise.all(
      this.layers.map(layer => layer.set(key, value, ttl).catch(err =>
        console.warn(`Warning: ${layer.name} cache write failed:`, err)
      ))
    );
  }

  async delete(key: string): Promise<void> {
    await Promise.all(this.layers.map(layer => layer.delete(key)));
  }
}
```

### Smart Query Hashing

```typescript
// File: domains/shared/crew-api-client/src/cache/query-hash.ts

import crypto from 'crypto';

/**
 * Create deterministic hash of query including context
 * Same query + context = same hash = cache reuse
 */
export function hashQuery(
  query: string,
  context?: {
    projectId?: string;
    crewId?: string;
    version?: string;
    parameters?: Record<string, any>;
  }
): string {
  const normalized = [
    query.toLowerCase().trim(),
    context?.projectId || '',
    context?.crewId || '',
    context?.version || '1.0',
    JSON.stringify(context?.parameters || {}),
  ].join('|');

  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Example: Identical queries with different casing should hit same cache
 */
export function normalizeSimilarQueries(
  query: string
): { normalized: string; hash: string } {
  // Remove extra whitespace
  const normalized = query
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

  return {
    normalized,
    hash: hashQuery(normalized),
  };
}
```

---

## 🎯 Strategy 3: Batch Operations

### Pattern: Query Aggregator

```typescript
// File: domains/shared/crew-api-client/src/batch/query-aggregator.ts

export interface BatchableQuery {
  id: string;
  query: string;
  context?: Record<string, any>;
  resolve: (result: any) => void;
  reject: (error: any) => void;
}

/**
 * Accumulate similar queries and execute together
 * Reduces overhead: 10 queries → 2 batch calls
 */
export class QueryAggregator {
  private queue: BatchableQuery[] = [];
  private batchSize = 5; // queries per batch
  private batchTimeout = 1000; // milliseconds
  private timeoutId: NodeJS.Timeout | null = null;
  private activeModel: ModelChoice = ModelChoice.HAIKU;

  async add(query: string, context?: Record<string, any>): Promise<any> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        id: crypto.randomUUID(),
        query,
        context,
        resolve,
        reject,
      });

      if (this.queue.length >= this.batchSize) {
        this.flush();
      } else if (!this.timeoutId) {
        this.timeoutId = setTimeout(() => this.flush(), this.batchTimeout);
      }
    });
  }

  private async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0, this.batchSize);
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    try {
      // Group queries by similarity
      const groups = this.groupSimilarQueries(batch);

      for (const group of groups) {
        const result = await this.executeBatch(group);
        group.forEach((q, idx) => q.resolve(result[idx]));
      }
    } catch (error) {
      batch.forEach(q => q.reject(error));
    }
  }

  private groupSimilarQueries(queries: BatchableQuery[]): BatchableQuery[][] {
    // Simple: group by first 10 chars similarity
    const groups: Map<string, BatchableQuery[]> = new Map();

    for (const q of queries) {
      const key = q.query.substring(0, 10);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(q);
    }

    return Array.from(groups.values());
  }

  private async executeBatch(batch: BatchableQuery[]): Promise<any[]> {
    // Combine all queries into single request
    const combinedPrompt = `
Answer the following queries:

${batch.map((q, i) => `${i + 1}. ${q.query}`).join('\n\n')}

Format responses as JSON array with ${batch.length} elements.
`;

    // Execute with cost tracking
    const response = await this.executeWithModel(combinedPrompt);

    // Parse and distribute results
    try {
      const results = JSON.parse(response);
      return Array.isArray(results) ? results : batch.map(() => response);
    } catch {
      // Fallback: return same response to all
      return batch.map(() => response);
    }
  }

  private async executeWithModel(prompt: string): Promise<string> {
    // Implementation: call CrewAPIClient
    return '';
  }
}

// Usage
const aggregator = new QueryAggregator();

// These queries might batch together if submitted close in time
Promise.all([
  aggregator.add('What is X?'),
  aggregator.add('Explain Y'),
  aggregator.add('Compare Z'),
])
  .then(([x, y, z]) => console.log({ x, y, z }));
```

---

## 🎯 Strategy 4: Pattern Matching (Zero Cost)

### Pattern: Known Response Database

```typescript
// File: domains/shared/crew-api-client/src/patterns/pattern-matcher.ts

export interface Pattern {
  id: string;
  regex: RegExp;
  response: string | ((match: RegExpMatchArray) => string);
  cost: 0;
  category: 'greeting' | 'faq' | 'status' | 'help' | 'calculation' | 'template';
}

export class PatternMatcher {
  private patterns: Pattern[] = [
    {
      id: 'greeting_hello',
      regex: /^(hello|hi|hey)\s*,?\s*crew/i,
      response: 'Hello! How can I help you with your AI crew today?',
      cost: 0,
      category: 'greeting',
    },
    {
      id: 'status_check',
      regex: /^(what's|what is|check|get).*(status|health|up)\s*\??$/i,
      response: 'All systems operational. Crew platform ready.',
      cost: 0,
      category: 'status',
    },
    {
      id: 'faq_pricing',
      regex: /how much (does|do|is|will) .*(cost|charge|spend)/i,
      response: 'Daily budget: $1.00. Model costs: Haiku $0.035/1K, Sonnet $0.3/1K, Opus $1.5/1K.',
      cost: 0,
      category: 'faq',
    },
    {
      id: 'help_models',
      regex: /which model (should|to|can i) (use|pick|choose)/i,
      response: 'Haiku for simple Q&A, Sonnet for analysis, Opus for complex reasoning.',
      cost: 0,
      category: 'help',
    },
    {
      id: 'calculation_tokens',
      regex: /estimate tokens (for|in|of) (.+)/i,
      response: (match) => {
        const text = match[2];
        const estimatedTokens = Math.ceil(text.length / 4);
        return `Estimated tokens: ~${estimatedTokens} (${estimatedTokens * 0.035 / 1000} cents on Haiku)`;
      },
      cost: 0,
      category: 'calculation',
    },
    {
      id: 'template_crew_creation',
      regex: /create (a new|new|my) crew (called|named|for|to manage)/i,
      response: (match) => {
        const crewName = match.input.split(match[0])[1]?.trim() || 'MyNewCrew';
        return `Crew template created: ${crewName}. Use \`crew-cli deploy\` to activate.`;
      },
      cost: 0,
      category: 'template',
    },
  ];

  async match(query: string): Promise<{ pattern: Pattern; match: RegExpMatchArray } | null> {
    for (const pattern of this.patterns) {
      const match = query.match(pattern.regex);
      if (match) {
        return { pattern, match };
      }
    }
    return null;
  }

  async resolve(pattern: Pattern, match: RegExpMatchArray): Promise<string> {
    if (typeof pattern.response === 'string') {
      return pattern.response;
    }
    return pattern.response(match);
  }

  addCustomPattern(pattern: Pattern): void {
    this.patterns.push(pattern);
  }
}

// Usage in CrewAPIClient
export class CrewAPIClient {
  private patternMatcher = new PatternMatcher();

  async execute_crew(params: ExecuteCrewParams): Promise<ExecuteCrewResponse> {
    // Check patterns first (0 cost)
    const match = await this.patternMatcher.match(params.input);
    if (match) {
      console.log(`✓ Pattern match (0 cost) - ${match.pattern.category}`);
      return {
        output: await this.patternMatcher.resolve(match.pattern, match.match),
        cost: 0,
        model: 'pattern_match',
      } as ExecuteCrewResponse;
    }

    // If no pattern match, proceed with normal logic
    // ... rest of execute_crew logic
  }
}
```

---

## 🎯 Strategy 5: Adaptive Throttling

### Pattern: Dynamic Rate Limiting

```typescript
// File: domains/shared/crew-api-client/src/throttling/adaptive-throttler.ts

export interface BudgetState {
  dailyBudget: number;      // $1.00
  used: number;             // current spend
  remaining: number;        // available
  resetTime: Date;          // UTC midnight
  percentUsed: number;      // 0-100
}

export class AdaptiveThrottler {
  private budgetManager: BudgetManager;
  private requestQueue: Array<{
    fn: () => Promise<any>;
    resolve: (v: any) => void;
    reject: (e: any) => void;
  }> = [];
  private processing = false;

  constructor(budgetManager: BudgetManager) {
    this.budgetManager = budgetManager;
  }

  async executeWithThrottling<T>(
    fn: () => Promise<T>,
    estimatedCost: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ fn, resolve, reject });
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.requestQueue.length === 0) return;

    this.processing = true;

    while (this.requestQueue.length > 0) {
      const budget = await this.budgetManager.getBudgetState();
      const throttleDelay = this.calculateThrottleDelay(budget);

      if (throttleDelay > 0) {
        await this.sleep(throttleDelay);
      }

      const item = this.requestQueue.shift();
      if (!item) continue;

      try {
        const result = await item.fn();
        item.resolve(result);
      } catch (error) {
        item.reject(error);
      }
    }

    this.processing = false;
  }

  private calculateThrottleDelay(budget: BudgetState): number {
    const timeUntilReset = budget.resetTime.getTime() - Date.now();
    const requestsRemaining = this.requestQueue.length;

    // Avoid spending all budget at once
    const safeUsagePercent = 0.9; // Don't use more than 90%
    const maxSpendable = budget.dailyBudget * safeUsagePercent - budget.used;

    if (maxSpendable <= 0) {
      // Out of safe budget - wait for reset
      return timeUntilReset;
    }

    // Calculate delay to evenly spread budget across time
    const costPerSecond = budget.dailyBudget / (24 * 60 * 60);
    const targetDelay = (budget.dailyBudget * 0.1) / costPerSecond; // 10% cost = spread

    if (budget.percentUsed > 80) {
      // Critical: only allow 1 request every 10 seconds
      return 10000;
    }

    if (budget.percentUsed > 60) {
      // High usage: throttle to 1 request per 5 seconds
      return 5000;
    }

    if (budget.percentUsed > 40) {
      // Normal: throttle to 1 request per 2 seconds
      return 2000;
    }

    // Low usage: process immediately
    return 0;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

---

## 📈 Implementation Roadmap

### Week 1-2: Foundation
- [ ] Implement ComplexityAnalyzer
- [ ] Set up BudgetManager with daily reset
- [ ] Create MultiLayerCache (Memory + Supabase)
- [ ] Add cost tracking to CrewAPIClient
- **Expected savings:** 20-30% (mostly from eliminating redundant calls)

### Week 3-4: Acceleration
- [ ] Implement QueryAggregator for batching
- [ ] Build PatternMatcher with 50+ patterns
- [ ] Deploy AdaptiveThrottler
- [ ] Add cost alerting (email/dashboard)
- **Expected savings:** 40-50% cumulative

### Week 5-8: Intelligence
- [ ] ML model for complexity prediction
- [ ] Predictive cache warming
- [ ] Cross-crew result sharing
- [ ] Cost anomaly detection
- **Expected savings:** 60-70% cumulative

---

## 🧪 Testing & Validation

### Unit Tests

```typescript
// patterns.test.ts
describe('ComplexityAnalyzer', () => {
  it('should route simple queries to Haiku', async () => {
    const result = await analyzeComplexity('What is 2+2?');
    expect(result.model).toBe(ModelChoice.HAIKU);
    expect(result.estimatedCost).toBeLessThan(0.01);
  });

  it('should downgrade model if budget insufficient', async () => {
    const result = await analyzeComplexity(
      'Write me a 10,000 word research paper',
      { estimatedOutputTokens: 10000 }
    );
    expect(result.estimatedCost).toBeGreaterThan(0.1); // Expensive
    // Should be downgraded by CrewAPIClient if budget < cost
  });
});

describe('MultiLayerCache', () => {
  it('should return cached value within TTL', async () => {
    const cache = new MultiLayerCache(memory, supabase);
    await cache.set('query1', 'result1', 3600000); // 1 hour
    const result = await cache.get('query1');
    expect(result).toBe('result1');
  });

  it('should return null for expired cache', async () => {
    const cache = new MultiLayerCache(memory, supabase);
    await cache.set('query2', 'result2', 1); // 1ms TTL
    await new Promise(r => setTimeout(r, 10));
    const result = await cache.get('query2');
    expect(result).toBeNull();
  });
});

describe('PatternMatcher', () => {
  it('should match greeting patterns', async () => {
    const matcher = new PatternMatcher();
    const match = await matcher.match('Hello crew!');
    expect(match?.pattern.id).toBe('greeting_hello');
  });
});
```

---

## 📊 Success Metrics

```
Metric                           Target      Baseline   Status
─────────────────────────────────────────────────────────────
Cost per query                   < $0.001    TBD        Setup
Cache hit rate                   > 80%       TBD        Setup
Model downgrade rate             > 60%       TBD        Setup
Pattern match rate               > 25%       TBD        Setup
Batch reduction (10→N)           > 60%       TBD        Setup
─────────────────────────────────────────────────────────────
Daily cost (target)              $0.50       TBD        Setup
Cost reduction (baseline)        50-70%      TBD        Setup
Query throughput at $1/day       1000+ q/day TBD        Setup
```

---

**Version:** 1.0.0 | **Last Updated:** 2026-03-01 | **Ready to Implement**
