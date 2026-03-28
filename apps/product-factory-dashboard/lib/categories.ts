export type Category = {
  slug: string;
  name: string;
  tagline: string;
  scores: { demand: number; effort: number; monetization: number; differentiation: number; risk: number };
  opportunity: string;
  buyers: string[];
  priceModels: string[];
};

export const categories: Category[] = [
  {
    slug: 'ai-observability-diagnostics',
    name: 'AI Observability & Diagnostics Layer',
    tagline: 'Tracing, failure handling, webhook diagnostics, AI SRE patterns',
    scores: { demand: 9, effort: 6, monetization: 8, differentiation: 7, risk: 5 },
    opportunity: 'Fastest to first revenue; wedge into existing copilots by selling reliability and debuggability.',
    buyers: ['Teams shipping copilots', 'Companies with incidents', 'Compliance-driven teams'],
    priceModels: ['SaaS per seat/request', 'Add-on to existing RAG', 'Consulting + tooling']
  },
  {
    slug: 'enterprise-rag-platform-foundation',
    name: 'Enterprise RAG Platform Foundation',
    tagline: 'Deployable, repeatable RAG systems with IaC + domain boundaries',
    scores: { demand: 8, effort: 7, monetization: 7, differentiation: 6, risk: 4 },
    opportunity: 'High implementation revenue; best as fixed-scope sprints plus retainers.',
    buyers: ['Mid-market AI adoption', 'Regulated orgs', 'Internal platform teams'],
    priceModels: ['Implementation packages', 'Platform retainers', 'Reference architecture licensing']
  },
  {
    slug: 'knowledge-refresh-governance',
    name: 'Knowledge Refresh & Governance System',
    tagline: 'Refresh cycles, auditability, change impact, trust controls',
    scores: { demand: 8, effort: 7, monetization: 7, differentiation: 8, risk: 6 },
    opportunity: 'Premium differentiation in regulated contexts; longer sales cycle but higher defensibility.',
    buyers: ['Legal/policy RAG', 'Support orgs', 'KM programs'],
    priceModels: ['Governance module', 'Policy + workflow templates', 'Managed ops']
  },
  {
    slug: 'ai-platform-engineering-blueprint',
    name: 'AI Platform Engineering Blueprint',
    tagline: 'Treat AI as a platform: ownership, contracts, reliability milestones',
    scores: { demand: 7, effort: 8, monetization: 6, differentiation: 8, risk: 5 },
    opportunity: 'Leadership-level engagements; strong positioning for Staff/Principal roles.',
    buyers: ['Engineering leadership', 'Platform orgs', 'CTOs in build phase'],
    priceModels: ['Advisory / architecture sprints', 'Workshops', 'Fractional platform architect']
  },
  {
    slug: 'ddd-web-architecture',
    name: 'DDD Web Architecture & Semantic Mapping',
    tagline: 'Domain-Driven Next.js with sitemap intelligence, bounded contexts, clean architecture',
    scores: { demand: 8, effort: 6, monetization: 7, differentiation: 9, risk: 4 },
    opportunity: 'Transform sitemaps into semantic graphs with multi-dimensional navigation; ideal for content-heavy sites, e-commerce, and enterprise web applications needing maintainable architecture.',
    buyers: ['WordPress agencies', 'E-commerce platforms', 'Enterprise web teams', 'Digital agencies', 'Content publishers'],
    priceModels: ['Implementation packages', 'Architecture consulting', 'Template licensing', 'Managed evolution']
  }
];
