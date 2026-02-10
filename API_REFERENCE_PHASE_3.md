# Phase 3 API Reference

Complete API documentation for all Phase 3 memory management services.

---

## Table of Contents

1. [CostOptimizationService](#costoptimizationservice)
2. [MemoryAnalyticsService](#memoryanalyticsservice)
3. [MemoryArchivalService](#memoryarchivalservice)
4. [Integration Examples](#integration-examples)
5. [Error Handling](#error-handling)
6. [Type Definitions](#type-definitions)

---

## CostOptimizationService

Cost tracking, budgeting, and optimization for memory operations.

### Constructor

```typescript
const service = new CostOptimizationService(config?: CostTrackingConfig);
```

**Parameters**:
- `config` (optional): Configuration object
  - `costPerToken`: number (default: 0.00001)
  - `costPerEmbedding`: number (default: 0.0001)
  - `costPerClusteringOp`: number (default: 0.00005)
  - `alertThreshold`: number (default: 0.8, range: 0-1)
  - `budgetCap`: number (default: 1000)

### Methods

#### trackMemoryCost()

Track cost for a memory operation.

```typescript
trackMemoryCost(
  memoryId: string,
  contentLength: number,
  operations?: {
    embedding?: boolean;
    compression?: boolean;
    clustering?: boolean;
  }
): MemoryCost
```

**Parameters**:
- `memoryId`: Unique memory identifier
- `contentLength`: Content size in bytes
- `operations`: Operations performed (optional)

**Returns**: `MemoryCost` object with breakdown

**Example**:
```typescript
const cost = service.trackMemoryCost('mem_123', 1500, {
  embedding: true,
  compression: true,
});
console.log(cost.totalCost); // $0.015
```

#### trackCacheAccess()

Record cache hit or miss.

```typescript
trackCacheAccess(isHit: boolean, contentLength: number): void
```

**Parameters**:
- `isHit`: Whether the access was a cache hit
- `contentLength`: Content size in bytes

**Example**:
```typescript
service.trackCacheAccess(true, 500);  // Cache hit
service.trackCacheAccess(false, 500); // Cache miss
```

#### getCachingMetrics()

Get cache performance metrics.

```typescript
getCachingMetrics(): CachingMetrics
```

**Returns**:
```typescript
{
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  hitRate: number;           // 0-1
  estimatedSavings: number;  // in dollars
}
```

#### resetCachingMetrics()

Reset cache metrics (e.g., for new period).

```typescript
resetCachingMetrics(): void
```

#### setBudget()

Set budget for a crew.

```typescript
setBudget(
  crewId: string,
  limitAmount: number,
  period?: 'daily' | 'weekly' | 'monthly'
): void
```

**Parameters**:
- `crewId`: Crew identifier
- `limitAmount`: Budget limit in dollars
- `period`: Billing period (default: 'monthly')

**Example**:
```typescript
service.setBudget('crew_1', 100, 'monthly');
```

#### updateBudget()

Update budget with spending.

```typescript
updateBudget(crewId: string, additionalSpending: number): CostBudget
```

**Parameters**:
- `crewId`: Crew identifier
- `additionalSpending`: Amount to deduct from budget

**Returns**: Updated `CostBudget` object

**Throws**: Error if budget not found

#### getBudget()

Get budget for crew.

```typescript
getBudget(crewId: string): CostBudget | undefined
```

**Returns**: Budget object or undefined if not set

#### canSpend()

Check if budget allows spending.

```typescript
canSpend(crewId: string, amount: number): boolean
```

**Returns**: true if amount is within remaining budget

#### estimateOperationCost()

Estimate cost for operation before execution.

```typescript
estimateOperationCost(
  memory: Memory,
  operations?: {
    embedding?: boolean;
    compression?: boolean;
    clustering?: boolean;
  }
): number
```

**Returns**: Estimated cost in dollars

#### estimateBatchCost()

Estimate cost for batch of memories.

```typescript
estimateBatchCost(
  memories: Memory[],
  operations?: {
    embedding?: boolean;
    compression?: boolean;
    clustering?: boolean;
  }
): number
```

**Returns**: Total estimated cost in dollars

#### getOptimizationMetrics()

Get overall optimization analysis.

```typescript
getOptimizationMetrics(): OptimizationMetrics
```

**Returns**:
```typescript
{
  totalCost: number;
  averageCostPerMemory: number;
  cacheHitRate: number;
  batchSavings: number;
  totalSavingsByCompression: number;
  costReductionRatio: number;
  recommendedActions: string[];
}
```

#### getCostBreakdown()

Get costs broken down by operation type.

```typescript
getCostBreakdown(): {
  embedding: number;
  compression: number;
  clustering: number;
  storage: number;
  total: number;
}
```

#### getCostStats()

Get cost statistics.

```typescript
getCostStats(): {
  totalMemories: number;
  totalCost: number;
  averageCost: number;
  maxCost: number;
  minCost: number;
}
```

#### clearHistory()

Clear all cost history (for new period).

```typescript
clearHistory(): void
```

---

## MemoryAnalyticsService

Analytics, insights, and recommendations engine.

### Constructor

```typescript
const service = new MemoryAnalyticsService();
```

### Methods

#### recordAccess()

Record a memory access event.

```typescript
recordAccess(memoryId: string, accessDate?: Date): void
```

**Parameters**:
- `memoryId`: Memory identifier
- `accessDate`: Access timestamp (default: now)

**Example**:
```typescript
service.recordAccess('mem_123');
```

#### getAccessPattern()

Get access pattern for a memory.

```typescript
getAccessPattern(memoryId: string, baseMemory?: Memory): AccessPattern | undefined
```

**Returns**:
```typescript
{
  memoryId: string;
  accessCount: number;
  lastAccessed: Date;
  firstAccessed: Date;
  accessFrequency: number;           // accesses per day
  accessTrend: 'increasing' | 'decreasing' | 'stable';
}
```

#### analyzeTopicTrends()

Analyze topic trends across memories.

```typescript
analyzeTopicTrends(memories: Memory[]): TopicAnalysis[]
```

**Returns**: Array of topics sorted by frequency

**Example**:
```typescript
const topics = service.analyzeTopicTrends(memories);
topics.forEach(topic => {
  console.log(`${topic.topic}: ${topic.frequency} memories`);
  console.log(`Trend: ${topic.trend}`);
  console.log(`Avg confidence: ${topic.avgConfidence}`);
});
```

#### calculateConfidenceDecay()

Calculate confidence decay over time.

```typescript
calculateConfidenceDecay(memory: Memory): ConfidenceDecay
```

**Returns**:
```typescript
{
  memoryId: string;
  initialConfidence: number;
  currentConfidence: number;
  decayRate: number;        // per day
  daysToZero: number;       // until confidence = 0
}
```

#### generateInsights()

Generate automated insights from memories.

```typescript
generateInsights(memories: Memory[]): AnalyticsInsight[]
```

**Returns**: Array of insights (warnings, opportunities, info)

**Insight Types**:
1. **Confidence Decay Warning** - High-value memories losing accuracy
2. **Low Confidence Info** - Weak reliability indicators
3. **Stale Memories Opportunity** - Candidates for archival
4. **Unbalanced Types Info** - Missing memory types

#### getRecommendationScore()

Calculate importance score for memory.

```typescript
getRecommendationScore(memory: Memory): number
```

**Returns**: Score 0-100 (higher = more important)

**Scoring Factors**:
- Confidence level (40 points)
- Access frequency (5 points per access)
- Retention tier (0-20 points)
- Recent access (0-15 points)
- Tag complexity (0-10 points)

#### getTopRecommendations()

Get top recommended memories.

```typescript
getTopRecommendations(
  memories: Memory[],
  limit?: number
): Array<{
  memory: Memory;
  recommendationScore: number;
}>
```

**Parameters**:
- `memories`: Array of memories to analyze
- `limit`: Max results (default: 10)

**Returns**: Ranked memory recommendations

#### generateAnalytics()

Generate comprehensive analytics report.

```typescript
generateAnalytics(crewId: string, memories: Memory[]): MemoryAnalytics
```

**Returns**:
```typescript
{
  crewId: string;
  totalMemories: number;
  accessPatterns: AccessPattern[];
  topTopics: TopicAnalysis[];
  confidenceDecays: ConfidenceDecay[];
  insights: AnalyticsInsight[];
  typeDistribution: Record<MemoryType, number>;
  retentionMetrics: {
    eternalCount: number;
    standardCount: number;
    temporaryCount: number;
    sessionCount: number;
  };
}
```

#### getInsights()

Get generated insights.

```typescript
getInsights(): AnalyticsInsight[]
```

#### clearData()

Clear all analytics data.

```typescript
clearData(): void
```

---

## MemoryArchivalService

Smart archival system with multiple strategies.

### Constructor

```typescript
const service = new MemoryArchivalService(config?: ArchivalConfig);
```

**Parameters**:
- `config` (optional):
  - `strategy`: 'automatic' | 'by-value' | 'manual' (default: 'automatic')
  - `maxActiveMemories`: number (default: 1000)
  - `minAgeDays`: number (default: 90)
  - `compressionEnabled`: boolean (default: true)
  - `encryptionEnabled`: boolean (default: false)

### Methods

#### shouldArchive()

Determine if memory should be archived.

```typescript
shouldArchive(memory: Memory): boolean
```

**Returns**: true if memory meets archival criteria

**Criteria**:
- Not eternal retention tier
- Age > minAgeDays
- Not accessed in 30+ days
- Or confidence < 30%

#### archiveMemory()

Archive a single memory.

```typescript
archiveMemory(memory: Memory): ArchivedMemory
```

**Returns**: Archived memory object with compression applied

**Example**:
```typescript
const archived = service.archiveMemory(memory);
console.log(`Compressed: ${archived.originalLength} → ${archived.compressedLength}`);
```

#### batchArchive()

Archive multiple memories in batch.

```typescript
batchArchive(
  memories: Memory[],
  strategy?: 'automatic' | 'by-value' | 'manual'
): {
  archived: ArchivedMemory[];
  skipped: string[];
  stats: ArchivalMetrics;
}
```

**Returns**: Archival results with statistics

**Example**:
```typescript
const result = service.batchArchive(memories, 'automatic');
console.log(`Archived: ${result.archived.length}`);
console.log(`Savings: ${result.stats.estimatedSavings} bytes`);
```

#### findInArchive()

Search archive by original memory ID.

```typescript
findInArchive(originalMemoryId: string): ArchivedMemory | undefined
```

#### restoreMemory()

Restore memory from archive.

```typescript
restoreMemory(archiveId: string): Memory | undefined
```

**Returns**: Restored memory or undefined if not found

#### listArchived()

List archived memories.

```typescript
listArchived(limit?: number): ArchivedMemory[]
```

**Parameters**:
- `limit`: Max results (default: 100)

**Returns**: Recent archives first

#### deleteArchived()

Permanently delete archived memory.

```typescript
deleteArchived(archiveId: string): boolean
```

**Returns**: true if deleted, false if not found

#### calculateMetrics()

Get archive statistics and metrics.

```typescript
calculateMetrics(): ArchivalMetrics
```

**Returns**:
```typescript
{
  totalArchived: number;
  totalActive: number;
  archiveSize: number;
  compressionRatio: number;
  estimatedSavings: number;
  oldestArchived: Date | null;
  newestArchived: Date | null;
}
```

#### recommendArchival()

Get archival recommendations.

```typescript
recommendArchival(memories: Memory[], limit?: number): ArchivalAction[]
```

**Returns**: Array of recommended archival actions

**Example**:
```typescript
const recommendations = service.recommendArchival(memories);
recommendations.forEach(rec => {
  console.log(`${rec.memoryId}: ${rec.reason}`);
  console.log(`Savings: $${rec.estimatedSavings}`);
});
```

#### analyzeStrategy()

Analyze archival strategy effectiveness.

```typescript
analyzeStrategy(memories: Memory[]): {
  strategyName: string;
  estimatedArchivable: number;
  estimatedSavings: number;
  timeToExecute: string;
}
```

#### getArchiveStatsByTier()

Get statistics by retention tier.

```typescript
getArchiveStatsByTier(): Record<RetentionTier, {
  count: number;
  size: number;
  avgConfidence: number;
}>
```

#### clearArchive()

Clear entire archive (destructive).

```typescript
clearArchive(): number
```

**Returns**: Number of archived memories deleted

---

## Integration Examples

### Complete Memory Lifecycle

```typescript
// Setup services
const costService = new CostOptimizationService();
const analyticsService = new MemoryAnalyticsService();
const archivalService = new MemoryArchivalService();

// 1. Create memory
const memory: Memory = {
  id: 'mem_123',
  crew_id: 'crew_1',
  content: 'Important information...',
  type: 'insight',
  retention_tier: 'standard',
  confidence_level: 0.85,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  access_count: 0,
  last_accessed: new Date().toISOString(),
  tags: ['important'],
};

// 2. Track cost
const cost = costService.trackMemoryCost('mem_123', memory.content.length, {
  embedding: true,
});

// 3. Set budget
costService.setBudget('crew_1', 100, 'monthly');

// 4. Update budget with operation cost
costService.updateBudget('crew_1', cost.totalCost);

// 5. Record access
analyticsService.recordAccess('mem_123');

// 6. After 90 days, check for archival
const shouldArchive = archivalService.shouldArchive(memory);

// 7. If yes, archive with compression
if (shouldArchive) {
  const archived = archivalService.archiveMemory(memory);
  console.log(`Archived: ${archived.originalLength} → ${archived.compressedLength}`);
}
```

### Cost-Aware Batch Operation

```typescript
// Check cost before batch operation
const memories = [...]; // array of memories

const estimatedCost = costService.estimateBatchCost(memories, {
  embedding: true,
  compression: true,
});

if (!costService.canSpend('crew_1', estimatedCost)) {
  throw new Error('Insufficient budget');
}

// Proceed with operation
for (const memory of memories) {
  // ... process memory ...

  // Track actual cost
  costService.trackMemoryCost(memory.id, memory.content.length, {
    embedding: true,
    compression: true,
  });

  costService.updateBudget('crew_1', estimatedCost / memories.length);
}
```

### Analytics-Driven Decisions

```typescript
// Generate comprehensive analytics
const analytics = analyticsService.generateAnalytics('crew_1', memories);

// Check for issues
analytics.insights.forEach(insight => {
  if (insight.type === 'warning') {
    console.warn(`⚠️ ${insight.title}: ${insight.description}`);
    // Take action based on recommendation
  }
});

// Get archival recommendations
const recommendations = archivalService.recommendArchival(memories);

// Execute recommendations
const result = archivalService.batchArchive(
  recommendations.map(r => memories.find(m => m.id === r.memoryId)!),
  'by-value'
);

// Update costs
result.archived.forEach(archived => {
  costService.trackMemoryCost(archived.originalId, archived.originalLength, {
    compression: archived.compressed,
  });
});
```

---

## Error Handling

All services include comprehensive error handling.

### Common Errors

**CostOptimizationService**:
- Budget not found: `updateBudget()` throws when crew budget doesn't exist
- Use `canSpend()` to check before operations

**MemoryAnalyticsService**:
- No errors thrown (graceful degradation)
- Returns empty arrays/objects for invalid input

**MemoryArchivalService**:
- Archive retrieval: Returns `undefined` if not found
- Archive deletion: Returns `false` if not found
- Use `try-catch` for destructive operations

### Error Handling Example

```typescript
try {
  // Check budget first
  if (!costService.canSpend('crew_1', estimatedCost)) {
    throw new Error('Budget exceeded');
  }

  // Proceed with operation
  const cost = costService.trackMemoryCost(...);
  costService.updateBudget('crew_1', cost.totalCost);
} catch (error) {
  if (error.message.includes('Budget')) {
    // Handle budget error
    console.error('Operation cancelled: insufficient budget');
  } else {
    // Handle other errors
    console.error('Operation failed:', error);
  }
}
```

---

## Type Definitions

### Common Types

```typescript
// Cost Tracking
interface MemoryCost {
  memoryId: string;
  createdDate: Date;
  embeddingCost: number;
  compressionCost: number;
  clusteringCost: number;
  storageCost: number;
  totalCost: number;
}

interface CostBudget {
  crewId: string;
  period: 'daily' | 'weekly' | 'monthly';
  limit: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  alertThresholdReached: boolean;
}

// Analytics
interface AccessPattern {
  memoryId: string;
  accessCount: number;
  lastAccessed: Date;
  firstAccessed: Date;
  accessFrequency: number;
  accessTrend: 'increasing' | 'decreasing' | 'stable';
}

interface TopicAnalysis {
  topic: string;
  frequency: number;
  relatedMemories: string[];
  avgConfidence: number;
  trend: 'emerging' | 'stable' | 'declining';
}

interface AnalyticsInsight {
  type: 'opportunity' | 'warning' | 'info';
  title: string;
  description: string;
  affected: string[];
  recommendation: string;
}

// Archival
interface ArchivedMemory {
  id: string;
  originalId: string;
  archivedAt: Date;
  originalCreatedAt: string;
  originalUpdatedAt: string;
  content: string;
  compressed: boolean;
  originalLength: number;
  compressedLength: number;
  metadata: {
    retentionTier: RetentionTier;
    type: string;
    tags: string[];
    confidence: number;
  };
}

interface ArchivalMetrics {
  totalArchived: number;
  totalActive: number;
  archiveSize: number;
  compressionRatio: number;
  estimatedSavings: number;
  oldestArchived: Date | null;
  newestArchived: Date | null;
}
```

---

## Configuration Examples

### Conservative Cost Control

```typescript
const service = new CostOptimizationService({
  costPerToken: 0.0001,              // Higher cost estimate
  alertThreshold: 0.6,                // Alert early (60%)
  budgetCap: 500,                     // Lower cap
});
```

### Aggressive Optimization

```typescript
const service = new CostOptimizationService({
  costPerToken: 0.00001,              // Lower estimate
  alertThreshold: 0.95,               // Alert late (95%)
  budgetCap: 5000,                    // Higher cap
});
```

### Archival Preservation

```typescript
const service = new MemoryArchivalService({
  strategy: 'manual',                 // Manual approval
  minAgeDays: 180,                    // Archive only very old
  compressionEnabled: true,
  encryptionEnabled: true,            // Encrypt archives
});
```

### Aggressive Archival

```typescript
const service = new MemoryArchivalService({
  strategy: 'automatic',              // Auto-archive
  minAgeDays: 30,                     // Archive after 30 days
  compressionEnabled: true,
  encryptionEnabled: false,
});
```

---

## Performance Notes

### Optimization Tips

1. **Cache embeddings** - Reuse embeddings for same content
2. **Batch operations** - Archive multiple memories at once
3. **Monitor metrics** - Use `getOptimizationMetrics()` regularly
4. **Set budgets** - Enforce spending limits
5. **Archive regularly** - Keep active set small

### Performance Benchmarks

- Cost calculation: <1ms
- Analytics generation: <100ms for 100 memories
- Archival decision: <10ms per memory
- Batch archival: <5s for 50 memories
- Cache lookup: <1ms

### Scaling Considerations

- Services tested with 100+ memories
- Linear performance scaling
- Batch operations scale efficiently
- Cache improves with usage

---

## Support & Contact

For issues, questions, or feature requests:
- Documentation: See PHASE_3_COMPLETE.md
- Examples: See PHASE_3_SPRINT_3_COMPLETION.md
- Tests: See test files for usage examples

---

*API Reference - Phase 3*
*Last Updated: February 9, 2026*
*Version: 1.0*
