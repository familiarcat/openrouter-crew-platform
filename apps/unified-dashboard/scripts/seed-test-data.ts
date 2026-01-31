/**
 * Seed Test Data for Unified Dashboard
 *
 * This script creates:
 * 1. Domain Projects (DJ-Booking, Product Factory, Alex-AI-Universal)
 * 2. Test projects with domain health metrics
 * 3. Domain feature areas within projects (visualized as progress charts)
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@openrouter-crew/shared-schemas';

// Use local Supabase if running locally, otherwise use env vars
const IS_LOCAL = process.argv.includes('--local') || !process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_URL = IS_LOCAL
  ? 'http://127.0.0.1:54321'
  : process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = IS_LOCAL
  ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
  : process.env.SUPABASE_SERVICE_ROLE_KEY || '';

console.log(`🔧 Using ${IS_LOCAL ? 'LOCAL' : 'REMOTE'} Supabase: ${SUPABASE_URL}\n`);

if (!SUPABASE_SERVICE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY not set');
  process.exit(1);
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Domain health metrics that projects inherit
interface DomainHealth {
  demand: number;        // 1-10: Market demand
  effort: number;        // 1-10: Implementation effort
  monetization: number;  // 1-10: Revenue potential
  differentiation: number; // 1-10: Competitive advantage
  risk: number;          // 1-10: Risk level
}

// Feature area within a project (shown as progress chart)
interface ProjectFeatureArea {
  slug: string;
  name: string;
  description: string;
  status: 'planned' | 'in-progress' | 'completed';
  progress: number; // 0-100
  health: DomainHealth;
}

// Domain projects (these ARE the main domains)
const DOMAIN_PROJECTS = [
  {
    name: 'DJ-Booking Platform',
    description: 'Event management, venue coordination, and artist bookings',
    type: 'dj-booking' as const,
    status: 'active' as const,
    budget_usd: 50000,
    health: {
      demand: 8,
      effort: 7,
      monetization: 9,
      differentiation: 7,
      risk: 4
    },
    featureAreas: [
      {
        slug: 'venue-management',
        name: 'Venue Management',
        description: 'Manage venues, bookings, and availability',
        status: 'in-progress' as const,
        progress: 65,
        health: { demand: 9, effort: 6, monetization: 8, differentiation: 7, risk: 3 }
      },
      {
        slug: 'artist-booking',
        name: 'Artist Booking System',
        description: 'DJ profiles, availability, and booking workflow',
        status: 'in-progress' as const,
        progress: 45,
        health: { demand: 8, effort: 8, monetization: 9, differentiation: 8, risk: 5 }
      },
      {
        slug: 'event-coordination',
        name: 'Event Coordination',
        description: 'End-to-end event planning and execution',
        status: 'planned' as const,
        progress: 15,
        health: { demand: 7, effort: 9, monetization: 7, differentiation: 6, risk: 6 }
      },
      {
        slug: 'payment-processing',
        name: 'Payment Processing',
        description: 'Secure payments, invoicing, and payouts',
        status: 'planned' as const,
        progress: 10,
        health: { demand: 9, effort: 7, monetization: 10, differentiation: 5, risk: 7 }
      }
    ]
  },
  {
    name: 'Product Factory',
    description: 'Sprint planning, RAG workflows, and product development',
    type: 'product-factory' as const,
    status: 'active' as const,
    budget_usd: 75000,
    health: {
      demand: 9,
      effort: 8,
      monetization: 8,
      differentiation: 9,
      risk: 5
    },
    featureAreas: [
      {
        slug: 'sprint-planning',
        name: 'Sprint Planning System',
        description: 'Agile sprint management and story tracking',
        status: 'completed' as const,
        progress: 95,
        health: { demand: 8, effort: 7, monetization: 7, differentiation: 8, risk: 3 }
      },
      {
        slug: 'rag-automation',
        name: 'RAG Automation',
        description: 'Retrieval-augmented generation for product docs',
        status: 'in-progress' as const,
        progress: 70,
        health: { demand: 9, effort: 9, monetization: 8, differentiation: 10, risk: 6 }
      },
      {
        slug: 'cost-optimization',
        name: 'Cost Optimization Engine',
        description: 'AI cost tracking and optimization',
        status: 'in-progress' as const,
        progress: 55,
        health: { demand: 10, effort: 8, monetization: 9, differentiation: 9, risk: 4 }
      },
      {
        slug: 'workflow-orchestration',
        name: 'Workflow Orchestration',
        description: 'n8n integration and workflow management',
        status: 'in-progress' as const,
        progress: 40,
        health: { demand: 8, effort: 9, monetization: 7, differentiation: 8, risk: 7 }
      }
    ]
  },
  {
    name: 'Alex-AI-Universal',
    description: 'CLI tools, VSCode integration, and universal platform features',
    type: 'ai-assistant' as const,
    status: 'active' as const,
    budget_usd: 60000,
    health: {
      demand: 8,
      effort: 9,
      monetization: 7,
      differentiation: 9,
      risk: 6
    },
    featureAreas: [
      {
        slug: 'cli-tools',
        name: 'CLI Development Tools',
        description: 'Command-line interface for platform management',
        status: 'in-progress' as const,
        progress: 60,
        health: { demand: 7, effort: 8, monetization: 6, differentiation: 8, risk: 4 }
      },
      {
        slug: 'vscode-extension',
        name: 'VSCode Extension',
        description: 'IDE integration for developer productivity',
        status: 'in-progress' as const,
        progress: 50,
        health: { demand: 9, effort: 9, monetization: 7, differentiation: 10, risk: 5 }
      },
      {
        slug: 'theme-system',
        name: 'Universal Theme System',
        description: 'Consistent theming across all platforms',
        status: 'completed' as const,
        progress: 90,
        health: { demand: 6, effort: 7, monetization: 5, differentiation: 7, risk: 2 }
      },
      {
        slug: 'ai-integration',
        name: 'AI Integration Layer',
        description: 'Universal AI service integration',
        status: 'in-progress' as const,
        progress: 35,
        health: { demand: 10, effort: 10, monetization: 9, differentiation: 10, risk: 8 }
      }
    ]
  }
];

// Child projects that belong to and inherit from domain projects
const CHILD_PROJECTS = [
  {
    name: 'Wedding DJ Marketplace MVP',
    description: 'MVP for connecting wedding planners with DJs',
    type: 'dj-booking' as const,
    status: 'active' as const,
    parent_domains: ['dj-booking-domain'],
    budget_usd: 15000,
    featureAreas: [
      {
        slug: 'dj-profiles',
        name: 'DJ Profile Pages',
        description: 'Public profiles for DJs with media and reviews',
        status: 'in-progress' as const,
        progress: 70,
        health: { demand: 9, effort: 5, monetization: 8, differentiation: 6, risk: 2 }
      },
      {
        slug: 'search-filters',
        name: 'Search & Filtering',
        description: 'Advanced search for finding perfect DJ',
        status: 'in-progress' as const,
        progress: 80,
        health: { demand: 10, effort: 6, monetization: 7, differentiation: 7, risk: 3 }
      },
      {
        slug: 'booking-flow',
        name: 'Booking Workflow',
        description: 'Inquiry to contract booking process',
        status: 'planned' as const,
        progress: 25,
        health: { demand: 10, effort: 8, monetization: 10, differentiation: 8, risk: 5 }
      }
    ]
  },
  {
    name: 'Corporate Event Automation',
    description: 'Automated booking system for corporate events',
    type: 'dj-booking' as const,
    status: 'draft' as const,
    parent_domains: ['dj-booking-domain', 'product-factory-domain'], // Cross-domain!
    budget_usd: 25000,
    featureAreas: [
      {
        slug: 'event-templates',
        name: 'Event Templates',
        description: 'Pre-configured templates for common event types',
        status: 'planned' as const,
        progress: 10,
        health: { demand: 8, effort: 6, monetization: 7, differentiation: 7, risk: 4 }
      },
      {
        slug: 'auto-matching',
        name: 'Auto-Matching Engine',
        description: 'AI-powered DJ-to-event matching',
        status: 'planned' as const,
        progress: 5,
        health: { demand: 9, effort: 10, monetization: 9, differentiation: 10, risk: 8 }
      }
    ]
  },
  {
    name: 'RAG Knowledge Base',
    description: 'Centralized knowledge management with RAG',
    type: 'product-factory' as const,
    status: 'active' as const,
    parent_domains: ['product-factory-domain', 'alex-ai-domain'], // Cross-domain!
    budget_usd: 20000,
    featureAreas: [
      {
        slug: 'document-ingestion',
        name: 'Document Ingestion Pipeline',
        description: 'Automated document processing and vectorization',
        status: 'in-progress' as const,
        progress: 65,
        health: { demand: 9, effort: 9, monetization: 8, differentiation: 9, risk: 6 }
      },
      {
        slug: 'semantic-search',
        name: 'Semantic Search',
        description: 'Vector-based semantic search engine',
        status: 'in-progress' as const,
        progress: 75,
        health: { demand: 10, effort: 8, monetization: 8, differentiation: 10, risk: 5 }
      },
      {
        slug: 'query-enhancement',
        name: 'Query Enhancement',
        description: 'LLM-powered query understanding and expansion',
        status: 'planned' as const,
        progress: 20,
        health: { demand: 8, effort: 10, monetization: 7, differentiation: 9, risk: 7 }
      }
    ]
  },
  {
    name: 'Developer Tools Suite',
    description: 'Integrated development environment tools',
    type: 'ai-assistant' as const,
    status: 'active' as const,
    parent_domains: ['alex-ai-domain'],
    budget_usd: 18000,
    featureAreas: [
      {
        slug: 'code-snippets',
        name: 'Code Snippet Library',
        description: 'Searchable library of reusable code snippets',
        status: 'completed' as const,
        progress: 100,
        health: { demand: 7, effort: 5, monetization: 5, differentiation: 6, risk: 2 }
      },
      {
        slug: 'ai-code-review',
        name: 'AI Code Review',
        description: 'Automated code review with suggestions',
        status: 'in-progress' as const,
        progress: 45,
        health: { demand: 10, effort: 10, monetization: 9, differentiation: 10, risk: 7 }
      }
    ]
  }
];

async function seedData() {
  console.log('🌱 Starting data seed...\n');

  // 1. Create domain projects
  console.log('📁 Creating domain projects...');
  const createdDomains: Record<string, string> = {}; // Map old ID to new UUID

  for (const domainProject of DOMAIN_PROJECTS) {
    const { featureAreas, health, ...projectData} = domainProject;
    const domainKey = projectData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const { data, error } = await supabase
      .from('projects')
      .insert({
        ...projectData,
        metadata: {
          health,
          featureAreas,
          isDomainProject: true,
          domainKey // Store a readable key for reference
        }
      })
      .select()
      .single();

    if (error) {
      console.error(`  ❌ Error creating ${projectData.name}:`, error.message);
    } else if (data) {
      createdDomains[domainKey] = data.id;
      console.log(`  ✅ Created domain project: ${projectData.name}`);
      console.log(`     - UUID: ${data.id}`);
      console.log(`     - ${featureAreas.length} feature areas`);
      console.log(`     - Overall health: D${health.demand} M${health.monetization} Δ${health.differentiation}`);
    }
  }

  // 2. Create child projects
  console.log('\n📦 Creating child projects...');
  for (const childProject of CHILD_PROJECTS) {
    const { parent_domains, featureAreas, ...projectData } = childProject;

    // Map old domain IDs to new UUIDs
    const parentDomainUUIDs = parent_domains
      .map(oldId => createdDomains[oldId])
      .filter(Boolean);

    // Calculate inherited health from parent domains
    const parentHealthMetrics = parent_domains.map(domainKey => {
      const domain = DOMAIN_PROJECTS.find(d =>
        d.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === domainKey
      );
      return domain?.health;
    }).filter(Boolean);

    const avgHealth = parentHealthMetrics.reduce((acc, h) => ({
      demand: acc.demand + (h?.demand || 0),
      effort: acc.effort + (h?.effort || 0),
      monetization: acc.monetization + (h?.monetization || 0),
      differentiation: acc.differentiation + (h?.differentiation || 0),
      risk: acc.risk + (h?.risk || 0),
    }), { demand: 0, effort: 0, monetization: 0, differentiation: 0, risk: 0 });

    const inheritedHealth = {
      demand: Math.round(avgHealth.demand / parentHealthMetrics.length),
      effort: Math.round(avgHealth.effort / parentHealthMetrics.length),
      monetization: Math.round(avgHealth.monetization / parentHealthMetrics.length),
      differentiation: Math.round(avgHealth.differentiation / parentHealthMetrics.length),
      risk: Math.round(avgHealth.risk / parentHealthMetrics.length),
    };

    const { data, error } = await supabase
      .from('projects')
      .insert({
        ...projectData,
        metadata: {
          parentDomains: parentDomainUUIDs,
          parentDomainKeys: parent_domains, // Keep for reference
          health: inheritedHealth,
          featureAreas,
          isDomainProject: false
        }
      });

    if (error) {
      console.error(`  ❌ Error creating ${projectData.name}:`, error.message);
    } else {
      console.log(`  ✅ Created child project: ${projectData.name}`);
      console.log(`     - Parent domains: ${parent_domains.join(', ')}`);
      console.log(`     - ${featureAreas.length} feature areas`);
      console.log(`     - Inherited health: D${inheritedHealth.demand} M${inheritedHealth.monetization} Δ${inheritedHealth.differentiation}`);
    }
  }

  console.log('\n✨ Data seed complete!\n');
  console.log('Summary:');
  console.log(`  - ${DOMAIN_PROJECTS.length} domain projects created`);
  console.log(`  - ${CHILD_PROJECTS.length} child projects created`);
  console.log(`  - ${CHILD_PROJECTS.filter(p => p.parent_domains.length > 1).length} cross-domain projects`);
}

seedData().catch(console.error);
