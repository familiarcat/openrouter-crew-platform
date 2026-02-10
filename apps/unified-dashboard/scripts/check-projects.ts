import { createClient } from '@supabase/supabase-js';
import type { Database } from '@openrouter-crew/shared-schemas';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkProjects() {
  console.log('📊 Checking projects in database...\n');

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  console.log(`Found ${data?.length || 0} projects:\n`);

  (data || []).forEach((project: any) => {
    const metadata = project?.metadata as any;
    const isDomain = metadata?.isDomainProject || false;
    const featureAreas = metadata?.featureAreas || [];
    const health = metadata?.health;

    console.log(`${isDomain ? '🏢 DOMAIN' : '📦 PROJECT'}: ${project.name}`);
    console.log(`  ID: ${project.id}`);
    console.log(`  Type: ${project.type}`);
    console.log(`  Status: ${project.status}`);
    if (health) {
      console.log(`  Health: D${health.demand} M${health.monetization} Δ${health.differentiation}`);
    }
    if (featureAreas.length > 0) {
      console.log(`  Feature Areas: ${featureAreas.length}`);
      featureAreas.forEach((area: any) => {
        console.log(`    - ${area.name} (${area.status}, ${area.progress}%)`);
      });
    }
    console.log('');
  });
}

checkProjects().catch(console.error);
