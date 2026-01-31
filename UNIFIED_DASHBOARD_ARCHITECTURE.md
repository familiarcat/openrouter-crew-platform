# Unified Dashboard Architecture

## Overview

The unified dashboard will be a comprehensive top-down UI/UX system that incorporates all domain dashboards, using the rag-refresh-product-factory project management UI as the foundation. This creates absolute interconnectivity between all domains through a single, cohesive interface.

**Date**: January 28, 2026
**Status**: In Design
**Architecture**: Unified Top-Down UI with Domain Integration

---

## Core Concept: Projects as Domains

### Key Insight

The rag-refresh-product-factory's "project" concept maps perfectly to our DDD "domains":

```
Product Factory Concept    →    DDD Architecture
─────────────────────────────────────────────────────
Projects                   →    Domains
  ├── Project Status       →      Domain Status
  ├── Project Sprints      →      Domain Workstreams
  ├── Domain Scores        →      Domain Health Metrics
  └── Categories           →      Domain Types

Navigation Structure       →    Unified Navigation
  ├── /projects            →      /domains (all domains)
  ├── /projects/[id]       →      /domains/[id] (domain detail)
  ├── /sprints             →      /sprints (cross-domain)
  ├── /crew                →      /crew (shared crew)
  └── /observation-lounge  →      /observation-lounge (monitoring)
```

### Domain Mapping

```typescript
const UNIFIED_DOMAINS = [
  {
    id: 'dj-booking',
    name: 'DJ-Booking',
    type: 'event-management',
    status: 'active',
    port: 3001,
    features: {
      venues: true,
      artists: true,
      events: true,
      mcpAgents: 6
    },
    ui: {
      baseRoute: '/domains/dj-booking',
      components: 'domains/dj-booking/dashboard/components',
      app: 'domains/dj-booking/dashboard/app'
    }
  },
  {
    id: 'product-factory',
    name: 'Product Factory',
    type: 'sprint-planning',
    status: 'active',
    port: 3002,
    features: {
      sprints: true,
      ragWorkflows: true,
      costOptimization: true,
      workflows: 54
    },
    ui: {
      baseRoute: '/domains/product-factory',
      components: 'domains/product-factory/dashboard/components',
      app: 'domains/product-factory/dashboard/app'
    }
  },
  {
    id: 'alex-ai-universal',
    name: 'Alex-AI-Universal',
    type: 'universal-platform',
    status: 'active',
    port: 3003,
    features: {
      cli: true,
      vscode: true,
      themes: true,
      workflows: 36
    },
    ui: {
      baseRoute: '/domains/alex-ai-universal',
      components: 'domains/alex-ai-universal/dashboard/components',
      app: 'domains/alex-ai-universal/dashboard/app'
    }
  }
]
```

---

## Unified Dashboard Structure

### Directory Structure

