# Phase 3 Sprint 4: Surface Integration & Production Deployment

**Planned**: February 9, 2026 onwards
**Status**: Planning Phase
**Scope**: CLI, Web, VSCode, n8n Integration
**Estimated Duration**: 3-4 weeks
**Objective**: Expose Phase 3 capabilities to all user surfaces

---

## Sprint 4 Overview

Sprint 4 integrates the production-ready Phase 3 services (cost optimization, analytics, archival) with all four user-facing surfaces:

1. **CLI** - Command-line interface integration
2. **Web** - Dashboard and visualization
3. **VSCode** - IDE extension integration
4. **n8n** - Workflow automation integration

---

## 1. CLI Integration (Weeks 1-2)

### Objective
Enable CLI users to access cost tracking, analytics, and archival directly from command-line operations.

### Features to Implement

#### 1.1 Memory Operations Cost Display
**Command**: `crew memory list`
```
Memory                  Created         Confidence  Cost      Recommendation
─────────────────────────────────────────────────────────────────────────────
mem_db_opt              2024-01-15      0.85        $0.012    Keep
mem_cache_strat         2024-01-10      0.72        $0.009    Archive (stale)
mem_api_design          2024-01-01      0.45        $0.006    Archive (low conf)
```

**Features**:
- Display cost per memory inline
- Show confidence levels
- Display archival recommendations
- Color-code by status (healthy, warning, archive)

#### 1.2 Budget Management Commands
```bash
crew budget set --crew crew_1 --amount 100 --period monthly
crew budget status --crew crew_1
crew budget alert --threshold 80
```

**Implementation**:
- New `budget` command group
- Budget status in dashboard
- Alert on operations exceeding budget
- Warnings when approaching limits

#### 1.3 Analytics & Insights CLI
```bash
crew analytics summary --crew crew_1
crew analytics topics --crew crew_1
crew analytics recommendations --crew crew_1 --limit 10
```

**Output Example**:
```
MEMORY INSIGHTS FOR crew_1
═══════════════════════════════════════════════════════

⚠️  Confidence Decay (3 memories)
    mem_old_strategy: 0.85 → 0.42 (50% loss)
    mem_legacy_api: 0.80 → 0.35 (56% loss)

💡 Stale Memories (5 memories)
    Last accessed >60 days ago
    Potential archival candidates
    Estimated savings: 2.3KB

📊 Top Topics
    1. performance (8 memories)
    2. database (6 memories)
    3. api-design (5 memories)
```

#### 1.4 Archival Operations
```bash
crew memory archive --crew crew_1 --strategy automatic
crew memory archive --crew crew_1 --ids mem_1,mem_2,mem_3
crew memory restore --archive-id archive_mem_1_123456
crew archive list --crew crew_1
```

**Features**:
- Dry-run capability (`--dry-run`)
- Progress indication for batch operations
- Estimated savings display
- Success/failure reporting

### CLI Implementation Plan

**Files to Create/Modify**:
1. `apps/cli/src/commands/budget/` (new)
   - `set.ts` - Budget configuration
   - `status.ts` - Budget display
   - `alert.ts` - Alert management

2. `apps/cli/src/commands/analytics/` (new)
   - `summary.ts` - Analytics overview
   - `topics.ts` - Topic trends
   - `recommendations.ts` - Memory recommendations

3. `apps/cli/src/commands/memory/` (modify)
   - `list.ts` - Add cost/recommendation columns
   - `archive.ts` - Archival operations
   - `restore.ts` - Archive restoration

4. `apps/cli/src/utils/formatters.ts` (new)
   - Cost formatting ($0.012)
   - Confidence bar charts
   - Insight rendering

5. `apps/cli/src/services/cli-integration.ts` (new)
   - Wrapper for Phase 3 services
   - CLI-specific formatting
   - Progress tracking

**Tests to Create**:
- CLI budget command tests (8 tests)
- CLI analytics command tests (8 tests)
- CLI archival command tests (8 tests)
- Integration tests (6 tests)
- **Total**: 30 tests

**Estimated Implementation**: 1.5 weeks

---

## 2. Web Dashboard Integration (Weeks 2-3)

### Objective
Create visual analytics dashboard and cost management UI for web users.

### Features to Implement

#### 2.1 Cost Analytics Dashboard
**Component**: `CostAnalyticsDashboard.tsx`

**Visualizations**:
- Total cost trend (line chart, 30-day)
- Cost breakdown by operation (pie chart)
- Cost per memory (bar chart, sortable)
- Budget utilization gauge (0-100%)
- Alert status indicator

