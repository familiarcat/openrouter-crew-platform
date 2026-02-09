# Cost Instrumentation Design

**Repository**: openrouter-crew-platform
**Date**: 2026-02-09
**Language**: TypeScript-first
**Target**: Production-grade cost tracking system

---

## EXECUTIVE SUMMARY

Design a **TypeScript-first, decorator-based cost instrumentation framework** that automatically tracks:

- **Tokens** (input/output per request)
- **Cost** (USD per call + accumulated)
- **Domain** (bounded context: product-factory, alex-ai, vscode-extension)
- **Feature** (user-facing feature that triggered LLM call)
- **Execution Context** (userId, projectId, sessionId, trace IDs)

**Architecture**: Composable decorators + middleware + hooks + event emitters

**Integration Points**: 100+ workflows, dashboards, CLI, extensions, agents

---

## 1. TYPE SYSTEM & INTERFACES

### 1.1 Core Instrumentation Types

```typescript
// domains/shared/cost-tracking/src/instrumentation/types.ts

/**
 * Execution Context - Tracks where a request originated
 */
export interface ExecutionContext {
  // Identification
  requestId: string;              // Unique request ID (UUID)
  traceId: string;                // Distributed trace ID (for correlation)
  spanId: string;                 // Span within trace
  parentSpanId?: string;          // Parent span (for nested calls)

  // Source
  domain: 'product-factory' | 'alex-ai' | 'vscode-extension' | 'cli' | 'webhook';
  feature: string;                // e.g., 'story-generation', 'code-review', 'sprint-planning'
  action: string;                 // e.g., 'POST /api/crew', 'ask-crew-member', 'debug-code'

  // User & Session
  userId?: string;                // Authenticated user (if available)
  sessionId?: string;             // Session identifier
  projectId?: string;             // Project context
  teamId?: string;                // Team context

  // Environment
  environment: 'development' | 'staging' | 'production';
  version: string;                // App version
  buildId?: string;               // Build/deployment ID

  // Metadata
  metadata?: Record<string, any>; // Custom metadata
  userAgent?: string;             // Client user agent
  remoteIp?: string;              // Client IP
}

/**
 * Cost Measurement - Tracks token and monetary costs
 */
export interface CostMeasurement {
  // Tokens
  inputTokens: number;            // Input prompt tokens
  outputTokens: number;           // Output completion tokens
  totalTokens: number;            // Sum of input + output

  // Cost
  estimatedCost: number;          // Pre-execution estimate (USD)
  actualCost: number;             // Post-execution actual (USD)
  costCurrency: 'USD' | 'EUR' | 'GBP';

  // Model pricing
  model: string;                  // Model ID used
  modelTier: 'premium' | 'standard' | 'budget' | 'ultra_budget';
  inputCostPer1M: number;        // Input cost per 1M tokens
  outputCostPer1M: number;       // Output cost per 1M tokens

  // Timing
  durationMs: number;             // Time to completion (ms)
  tokenThroughput: number;        // Tokens per second
}

/**
 * LLM Request Instrumentation
 */
export interface LLMRequestInstrumentation {
  // Context
  context: ExecutionContext;

  // Request details
  model: string;
  prompt: string;                 // Original prompt (first 500 chars)
  promptLength: number;           // Character count
  systemPrompt?: string;          // System message (if any)
  messages?: number;              // Number of messages in conversation

  // Parameters
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;

  // Crew integration
  crewMember?: string;            // Assigned crew member
  crewExpertise?: string[];       // Crew expertise

  // Cost
  cost: CostMeasurement;

  // Result
  responseTokens?: number;        // Response length (tokens)
  successfulRequest: boolean;
  errorMessage?: string;
  errorCode?: string;

  // Metadata
  inputMethod: 'api' | 'webhook' | 'cli' | 'ui' | 'extension';
  outputMethod: 'api' | 'dashboard' | 'editor' | 'terminal';
  timestamp: Date;
}

/**
 * Feature Usage Tracking
 */
export interface FeatureUsageTrack {
  context: ExecutionContext;
  featureName: string;            // e.g., 'code-review-ai'
  featureVersion: string;         // Feature version
  eventType: 'start' | 'complete' | 'error' | 'cancel';

  // Metrics
  executionCount: number;
  totalCost: number;
  averageCostPerExecution: number;
  totalDurationMs: number;
  errorRate: number;              // 0-1

  // Context
  userSegment?: string;           // Free/pro/enterprise
  featureUsageLevel: 'low' | 'medium' | 'high';

  timestamp: Date;
}

/**
 * Cost Budget & Limit Tracking
 */
export interface BudgetTrack {
  context: ExecutionContext;

  // Budget
  budgetLimit: number;            // USD limit (monthly/yearly)
  budgetUsed: number;             // USD spent so far
  budgetRemaining: number;        // USD remaining
  budgetUtilizationPercent: number; // 0-100

  // Alerts
  alert?: {
    level: 'info' | 'warning' | 'critical';
    message: string;
    threshold: number;            // Percent at which alert fired
  };

  // Trends
  dailyAverage: number;
  projectedMonthlySpend: number;
  trendingUp: boolean;

  timestamp: Date;
}

/**
 * Cost Event - Emitted for analytics/logging
 */
export interface CostEvent {
  eventType:
    | 'llm_request_start'
    | 'llm_request_complete'
    | 'llm_request_error'
    | 'feature_usage'
    | 'budget_alert'
    | 'cost_estimation'
    | 'cost_optimization_suggested';

  instrumentation: LLMRequestInstrumentation | FeatureUsageTrack | BudgetTrack;
  timestamp: Date;
}
```

