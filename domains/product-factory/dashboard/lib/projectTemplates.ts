import { categories } from './categories';

export function templateForCategorySlug(slug?: string) {
  const c = categories.find(x => x.slug === slug);
  if (!c) {
    return {
      title: 'New AI Product',
      summary: 'Describe the product you want to build.',
      sections: [
        'Target user',
        'Core workflow (3 steps)',
        'Retrieval sources (RAG)',
        'Diagnostics requirements (trace + citations)',
        'Governance/refresh requirements',
        'Monetization model',
      ]
    };
  }

  // Category-specific templates
  const base = {
    title: `New project: ${c.name}`,
    summary: c.tagline,
    sections: [] as string[]
  };

  if (slug.includes('observability')) {
    base.sections = [
      'Problem statement (what breaks today?)',
      'Telemetry plan (traces, spans, events)',
      'Failure modes + runbooks',
      'Dashboard spec (latency, grounding, retrieval quality)',
      'Integration points (RAG, webhook workers, queues)',
      'Pricing (per request/seat)',
    ];
  } else if (slug.includes('enterprise-rag')) {
    base.sections = [
      'Domain boundaries (bounded contexts)',
      'Data sources + ingestion contracts',
      'IaC plan (environments, secrets, deploy)',
      'Evaluation plan (offline + online)',
      'SLA/SLO targets',
      'Packaging (implementation sprint + retainer)',
    ];
  } else if (slug.includes('governance')) {
    base.sections = [
      'Freshness SLA (by domain)',
      'Change detection + impact analysis',
      'Audit log requirements',
      'Human-in-the-loop review workflow',
      'Policy controls (allowed sources, risk thresholds)',
      'Compliance reporting / pricing',
    ];
  } else if (slug.includes('ddd-web')) {
    base.sections = [
      'Domain boundaries (bounded contexts from sitemap)',
      'Sitemap sources (WordPress XML, custom sitemaps)',
      'Graph model (nodes: site/section/page/category/date, edges: contains/member/asset)',
      'Next.js architecture (App Router, RSC, API routes)',
      'View dimensions (section, category, date, asset-host)',
      'Layout algorithms (breadthfirst, radial, timeline, force-directed)',
      'Navigation patterns (drill-down, breadcrumbs, search, filters)',
      'State management (URL params, local state, server state)',
      'Metadata extraction (categories, dates, post types from URLs)',
      'Export formats (Mermaid diagrams, SVG, interactive Cytoscape)',
      'Packaging (template licensing, implementation, consulting)',
    ];
  } else {
    base.sections = [
      'Operating model (ownership + oncall)',
      'Platform contracts (APIs, SLAs, versioning)',
      'Roadmap (90 days)',
      'Metrics and gates',
      'Enablement plan (docs, training, templates)',
      'Advisory packaging / pricing',
    ];
  }

  return base;
}
