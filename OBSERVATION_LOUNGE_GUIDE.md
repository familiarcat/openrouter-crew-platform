# Observation Lounge System Guide

## Overview

The **Observation Lounge** is a shared space where crew members contribute findings, insights, and observations from their work. These findings are automatically integrated with the agent memory system, enabling:

1. **Knowledge Sharing** - Crew members see what others have discovered
2. **Memory Decay** - Important findings stay active; unused ones fade (preventing knowledge bloat)
3. **Weekly Reports** - Automatic cost reports pull the most relevant findings
4. **MCP Service Integration** - Each crew role has recommended tools for gathering high-quality data

---

## How It Works

### The Three-Tier System

```
┌─────────────────────────────────────────────────────────────────┐
│                    OBSERVATION LOUNGE                           │
│              (Crew members share findings)                      │
└────────┬────────────────────────────────────────────────────────┘
         │
         ├──> SUPABASE (observation_lounge_findings table)
         │    Stores: findings, confidence, MCP service used
         │
         ├──> AGENT MEMORY (weighted interpolation)
         │    - High confidence → eternal retention
         │    - Med confidence → standard (30-day half-life)
         │    - Low confidence → temporary (3-day half-life)
         │
         └──> WEEKLY REPORTS
              Pull high-confidence findings for PM
```

### Memory Confidence & Retention

Findings are stored with a confidence score (0-1) that determines how long they persist:

| Confidence | Retention Tier | Half-Life | Use Case |
|-----------|-------------------|-----------|----------|
| ≥ 0.9 | **Eternal** | ~70 years | Critical findings, proven patterns |
| 0.7-0.89 | **Standard** | 30 days | Well-validated insights |
| 0.5-0.69 | **Temporary** | 3 days | Emerging patterns, working hypotheses |
| < 0.5 | **Session** | 10 hours | Exploratory observations, raw data |

**Key Feature**: When a finding is **referenced or used**, its confidence increases and decay is reset. Unused findings naturally fade away.

---

## Crew Roles & MCP Services

Each crew member role has **primary MCP services** (must-use) and **secondary services** (optional).

### Data Analytics
**Primary Services:**
- `mcp-dataframe-analyzer` - Process and analyze CSV/JSON data
- `mcp-statistical-suite` - Calculate statistics, trends, correlations
- `mcp-anomaly-detector` - Identify outliers and unusual patterns
- `mcp-cost-forecaster` - Project costs and budget trends

**Frequency:** Daily

**Example Finding:**
```
"Cost anomaly detected: API calls increased 150% on Tuesday
without corresponding workflow changes. Confidence: 0.95
Using: mcp-anomaly-detector"
```

### Strategic Leadership
**Primary Services:**
- `mcp-market-analyzer` - Industry/market data
- `mcp-competitor-tracker` - Monitor competitor moves
- `mcp-trend-identifier` - Identify market trends
- `mcp-risk-assessor` - Assess strategic risks

**Frequency:** Weekly

### Tactical Execution
**Primary Services:**
- `mcp-timeline-optimizer` - Analyze project schedules
- `mcp-resource-allocator` - Optimize resource usage
- `mcp-dependency-mapper` - Map task dependencies
- `mcp-velocity-calculator` - Track delivery metrics

**Frequency:** Daily

### User Experience
**Primary Services:**
- `mcp-ux-research-aggregator` - Compile user research
- `mcp-sentiment-analyzer` - Analyze user sentiment
- `mcp-usability-scorer` - Score interface usability
- `mcp-feedback-categorizer` - Organize feedback

**Frequency:** Daily

### Security & Compliance
**Primary Services:**
- `mcp-security-scanner` - Basic vulnerability scanning
- `mcp-compliance-checker` - Check compliance requirements
- `mcp-audit-log-analyzer` - Analyze access logs
- `mcp-policy-validator` - Validate against policies

**Frequency:** Daily

### System Health
**Primary Services:**
- `mcp-metrics-collector` - Gather system metrics
- `mcp-alert-analyzer` - Analyze system alerts
- `mcp-performance-profiler` - Profile performance
- `mcp-uptime-tracker` - Track availability

**Frequency:** Hourly

### Infrastructure
**Primary Services:**
- `mcp-cloud-cost-analyzer` - Analyze cloud costs
- `mcp-resource-optimizer` - Optimize resources
- `mcp-capacity-planner` - Plan for growth
- `mcp-infrastructure-auditor` - Audit infrastructure

