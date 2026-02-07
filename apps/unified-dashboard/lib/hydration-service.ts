import { createClient } from '@supabase/supabase-js';
import { DOMAINS, MOCK_PROJECTS } from './unified-mock-data';

// Safe initialization for build time
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'local-test-key';
const n8nUrl = process.env.NEXT_PUBLIC_N8N_URL || process.env.N8N_URL || 'http://localhost:5678';

export async function hydrateSupabase() {
  console.log('💧 Hydrating Supabase...');
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Simulate hydration logic
    console.log('   - Pushing', DOMAINS.length, 'domains');
    console.log('   - Pushing', MOCK_PROJECTS.length, 'projects');
    
    return { success: true, message: 'Supabase hydration simulated' };
  } catch (e: any) {
    console.error('Supabase hydration error:', e);
    return { success: false, message: e.message };
  }
}

export async function hydrateN8n() {
  console.log('💧 Hydrating n8n...');
  try {
    console.log('   - Checking n8n connectivity at', n8nUrl);
    return { success: true, message: 'n8n hydration simulated' };
  } catch (e: any) {
    console.error('n8n hydration error:', e);
    return { success: false, message: e.message };
  }
}

export async function hydrateAll() {
  const sb = await hydrateSupabase();
  const n8n = await hydrateN8n();
  return { supabase: sb, n8n };
}