```
apps/unified-dashboard/
├── app/
│   ├── layout.tsx                      # Root layout with Sidebar
│   ├── page.tsx                        # Home/Dashboard overview
│   │
│   ├── domains/                        # All domains (replaces /projects)
│   │   ├── page.tsx                    # Domain listing with status
│   │   └── [domain]/                   # Individual domain detail
│   │       ├── page.tsx                # Domain overview
│   │       ├── sprints/                # Domain-specific sprints
│   │       │   ├── page.tsx
│   │       │   └── [id]/page.tsx
│   │       ├── architecture/           # Domain architecture view
│   │       │   └── page.tsx
│   │       ├── workflows/              # Domain workflows
│   │       │   ├── page.tsx
│   │       │   └── [id]/page.tsx
│   │       ├── crew/                   # Domain crew assignments
│   │       │   └── page.tsx
│   │       ├── settings/               # Domain settings
│   │       │   └── page.tsx
│   │       │
│   │       ├── venues/                 # DJ-Booking specific
│   │       │   ├── page.tsx
│   │       │   └── [id]/page.tsx
│   │       ├── artists/                # DJ-Booking specific
│   │       │   ├── page.tsx
│   │       │   └── [id]/page.tsx
│   │       │
│   │       └── cli/                    # Alex-AI-Universal specific
│   │           └── page.tsx
│   │
│   ├── sprints/                        # Cross-domain sprint management
│   │   ├── page.tsx                    # All sprints across domains
│   │   └── [id]/page.tsx               # Sprint detail
│   │
│   ├── crew/                           # Shared crew management
│   │   ├── page.tsx                    # All crew members
│   │   └── [id]/page.tsx               # Crew member detail
│   │
│   ├── observation-lounge/             # Monitoring & analytics
│   │   └── page.tsx
│   │
│   ├── workflows/                      # Cross-domain workflow management
│   │   ├── page.tsx                    # All workflows
│   │   └── [id]/page.tsx               # Workflow detail
│   │
│   └── api/
│       ├── domains/route.ts            # Domain API
│       ├── sprints/route.ts            # Sprint API
│       ├── crew/route.ts               # Crew API
│       └── workflows/route.ts          # Workflow API
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx                 # Main navigation (from product-factory)
│   │   ├── Header.tsx
│   │   └── DomainSwitcher.tsx          # Quick domain navigation
│   │
│   ├── domains/
│   │   ├── DomainCard.tsx              # Domain summary card
│   │   ├── DomainStatusBar.tsx         # Domain health metrics
│   │   ├── DomainSelector.tsx          # Domain picker
│   │   └── DomainStats.tsx             # Domain statistics
│   │
│   ├── sprints/
│   │   ├── SprintBoard.tsx             # Sprint kanban (from product-factory)
│   │   ├── SprintTimeline.tsx          # Timeline view
│   │   └── SprintIndicator.tsx         # Sprint status badge
│   │
│   ├── crew/
│   │   ├── CrewCard.tsx                # Crew member card
│   │   ├── CrewAssignments.tsx         # Crew assignments view
│   │   └── ObservationLounge.tsx       # Crew coordination
│   │
│   ├── workflows/
│   │   ├── WorkflowList.tsx            # Workflow listing
│   │   ├── WorkflowEditor.tsx          # N8N workflow editor
│   │   └── WorkflowExecutions.tsx      # Execution history
│   │
│   ├── projects/                       # From product-factory
│   │   ├── ProjectTimeline.tsx
│   │   ├── ProjectSitemap.tsx
│   │   └── RecentProjects.tsx
│   │
│   └── shared/
│       ├── Charts.tsx                  # Shared visualizations
│       ├── StatusBadge.tsx
│       └── LoadingState.tsx
│
├── lib/
│   ├── domains.ts                      # Domain configuration & API
│   ├── projects.ts                     # Project/Domain types (from product-factory)
│   ├── sprints.ts                      # Sprint management
│   ├── crew.ts                         # Crew coordination
│   ├── workflows.ts                    # Workflow management
│   ├── context/
│   │   ├── DomainContext.tsx           # Current domain context
│   │   ├── SprintContext.tsx           # Sprint data context
│   │   └── CrewContext.tsx             # Crew data context
│   └── hooks/
│       ├── useDomain.ts                # Domain management hook
│       ├── useSprints.ts               # Sprint management hook
│       └── useCrew.ts                  # Crew management hook
│
└── styles/
    └── globals.css                     # Global styles (from product-factory)
```

---

## Navigation System

### Sidebar Navigation

```typescript
// Main navigation items
const NAV_ITEMS = [
  {
    section: 'Overview',
    items: [
      { label: 'Dashboard', href: '/', icon: 'Home' },
      { label: 'Domains', href: '/domains', icon: 'FolderKanban' },
      { label: 'Sprints', href: '/sprints', icon: 'Calendar' },
      { label: 'Crew', href: '/crew', icon: 'Users' }
    ]
  },
  {
    section: 'Domains',
    items: [
      {
        label: 'DJ-Booking',
        href: '/domains/dj-booking',
        icon: 'Music',
        badge: 'Event Management'
      },
      {
        label: 'Product Factory',
        href: '/domains/product-factory',
        icon: 'Factory',
        badge: 'Sprint Planning'
      },
      {
        label: 'Alex-AI-Universal',
        href: '/domains/alex-ai-universal',
        icon: 'Sparkles',
        badge: 'Universal Platform'
      }
    ]
  },
  {
    section: 'Operations',
    items: [
      { label: 'Workflows', href: '/workflows', icon: 'GitBranch' },
      { label: 'Observation Lounge', href: '/observation-lounge', icon: 'Eye' },
      { label: 'Cost Tracking', href: '/cost-tracking', icon: 'DollarSign' }
    ]
  }
]
```

### Breadcrumb Navigation

