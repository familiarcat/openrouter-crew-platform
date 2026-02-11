import { 
  LayoutDashboard, 
  Factory, 
  Music, 
  Terminal, 
  Settings, 
  Users, 
  Shield, 
  Database, 
  Activity,
  GitBranch,
  BookOpen
} from 'lucide-react';

export interface Route {
  title: string;
  path: string;
  icon?: any;
  badge?: string;
}

export interface DomainGroup {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  port: number;
  routes: Route[];
}

export const UNIVERSAL_SITEMAP: DomainGroup[] = [
  {
    id: 'unified',
    title: 'Unified Platform',
    description: 'System Overview & Orchestration',
    icon: LayoutDashboard,
    color: 'text-blue-500',
    port: 3000,
    routes: [
      { title: 'Home', path: '/' },
      { title: 'Domain Overview', path: '/domains' },
      { title: 'System Health', path: '/health', icon: Activity },
      { title: 'Global Settings', path: '/settings', icon: Settings },
    ]
  },
  {
    id: 'product-factory',
    title: 'Product Factory',
    description: 'Sprint Planning & RAG',
    icon: Factory,
    color: 'text-orange-500',
    port: 3002,
    routes: [
      { title: 'Dashboard', path: '/domains/product-factory' },
      { title: 'Sprint Board', path: '/domains/product-factory/sprint' },
      { title: 'Backlog Management', path: '/domains/product-factory/backlog' },
      { title: 'Retrospectives', path: '/domains/product-factory/retro' },
      { title: 'Crew Configuration', path: '/domains/product-factory/crew', icon: Users },
      { title: 'RAG Knowledge Base', path: '/domains/product-factory/rag', icon: Database },
      { title: 'Feature Flags', path: '/domains/product-factory/features', icon: GitBranch },
      { title: 'Release Notes', path: '/domains/product-factory/releases' },
    ]
  },
  {
    id: 'dj-booking',
    title: 'DJ Booking',
    description: 'Event Management System',
    icon: Music,
    color: 'text-purple-500',
    port: 3001,
    routes: [
      { title: 'Dashboard', path: '/domains/dj-booking' },
      { title: 'Events Calendar', path: '/domains/dj-booking/events' },
      { title: 'Artist Roster', path: '/domains/dj-booking/artists', icon: Users },
      { title: 'Contracts & Finance', path: '/domains/dj-booking/finance' },
      { title: 'Venue Management', path: '/domains/dj-booking/venues' },
      { title: 'Booking Requests', path: '/domains/dj-booking/requests', badge: 'New' },
    ]
  },
  {
    id: 'alex-ai',
    title: 'Alex AI Universal',
    description: 'Intelligence & Automation',
    icon: Terminal,
    color: 'text-green-500',
    port: 3003,
    routes: [
      { title: 'Command Center', path: '/domains/alex-ai-universal' },
      { title: 'Workflow Editor', path: '/domains/alex-ai-universal/workflows', icon: GitBranch },
      { title: 'Terminal Access', path: '/domains/alex-ai-universal/terminal' },
      { title: 'Security Audit', path: '/domains/alex-ai-universal/security', icon: Shield },
      { title: 'Cost Analysis', path: '/domains/alex-ai-universal/cost' },
      { title: 'Prompt Engineering', path: '/domains/alex-ai-universal/prompts' },
      { title: 'Documentation', path: '/domains/alex-ai-universal/docs', icon: BookOpen },
      { title: 'VSCode Extension', path: '/domains/alex-ai-universal/vscode' },
    ]
  }
];

export const FLATTENED_ROUTES = UNIVERSAL_SITEMAP.flatMap(domain => 
  domain.routes.map(route => ({
    ...route,
    domainId: domain.id,
    fullPath: route.path.startsWith('http') ? route.path : route.path
  }))
);