---

## 2. INSTRUMENTATION DECORATOR SYSTEM

### 2.1 Decorator-Based Instrumentation

```typescript
// domains/shared/cost-tracking/src/instrumentation/decorators.ts

import { ExecutionContext, LLMRequestInstrumentation, CostMeasurement } from './types';

/**
 * @InstrumentLLMCall - Automatically track LLM call costs
 *
 * Usage:
 * @InstrumentLLMCall({
 *   domain: 'product-factory',
 *   feature: 'story-generation',
 *   action: 'generate-story'
 * })
 * async callLLM(prompt: string, model: string): Promise<string> { ... }
 */
export function InstrumentLLMCall(options: {
  domain: string;
  feature: string;
  action: string;
  captureInput?: boolean;         // Log input prompt?
  captureOutput?: boolean;        // Log output?
  captureMetadata?: (target: any, args: any[]) => Record<string, any>;
}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      const context = this.executionContext || createDefaultContext();

      // Create instrumentation object
      const instrumentation: Partial<LLMRequestInstrumentation> = {
        context: { ...context, feature: options.feature, action: options.action },
        timestamp: new Date(),
        inputMethod: context.domain === 'cli' ? 'cli' : 'api',
      };

      try {
        // Pre-call hook
        emitCostEvent({
          eventType: 'llm_request_start',
          instrumentation: instrumentation as any,
          timestamp: new Date(),
        });

        // Execute original method
        const result = await originalMethod.apply(this, args);

        // Post-call instrumentation
        const durationMs = Date.now() - startTime;
        instrumentation.cost = calculateCost({
          model: args[1] || 'unknown',
          inputTokens: estimateTokens(args[0]),
          outputTokens: estimateTokens(result),
          durationMs,
        });

        instrumentation.successfulRequest = true;

        // Emit completion event
        emitCostEvent({
          eventType: 'llm_request_complete',
          instrumentation: instrumentation as any,
          timestamp: new Date(),
        });

        return result;
      } catch (error) {
        instrumentation.successfulRequest = false;
        instrumentation.errorMessage = (error as Error).message;

        emitCostEvent({
          eventType: 'llm_request_error',
          instrumentation: instrumentation as any,
          timestamp: new Date(),
        });

        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * @TrackFeatureUsage - Track feature-level metrics
 *
 * Usage:
 * @TrackFeatureUsage({
 *   featureName: 'code-review-ai',
 *   captureMetrics: true
 * })
 * async reviewCode(code: string): Promise<Review> { ... }
 */
export function TrackFeatureUsage(options: {
  featureName: string;
  featureVersion?: string;
  captureMetrics?: boolean;
  alertOnError?: boolean;
}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      const context = this.executionContext || createDefaultContext();

      try {
        const result = await originalMethod.apply(this, args);

        // Emit feature usage event
        emitCostEvent({
          eventType: 'feature_usage',
          instrumentation: {
            context,
            featureName: options.featureName,
            featureVersion: options.featureVersion || '1.0.0',
            eventType: 'complete',
            executionCount: 1,
            totalCost: 0,
            averageCostPerExecution: 0,
            totalDurationMs: Date.now() - startTime,
            errorRate: 0,
          },
          timestamp: new Date(),
        });

        return result;
      } catch (error) {
        if (options.alertOnError) {
          emitCostEvent({
            eventType: 'feature_usage',
            instrumentation: {
              context,
              featureName: options.featureName,
              eventType: 'error',
              executionCount: 1,
              errorRate: 1,
            } as any,
            timestamp: new Date(),
          });
        }
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * @EnforceBudgetLimit - Prevent spending beyond budget
 *
 * Usage:
 * @EnforceBudgetLimit({
 *   budgetSource: 'project',
 *   action: 'reject' // or 'degrade'
 * })
 * async callLLM(prompt: string): Promise<string> { ... }
 */
export function EnforceBudgetLimit(options: {
  budgetSource: 'project' | 'user' | 'organization';
  action: 'reject' | 'degrade' | 'warn';
  threshold?: number;             // Alert at % of budget
}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const context = this.executionContext || createDefaultContext();
      const budgetInfo = getBudgetInfo(context, options.budgetSource);

      if (budgetInfo.budgetUtilizationPercent > 90) {
        if (options.action === 'reject') {
          throw new Error('Budget limit exceeded');
        } else if (options.action === 'degrade') {
          // Use cheaper model instead
          console.warn('Budget limit approaching, degrading to cheaper model');
        }
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
```