```typescript
// Example breadcrumb paths
/domains/product-factory/sprints/sprint-123
└─ Dashboard > Domains > Product Factory > Sprints > Sprint 123

/domains/dj-booking/venues/venue-456
└─ Dashboard > Domains > DJ-Booking > Venues > Venue 456

/crew/captain-picard
└─ Dashboard > Crew > Captain Picard
```

---

## Data Flow & Context System

### Unified Context Architecture

```typescript
// apps/unified-dashboard/lib/context/UnifiedContext.tsx
interface UnifiedContextType {
  // Current domain
  currentDomain: Domain | null
  setCurrentDomain: (domain: Domain) => void

  // Domain data
  domains: Domain[]
  loadDomains: () => Promise<void>

  // Sprints across domains
  sprints: Sprint[]
  loadSprints: (domainId?: string) => Promise<void>

  // Crew members
  crew: CrewMember[]
  loadCrew: () => Promise<void>

  // Workflows
  workflows: Workflow[]
  loadWorkflows: (domainId?: string) => Promise<void>

  // Cross-domain operations
  federateFeature: (from: string, to: string, feature: string) => Promise<void>
  syncDomains: () => Promise<void>
}

// Usage in components
import { useUnifiedContext } from '@/lib/context/UnifiedContext'

function DomainPage() {
  const { currentDomain, sprints, loadSprints } = useUnifiedContext()

  useEffect(() => {
    if (currentDomain) {
      loadSprints(currentDomain.id)
    }
  }, [currentDomain])

  return <SprintBoard sprints={sprints} domain={currentDomain} />
}
```

### API Structure

```typescript
// Domain API
GET  /api/domains              # List all domains
GET  /api/domains/:id          # Get domain details
PUT  /api/domains/:id          # Update domain
GET  /api/domains/:id/health   # Domain health metrics

// Sprint API
GET  /api/sprints              # All sprints (cross-domain)
GET  /api/sprints?domain=id    # Sprints for specific domain
POST /api/sprints              # Create sprint
GET  /api/sprints/:id          # Sprint details
PUT  /api/sprints/:id          # Update sprint

// Crew API
GET  /api/crew                 # All crew members
GET  /api/crew/:id             # Crew member details
GET  /api/crew/:id/assignments # Crew assignments
POST /api/crew/:id/assign      # Assign to domain

// Workflow API
GET  /api/workflows            # All workflows
GET  /api/workflows?domain=id  # Workflows for domain
GET  /api/workflows/:id        # Workflow details
POST /api/workflows/:id/execute # Execute workflow
```

---

## Integration Strategy

### Phase 1: Foundation (Week 1)

1. **Import Core Layout**
   ```bash
   # Copy from product-factory to unified-dashboard
   - components/Sidebar.tsx
   - app/globals.css
   - app/layout.tsx (adapt for unified)
   - lib/pageTheme.ts
   ```

2. **Create Domain System**
   ```bash
   # New files in unified-dashboard
   - lib/domains.ts (domain definitions)
   - app/domains/page.tsx (domain listing)
   - app/domains/[domain]/page.tsx (domain detail)
   - components/domains/* (domain components)
   ```

3. **Import Sprint Management**
   ```bash
   # Copy from product-factory
   - components/SprintBoard.tsx
   - components/SprintTimeline.tsx
   - components/SprintIndicator.tsx
   - app/sprints/page.tsx
   - lib/sprints.ts
   ```

### Phase 2: Domain Integration (Week 2)

1. **DJ-Booking Integration**
   ```bash
   # Import DJ-Booking specific UIs
   - app/domains/dj-booking/venues/*
   - app/domains/dj-booking/artists/*
   - app/domains/dj-booking/events/*
   - components/dj-booking/* (domain-specific components)
   ```

2. **Product Factory Integration**
   ```bash
   # Already has most components, add domain routes
   - app/domains/product-factory/sprints/*
   - app/domains/product-factory/architecture/*
   - Use existing SprintBoard, ProjectTimeline, etc.
   ```

3. **Alex-AI-Universal Integration**
   ```bash
   # Import Alex-AI specific UIs
   - app/domains/alex-ai-universal/cli/*
   - app/domains/alex-ai-universal/themes/*
   - app/domains/alex-ai-universal/workflows/*
   - components/alex-ai/* (domain-specific components)
   ```

### Phase 3: Unified Features (Week 3)

1. **Cross-Domain Sprints**
   - Sprint board showing sprints from all domains
   - Filter by domain
   - Drag-and-drop across domains

