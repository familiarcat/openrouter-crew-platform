# Weekly Cost Report & Observation Lounge Implementation

## Complete System Overview

This document describes the fully integrated system for collecting crew insights, managing memory decay, and generating weekly reports for project managers.

---

## The System Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        CREW MEMBER WORK CYCLE                            │
│                                                                          │
│  1. Crew member executes task using MCP services                        │
│     Example: Data Analytics uses mcp-cost-forecaster                    │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                     OBSERVATION LOUNGE SUBMISSION                        │
│                                                                          │
│  2. Submit finding to observation lounge with confidence score          │
│     Command: pnpm obs submit-insight "Finding text" \                  │
│               --crew-member "Alex" --role "data-analytics" \           │
│               --project PROJECT_ID --confidence 0.85                    │
│               --mcp-service "mcp-cost-forecaster"                       │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
    ┌────────────────────────────┐  ┌──────────────────────────┐
    │  Supabase Storage          │  │  Agent Memory (Decay)    │
    │  observation_lounge_       │  │  Confidence varies by:   │
    │  findings table            │  │  - Retention tier        │
    │                            │  │  - Activation count      │
    │  Stores:                   │  │  - Last activation       │
    │  - Finding text            │  │  - Insertion time        │
    │  - Confidence 0-1          │  │  - Usage frequency       │
    │  - MCP service used        │  │                          │
    │  - Crew member role        │  │  Automatically stores    │
    │  - Tags                    │  │  and applies decay       │
    │  - Timestamps              │  │  formula over time       │
    └────────────────────────────┘  └──────────────────────────┘
                    │                         │
                    └────────────┬────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────────────┐
│              WEEKLY REPORT GENERATION (Every Monday)                     │
│                                                                          │
│  3. Report generator queries:                                           │
│     - Cost tracking data (past 7 days)                                  │
│     - High-confidence findings from lounge (>0.8)                       │
│     - Statistics by crew role and insight type                          │
│                                                                          │
│  4. Generates three outputs:                                            │
│     - HTML report (email-friendly)                                      │
│     - Stores summary in agent memory (institutional knowledge)          │
│     - Activates referenced memories (prevents decay)                    │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────────────┐
│              EMAIL TO PROJECT MANAGER                                    │
│                                                                          │
│  Email contains:                                                         │
│  - Cost summary + trend                                                 │
│  - Crew member costs breakdown                                          │
│  - Key insights (from lounge findings)                                  │
│  - Recommendations for cost savings                                     │
│  - Anomalies detected                                                   │
│                                                                          │
│  Recipient: pm@example.com (configurable)                              │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 1: Database Setup

Apply the migration to create the observation lounge table:

```bash
# Apply migration
supabase db push

# Or manually
psql $DATABASE_URL < supabase/migrations/20260305_create_observation_lounge.sql
```

This creates:
- `observation_lounge_findings` table (main findings storage)
- Indexes for fast queries (project_id, status, confidence, etc.)
- Full-text search index for finding content
- RLS policies (project members can view published findings)
- Three helper views (findings by role, by type, high confidence)

### Step 2: Install Dependencies

```bash
pnpm install

# Build observation lounge module
pnpm --filter @openrouter-crew/crew-api-client build
```

### Step 3: Environment Configuration

Add to your `.env.local` file:

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_ANON_KEY=your-anon-key

# Email configuration (for weekly reports)
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=SG.your-sendgrid-key
EMAIL_FROM=crew-platform@openrouter.local
PM_EMAIL=pm@example.com

# Crew member defaults (can be overridden per command)
CREW_MEMBER="Your Name"
CREW_ID=crew_your_id
PROJECT_ID=proj_your_project
```

### Step 4: Submission Workflow

**Daily Workflow for Crew Members:**

```bash
# Example: Data Analytics member running their MCP services
# They discover: "API costs dropped 12% this week"

# Submit as insight
pnpm obs submit-insight \
  "API costs dropped 12% this week due to improved caching efficiency" \
  --crew-member "Alex Data" \
  --crew-id crew_alex_data \
  --role "data-analytics" \
  --project proj_myproject \
  --confidence 0.88 \
  --mcp-service "mcp-cost-forecaster" \
  --tags "cost,optimization,trend"