---

## 2.2 Middleware-Based Instrumentation

```typescript
// domains/shared/cost-tracking/src/instrumentation/middleware.ts

import { Request, Response, NextFunction } from 'express';
import { ExecutionContext, CostEvent } from './types';

/**
 * Express middleware for automatic instrumentation
 */
export function costInstrumentationMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const requestId = req.headers['x-request-id'] as string || generateUUID();
    const traceId = req.headers['x-trace-id'] as string || generateUUID();

    // Create execution context from request
    const context: ExecutionContext = {
      requestId,
      traceId,
      spanId: generateUUID(),
      domain: req.baseUrl.includes('product-factory') ? 'product-factory' : 'alex-ai',
      feature: extractFeatureFromPath(req.path),
      action: `${req.method} ${req.path}`,
      userId: (req as any).user?.id,
      sessionId: (req as any).session?.id,
      projectId: (req as any).query?.projectId as string,
      environment: process.env.NODE_ENV as any,
      version: process.env.APP_VERSION || '1.0.0',
      userAgent: req.headers['user-agent'],
      remoteIp: req.ip,
      timestamp: new Date(),
    };

    // Attach to request for downstream handlers
    (req as any).executionContext = context;

    // Wrap response to capture cost metrics
    const originalJson = res.json;
    res.json = function (body: any) {
      const durationMs = Date.now() - (req as any).startTime;

      // If response contains cost data, emit event
      if (body?.cost) {
        emitCostEvent({
          eventType: 'llm_request_complete',
          instrumentation: {
            context,
            cost: body.cost,
            successfulRequest: res.statusCode < 400,
            timestamp: new Date(),
          } as any,
          timestamp: new Date(),
        });
      }

      return originalJson.call(this, body);
    };

    (req as any).startTime = Date.now();
    next();
  };
}

/**
 * Extract feature name from request path
 */
function extractFeatureFromPath(path: string): string {
  const segments = path.split('/').filter(Boolean);
  return segments.slice(1, 3).join('-') || 'unknown';
}
```

---

## 3. INSTRUMENTATION HOOKS & EVENT EMITTER

### 3.1 Event Emitter System

```typescript
// domains/shared/cost-tracking/src/instrumentation/emitter.ts

import { EventEmitter } from 'events';
import { CostEvent } from './types';

/**
 * Global cost event emitter
 */
class CostEventEmitter extends EventEmitter {
  private listeners: Map<string, Function[]> = new Map();

  /**
   * Emit cost event to all listeners
   */
  emitCostEvent(event: CostEvent): void {
    this.emit('cost:*', event);
    this.emit(`cost:${event.eventType}`, event);

    // Async listeners (don't wait)
    setImmediate(() => {
      this.callAsyncListeners(event);
    });
  }

  /**
   * Listen for specific cost event
   */
  onCostEvent(
    eventType: string | '*',
    handler: (event: CostEvent) => void | Promise<void>
  ): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(handler);
  }

  /**
   * Call async listeners for event
   */
  private async callAsyncListeners(event: CostEvent): Promise<void> {
    const listeners = [
      ...(this.listeners.get('*') || []),
      ...(this.listeners.get(event.eventType) || []),
    ];

    await Promise.allSettled(listeners.map(listener => listener(event)));
  }
}

export const costEventEmitter = new CostEventEmitter();

/**
 * Emit cost event
 */
export function emitCostEvent(event: CostEvent): void {
  costEventEmitter.emitCostEvent(event);
}

/**
 * Listen for cost events
 */
export function onCostEvent(
  eventType: string,
  handler: (event: CostEvent) => void | Promise<void>
): void {
  costEventEmitter.onCostEvent(eventType, handler);
}
```

### 3.2 Hook Listeners

