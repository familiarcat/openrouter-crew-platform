/**
 * 🔍 Dashboard Data Verification Script
 * 
 * Verifies that Supabase data is hydrated and accessible via UnifiedDataService.
 * Usage: npx ts-node scripts/verify-data-hydration.ts
 */

import { getUnifiedDataService } from './unified-data-service';

// Note: Environment variables must be loaded before running this script
// Example: npx dotenv -e .env.local -- npx ts-node lib/verify-data-hydration.ts

async function verifyDashboardData() {
  const service = getUnifiedDataService();
  console.log('🔍 Verifying Dashboard Data Connectivity...\n');

  try {
    // 1. Verify Cost Data (llm_usage_events)
    console.log('1️⃣  Checking Cost Data...');
    const costData = await service.getCostData();
    if (costData?.recentEvents?.length > 0) {
      console.log(`   ✅ Success: Found ${costData.recentEvents.length} usage events`);
      console.log(`   💰 Latest cost: $${costData.recentEvents[0].cost_usd}`);
    } else {
      console.error('   ❌ Failed: No cost data found. Did you run the seed script?');
    }

    // 2. Verify Crew Stats (crew_members)
    console.log('\n2️⃣  Checking Crew Stats...');
    const crewStats = await service.getCrewStats();
    if (crewStats?.data?.length > 0) {
      console.log(`   ✅ Success: Found ${crewStats.data.length} crew members`);
    } else {
      console.error('   ❌ Failed: No crew members found.');
    }

    // 3. Verify Knowledge (crew_memories)
    console.log('\n3️⃣  Checking Knowledge Base...');
    const knowledge = await service.queryKnowledge({ limit: 5 });
    if (knowledge?.results?.length > 0) {
      console.log(`   ✅ Success: Found ${knowledge.results.length} memories`);
      console.log(`   🧠 Latest memory: "${knowledge.results[0].content.substring(0, 50)}..."`);
    } else {
      console.error('   ❌ Failed: No memories found.');
    }

  } catch (error) {
    console.error('\n❌ Verification failed with error:', error);
  }
}

verifyDashboardData();