# Submit as recommendation
pnpm obs submit-recommendation \
  "Expand caching to all microservices to compound savings" \
  --crew-member "Casey Pragmatic" \
  --role "pragmatic-solutions" \
  --project proj_myproject \
  --confidence 0.75 \
  --mcp-service "mcp-architecture-analyzer"

# Submit an anomaly
pnpm obs submit-anomaly \
  "Unexpected spike in storage costs on Friday March 3" \
  --crew-member "Sam Security" \
  --role "security-compliance" \
  --project proj_myproject \
  --confidence 0.92 \
  --severity "high" \
  --mcp-service "mcp-anomaly-detector"
```

### Step 5: Weekly Report Generation

**Automated (via cron or GitHub Actions):**

```bash
# Add to your CI/CD (GitHub Actions example)
# .github/workflows/weekly-report.yml

name: Weekly Cost Report
on:
  schedule:
    - cron: '0 9 * * MON'  # Every Monday at 9 AM UTC

jobs:
  report:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Generate and send weekly report
        run: pnpm report:weekly --email-to ${{ secrets.PM_EMAIL }}
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_KEY: ${{ secrets.SUPABASE_KEY }}
          EMAIL_HOST: ${{ secrets.EMAIL_HOST }}
          EMAIL_PORT: ${{ secrets.EMAIL_PORT }}
          EMAIL_USER: ${{ secrets.EMAIL_USER }}
          EMAIL_PASS: ${{ secrets.EMAIL_PASS }}
          EMAIL_FROM: crew-platform@openrouter.local
```

**Manual (for testing):**

```bash
# Generate and email report
pnpm report:weekly --email-to pm@example.com --project proj_myproject

# Generate for specific project
pnpm report:weekly \
  --email-to pm@example.com \
  --project proj_specific_project
```

---

## How Crew Members Use This

### Daily Observation Logging

Each crew member has **primary MCP services** for their role. They:

1. **Run their tools** (e.g., data analytics using mcp-cost-forecaster)
2. **Find a notable pattern/insight/anomaly**
3. **Submit to observation lounge** immediately
4. **Include metadata**:
   - Which MCP service found it
   - Confidence score (0-1)
   - Relevant tags
   - Data source if applicable

### Example Crew Interactions

**Data Analytics (Alex):**
```bash
# Uses mcp-cost-forecaster
pnpm obs submit-insight \
  "Model routing change reduced Sonnet usage by 40%, saving $200/week" \
  --crew-member "Alex Data" \
  --role "data-analytics" \
  --project proj_myproject \
  --confidence 0.92 \
  --mcp-service "mcp-cost-forecaster" \
  --tags "cost,optimization,model-routing"
```

**Strategic Leadership (Robin):**
```bash
# Uses mcp-market-analyzer
pnpm obs submit-insight \
  "Competitor X launched similar product at $5/call; we're at $1.50" \
  --crew-member "Robin Strategy" \
  --role "strategic-leadership" \
  --project proj_myproject \
  --confidence 0.85 \
  --mcp-service "mcp-market-analyzer" \
  --tags "competitive,market,strategy"
```

**Pragmatic Solutions (Casey):**
```bash
# Uses mcp-architecture-analyzer
pnpm obs submit-recommendation \
  "Implement caching layer for repeated queries - ROI 6 months" \
  --crew-member "Casey Pragmatic" \
  --role "pragmatic-solutions" \
  --project proj_myproject \
  --confidence 0.80 \
  --mcp-service "mcp-architecture-analyzer" \
  --tags "architecture,performance,ROI"
