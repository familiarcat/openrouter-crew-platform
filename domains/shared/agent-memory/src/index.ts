/**
 * @openrouter-crew/agent-memory
 * Weighted Memory Interpolation System
 */

// Main service
export { MemoryService, createMemoryService } from './memory-service';

// Component exports
export { MemoryGraph } from './memory-graph';
export { MemoryInterpolator } from './interpolator';
export { MemoryReinforcer } from './reinforcer';
export { DecayManager } from './decay-manager';
export { PromptBuilder } from './prompt-builder';
export { ContextEncoder } from './context-encoder';

// Visualization exports
export { createMemoryAPI } from './memory-api';

// Design System exports
export {
  designSystem,
  colors,
  spacing,
  sizes,
  typography,
  effects,
  components,
  breakpoints,
  animations,
  getCSSVariables,
  getLayerColors,
  getStatusColors,
  createGrid,
} from './design-system';

// Type exports
export type {
  MemoryLayer,
  RetentionTier,
  MemoryOutcome,
  MemoryIntent,
  MemoryDomain,
  MemoryNode,
  MemoryEdge,
  WeightedMemory,
  MemoryRetrievalOptions,
  MemoryInsertOptions,
  OutcomeReport,
  EncodedContext,
  MemoryRetrievalResult,
  DecayConfig,
  PromptBuilderOptions,
} from './types';

export { MemoryServiceError } from './types';