```typescript
// domains/shared/cost-tracking/src/instrumentation/hooks.ts

import { onCostEvent } from './emitter';
import { CostEvent } from './types';

/**
 * Setup default cost instrumentation hooks
 */
export function setupCostInstrumentationHooks(): void {
  // Hook 1: Log all LLM requests
  onCostEvent('llm_request_start', (event: CostEvent) => {
    console.log(`[LLM Start] ${event.instrumentation.context?.feature} - ${event.instrumentation.context?.userId}`);
  });

  onCostEvent('llm_request_complete', (event: CostEvent) => {
    const instr = event.instrumentation as any;
    console.log(
      `[LLM Complete] ${instr.cost?.actualCost?.toFixed(4)} USD - ${instr.cost?.totalTokens} tokens`
    );
  });

  // Hook 2: Track costs in real-time
  onCostEvent('llm_request_complete', async (event: CostEvent) => {
    const instr = event.instrumentation as any;
    await trackCostInDatabase(instr.context, instr.cost);
  });

  // Hook 3: Budget alerts
  onCostEvent('llm_request_complete', async (event: CostEvent) => {
    const instr = event.instrumentation as any;
    const budgetInfo = getBudgetInfo(instr.context);

    if (budgetInfo.budgetUtilizationPercent >= 75) {
      await sendBudgetAlert(instr.context, budgetInfo);
    }
  });

  // Hook 4: Cost optimization suggestions
  onCostEvent('llm_request_complete', async (event: CostEvent) => {
    const instr = event.instrumentation as any;
    const suggestions = await generateCostOptimizationSuggestions(instr);

    if (suggestions.length > 0) {
      emitCostEvent({
        eventType: 'cost_optimization_suggested',
        instrumentation: suggestions[0],
        timestamp: new Date(),
      });
    }
  });

  // Hook 5: Analytics pipeline
  onCostEvent('*', async (event: CostEvent) => {
    await sendToAnalyticsPlatform(event);
  });

  // Hook 6: Feature usage metrics
  onCostEvent('feature_usage', async (event: CostEvent) => {
    await updateFeatureMetrics(event.instrumentation as any);
  });
}

/**
 * Track cost in database
 */
async function trackCostInDatabase(context: any, cost: any): Promise<void> {
  // Insert into Supabase llm_usage_events
}

/**
 * Send budget alert
 */
async function sendBudgetAlert(context: any, budgetInfo: any): Promise<void> {
  // Send alert email/Slack/notification
}

/**
 * Generate cost optimization suggestions
 */
async function generateCostOptimizationSuggestions(instr: any): Promise<any[]> {
  // Call CostOptimizer.analyzeUsage() and return suggestions
  return [];
}

/**
 * Send event to analytics
 */
async function sendToAnalyticsPlatform(event: CostEvent): Promise<void> {
  // Send to Mixpanel, Segment, or custom analytics
}

/**
 * Update feature metrics
 */
async function updateFeatureMetrics(featureTrack: any): Promise<void> {
  // Update aggregate metrics in cache/database
}
```

---

## 4. INSTRUMENTATION CONTEXT PROVIDERS

### 4.1 React Hook for Web UI

```typescript
// domains/product-factory/dashboard/lib/hooks/useInstrumentationContext.ts

import { useContext, useEffect } from 'react';
import { ExecutionContext } from '@openrouter-crew/shared-cost-tracking';

/**
 * React hook for instrumentation context
 */
export function useInstrumentationContext(): ExecutionContext {
  const context: ExecutionContext = {
    requestId: useRequestId(),
    traceId: useTraceId(),
    spanId: generateUUID(),
    domain: 'product-factory',
    feature: useFeature(),  // From route/feature flag
    action: useAction(),    // From component
    userId: useUserId(),
    sessionId: useSessionId(),
    projectId: useProjectId(),
    environment: process.env.NODE_ENV as any,
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    metadata: useMetadata(),
  };

  // Track component mount/unmount
  useEffect(() => {
    emitCostEvent({
      eventType: 'feature_usage',
      instrumentation: {
        context,
        featureName: context.feature,
        eventType: 'start',
      } as any,
      timestamp: new Date(),
    });

    return () => {
      emitCostEvent({
        eventType: 'feature_usage',
        instrumentation: {
          context,
          featureName: context.feature,
          eventType: 'complete',
        } as any,
        timestamp: new Date(),
      });
    };
  }, [context.feature]);

  return context;
}

/**
 * Instrumentation context for API calls from components
 */
export function useInstrumentedFetch() {
  const context = useInstrumentationContext();

  return async (url: string, options?: RequestInit) => {
    const startTime = Date.now();

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options?.headers,
          'x-request-id': context.requestId,
          'x-trace-id': context.traceId,
        },
      });

      const durationMs = Date.now() - startTime;

      if (!response.ok) {
        emitCostEvent({
          eventType: 'llm_request_error',
          instrumentation: {
            context,
            successfulRequest: false,
            errorMessage: `HTTP ${response.status}`,
          } as any,
          timestamp: new Date(),
        });
      }

      return response;
    } catch (error) {
      emitCostEvent({
        eventType: 'llm_request_error',
        instrumentation: {
          context,
          successfulRequest: false,
          errorMessage: (error as Error).message,
        } as any,
        timestamp: new Date(),
      });

      throw error;
    }
  };
}
```

---

## 5. INSTRUMENTATION INTEGRATION PATTERNS

### 5.1 Pattern: LLM Service Wrapper

