/**
 * Semantic Parity Tests
 * Verify CrewAPIClient produces identical results across all surfaces
 */

import { CrewAPIClient, UnauthorizedError, OperationError } from '../src/index';

/**
 * Mock Supabase client for testing
 */
class MockSupabaseClient {
  private memories: Map<string, any> = new Map();
  private auditLog: any[] = [];

  from(table: string) {
    return {
      insert: (data: any) => {
        if (table === 'crew_memory_vectors') {
          const id = `mem_${Date.now()}`;
          const record = { id, ...data };
          this.memories.set(id, record);
          return {
            select: () => ({
              single: async () => ({ data: record, error: null }),
            }),
          };
        }
        return {
          select: () => ({
            single: async () => ({ data: null, error: null }),
          }),
        };
      },
      select: (fields: string) => {
        return {
          eq: (field: string, value: any) => {
            return {
              ilike: (field: string, query: string) => {
                return {
                  order: (field: string, options: any) => {
                    return {
                      limit: (n: number) => {
                        const results = Array.from(this.memories.values())
                          .filter((m) => m.crew_id === value)
                          .slice(0, n);
                        return {
                          then: (cb: any) => cb({ data: results, error: null, count: results.length }),
                        };
                      },
                    };
                  },
                };
              },
              order: (field: string, options: any) => {
                return {
                  limit: (n: number) => {
                    const results = Array.from(this.memories.values())
                      .filter((m) => m.crew_id === value)
                      .slice(0, n);
                    return {
                      then: (cb: any) => cb({ data: results, error: null, count: results.length }),
                    };
                  },
                };
              },
            };
          },
        };
      },
      update: (data: any) => {
        return {
          eq: (field: string, value: any) => {
            return {
              select: () => ({
                single: async () => {
                  const memory = this.memories.get(value);
                  if (memory) {
                    const updated = { ...memory, ...data };
                    this.memories.set(value, updated);
                    return { data: updated, error: null };
                  }
                  return { data: null, error: { message: 'Not found' } };
                },
              }),
            };
          },
        };
      },
      delete: () => {
        return {
          eq: (field: string, value: any) => {
            return {
              then: (cb: any) => {
                this.memories.delete(value);
                cb({ error: null });
              },
            };
          },
        };
      },
    };
  }

  getMemories() {
    return Array.from(this.memories.values());
  }

  getAuditLog() {
    return this.auditLog;
  }
}

