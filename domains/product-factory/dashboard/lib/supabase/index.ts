import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseBrowser = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey
)

export const supabaseServer = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey
)

// Legacy compatibility
export const supabase = supabaseServer

export async function logAudit(..._args: any[]) {
  return true
}

export async function checkPermission(..._args: any[]) {
  return true
}

export type AuthProfile = {
  user_id: string;
  email?: string | null;
  role?: string | null;
}