```typescript
// domains/shared/cost-tracking/src/instrumentation/llm-service-wrapper.ts

import { ExecutionContext, LLMRequestInstrumentation, CostMeasurement } from './types';

/**
 * Wrapper for LLM calls with automatic instrumentation
 */
export class InstrumentedLLMService {
  constructor(private context: ExecutionContext) {}

  @InstrumentLLMCall({
    domain: 'product-factory',
    feature: 'code-review',
    action: 'review-code',
  })
  async reviewCode(code: string, model: string): Promise<string> {
    const response = await fetch('https://api.openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'X-Request-ID': this.context.requestId,
        'X-Trace-ID': this.context.traceId,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are a code reviewer.' },
          { role: 'user', content: code },
        ],
        temperature: 0.5,
        max_tokens: 1000,
      }),
    });

    return response.json();
  }

  @InstrumentLLMCall({
    domain: 'product-factory',
    feature: 'story-generation',
    action: 'generate-story',
  })
  async generateStory(title: string, description: string): Promise<string> {
    // Implementation
    return '';
  }
}
```

### 5.2 Pattern: N8N Workflow Integration

```json
{
  "nodes": [
    {
      "name": "Create Execution Context",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": "return {\n  executionContext: {\n    requestId: $execution.id,\n    traceId: $json.trace_id,\n    domain: 'product-factory',\n    feature: $json.feature,\n    action: $json.action,\n    userId: $json.userId,\n    projectId: $json.projectId,\n    timestamp: new Date().toISOString()\n  }\n}"
      }
    },
    {
      "name": "Emit Cost Event Start",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "{{ $env.COST_TRACKING_WEBHOOK }}/emit",
        "method": "POST",
        "body": "{\n  \"eventType\": \"llm_request_start\",\n  \"context\": \"{{ $node['Create Execution Context'].json.executionContext }}\"\n}"
      }
    },
    {
      "name": "Call LLM",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://api.openrouter.ai/api/v1/chat/completions",
        "method": "POST",
        "headers": {
          "Authorization": "Bearer {{ $env.OPENROUTER_API_KEY }}",
          "X-Request-ID": "{{ $node['Create Execution Context'].json.executionContext.requestId }}",
          "X-Trace-ID": "{{ $node['Create Execution Context'].json.executionContext.traceId }}"
        }
      }
    },
    {
      "name": "Emit Cost Event Complete",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "{{ $env.COST_TRACKING_WEBHOOK }}/emit",
        "method": "POST",
        "body": "{\n  \"eventType\": \"llm_request_complete\",\n  \"context\": \"{{ $node['Create Execution Context'].json.executionContext }}\",\n  \"cost\": {\n    \"inputTokens\": \"{{ $node['Call LLM'].json.usage.prompt_tokens }}\",\n    \"outputTokens\": \"{{ $node['Call LLM'].json.usage.completion_tokens }}\",\n    \"actualCost\": \"{{ $json.cost }}\"\n  }\n}"
      }
    }
  ]
}
```

### 5.3 Pattern: CLI Instrumentation

```typescript
// apps/cli/src/instrumentation.ts

import { ExecutionContext } from '@openrouter-crew/shared-cost-tracking';

/**
 * Setup CLI instrumentation
 */
export function setupCLIInstrumentation(): ExecutionContext {
  const context: ExecutionContext = {
    requestId: generateUUID(),
    traceId: process.env.CI_BUILD_ID || generateUUID(),
    spanId: generateUUID(),
    domain: 'cli',
    feature: process.argv[2] || 'unknown', // Command name
    action: process.argv.slice(2).join(' '),
    userId: process.env.USER,
    environment: process.env.NODE_ENV as any,
    version: require('../package.json').version,
    timestamp: new Date(),
  };

  // Track to database when CLI completes
  process.on('exit', async () => {
    await trackCLIExecution(context);
  });

  return context;
}

/**
 * Usage in CLI command
 */
export async function askCrewCommand(
  crewMember: string,
  question: string
): Promise<void> {
  const context = setupCLIInstrumentation();

  try {
    const response = await fetch('https://api.openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'X-Request-ID': context.requestId,
        'X-Trace-ID': context.traceId,
      },
      body: JSON.stringify({ /* ... */ }),
    });

    emitCostEvent({
      eventType: 'llm_request_complete',
      instrumentation: {
        context,
        successfulRequest: response.ok,
      } as any,
      timestamp: new Date(),
    });
  } catch (error) {
    emitCostEvent({
      eventType: 'llm_request_error',
      instrumentation: {
        context,
        successfulRequest: false,
        errorMessage: (error as Error).message,
      } as any,
      timestamp: new Date(),
    });
  }
}
```

---

## 6. METRICS AGGREGATION & REPORTING

### 6.1 Metrics Aggregator