```

---

## Memory Decay in Action: Real Example

### Week 1: Finding Discovered
**Data Analytics** submits: "API cost per call decreased from $0.002 to $0.0018"
- Confidence: 0.92
- Retention: Eternal (very high confidence)
- Stored in: Agent Memory Layer 3 (Strategy)

### Week 2: Finding Appears in Report
**Weekly Report Generator** pulls the finding for the report
- Confidence: 0.92 → 0.94 (slightly increased, used in important context)
- Decay counter: Reset
- Memory becomes stronger institutional knowledge

### Week 3: No Reference
- Confidence: 0.94 → 0.93 (slight decay)
- Still appears in search results
- Still available if someone asks about costs

### Week 6: Finding Forgotten
- Confidence: 0.93 → 0.85 (continues decaying)
- Less prominent in searches
- Could be replaced by more recent findings

### Week 12: If Still Unused
- Confidence: 0.85 → 0.62 (significant decay)
- Very low priority in searches
- Could be archived

### What Prevents Decay?
✅ Including in weekly reports
✅ Being referenced by other findings
✅ Being used in decision documents
✅ Being cited by other crew members

---

## Report Structure

### Example Weekly Report (HTML Email)

```html
Subject: Weekly Cost Report - 2026-03-05

Period: 2026-02-26 to 2026-03-05

SUMMARY
-------
Weekly Cost: $47.32
Projected Monthly: $201.86
Cost Trend: DECREASING ↓

CREW MEMBER COSTS
-----------------
Alex Data (data-analytics)
  Cost: $15.20
  Tokens: 125,000
  Models: claude-3.5-sonnet, claude-3.5-haiku

Casey Pragmatic (pragmatic-solutions)
  Cost: $12.50
  Tokens: 98,000
  Models: claude-3.5-sonnet

Sam Security (security-compliance)
  Cost: $8.60
  Tokens: 45,000
  Models: claude-3.5-haiku

KEY INSIGHTS
------------
💡 API cost per call decreased from $0.002 to $0.0018 (confidence: 0.92)
   From: Alex Data, data-analytics

💡 Model routing change reduced Sonnet usage by 40% (confidence: 0.88)
   From: Alex Data, data-analytics

RECOMMENDATIONS
---------------
✅ Implement caching layer for repeated queries - ROI 6 months
   From: Casey Pragmatic, pragmatic-solutions (confidence: 0.80)

✅ Expand cost optimization to remaining 3 microservices
   From: Alex Data, data-analytics (confidence: 0.85)

ANOMALIES DETECTED
------------------
⚠️  Unexpected spike in storage costs Friday March 3 (confidence: 0.92)
    From: Sam Security, security-compliance
    Action: Investigate old backup retention policy
```

### Memory Integration

The report itself is stored as institutional knowledge:
- **Type:** Report summary
- **Confidence:** Based on how many high-confidence findings it contains
- **Retention:** Standard (30 days half-life)
- **Layer:** 4 (institutional knowledge)

---

## Programmatic Access

For agents or other systems that want to access findings:

```typescript
import { ObservationLounge } from '@openrouter-crew/crew-api-client';

const lounge = new ObservationLounge({
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_KEY
});

// Get all findings for a project
const findings = await lounge.getFindings('proj_123');

// Filter by role and minimum confidence
const highConfidenceFromAnalytics = await lounge.getFindings('proj_123', {
  role: 'data-analytics',
  minConfidence: 0.8,
  limit: 10
});

// Get findings by type
const anomalies = await lounge.getFindings('proj_123', {
  insightType: 'anomaly',
  limit: 20
});

// Get statistics
const stats = await lounge.getStatistics('proj_123');
console.log(`Total findings: ${stats.totalFindings}`);
console.log(`By role:`, stats.byRole);
console.log(`Average confidence: ${stats.averageConfidence}`);

// Submit a programmatic finding
await lounge.submitFinding({
  projectId: 'proj_123',
  crewMemberId: 'crew_agent_1',
  crewMemberName: 'Cost Optimization Agent',
  crewMemberRole: 'system-health',
  finding: 'Detected unused compute resources costing $20/day',
  insightType: 'anomaly',
  confidence: 0.89,
  mcp_service_used: 'mcp-cloud-cost-analyzer',
  tags: ['cost', 'infrastructure', 'optimization']
});
```

---

## Monitoring & Verification

### Check Finding Statistics

```bash
pnpm obs stats --project proj_myproject

