// Optional helper for future cleanup: a boundary-cast query wrapper.
// Not required for the TS2589 fix, but included for consistency.
import type { SupabaseClient } from '@supabase/supabase-js';

export type QueryResult<T> = { data: T | null; error: any };

export function fromAny(client: SupabaseClient<any>, table: string) {
  return (client as any).from(table);
}