```typescript
// domains/shared/cost-tracking/src/instrumentation/aggregator.ts

import { LLMRequestInstrumentation, FeatureUsageTrack } from './types';

/**
 * Real-time metrics aggregation
 */
export class MetricsAggregator {
  private metrics: Map<string, AggregatedMetric> = new Map();

  /**
   * Record LLM request for aggregation
   */
  recordLLMRequest(instr: LLMRequestInstrumentation): void {
    const key = this.getMetricKey(instr);

    if (!this.metrics.has(key)) {
      this.metrics.set(key, {
        feature: instr.context.feature,
        domain: instr.context.domain,
        requestCount: 0,
        totalCost: 0,
        totalTokens: 0,
        totalDurationMs: 0,
        errorCount: 0,
        minCost: Infinity,
        maxCost: 0,
        lastUpdated: new Date(),
      });
    }

    const metric = this.metrics.get(key)!;
    metric.requestCount++;
    metric.totalCost += instr.cost.actualCost;
    metric.totalTokens += instr.cost.totalTokens;
    metric.totalDurationMs += instr.cost.durationMs;
    if (!instr.successfulRequest) metric.errorCount++;
    metric.minCost = Math.min(metric.minCost, instr.cost.actualCost);
    metric.maxCost = Math.max(metric.maxCost, instr.cost.actualCost);
    metric.lastUpdated = new Date();
  }

  /**
   * Get aggregated metrics by feature
   */
  getMetricsByFeature(feature: string): AggregatedMetric | null {
    const key = `feature:${feature}`;
    return this.metrics.get(key) || null;
  }

  /**
   * Get aggregated metrics by domain
   */
  getMetricsByDomain(domain: string): AggregatedMetric[] {
    return Array.from(this.metrics.values())
      .filter(m => m.domain === domain);
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): AggregatedMetric[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Reset aggregated metrics
   */
  reset(): void {
    this.metrics.clear();
  }

  /**
   * Create metric key
   */
  private getMetricKey(instr: LLMRequestInstrumentation): string {
    return `${instr.context.domain}:${instr.context.feature}`;
  }
}

interface AggregatedMetric {
  feature: string;
  domain: string;
  requestCount: number;
  totalCost: number;
  totalTokens: number;
  totalDurationMs: number;
  errorCount: number;
  minCost: number;
  maxCost: number;
  lastUpdated: Date;

  // Derived
  averageCost?: number;
  averageTokens?: number;
  averageDurationMs?: number;
  errorRate?: number;
}
```

### 6.2 Dashboard Integration

```typescript
// domains/product-factory/dashboard/lib/instrumentation/dashboard.ts

import { MetricsAggregator } from '@openrouter-crew/shared-cost-tracking';

/**
 * Real-time cost dashboard data provider
 */
export class CostDashboardProvider {
  private aggregator = new MetricsAggregator();

  /**
   * Get dashboard data
   */
  getDashboardData(projectId: string) {
    return {
      todaysCost: this.getTodaysCost(projectId),
      monthlyProjection: this.getMonthlyProjection(projectId),
      budgetStatus: this.getBudgetStatus(projectId),
      featureBreakdown: this.getFeatureBreakdown(projectId),
      modelDistribution: this.getModelDistribution(projectId),
      crewMemberMetrics: this.getCrewMemberMetrics(projectId),
      optimizationOpportunities: this.getOptimizationOpportunities(projectId),
    };
  }

  private getTodaysCost(projectId: string): number {
    // Sum costs from today's events
    return 0;
  }

  private getMonthlyProjection(projectId: string): number {
    // Estimate based on daily average
    return 0;
  }

  private getBudgetStatus(projectId: string) {
    return {
      limit: 1000,
      used: 250,
      remaining: 750,
      utilizationPercent: 25,
      daysRemaining: 25,
    };
  }

  private getFeatureBreakdown(projectId: string): Record<string, number> {
    const allMetrics = this.aggregator.getAllMetrics();
    return allMetrics.reduce((acc, m) => ({
      ...acc,
      [m.feature]: m.totalCost,
    }), {});
  }

  private getModelDistribution(projectId: string) {
    // Model usage distribution
    return {};
  }

  private getCrewMemberMetrics(projectId: string) {
    // Cost and usage per crew member
    return {};
  }

  private getOptimizationOpportunities(projectId: string) {
    // Suggest cost savings
    return [];
  }
}
```

---

## 7. STORAGE & PERSISTENCE

### 7.1 Supabase Schema

