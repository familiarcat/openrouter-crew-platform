import { EventEmitter } from 'events';
import { CostEvent } from '../types';

class CostEventEmitter extends EventEmitter {
  emitCostEvent(event: CostEvent): void {
    this.emit('cost', event);
    this.emit(event.eventType, event);
  }

  onCostEvent(eventType: string, handler: (event: CostEvent) => void): void {
    this.on(eventType, handler);
  }
}

export const costEventEmitter = new CostEventEmitter();

export function emitCostEvent(event: CostEvent): void {
  costEventEmitter.emitCostEvent(event);
}

export function onCostEvent(eventType: string, handler: (event: CostEvent) => void): void {
  costEventEmitter.onCostEvent(eventType, handler);
}