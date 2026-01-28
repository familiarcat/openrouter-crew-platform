import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@openrouter-crew/shared-schemas'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Create a simple mock client for build/SSR with proper return types
const mockQueryBuilder = {
  select: () => Promise.resolve({ data: [] as any, error: null }),
  insert: () => Promise.resolve({ data: null as any, error: null }),
  update: () => Promise.resolve({ data: null as any, error: null }),
  delete: () => Promise.resolve({ data: null as any, error: null }),
  order: () => mockQueryBuilder,
  limit: () => mockQueryBuilder,
}

const mockClient = {
  from: () => mockQueryBuilder,
  channel: () => ({
    on: () => ({ subscribe: () => ({}) }),
  }),
  removeChannel: () => {},
} as unknown as SupabaseClient<Database>

// Lazy client creation
let supabaseClient: SupabaseClient<Database> | null = null

function getSupabaseClient(): SupabaseClient<Database> {
  if (typeof window === 'undefined') {
    return mockClient
  }

  if (!supabaseClient) {
    supabaseClient = createClient<Database>(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      }
    )
  }
  return supabaseClient
}

// Export getter function instead of Proxy
export function getSupabase(): SupabaseClient<Database> {
  return getSupabaseClient()
}

// For backwards compatibility, export as supabase
export const supabase = getSupabaseClient()

// Admin client (for server-side operations)
let supabaseAdmin: ReturnType<typeof createClient<Database>> | null = null

export function getSupabaseAdmin() {
  if (supabaseAdmin) return supabaseAdmin

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY - required for admin operations')
  }

  supabaseAdmin = createClient<Database>(
    SUPABASE_URL,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )

  return supabaseAdmin
}