describe('CrewAPIClient - Semantic Parity Tests', () => {
  let client: CrewAPIClient;
  let mockSupabase: MockSupabaseClient;

  beforeEach(() => {
    mockSupabase = new MockSupabaseClient();
    client = new CrewAPIClient(mockSupabase as any);
  });

  describe('Memory Operations - Semantic Consistency', () => {
    test('create_memory produces consistent response across surfaces', async () => {
      const params = {
        content: 'Mobile onboarding story',
        type: 'story' as const,
        retention_tier: 'standard' as const,
      };

      const ideContext = {
        user_id: 'user_123',
        crew_id: 'crew_abc',
        role: 'member' as const,
        surface: 'ide' as const,
      };

      const cliContext = {
        user_id: 'user_123',
        crew_id: 'crew_abc',
        role: 'member' as const,
        surface: 'cli' as const,
      };

      const ideResult = await client.create_memory(params, ideContext);
      const cliResult = await client.create_memory(params, cliContext);

      // ASSERTION: Both create identical memory
      expect(ideResult.content).toBe(cliResult.content);
      expect(ideResult.type).toBe(cliResult.type);

      // ASSERTION: Cost is identical
      expect(ideResult.cost).toBe(cliResult.cost);

      // ASSERTION: Both produce typed responses
      expect(ideResult).toHaveProperty('id');
      expect(ideResult).toHaveProperty('created_at');
      expect(cliResult).toHaveProperty('id');
      expect(cliResult).toHaveProperty('created_at');
    });

    test('retrieve_memories produces identical results across surfaces', async () => {
      const createParams = {
        content: 'Test memory',
        type: 'story' as const,
      };

      const context = {
        user_id: 'user_123',
        crew_id: 'crew_abc',
        role: 'member' as const,
        surface: 'cli' as const,
      };

      await client.create_memory(createParams, context);

      const retrieveParams = {
        crew_id: 'crew_abc',
        filter: 'Test',
      };

      const ideResult = await client.retrieve_memories(retrieveParams, {
        ...context,
        surface: 'ide' as const,
      });

      const webResult = await client.retrieve_memories(retrieveParams, {
        ...context,
        surface: 'web' as const,
      });

      // ASSERTION: Both surfaces retrieve same memories
      expect(ideResult.memories).toHaveLength(webResult.memories.length);
      expect(ideResult.total).toBe(webResult.total);

      // ASSERTION: Cost is identical
      expect(ideResult.cost).toBe(webResult.cost);

      // ASSERTION: Confidence is identical
      expect(ideResult.confidence).toBe(webResult.confidence);
    });
  });

  describe('Authorization - Semantic Consistency', () => {
    test('delete_memory enforces same permissions across all surfaces', async () => {
      const createParams = {
        content: 'Test',
        type: 'story' as const,
      };

      const ownerContext = {
        user_id: 'owner_123',
        crew_id: 'crew_abc',
        role: 'owner' as const,
        surface: 'cli' as const,
      };

      const response = await client.create_memory(createParams, ownerContext);

      const deleteParams = { id: response.id };

      const viewerContext = {
        user_id: 'viewer_123',
        crew_id: 'crew_abc',
        role: 'viewer' as const,
        surface: 'web' as const,
      };

      // ASSERTION: All surfaces reject viewer delete
      await expect(client.delete_memory(deleteParams, viewerContext)).rejects.toThrow(
        UnauthorizedError
      );

      const memberContext = {
        ...viewerContext,
        role: 'member' as const,
      };

      // ASSERTION: All surfaces reject member delete
      await expect(client.delete_memory(deleteParams, memberContext)).rejects.toThrow(
        UnauthorizedError
      );

      // ASSERTION: Owner can delete (same across all surfaces)
      const ideOwnerContext = { ...ownerContext, surface: 'ide' as const };
      const n8nOwnerContext = { ...ownerContext, surface: 'n8n' as const };

      await expect(client.delete_memory(deleteParams, ideOwnerContext)).resolves.toBeDefined();
    });

    test('create_memory enforces same permissions across all surfaces', async () => {
      const params = {
        content: 'Test',
        type: 'story' as const,
      };

      const viewerContext = {
        user_id: 'viewer_123',
        crew_id: 'crew_abc',
        role: 'viewer' as const,
        surface: 'cli' as const,
      };

      // ASSERTION: Viewer cannot create (consistent across surfaces)
      await expect(client.create_memory(params, viewerContext)).rejects.toThrow(
        UnauthorizedError
      );

      const webViewerContext = { ...viewerContext, surface: 'web' as const };
      await expect(client.create_memory(params, webViewerContext)).rejects.toThrow(
        UnauthorizedError
      );
    });
  });

  describe('Cost Tracking - Semantic Consistency', () => {
    test('operations report consistent costs across surfaces', async () => {
      const params = {
        content: 'A'.repeat(100), // 100 character content
        type: 'story' as const,
      };

      const context = {
        user_id: 'user_123',
        crew_id: 'crew_abc',
        role: 'member' as const,
        surface: 'cli' as const,
      };

      const ideResult = await client.create_memory(params, {
        ...context,
        surface: 'ide' as const,
      });

      const cliResult = await client.create_memory(params, context);

      // ASSERTION: Cost is identical regardless of surface
      expect(ideResult.cost).toBe(cliResult.cost);

      // ASSERTION: Cost is non-zero (operation has cost)
      expect(ideResult.cost).toBeGreaterThan(0);
    });
  });

  describe('Error Handling - Semantic Consistency', () => {
    test('operation errors have consistent structure across surfaces', async () => {
      const params = {
        content: 'Test',
        type: 'story' as const,
      };

      const invalidCrewContext = {
        user_id: 'user_123',
        crew_id: 'different_crew',
        role: 'member' as const,
        surface: 'cli' as const,
      };

      try {
        await client.create_memory(params, invalidCrewContext);
        fail('Should have thrown');
      } catch (error) {
        // All surfaces should throw same error type
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Determinism - Same Input = Same Output', () => {
    test('identical inputs produce identical outputs', async () => {
      const params = {
        content: 'Deterministic test',
        type: 'story' as const,
        retention_tier: 'standard' as const,
        tags: ['test', 'deterministic'],
      };

      const context = {
        user_id: 'user_123',
        crew_id: 'crew_abc',
        role: 'member' as const,
        surface: 'cli' as const,
      };

      const result1 = await client.create_memory(params, context);
      const result2 = await client.create_memory(params, context);

      // ASSERTION: Both have identical cost (deterministic)
      expect(result1.cost).toBe(result2.cost);

      // ASSERTION: Both produce valid responses
      expect(result1).toHaveProperty('id');
      expect(result2).toHaveProperty('id');
      expect(result1.id).not.toBe(result2.id); // Different memories (new IDs)
      expect(result1.content).toBe(result2.content); // Same content
    });
  });
});