```sql
-- Enhanced llm_usage_events with instrumentation data
CREATE TABLE llm_usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Execution Context
  request_id UUID NOT NULL,
  trace_id UUID,
  span_id UUID,
  parent_span_id UUID,

  domain TEXT NOT NULL CHECK (domain IN ('product-factory', 'alex-ai', 'vscode-extension', 'cli', 'webhook')),
  feature TEXT NOT NULL,
  action TEXT,

  -- User & Session
  user_id UUID,
  session_id UUID,
  project_id UUID,
  team_id UUID,

  -- LLM Details
  model TEXT NOT NULL,
  crew_member TEXT,
  input_tokens INT,
  output_tokens INT,
  total_tokens INT,

  -- Cost
  estimated_cost_usd NUMERIC,
  actual_cost_usd NUMERIC,
  cost_currency TEXT DEFAULT 'USD',
  cost_tier TEXT CHECK (cost_tier IN ('premium', 'standard', 'budget', 'ultra_budget')),

  -- Performance
  duration_ms INT,
  token_throughput NUMERIC,

  -- Status
  successful BOOLEAN,
  error_message TEXT,
  error_code TEXT,

  -- Metadata
  input_method TEXT CHECK (input_method IN ('api', 'webhook', 'cli', 'ui', 'extension')),
  output_method TEXT,
  metadata JSONB DEFAULT '{}',

  -- Indexes
  CONSTRAINT fk_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  INDEX idx_domain_feature (domain, feature),
  INDEX idx_user_id (user_id),
  INDEX idx_project_id (project_id),
  INDEX idx_created_at (created_at),
  INDEX idx_trace_id (trace_id)
);

-- Feature usage aggregation table
CREATE TABLE feature_usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),

  feature_name TEXT NOT NULL,
  domain TEXT NOT NULL,

  -- Aggregates (daily)
  usage_count INT,
  total_cost_usd NUMERIC,
  average_cost_usd NUMERIC,
  total_duration_ms INT,
  error_count INT,
  error_rate NUMERIC,

  -- Period
  period_date DATE NOT NULL,

  CONSTRAINT unique_feature_domain_date UNIQUE (feature_name, domain, period_date),
  INDEX idx_feature_name (feature_name),
  INDEX idx_period_date (period_date)
);

-- Budget tracking table
CREATE TABLE budget_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),

  project_id UUID NOT NULL,
  budget_limit_usd NUMERIC NOT NULL,
  budget_used_usd NUMERIC,
  budget_remaining_usd NUMERIC,
  utilization_percent NUMERIC,

  alert_level TEXT CHECK (alert_level IN ('info', 'warning', 'critical')),
  alert_message TEXT,

  CONSTRAINT fk_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  INDEX idx_project_id (project_id)
);
```

---

## 8. INSTRUMENTATION INITIALIZATION

### 8.1 Bootstrap Configuration

```typescript
// domains/shared/cost-tracking/src/instrumentation/bootstrap.ts

import { setupCostInstrumentationHooks, onCostEvent } from './hooks';
import { MetricsAggregator } from './aggregator';

/**
 * Initialize cost instrumentation for application
 */
export async function initializeCostInstrumentation(config: {
  enableDatabaseTracking?: boolean;
  enableAnalytics?: boolean;
  enableBudgetAlerts?: boolean;
  enableOptimizationSuggestions?: boolean;
  analyticsEndpoint?: string;
}): Promise<void> {
  // Setup event hooks
  setupCostInstrumentationHooks();

  // Setup database tracking
  if (config.enableDatabaseTracking !== false) {
    onCostEvent('llm_request_complete', async (event) => {
      await storeCostEvent(event);
    });
  }

  // Setup analytics
  if (config.enableAnalytics) {
    onCostEvent('*', async (event) => {
      await sendToAnalytics(event, config.analyticsEndpoint);
    });
  }

  // Setup budget alerts
  if (config.enableBudgetAlerts !== false) {
    onCostEvent('llm_request_complete', async (event) => {
      await checkBudgetAndAlert(event);
    });
  }

  // Setup cost optimization
  if (config.enableOptimizationSuggestions !== false) {
    onCostEvent('llm_request_complete', async (event) => {
      await suggestOptimizations(event);
    });
  }

  console.log('✅ Cost instrumentation initialized');
}

/**
 * Usage in application startup
 */
export async function main() {
  // Initialize instrumentation first
  await initializeCostInstrumentation({
    enableDatabaseTracking: true,
    enableAnalytics: true,
    enableBudgetAlerts: true,
    enableOptimizationSuggestions: true,
    analyticsEndpoint: process.env.ANALYTICS_ENDPOINT,
  });

  // Then start application
  startApplication();
}
```

---

## 9. TESTING & MONITORING

### 9.1 Unit Tests for Instrumentation

```typescript
// domains/shared/cost-tracking/src/instrumentation/__tests__/decorators.test.ts

import { describe, it, expect } from '@jest/globals';
import { InstrumentLLMCall } from '../decorators';
import { onCostEvent } from '../emitter';

describe('InstrumentLLMCall Decorator', () => {
  it('should track LLM call cost', async () => {
    const events: any[] = [];

    onCostEvent('llm_request_complete', (event) => {
      events.push(event);
    });

    class TestService {
      executionContext = {
        requestId: 'test-123',
        traceId: 'trace-123',
        domain: 'product-factory',
      };

      @InstrumentLLMCall({
        domain: 'product-factory',
        feature: 'test',
        action: 'test-action',
      })
      async callLLM(prompt: string): Promise<string> {
        return 'test response';
      }
    }

    const service = new TestService();
    await service.callLLM('test prompt');

    expect(events).toHaveLength(1);
    expect(events[0].eventType).toBe('llm_request_complete');
    expect(events[0].instrumentation.successfulRequest).toBe(true);
  });

  it('should track errors', async () => {
    const events: any[] = [];

    onCostEvent('llm_request_error', (event) => {
      events.push(event);
    });

    class FailingService {
      executionContext = { requestId: 'test-123' };

      @InstrumentLLMCall({
        domain: 'product-factory',
        feature: 'test',
        action: 'failing-action',
      })
      async callLLM(): Promise<never> {
        throw new Error('API Error');
      }
    }

    const service = new FailingService();

    try {
      await service.callLLM();
    } catch {}

    expect(events).toHaveLength(1);
    expect(events[0].instrumentation.successfulRequest).toBe(false);
  });
});
```