**Features**:
- Export cost data (CSV)
- Filter by date range
- Drill-down into specific operations
- Budget adjustment UI

#### 2.2 Memory Analytics Dashboard
**Component**: `MemoryAnalyticsDashboard.tsx`

**Sections**:
1. **Quick Stats**
   - Total memories
   - Average confidence
   - Recent access rate
   - Archive candidates

2. **Top Topics**
   - Topic cloud with frequency
   - Trend indicators (↑ emerging, → stable, ↓ declining)
   - Related memory count

3. **Access Patterns**
   - Access frequency chart
   - Most/least accessed memories
   - Access trend over time

4. **Insights Panel**
   - Color-coded by severity (warning/info/opportunity)
   - Affected memories listed
   - Recommended actions with one-click execution

#### 2.3 Archival Management UI
**Component**: `ArchivalManager.tsx`

**Features**:
- Archive status overview
- Memory recommendation list
- Batch archival with preview
- Archive search/restore
- Statistics by retention tier

**Workflow**:
1. View recommendations
2. Select memories to archive
3. Review estimated savings
4. Execute with progress tracking
5. View confirmation

#### 2.4 Budget Management UI
**Component**: `BudgetManager.tsx`

**Features**:
- Current budget display
- Spent vs. limit visualization
- Alert threshold configuration
- Budget history
- Spending trend

### Web Implementation Plan

**Files to Create**:
1. `apps/unified-dashboard/components/cost/` (new)
   - `CostAnalyticsDashboard.tsx`
   - `CostTrendChart.tsx`
   - `CostBreakdownChart.tsx`
   - `BudgetGauge.tsx`

2. `apps/unified-dashboard/components/analytics/` (new)
   - `MemoryAnalyticsDashboard.tsx`
   - `TopicsCloud.tsx`
   - `AccessPatternChart.tsx`
   - `InsightsPanel.tsx`

3. `apps/unified-dashboard/components/archival/` (new)
   - `ArchivalManager.tsx`
   - `ArchiveRecommendations.tsx`
   - `ArchiveRestoreModal.tsx`
   - `ArchiveStats.tsx`

4. `apps/unified-dashboard/components/budget/` (new)
   - `BudgetManager.tsx`
   - `BudgetChart.tsx`
   - `AlertConfig.tsx`

5. `apps/unified-dashboard/lib/phase3-integration.ts` (new)
   - Service wrappers for React
   - State management hooks
   - Data transformation utilities

6. `apps/unified-dashboard/app/analytics/` (new)
   - `page.tsx` - Analytics dashboard page
   - `layout.tsx` - Analytics layout

7. `apps/unified-dashboard/app/cost/` (new)
   - `page.tsx` - Cost analytics page
   - `layout.tsx` - Cost layout

**Tests to Create**:
- Dashboard component tests (12 tests)
- Chart rendering tests (8 tests)
- Archival workflow tests (8 tests)
- Budget UI tests (6 tests)
- Integration tests (10 tests)
- **Total**: 44 tests

**Estimated Implementation**: 2 weeks

---

## 3. VSCode Extension Integration (Week 3)

### Objective
Provide IDE-integrated memory insights and archival suggestions.

### Features to Implement

#### 3.1 Memory Status Bar
**Display**: VSCode status bar right side
```
🧠 Crew Memory | Cost: $12.34 | Cache: 68% | ⚠️ 3 insights
```

**On Click**: Open memory sidebar

#### 3.2 Memory Sidebar
**Panel**: Memory explorer with:
- Memory list with confidence indicators
- Access frequency badges
- Cost indicators (color-coded)
- Archival status
- Quick actions (view, archive, restore)

#### 3.3 Code Decorations
**Inline Decorations**:
- Cost estimate on memory references
- Confidence level on retrieval calls
- Archival suggestions on stale memories
- Budget warnings on bulk operations

#### 3.4 Commands Palette
**New Commands**:
- `Crew: Show Memory Insights`
- `Crew: Archive Memory`
- `Crew: View Memory Cost`
- `Crew: Check Budget`
- `Crew: Refresh Analytics`

#### 3.5 Notifications
**Alert Types**:
- Budget threshold reached (80%)
- Budget exceeded (100%)
- High confidence decay detected
- Recommended archival available
- Cache effectiveness improved

### VSCode Implementation Plan

**Files to Create**:
1. `domains/vscode-extension/src/panels/` (modify)
   - `MemorySidebar.ts` - Enhanced with analytics
   - `CostIndicator.ts` - Cost display
   - `ArchivalSuggestions.ts` - Archival UI

