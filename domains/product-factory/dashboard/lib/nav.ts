// Factory-level documentation
export const docsNav = [
  {
    "label": "Overview",
    "route": "/docs/overview",
    "icon": "📋"
  },
  {
    "label": "Categories → Domains",
    "route": "/docs/categories",
    "icon": "🏗️"
  },
  {
    "label": "Best Practices",
    "route": "/docs/nextjs_product_factory_best_practices",
    "icon": "📘"
  },
  {
    "label": "Roadmap",
    "route": "/docs/roadmap",
    "icon": "🗺️"
  },
  {
    "label": "Portfolio",
    "route": "/docs/portfolio",
    "icon": "💼"
  },
  {
    "label": "Timeline",
    "route": "/docs/timeline",
    "icon": "📅"
  },
  {
    "label": "Assumptions",
    "route": "/docs/assumptions",
    "icon": "💡"
  }
] as const;

// Projects managed by the factory (to be populated dynamically)
export interface ManagedProject {
  id: string;
  name: string;
  category: string;
  domains: string[];
  createdAt: string;
  status: 'active' | 'archived' | 'draft';
}

// This will be populated from a projects.json or database
export const projectsNav: ManagedProject[] = [];