### 9.2 Instrumentation Dashboard

```typescript
// domains/product-factory/dashboard/pages/admin/instrumentation.tsx

import { CostDashboardProvider } from '@/lib/instrumentation/dashboard';

export default function InstrumentationDashboard() {
  const provider = new CostDashboardProvider();
  const data = provider.getDashboardData('project-123');

  return (
    <div className="p-8">
      <h1>Cost Instrumentation Dashboard</h1>

      {/* Real-time Metrics */}
      <section>
        <h2>Today's Cost: ${data.todaysCost.toFixed(2)}</h2>
        <p>Projected Monthly: ${data.monthlyProjection.toFixed(2)}</p>
      </section>

      {/* Budget Status */}
      <section>
        <h3>Budget Status</h3>
        <ProgressBar
          used={data.budgetStatus.used}
          limit={data.budgetStatus.limit}
        />
        <p>{data.budgetStatus.utilizationPercent}% used</p>
      </section>

      {/* Feature Breakdown */}
      <section>
        <h3>Cost by Feature</h3>
        <BarChart data={data.featureBreakdown} />
      </section>

      {/* Optimization Opportunities */}
      <section>
        <h3>Cost Optimization Opportunities</h3>
        <ul>
          {data.optimizationOpportunities.map((opp, i) => (
            <li key={i}>{opp.suggestion} - Save ${opp.savings.toFixed(2)}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
```

---

## 10. BEST PRACTICES & GUIDELINES

### 10.1 When to Instrument

✅ **Always Instrument**:
- LLM API calls (OpenRouter, direct providers)
- Feature usage in user-facing flows
- N8N workflow executions
- Critical code paths affecting cost

⚠️ **Conditionally Instrument**:
- Development/test environments (may want to disable)
- High-frequency operations (cache/batch events)
- Internal utility functions

❌ **Don't Instrument**:
- Simple logging or utility functions
- Non-critical internal operations
- Functions already instrumented by parent

### 10.2 Context Management

```typescript
// Good: Pass context through entire call stack
async function complexOperation(context: ExecutionContext) {
  this.context = context;  // Store for decorators
  await this.llmCall();
  await this.secondLLMCall();
}

// Avoid: Creating new context per call
async function complexOperation() {
  const context1 = createContext();  // ❌ Different traceId!
  await this.llmCall(context1);
  const context2 = createContext();  // ❌ Different traceId!
  await this.secondLLMCall(context2);
}
```

### 10.3 Trace ID Propagation

```typescript
// HTTP Headers
'X-Request-ID': context.requestId
'X-Trace-ID': context.traceId
'X-Span-ID': context.spanId
'X-Parent-Span-ID': context.parentSpanId

// Message Queue
{ traceId, spanId, parentSpanId, payload }

// N8N Variables
{{ $json.traceId }}
```

---

## 11. IMPLEMENTATION ROADMAP

### Phase 1: Core Infrastructure (Weeks 1-2)
- [ ] Define type system
- [ ] Implement event emitter
- [ ] Create basic decorators
- [ ] Setup Supabase schema

### Phase 2: Integration (Weeks 3-4)
- [ ] Integrate with API routes
- [ ] Integrate with N8N workflows
- [ ] Integrate with CLI
- [ ] Integrate with VSCode extension

### Phase 3: Observability (Weeks 5-6)
- [ ] Build metrics aggregator
- [ ] Create dashboard
- [ ] Setup analytics pipeline
- [ ] Implement budget alerts

### Phase 4: Optimization (Weeks 7-8)
- [ ] Generate cost optimization suggestions
- [ ] Setup recommendations UI
- [ ] Performance tuning
- [ ] Documentation

---

## 12. MIGRATION GUIDE

### Step 1: Update Type Dependencies
```bash
pnpm add @openrouter-crew/shared-cost-tracking
```

### Step 2: Initialize in Application
```typescript
import { initializeCostInstrumentation } from '@openrouter-crew/shared-cost-tracking';

await initializeCostInstrumentation({
  enableDatabaseTracking: true,
  enableAnalytics: true,
});
```

### Step 3: Add Decorators to LLM Services
```typescript
@InstrumentLLMCall({
  domain: 'product-factory',
  feature: 'your-feature',
  action: 'your-action',
})
async callLLM(prompt: string): Promise<string> {
  // Implementation
}
```

### Step 4: Update API Routes
```typescript
// Add middleware
app.use(costInstrumentationMiddleware());

// Use instrumented fetch in routes
const fetch = useInstrumentedFetch();
```

---

**Generated**: 2026-02-09
**Status**: Design Complete - Ready for Implementation
**Priority**: High - Foundation for cost optimization