2. `domains/vscode-extension/src/commands/` (new)
   - `memory-insights.ts`
   - `archive-memory.ts`
   - `view-cost.ts`
   - `check-budget.ts`
   - `refresh-analytics.ts`

3. `domains/vscode-extension/src/services/` (new)
   - `vscode-phase3-integration.ts` - Service wrappers
   - `status-bar-manager.ts` - Status bar updates
   - `decoration-manager.ts` - Code decorations

4. `domains/vscode-extension/src/ui/` (new)
   - `insights-view.html` - Insights display
   - `archival-view.html` - Archival interface
   - `styles.css` - UI styling

5. `domains/vscode-extension/package.json` (modify)
   - Add new commands
   - Add webview styles
   - Add decorators

**Tests to Create**:
- Command tests (8 tests)
- UI component tests (8 tests)
- Integration tests (6 tests)
- **Total**: 22 tests

**Estimated Implementation**: 1 week

---

## 4. n8n Integration (Week 4)

### Objective
Enable n8n workflows to use Phase 3 services for cost-aware automation.

### Features to Implement

#### 4.1 Cost Optimization Node
**Inputs**:
- `memories` - Array of memories
- `operation` - Operation type (embedding, compression, clustering)
- `budget` - Budget limit

**Outputs**:
- `estimatedCost` - Total cost
- `canProceed` - Boolean (cost within budget)
- `breakdown` - Cost by operation

**Workflow Example**:
```
Input memories → Cost Check → Conditional
                    ↓
              [Cost exceeds budget?]
              ↓               ↓
           Alert        Proceed with operation
```

#### 4.2 Analytics Node
**Inputs**:
- `crewId` - Crew identifier
- `memories` - Memory array
- `reportType` - 'summary'|'topics'|'insights'

**Outputs**:
- `analytics` - Full analytics object
- `insights` - Array of insights
- `recommendations` - Memory recommendations

#### 4.3 Archival Decision Node
**Inputs**:
- `memories` - Memory array
- `strategy` - 'automatic'|'by-value'|'manual'
- `dryRun` - Boolean

**Outputs**:
- `archivables` - Candidate memories
- `estimatedSavings` - Total savings
- `archiveResults` - Archival status

#### 4.4 Budget Control Node
**Inputs**:
- `crewId` - Crew identifier
- `amount` - Budget amount
- `period` - 'daily'|'weekly'|'monthly'

**Outputs**:
- `budgetId` - Created budget ID
- `status` - 'set'|'updated'

#### 4.5 Workflow Templates
**Pre-built Workflows**:

1. **Cost-Aware Memory Ingestion**
   - Check budget before creating memory
   - Alert if exceeds threshold
   - Execute if within budget

2. **Automated Archival**
   - Daily analytics run
   - Identify archive candidates
   - Archive if confidence decay > 50%
   - Log results

3. **Budget Monitoring**
   - Hourly budget check
   - Alert at 80% threshold
   - Escalate at 100%
   - Auto-pause operations at limit

4. **Weekly Insights Report**
   - Generate analytics
   - Extract top insights
   - Send summary email
   - Archive recommendations

### n8n Implementation Plan

**Files to Create**:
1. `domains/n8n-nodes/src/nodes/` (new)
   - `CostOptimization/` - Cost node
   - `MemoryAnalytics/` - Analytics node
   - `MemoryArchival/` - Archival node
   - `BudgetControl/` - Budget node

2. `domains/n8n-nodes/src/workflows/` (new)
   - `cost-aware-ingestion.json`
   - `automated-archival.json`
   - `budget-monitoring.json`
   - `weekly-insights.json`

3. `domains/n8n-nodes/src/services/` (new)
   - `n8n-phase3-integration.ts` - Service wrappers
   - `node-helpers.ts` - Utility functions

4. `domains/n8n-nodes/test/` (new)
   - Node execution tests
   - Workflow tests
   - Integration tests

**Tests to Create**:
- Cost node tests (8 tests)
- Analytics node tests (8 tests)
- Archival node tests (8 tests)
- Budget node tests (6 tests)
- Workflow tests (8 tests)
- **Total**: 38 tests

**Estimated Implementation**: 1.5 weeks

---

## Implementation Timeline

### Week 1: CLI Integration
- Days 1-3: Budget commands
- Days 4-5: Analytics commands
- Days 6-7: Archival commands + testing