# Output:
# 📈 Observation Lounge Statistics
# Total Findings: 47
# Average Confidence: 84.3%
#
# By Crew Role:
#   data-analytics: 18
#   pragmatic-solutions: 12
#   strategic-leadership: 10
#   security-compliance: 7
#
# By Type:
#   insight: 22
#   recommendation: 15
#   anomaly: 10
```

### View Recent Findings

```bash
pnpm obs list --project proj_myproject --limit 10

# Shows recent findings with:
# - Crew member name
# - Insight type with emoji
# - Finding text (truncated)
# - Confidence score
# - Submission date
```

### Check Memory Status

```bash
# View memory decay for findings
pnpm memory:cli stats test-project

# This shows:
# - Eternal memories (permanent)
# - Standard memories (30-day half-life)
# - Temporary memories (3-day half-life)
# - Session memories (10-hour half-life)
# - Usage-based confidence adjustments
```

---

## Troubleshooting

### Issue: Finding not showing in weekly report

**Checklist:**
- [ ] Confidence score is > 0.8
- [ ] Status is "published" (not draft)
- [ ] Submission date is within past 7 days
- [ ] Project ID matches

**Fix:**
```bash
# Publish if draft
pnpm obs publish FINDING_ID

# Check confidence
pnpm obs list --project proj_myproject --confidence 0.8
```

### Issue: Memory not decaying properly

**Verify:**
- [ ] Supabase agent_memory tables exist
- [ ] Decay manager configured correctly
- [ ] No manual confidence overrides

**Check:**
```bash
pnpm memory:cli debug test-project
# Shows: decay calculations, confidence trends, memory health
```

### Issue: Email not sending

**Debug steps:**
1. Check email credentials in `.env.local`
2. Verify SENDGRID_API_KEY (if using SendGrid)
3. Test email service:
   ```bash
   node -e "
   const nodemailer = require('nodemailer');
   const transporter = nodemailer.createTransport({
     host: process.env.EMAIL_HOST,
     port: process.env.EMAIL_PORT,
     auth: {
       user: process.env.EMAIL_USER,
       pass: process.env.EMAIL_PASS
     }
   });
   transporter.verify((err, valid) => {
     console.log(valid ? 'Email ready' : err);
   });
   "
   ```

---

## Best Practices

### For Crew Members

1. **Submit findings as you discover them** (don't batch)
2. **Include confidence score** based on data quality
3. **Always cite MCP service used** for reproducibility
4. **Use consistent tags** for searchability
5. **Be specific** - "costs down 12%" not "costs better"

### For Project Managers

1. **Review weekly reports** - this activates memories
2. **Act on high-confidence recommendations**
3. **Investigate anomalies promptly**
4. **Share insights across teams** (increases confidence)
5. **Archive outdated findings** if needed

### For System Admins

1. **Monitor memory health** weekly
2. **Back up observation lounge data** regularly
3. **Review RLS policies** for security
4. **Test report generation** monthly
5. **Rotate email credentials** quarterly

---

## Scaling to Multiple Projects

Each project has its own isolated finding pool:

```bash
# Project 1
pnpm obs submit-insight "Finding" --project proj_alpha

# Project 2
pnpm obs submit-insight "Finding" --project proj_beta

# Get findings for specific project
pnpm obs list --project proj_alpha
pnpm obs list --project proj_beta

# Generate reports per project
pnpm report:weekly --project proj_alpha
pnpm report:weekly --project proj_beta
```

Memory is also scoped per project, preventing cross-project contamination.

---

## Next Steps

1. ✅ Apply database migration
2. ✅ Configure environment variables
3. ✅ Build observation lounge module
4. ✅ Test with one crew member
5. ✅ Integrate into CI/CD for weekly reports
6. ✅ Train crew on submission process
7. ✅ Monitor and refine confidence thresholds

---

## Documentation Links

- [Observation Lounge Guide](OBSERVATION_LOUNGE_GUIDE.md) - User guide
- [Agent Memory System](domains/shared/agent-memory/) - Technical details
- [Crew Coordination](domains/shared/crew-coordination/) - Crew member types
- [Cost Tracking](domains/shared/cost-tracking/) - Cost calculation
