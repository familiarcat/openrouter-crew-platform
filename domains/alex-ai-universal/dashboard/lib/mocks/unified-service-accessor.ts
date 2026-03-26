/**
 * Compatibility shim for legacy imports of unified-service-accessor
 * Redirects to the new shared CrewAPIClient
 */

import { CrewAPIClient } from '@openrouter-crew/crew-api-client';

// Re-export the client as the default or named export expected by legacy code
export const unifiedServiceAccessor = new CrewAPIClient();

// If the legacy code expects a class
export class UnifiedServiceAccessor extends CrewAPIClient {}

// If the legacy code expects specific utility functions, they should be added here
export const getService = () => new CrewAPIClient();