### Week 2: Web Dashboard Part 1
- Days 1-3: Cost dashboard
- Days 4-5: Budget UI
- Days 6-7: Testing + refinements

### Week 3: Web Dashboard Part 2 + VSCode
- Days 1-3: Analytics dashboard
- Days 4-5: Archival UI
- Days 6-7: VSCode integration

### Week 4: n8n + Polish
- Days 1-3: n8n nodes
- Days 4-5: Workflow templates
- Days 6-7: Integration tests + documentation

---

## Testing Strategy

### Test Count by Surface
| Surface | Tests | Types |
|---------|-------|-------|
| CLI | 30 | Unit + Integration |
| Web | 44 | Component + Integration |
| VSCode | 22 | Unit + Integration |
| n8n | 38 | Unit + Integration |
| **Total** | **134** | **All Critical Paths** |

### Quality Criteria
- ✅ 100% of user workflows tested
- ✅ Error scenarios covered
- ✅ Performance acceptable
- ✅ Type-safe (TypeScript)
- ✅ Documentation complete

---

## Deployment Plan

### Pre-Deployment
1. **Testing**
   - All 134 new tests passing
   - Integration tests across all surfaces
   - Manual UAT for each surface
   - Performance benchmarks

2. **Documentation**
   - User guides for each surface
   - API reference for n8n
   - CLI help documentation
   - Dashboard usage guide

3. **Migration**
   - Backward compatibility check
   - Data migration scripts (if needed)
   - Rollback procedures

### Deployment Phases
1. **Phase 1**: CLI (low risk, immediate feedback)
2. **Phase 2**: n8n (automation-focused users)
3. **Phase 3**: Web (general users)
4. **Phase 4**: VSCode (IDE users)

### Rollback Plan
- Feature flags for each surface
- Quick disable if critical issues
- Data backup before each phase
- Monitoring and alerting

---

## Success Metrics

### User Adoption
- ✅ CLI: 80%+ adoption among CLI users
- ✅ Web: 60%+ dashboard usage
- ✅ VSCode: 40%+ extension active
- ✅ n8n: 10+ workflow templates used

### System Metrics
- ✅ Cost reduction: 20%+ through archival
- ✅ Performance: <5s for all operations
- ✅ Reliability: 99.9% uptime
- ✅ User satisfaction: >4.0/5.0 rating

### Technical Metrics
- ✅ Test coverage: >90%
- ✅ Type safety: 100%
- ✅ Documentation: Complete
- ✅ Performance: P95 <2s

---

## Risks & Mitigations

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| Integration complexity | Medium | Incremental delivery per surface |
| Performance degradation | Low | Performance tests before release |
| User adoption lag | Medium | Clear documentation + tutorials |
| Breaking changes | Low | Backward compatibility testing |
| n8n API changes | Low | Version pinning + compatibility matrix |

---

## Resource Requirements

### Development
- 2-3 senior engineers (4 weeks)
- 1 QA engineer (4 weeks)
- 1 technical writer (2 weeks)

### Infrastructure
- No new infrastructure needed
- Existing Phase 3 services handle load
- CLI/Web/VSCode run on user machines

### Timeline
- **Total Duration**: 4 weeks
- **Full Capacity**: Yes
- **Buffer**: 1 week (unforeseen issues)
- **Launch Target**: End of February 2026

---

## Documentation Deliverables

1. **User Guides**
   - CLI: Budget, Analytics, Archival
   - Web: Dashboard usage
   - VSCode: Extension features
   - n8n: Node reference + templates

2. **API Documentation**
   - Phase 3 services API reference
   - n8n node input/output specs
   - CLI command reference
   - REST API documentation

3. **Architecture Guides**
   - Phase 3 system design
   - Integration architecture
   - Data flow diagrams
   - Service dependencies

4. **Troubleshooting**
   - Common issues and solutions
   - Debugging guides
   - Performance tuning
   - Cost optimization tips

---

## Summary

**Sprint 4 Delivers**:
- ✅ CLI integration with 30 tests
- ✅ Web dashboard with 44 tests
- ✅ VSCode extension with 22 tests
- ✅ n8n integration with 38 tests
- ✅ 134 new tests (all passing)
- ✅ Complete documentation
- ✅ Production deployment

**Expected Outcomes**:
- Phase 3 capabilities exposed across all surfaces
- 20%+ cost reduction through archival
- Complete memory management system
- Production-ready platform

---

*Sprint 4 Plan - February 9, 2026*
*Status: Ready for Implementation*
*Estimated Duration: 4 weeks*
*Target Launch: End of February 2026*
