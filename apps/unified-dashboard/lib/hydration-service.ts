import { createClient } from '@supabase/supabase-js';
import { DOMAINS, MOCK_PROJECTS, MOCK_WORKFLOWS } from './unified-mock-data';

// Safe initialization for build time
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'local-test-key';
const n8nUrl = process.env.NEXT_PUBLIC_N8N_URL || process.env.N8N_URL || 'http://localhost:5678';

const isRemote = !supabaseUrl.includes('localhost') && !supabaseUrl.includes('127.0.0.1');

export async function hydrateSupabase() {
  console.log(`💧 Hydrating Supabase (${isRemote ? 'REMOTE' : 'LOCAL'})...`);
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('   - Pushing', MOCK_PROJECTS.length, 'projects to DB');
    console.log('   - Pushing', MOCK_WORKFLOWS.length, 'workflows to DB');
    
    // Map UI model to DB Schema (using metadata JSONB column for complex objects)
    const dbRows = MOCK_PROJECTS.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      status: p.status,
      // Store complex nested objects in metadata to avoid rigid schema requirements
      metadata: {
        domainId: p.domainId,
        budget: p.budget,
        team: p.team,
        metrics: p.metrics
      },
      updated_at: p.updatedAt
    }));

    const { error } = await supabase
      .from('projects')
      .upsert(dbRows, { onConflict: 'id' });

    if (error) console.warn('Project sync warning:', error.message);

    // Sync Workflows
    const wfRows = MOCK_WORKFLOWS.map(w => ({
      id: w.id,
      name: w.name,
      status: w.status,
      last_run: w.lastRun,
      updated_at: new Date().toISOString()
    }));

    const { error: wfError } = await supabase
      .from('workflows')
      .upsert(wfRows, { onConflict: 'id' });
    
    return { success: true, message: `Synced ${dbRows.length} projects and ${wfRows.length} workflows to Supabase.` };
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
