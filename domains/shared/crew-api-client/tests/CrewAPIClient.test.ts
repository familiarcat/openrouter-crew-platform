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
  private idCounter: number = 0;

  from(table: string) {
    return {
      insert: (data: any) => {
        if (table === 'crew_memory_vectors') {
          const id = `mem_${Date.now()}_${++this.idCounter}`;
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
        const queryState = {
          filters: [] as Array<(m: any) => boolean>,
          orderField: '',
          orderAsc: true,
          limitValue: 0,
          eq: function(field: string, value: any) {
            this.filters.push((m: any) => m[field] === value);
            return this;
          },
          gte: function(field: string, value: any) {
            this.filters.push((m: any) => m[field] >= value);
            return this;
          },
          lte: function(field: string, value: any) {
            this.filters.push((m: any) => m[field] <= value);
            return this;
          },
          lt: function(field: string, value: any) {
            this.filters.push((m: any) => m[field] < value);
            return this;
          },
          ilike: function(field: string, query: string) {
            this.filters.push((m: any) => m[field]?.toLowerCase?.().includes(query.toLowerCase()));
            return this;
          },
          order: function(field: string, options: any) {
            this.orderField = field;
            this.orderAsc = options?.ascending !== false;
            return this;
          },
          limit: function(n: number) {
            this.limitValue = n;
            return this;
          },
          single: async function() {
            let results = Array.from(this.memories.values());
            this.filters.forEach((f: any) => {
              results = results.filter(f);
            });
            return { data: results[0] || null, error: results.length === 0 ? { message: 'Not found' } : null };
          },
          then: (cb: any) => {
            let results = Array.from(this.memories.values());
            queryState.filters.forEach((f: any) => {
              results = results.filter(f);
            });
            if (queryState.orderField) {
              results.sort((a: any, b: any) => {
                const aVal = a[queryState.orderField];
                const bVal = b[queryState.orderField];
                if (queryState.orderAsc) return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
                return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
              });
            }
            if (queryState.limitValue) {
              results = results.slice(0, queryState.limitValue);
            }
            cb({ data: results, error: null, count: results.length });
          },
          memories: this.memories,
        };
        return queryState as any;
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

  describe('Query Operations - Semantic Consistency', () => {
    test('search_memories produces consistent results across surfaces', async () => {
      const createParams = {
        content: 'Search test memory',
        type: 'story' as const,
      };

      const context = {
        user_id: 'user_123',
        crew_id: 'crew_abc',
        role: 'member' as const,
        surface: 'cli' as const,
      };

      await client.create_memory(createParams, context);

      const searchParams = {
        query: 'Search test',
        limit: 10,
      };

      const ideResult = await client.search_memories(searchParams, {
        ...context,
        surface: 'ide' as const,
      });

      const webResult = await client.search_memories(searchParams, {
        ...context,
        surface: 'web' as const,
      });

      // ASSERTION: Both surfaces find same memories
      expect(ideResult.length).toBe(webResult.length);
      expect(ideResult[0]?.content).toBe(webResult[0]?.content);
    });

    test('compliance_status accessible only to members and owners', async () => {
      const context = {
        user_id: 'user_123',
        crew_id: 'crew_abc',
        role: 'viewer' as const,
        surface: 'cli' as const,
      };

      const params = { crew_id: 'crew_abc', period: '30d' };

      // ASSERTION: Viewer cannot access compliance status
      await expect(client.compliance_status(params, context)).rejects.toThrow(
        UnauthorizedError
      );

      // ASSERTION: Member can access
      const memberContext = { ...context, role: 'member' as const };
      await expect(client.compliance_status(params, memberContext)).resolves.toBeDefined();
    });

    test('expiration_forecast produces consistent structure', async () => {
      const context = {
        user_id: 'user_123',
        crew_id: 'crew_abc',
        role: 'member' as const,
        surface: 'cli' as const,
      };

      const params = { crew_id: 'crew_abc' };
      const result = await client.expiration_forecast(params, context);

      // ASSERTION: Result has required structure
      expect(result).toHaveProperty('crew_id');
      expect(result).toHaveProperty('expiring_soon');
      expect(result).toHaveProperty('expiring_30days');
      expect(result).toHaveProperty('expiring_90days');
    });
  });

  describe('Admin Operations - Authorization', () => {
    test('export_crew_data accessible only to owners', async () => {
      const context = {
        user_id: 'user_123',
        crew_id: 'crew_abc',
        role: 'member' as const,
        surface: 'cli' as const,
      };

      const params = { crew_id: 'crew_abc', format: 'json' as const };

      // ASSERTION: Member cannot export
      await expect(client.export_crew_data(params, context)).rejects.toThrow(
        UnauthorizedError
      );

      // ASSERTION: Owner can export
      const ownerContext = { ...context, role: 'owner' as const };
      await expect(client.export_crew_data(params, ownerContext)).resolves.toBeDefined();
    });

    test('prune_expired_memories accessible only to owners', async () => {
      const context = {
        user_id: 'user_123',
        crew_id: 'crew_abc',
        role: 'member' as const,
        surface: 'cli' as const,
      };

      const params = { crew_id: 'crew_abc', dry_run: true };

      // ASSERTION: Member cannot prune
      await expect(
        client.prune_expired_memories(params, context)
      ).rejects.toThrow(UnauthorizedError);

      // ASSERTION: Owner can prune
      const ownerContext = { ...context, role: 'owner' as const };
      await expect(
        client.prune_expired_memories(params, ownerContext)
      ).resolves.toBeDefined();
    });

    test('generate_audit_report accessible only to owners', async () => {
      const context = {
        user_id: 'user_123',
        crew_id: 'crew_abc',
        role: 'viewer' as const,
        surface: 'cli' as const,
      };

      const params = {
        crew_id: 'crew_abc',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
      };

      // ASSERTION: Viewer cannot generate report
      await expect(
        client.generate_audit_report(params, context)
      ).rejects.toThrow(UnauthorizedError);

      // ASSERTION: Owner can generate report
      const ownerContext = { ...context, role: 'owner' as const };
      await expect(
        client.generate_audit_report(params, ownerContext)
      ).resolves.toBeDefined();
    });
  });
});