2. **Shared Crew Management**
   - Crew assignments across domains
   - Observation lounge with cross-domain visibility
   - Crew workload balancing

3. **Workflow Orchestration**
   - Workflow editor for all domains
   - Cross-domain workflow triggers
   - Workflow dependency management

### Phase 4: Advanced Features (Week 4)

1. **Domain Health Dashboard**
   - Real-time metrics from all domains
   - Cost tracking across domains
   - Performance monitoring

2. **Feature Federation UI**
   - Visual interface for feature promotion
   - Domain → Shared → Global flow
   - Federation history and tracking

3. **Advanced Analytics**
   - Cross-domain reporting
   - Sprint velocity across domains
   - Crew productivity metrics

---

## Benefits of Unified Approach

### 1. Single Source of Truth
- **Before**: 4 separate dashboards, disconnected data
- **After**: One dashboard, unified data model
- **Benefit**: Consistent UX, shared state, easier maintenance

### 2. Cross-Domain Operations
- **Before**: Can't see or manage work across domains
- **After**: Sprint board shows all domains, crew works across domains
- **Benefit**: Better resource allocation, clearer priorities

### 3. Simplified Development
- **Before**: Maintain 4 separate Next.js apps
- **After**: One app, domain-specific routes
- **Benefit**: Faster iterations, shared components, unified styling

### 4. Better Context Awareness
- **Before**: Switch between dashboards, lose context
- **After**: Domain context preserved, breadcrumbs, quick switching
- **Benefit**: Improved productivity, less cognitive load

### 5. Advanced Features Possible
- **Before**: Hard to implement cross-domain features
- **After**: Easy to add cross-domain analytics, workflows, etc.
- **Benefit**: More powerful platform capabilities

---

## Technical Considerations

### Performance

```typescript
// Code splitting by domain
const DJBookingApp = dynamic(() => import('@/domains/dj-booking'))
const ProductFactoryApp = dynamic(() => import('@/domains/product-factory'))
const AlexAIApp = dynamic(() => import('@/domains/alex-ai-universal'))

// Only load domain code when navigating to that domain
```

### State Management

```typescript
// Use React Context for global state
- UnifiedContext: Domain, sprint, crew data
- DomainContext: Current domain specific data
- UserContext: User preferences, settings

// Use SWR for data fetching
- Automatic revalidation
- Cache across routes
- Optimistic updates
```

### Styling

```typescript
// Unified theming system
- Base theme from product-factory (globals.css)
- Domain-specific color schemes
- Consistent component styling
- Dark mode support
```

---

## Migration Path

### Step 1: Preserve Existing (No Breaking Changes)

```bash
# Keep domain dashboards functional
domains/*/dashboard/ → Still work independently

# Unified dashboard is additive
apps/unified-dashboard/ → New integrated experience
```

### Step 2: Import Core Components

```bash
# Copy essential components to unified-dashboard
rsync -av domains/product-factory/dashboard/components/ \
  apps/unified-dashboard/components/

rsync -av domains/product-factory/dashboard/app/ \
  apps/unified-dashboard/app/
```

### Step 3: Create Domain Routes

```bash
# Create domain-specific routes in unified dashboard
apps/unified-dashboard/app/domains/[domain]/
  ├── Layout pulls from domain dashboard
  ├── Components imported from domain
  └── API routes proxy to domain APIs
```

### Step 4: Test & Iterate

```bash
# Run both in parallel during transition
pnpm --filter @openrouter-crew/unified-dashboard dev  # :3000
pnpm --filter @openrouter-crew/product-factory-dashboard dev  # :3002

# Gradually migrate users to unified dashboard
# Deprecate standalone dashboards when ready
```

---

## Success Metrics

### User Experience
- ✅ Single navigation system across all domains
- ✅ Context preserved when switching domains
- ✅ Consistent UI/UX patterns
- ✅ Fast load times (< 2s)

### Developer Experience
- ✅ Shared component library
- ✅ Unified state management
- ✅ Code reuse across domains
- ✅ Easy to add new domains

### Platform Capabilities
- ✅ Cross-domain sprint management
- ✅ Shared crew assignments
- ✅ Unified workflow orchestration
- ✅ Cross-domain analytics

---

**Status**: Ready for Implementation
**Next Step**: Import core layout and components from product-factory
**Timeline**: 4 weeks to full integration