**Frequency:** Weekly

### Communications
**Primary Services:**
- `mcp-sentiment-analyzer` - Analyze tone/sentiment
- `mcp-engagement-scorer` - Score engagement
- `mcp-message-optimizer` - Optimize messaging
- `mcp-audience-analyzer` - Understand audience

**Frequency:** Daily

### Pragmatic Solutions
**Primary Services:**
- `mcp-architecture-analyzer` - Analyze system architecture
- `mcp-solution-validator` - Validate solutions
- `mcp-trade-off-calculator` - Calculate trade-offs
- `mcp-complexity-estimator` - Estimate complexity

**Frequency:** Daily

---

## Using the Observation Lounge

### CLI Commands

#### Submit an Insight
```bash
pnpm obs submit-insight "Found pattern in cost data" \
  --crew-member "Alex Data" \
  --role "data-analytics" \
  --project PROJECT_ID \
  --confidence 0.85 \
  --mcp-service "mcp-cost-forecaster" \
  --tags "cost,pattern"
```

#### Submit a Recommendation
```bash
pnpm obs submit-recommendation "Implement caching layer to reduce API calls" \
  --crew-member "Casey Pragmatic" \
  --role "pragmatic-solutions" \
  --project PROJECT_ID \
  --confidence 0.8 \
  --mcp-service "mcp-architecture-analyzer"
```

#### Submit an Anomaly
```bash
pnpm obs submit-anomaly "Unusual spike in API costs" \
  --crew-member "Alex Data" \
  --role "data-analytics" \
  --project PROJECT_ID \
  --confidence 0.95 \
  --severity "high" \
  --mcp-service "mcp-anomaly-detector"
```

#### View Findings
```bash
# All findings
pnpm obs list --project PROJECT_ID

# By crew role
pnpm obs list --project PROJECT_ID --role data-analytics

# By insight type
pnpm obs list --project PROJECT_ID --type anomaly

# With minimum confidence
pnpm obs list --project PROJECT_ID --confidence 0.8
```

#### View Statistics
```bash
pnpm obs stats --project PROJECT_ID
```

#### View MCP Services for Your Role
```bash
pnpm obs mcp-services --role data-analytics
```

#### Publish a Draft Finding
```bash
pnpm obs publish FINDING_ID
```

### Programmatic Usage

```typescript
import { ObservationLounge } from '@openrouter-crew/crew-api-client';

const lounge = new ObservationLounge({
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_KEY
});

// Submit a finding
const finding = await lounge.submitFinding({
  projectId: 'proj_123',
  crewMemberId: 'crew_alex',
  crewMemberName: 'Alex Data',
  crewMemberRole: 'data-analytics',
  finding: 'Cost per token decreased 15% this week',
  insightType: 'insight',
  confidence: 0.88,
  tags: ['cost', 'optimization', 'trend'],
  mcp_service_used: 'mcp-cost-forecaster'
});

console.log(`Finding submitted: ${finding.id}`);

// Get findings
const findings = await lounge.getFindings('proj_123', {
  role: 'data-analytics',
  minConfidence: 0.8,
  limit: 10
});

// Get statistics
const stats = await lounge.getStatistics('proj_123');
console.log(`Total findings: ${stats.totalFindings}`);
console.log(`By role:`, stats.byRole);
```

---

## Weekly Reports

The weekly cost report automatically integrates observation lounge findings:

```bash
pnpm generate:weekly-report --email-to pm@example.com --project PROJECT_ID
```

### What Gets Included

1. **Cost Summary**
   - Total weekly cost
   - Cost trend (increasing/stable/decreasing)
   - Projected monthly burn

2. **Crew Member Costs**
   - Individual costs
   - Tokens used
   - Models used
   - Top findings from that person

3. **Key Insights**
   - High-confidence observations from lounge
   - Patterns discovered by crew
   - Cost-saving opportunities

4. **Recommendations**
   - Actionable items from strategic crew
   - Process improvements
   - Cost optimizations

5. **Anomalies**
   - Problems detected
   - Unusual patterns
   - Alerts requiring attention

### Memory Integration

The report itself is stored in agent memory as **institutional knowledge** (Layer 4):
- **Retention:** Standard tier (30 days half-life)
- **Activation:** Every time someone views the report, memory is refreshed
- **Decay:** If no one views the report for 30 days, confidence fades

---

## Memory Decay in Action

### Example Timeline

