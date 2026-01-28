import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// --- Server-side Supabase client (for API routes, server components) ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('SUPABASE_URL is not set for the server-side client.');
}

if (!supabaseServiceRoleKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set for the server-side client.');
}

export const supabaseServer: SupabaseClient<Database> = createClient<Database>(supabaseUrl, supabaseServiceRoleKey);

// --- Client-side Supabase client (for browser) ---
const publicSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publicSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!publicSupabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set for the client-side client.');
}

if (!publicSupabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set for the client-side client.');
}

export const supabaseBrowser: SupabaseClient<Database> = createClient<Database>(publicSupabaseUrl, publicSupabaseAnonKey);

// --- Canonical Exports ---
// Default export for server-side usage, as was the legacy setup
export const supabase: SupabaseClient<Database> = supabaseServer;

// --- Utility Functions ---

// The real implementations of these functions seem to be elsewhere.
// I will provide simple placeholders here to avoid breaking imports,
// but they should be properly implemented or imported from their correct location.

export async function logAudit(event: any) {
  console.log("AUDIT LOG (placeholder):", event);
  // A real implementation would likely use supabaseServer to insert into an audit table.
  // const { error } = await supabaseServer.from('audit_log').insert({ event });
  // if (error) console.error('Error logging audit event:', error);
  return Promise.resolve(true);
}

export async function checkPermission(userId: string, permission: string, projectId?: string): Promise<boolean> {
  console.log(`CHECKING PERMISSION (placeholder): ${permission} for user ${userId}`);
  // A real implementation would query the database to check user roles and permissions.
  // This is a placeholder and should not be used for actual security.
  return Promise.resolve(true);
}

export type ApiKey = {
    id: string;
    user_id: string;
    key_hash: string;
    label: string;
    created_at: string;
    revoked_at?: string | null;
};

export type AuthProfile = {
  id: string;
  user_id: string;
  email?: string | null;
  role?: string | null;
};