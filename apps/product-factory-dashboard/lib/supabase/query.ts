// Supabase query boundary helpers.
//
// Purpose: prevent TypeScript "type instantiation is excessively deep" errors
// in cross-cutting code paths (auth/middleware/app routes) by establishing an
// explicit typing boundary at the query site.
//
// Use in auth/middleware-like code where Supabase generics explode:
//
//   type ApiKeyRow = { user_id: string; expires_at: string | null; revoked_at: string | null };
//   const { data, error } = await q<ApiKeyRow>(supabase, 'api_keys')
//     .select('user_id, expires_at, revoked_at')
//     .eq('key_hash', keyHash)
//     .maybeSingle();
//
// NOTE: In most of this codebase, we prefer the minimal cast boundary:
//   (supabase as any).from('api_keys') ...
// This helper is provided as a cleaner alternative going forward.
import type { SupabaseClient } from '@supabase/supabase-js';

export type QueryResult<T> = { data: T | null; error: any };

export function q<Row>(client: SupabaseClient<any>, table: string) {
  // We intentionally cast the query builder to avoid deep generic instantiation.
  const base = (client as any).from(table);

  return {
    select(columns: string) {
      const qb = base.select(columns);
      return {
        eq(column: string, value: any) {
          const q2 = qb.eq(column, value);
          return {
            maybeSingle(): Promise<QueryResult<Row>> {
              return q2.maybeSingle() as Promise<QueryResult<Row>>;
            },
            single(): Promise<QueryResult<Row>> {
              return q2.single() as Promise<QueryResult<Row>>;
            },
            limit(n: number) {
              const q3 = q2.limit(n);
              return {
                then: (resolve: any, reject?: any) => (q3 as any).then(resolve, reject),
              };
            },
            then: (resolve: any, reject?: any) => (q2 as any).then(resolve, reject),
          };
        },
        maybeSingle(): Promise<QueryResult<Row>> {
          return qb.maybeSingle() as Promise<QueryResult<Row>>;
        },
        single(): Promise<QueryResult<Row>> {
          return qb.single() as Promise<QueryResult<Row>>;
        },
        then: (resolve: any, reject?: any) => (qb as any).then(resolve, reject),
      };
    },
  };
}