**Day 1: Finding Submitted**
- Alex submits: "Implementing cache reduced API calls by 25%"
- Confidence: 0.92 → Retention: Eternal
- Memory stored in Layer 3 (Strategy)

**Day 7: Finding Referenced**
- Casey reads the finding while planning architecture
- System records: "activation"
- Confidence: 0.92 → 0.94 (slightly increased)
- Decay counter resets

**Day 30: Finding Not Referenced**
- If never referenced again, confidence decays
- Original: 0.92 → After 30 days: ~0.81
- Still available but slightly lower priority

**Day 90: Finding Forgotten**
- If still not referenced, confidence: ~0.64
- Moves to "emerging patterns" tier
- Still available but less prominent in searches

**Day 365: Finding Archived**
- If never referenced, confidence: ~0.22
- Very low priority
- Can be manually archived or expired

### Preventing Decay

Findings stay fresh when they're:
- ✅ Referenced in reports
- ✅ Used in decision-making
- ✅ Tested and validated
- ✅ Cited by other crew members

Findings fade when they're:
- ❌ Never used
- ❌ Superseded by new findings
- ❌ Proven incorrect
- ❌ Outdated/no longer relevant

---

## Best Practices

### Quality Over Quantity
- Submit findings you're confident about (aim for >0.7 confidence)
- Use MCP services appropriate to your role
- Cite your data sources

### Clear Communication
- Be specific: "API costs up 15%" not "costs higher"
- Include context: "This happened because X"
- Suggest next steps: "Recommend implementing Y"

### MCP Service Usage
- **Always** cite which MCP service generated the finding
- **Validate** findings with 2+ sources before high confidence
- **Document** the process if unusual

### Tag Smartly
- Use consistent tags: `cost`, `performance`, `anomaly`, `optimization`
- Enable future search and correlation
- Make findings discoverable by others

### Timing
- Submit findings **as soon** as you discover them (don't batch)
- Update confidence scores if new evidence emerges
- Publish drafts when confident (don't leave in draft)

---

## Integration with Weekly Reports

### Automatic Inclusion
High-confidence findings (>0.8) from the past week are **automatically** included in reports:

```
From observation lounge findings this week:

💡 INSIGHT (from Alex Data, data-analytics)
"API cost optimization through caching implementation reduced
costs by 15%, with confidence 0.92"

✅ RECOMMENDATION (from Casey Pragmatic, pragmatic-solutions)
"Implement distributed caching layer across all microservices"

⚠️  ANOMALY (from Sam Security, security-compliance)
"Unusual spike in authentication failures on March 3 (0.89 confidence)"
```

### Memory Lifecycle
When findings are included in reports:
1. Confidence score increases slightly (0.01-0.05)
2. Decay counter resets
3. Finding becomes stronger institutional knowledge

---

## Troubleshooting

### Finding Not Showing in Reports
- Check confidence score (must be >0.8 for reports)
- Verify status is "published" (not "draft")
- Ensure timestamp is within the past 7 days

### MCP Service Not Available
- Check if it's free/open-source
- Verify it's in your role's recommended list
- Update to latest version

### Memory Decay Feels Too Fast
- More references = slower decay
- Cite findings in other findings
- Include in weekly reports
- Use in decision documents

---

## Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  CREW MEMBER WORK                                               │
│  (Running task with MCP services)                               │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  OBSERVATION LOUNGE CLI                                         │
│  pnpm obs submit-insight "Finding text"                         │
│  --mcp-service "mcp-service-name"                               │
│  --confidence 0.85                                              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                    ┌──────┴───────┐
                    │              │
                    ▼              ▼
         ┌──────────────────┐  ┌──────────────────┐
         │  Supabase        │  │  Agent Memory    │
         │  observation_    │  │  (Layer 2-4)     │
         │  lounge_findings │  │  with decay      │
         └──────────────────┘  └──────────────────┘
                    │              │
                    │              │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │ WEEKLY REPORT │
                    │ Generator     │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────────┐
                    │ Email to PM       │
                    │ HTML Report       │
                    └──────────────────┘
```

---

## See Also

- [Agent Memory System](domains/shared/agent-memory/README.md) - How memory decay works
- [Crew Coordination](domains/shared/crew-coordination/) - Crew member types and roles
- [Cost Tracking](domains/shared/cost-tracking/) - Cost calculation system
- [Weekly Report Generator](scripts/generate-weekly-report.ts) - Report generation script

---

## Questions?

For issues or suggestions, please create an issue in the repository with the `observation-lounge` tag.
