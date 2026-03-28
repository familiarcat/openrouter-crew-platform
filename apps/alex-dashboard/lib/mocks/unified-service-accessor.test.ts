import { unifiedServiceAccessor, UnifiedServiceAccessor, getService } from './unified-service-accessor';
import { CrewAPIClient } from '@openrouter-crew/crew-api-client';

jest.mock('@openrouter-crew/crew-api-client');

describe('Unified Service Accessor Shim', () => {
  it('should export an instantiated CrewAPIClient as unifiedServiceAccessor', () => {
    expect(unifiedServiceAccessor).toBeInstanceOf(CrewAPIClient);
  });

  it('should export a class UnifiedServiceAccessor that extends CrewAPIClient', () => {
    const instance = new UnifiedServiceAccessor();
    expect(instance).toBeInstanceOf(CrewAPIClient);
    expect(instance).toBeInstanceOf(UnifiedServiceAccessor);
  });

  it('should export getService which returns a CrewAPIClient', () => {
    const service = getService();
    expect(service).toBeInstanceOf(CrewAPIClient);
  });
});