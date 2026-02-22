import { ExecutionContext } from '../types';
import { v4 as uuidv4 } from 'uuid';

export function createDefaultContext(): ExecutionContext {
  return {
    requestId: uuidv4(),
    traceId: uuidv4(),
    spanId: uuidv4(),
    domain: 'unknown',
    feature: 'unknown',
    action: 'unknown',
    timestamp: new Date(),
  };
}

export function generateUUID(): string {
  return uuidv4();
}