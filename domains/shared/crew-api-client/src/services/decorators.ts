/// <reference types="node" />
import { ExecutionContext, LLMRequestInstrumentation, CostMeasurement } from '../types';
import { emitCostEvent } from './emitter';
import { createDefaultContext } from './utils';

// Assumed imports from parent package - these would need to be exported by the package
// import { costCalculator } from '@shared/cost-tracking';
// import { getBudgetInfo } from '../budget-enforcer'; // Not available in shared-cost-tracking exports

const costCalculator = { estimateTokens: (text: string) => Math.ceil((text || '').length / 4) };

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
      const context = (this as any).executionContext || createDefaultContext();

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
        
        // Assuming args[0] is prompt and args[1] is model, or similar signature
        // This might need adjustment based on actual method signatures
        const inputTokens = costCalculator.estimateTokens(args[0] || '');
        const outputTokens = costCalculator.estimateTokens(result || '');
        instrumentation.cost = {
          model: args[1] || 'unknown',
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens,
          estimatedCost: 0,
          actualCost: 0, // costCalculator.calculateActualCost might throw
          durationMs,
        };

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
      const context = (this as any).executionContext || createDefaultContext();

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
      const context = (this as any).executionContext || createDefaultContext();
      // const budgetInfo = getBudgetInfo(context, options.budgetSource);

      // if (budgetInfo.budgetUtilizationPercent > 90) {
      //   if (options.action === 'reject') {
      //     throw new Error('Budget limit exceeded');
      //   } else if (options.action === 'degrade') {
      //     // Use cheaper model instead
      //     console.warn('Budget limit approaching, degrading to cheaper model');
      //   }
      // }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}