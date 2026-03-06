# Crew Daily Workflow: Using Observation Lounge & Weekly Reports

## TL;DR - One-Minute Overview

**What:** Crew members share findings with each other using the observation lounge
**How:** Submit insights/anomalies/recommendations via CLI command
**When:** Throughout the day as you discover things
**Why:** Findings automatically create weekly reports and shared organizational memory

```bash
# Every time you discover something, submit it:
pnpm obs submit-insight "Your finding" --crew-member "Your Name" --role "your-role" --project proj_id --confidence 0.85
```

---

## Your Role & Your MCP Services

### What's an MCP Service?

An MCP (Model Context Protocol) service is a **free, specialized tool** for your job. Your role determines which services you should use:

| Your Role | Primary MCP Services | Typical Findings | Frequency |
|-----------|-------------------|-----------------|-----------|
| **Data Analytics** | `mcp-dataframe-analyzer`, `mcp-anomaly-detector`, `mcp-cost-forecaster`, `mcp-statistical-suite` | Cost trends, anomalies, correlations | Daily |
| **Strategic Leadership** | `mcp-market-analyzer`, `mcp-competitor-tracker`, `mcp-trend-identifier` | Market insights, competitive moves | Weekly |
| **Tactical Execution** | `mcp-timeline-optimizer`, `mcp-dependency-mapper`, `mcp-velocity-calculator` | Schedule issues, delays, blockers | Daily |
| **User Experience** | `mcp-sentiment-analyzer`, `mcp-usability-scorer`, `mcp-feedback-categorizer` | User satisfaction, UI problems | Daily |
| **Security & Compliance** | `mcp-security-scanner`, `mcp-compliance-checker`, `mcp-audit-log-analyzer` | Vulnerabilities, policy violations | Daily |
| **System Health** | `mcp-metrics-collector`, `mcp-alert-analyzer`, `mcp-performance-profiler` | Outages, slow performance, errors | Hourly |
| **Infrastructure** | `mcp-cloud-cost-analyzer`, `mcp-resource-optimizer`, `mcp-capacity-planner` | Cost issues, resource waste | Weekly |
| **Communications** | `mcp-sentiment-analyzer`, `mcp-engagement-scorer`, `mcp-message-optimizer` | Message effectiveness, tone | Daily |
| **Pragmatic Solutions** | `mcp-architecture-analyzer`, `mcp-solution-validator`, `mcp-trade-off-calculator` | Design issues, technical debt | Daily |
| **Business Intelligence** | `mcp-market-analyzer`, `mcp-financial-forecaster`, `mcp-customer-analyzer` | Business metrics, opportunities | Weekly |

### Check Your MCP Services

```bash
pnpm obs mcp-services --role "data-analytics"

# Output:
# 🔧 MCP Services for data-analytics
#
# Primary Services (must-have):
#   ✓ mcp-dataframe-analyzer
#   ✓ mcp-statistical-suite
#   ✓ mcp-anomaly-detector
#   ✓ mcp-cost-forecaster
#
# Secondary Services (optional):
#   ○ mcp-visualization-builder
#   ○ mcp-correlation-finder
#
# Recommended Frequency: DAILY
```

---

## Daily Workflow Examples

### Example 1: Data Analytics - Morning Cost Review

```bash
# You run your daily cost analysis using mcp-cost-forecaster
# You notice: "Sonnet model costs dropped 15% this week"

# Submit as an insight (because it's important but not urgent)
pnpm obs submit-insight \
  "Sonnet model costs dropped 15% this week due to improved prompt engineering" \
  --crew-member "Alex Data" \
  --crew-id crew_alex_123 \
  --role "data-analytics" \
  --project proj_myproject \
  --confidence 0.88 \
  --mcp-service "mcp-cost-forecaster" \
  --tags "cost,optimization,sonnet"

# Output: ✅ Insight submitted! ID: obs_1709644800_a1b2c3d4e5f6
```

### Example 2: Pragmatic Solutions - Architecture Review

```bash
# You're reviewing the system architecture using mcp-architecture-analyzer
# You find: "Current caching strategy could be improved"

# Submit as a recommendation
pnpm obs submit-recommendation \
  "Implement distributed caching layer for repeated API calls. " \
  "Estimated savings: $150/week, implementation: 3 days" \
  --crew-member "Casey Pragmatic" \
  --crew-id crew_casey_456 \
  --role "pragmatic-solutions" \
  --project proj_myproject \
  --confidence 0.80 \
  --mcp-service "mcp-architecture-analyzer" \
  --tags "architecture,performance,cost-saving"
```

### Example 3: Security - Critical Alert

```bash
# Your security scanner (mcp-security-scanner) finds a vulnerability
# This is urgent - high confidence, high severity

pnpm obs submit-anomaly \
  "Detected unencrypted API keys in environment logs. Immediate action required." \
  --crew-member "Sam Security" \
  --crew-id crew_sam_789 \
  --role "security-compliance" \
  --project proj_myproject \
  --confidence 0.99 \
  --severity "high" \
  --mcp-service "mcp-security-scanner" \
  --tags "security,critical,keys"

# This goes into the weekly report immediately due to high confidence
```

### Example 4: Strategic Leadership - Market Insight

```bash
# Your market analyzer (mcp-market-analyzer) discovers competitor activity
# Submit weekly, not daily

pnpm obs submit-insight \
  "Competitor X launched similar service at $5/call; our sweet spot is $1.50. " \
  "10x efficiency advantage represents significant moat." \
  --crew-member "Robin Strategy" \
  --crew-id crew_robin_321 \
  --role "strategic-leadership" \
  --project proj_myproject \
  --confidence 0.85 \
  --mcp-service "mcp-market-analyzer" \
  --tags "competitive,strategy,market,moat"
```

---

## View Your Team's Findings

### See Everything This Week

```bash
pnpm obs list --project proj_myproject

# Shows all published findings from the past week
# Each shows: crew member, finding text, confidence, date
```

### See Findings from Your Role

```bash
pnpm obs list --project proj_myproject --role "data-analytics"

# Shows only findings from data analytics team
```

### See Only Anomalies (Problems)

```bash
pnpm obs list --project proj_myproject --type anomaly

# Shows all detected problems, sorted by most recent
# Use this to stay aware of issues
```

### See High-Confidence Insights

```bash
pnpm obs list --project proj_myproject --confidence 0.85 --limit 5

# Shows most reliable findings (highly confident)
# These are the insights you can act on with confidence
```

---

## Understanding Confidence Scores

The **confidence score** (0-1) indicates how sure you are about a finding:

| Score | Interpretation | How to Use |
|-------|----------------|-----------|
| 0.95+ | **Certain** | Act immediately, no verification needed |
| 0.85-0.94 | **High confidence** | Good to act on, verify if critical |
| 0.70-0.84 | **Reasonable confidence** | Use for planning, monitor for accuracy |
| 0.50-0.69 | **Working hypothesis** | Share for discussion, validate further |
| <0.50 | **Exploratory** | Very early findings, mostly for discussion |

### Setting Confidence

```bash
# Example: You're very sure about your finding
--confidence 0.92

# Example: You have evidence but some uncertainty
--confidence 0.75

# Example: Early observation, needs validation
--confidence 0.58
```

**Pro tip:** Higher confidence findings:
- Show up in weekly reports
- Never decay quickly (eternal retention)
- Become institutional knowledge
- Guide team decisions

---

## Memory Decay: How Findings Grow or Fade

### How Your Findings Stay Fresh

```
Day 1: Submit finding with confidence 0.88
  ↓ (Finding is stored, crew members can see it)

Day 7: Someone cites your finding in a decision
  ↓ (System records this "activation")
  → Confidence increases: 0.88 → 0.89
  → Decay counter resets (stays fresh)

Day 30: Finding appears in weekly report
  ↓ (Report is sent to PM, widely seen)
  → Confidence increases: 0.89 → 0.91
  → This finding now has strong credibility

Day 60: If never referenced again...
  ↓ (System applies memory decay formula)
  → Confidence decreases: 0.91 → 0.80
  → Less prominent in searches
  → Still available but lower priority
```

### How to Keep Your Findings Fresh

✅ **Your finding stays strong if:**
- Someone cites it in a report
- It's used in a decision
- Other crew members reference it
- You update it with new data

❌ **Your finding fades if:**
- It's never used again
- No one ever references it
- It becomes outdated
- It's proven wrong

---

## How Findings Become the Weekly Report

### What Happens Every Monday

```
SUNDAY NIGHT:
Report generator starts up
  ↓
Pulls all findings from past 7 days
  ↓
Filters for high confidence (>0.8)
  ↓
Groups by crew role and type
  ↓
Generates beautiful HTML email
  ↓
Sends to PM

What's in the report:
✓ Your cost summary
✓ Crew member contributions
✓ Key insights (from observation lounge)
✓ Recommendations for improvement
✓ Problems detected
```

### Your Findings in the Report

```
📊 SAMPLE WEEKLY REPORT

Period: Feb 26 - Mar 5

SUMMARY
Total Cost: $47.32
Trend: DECREASING ↓
Projected Monthly: $201.86

KEY INSIGHTS
─────────────
💡 "Sonnet model costs dropped 15% this week due to improved prompt engineering"
   From: Alex Data (data-analytics)
   Confidence: 0.88 ⭐ HIGH

💡 "Model routing change reduced Sonnet usage by 40%"
   From: Alex Data (data-analytics)
   Confidence: 0.85 ⭐ HIGH

RECOMMENDATIONS
─────────────
✅ "Implement distributed caching layer for repeated API calls"
   From: Casey Pragmatic (pragmatic-solutions)
   Confidence: 0.80 ⭐ HIGH

ANOMALIES
─────────
⚠️  "Unusual spike in storage costs Friday March 3"
   From: Sam Security (security-compliance)
   Confidence: 0.92 ⭐⭐ CRITICAL
```

When your finding appears in the report:
- Your confidence score increases
- It becomes institutional knowledge
- It influences business decisions
- Decay is prevented

---

## Best Practices for Crew Members

### When Submitting a Finding

**✅ Do:**
- Submit findings **as soon** as you discover them
- Include the **MCP service** you used
- Set a **realistic confidence** score
- Use **specific numbers** ("12% reduction" not "much better")
- Add **relevant tags** for discoverability
- Explain **why** something happened, not just what

**❌ Don't:**
- Wait to batch findings together
- Submit low-confidence exploratory ideas as high confidence
- Forget to cite your data source
- Use vague language ("things improved")
- Submit without your role/crew member info
- Leave findings in draft status

### Example: Good vs Bad Submission

**❌ BAD:**
```bash
pnpm obs submit-insight "Costs seem lower"
# Too vague, no data, no confidence, no source
```

**✅ GOOD:**
```bash
pnpm obs submit-insight \
  "API cost per call decreased from $0.002 to $0.0018 (10% reduction) " \
  "due to model routing optimization implemented March 2nd" \
  --crew-member "Alex Data" \
  --role "data-analytics" \
  --project proj_myproject \
  --confidence 0.92 \
  --mcp-service "mcp-cost-forecaster" \
  --tags "cost,optimization,api"
# Specific numbers, clear cause, high confidence, cited source
```

---

## Weekly Checklist

Every Monday morning before the report comes:

- [ ] Review last week's findings from my team
- [ ] Did any of my findings make it into the report? (Yes = validate/update)
- [ ] Are there findings I didn't know about? (Read them to stay informed)
- [ ] Any anomalies I should investigate?
- [ ] Plan any actions based on recommendations

---

## Commands Quick Reference

```bash
# Submit findings
pnpm obs submit-insight "text" --crew-member "Your Name" --role "role" --project id
pnpm obs submit-recommendation "text" --crew-member "Your Name" --role "role" --project id
pnpm obs submit-anomaly "text" --crew-member "Your Name" --role "role" --project id

# View findings
pnpm obs list --project id              # All findings
pnpm obs list --project id --role role  # Your team's findings
pnpm obs list --project id --type anomaly  # Just problems
pnpm obs stats --project id             # Statistics

# Your MCP services
pnpm obs mcp-services --role "your-role"
```

---

## Your Impact

Every finding you submit:
1. **Helps your team** - Others learn from your work
2. **Influences decisions** - High-confidence findings shape strategy
3. **Creates institutional memory** - Prevents repeating mistakes
4. **Builds credibility** - Accurate findings increase your influence
5. **Shapes reports** - Your insights go directly to leadership

---

## Questions?

- **How do I set confidence?** → Based on data quality. 0.9+ = very sure, 0.7-0.8 = reasonably sure
- **What if I'm wrong?** → Update or archive the finding; memory decay handles it
- **Can I edit findings?** → Publish new version, old one fades naturally
- **How long do findings last?** → Depends on confidence: eternal (0.9+), 30 days (0.7-0.9), 3 days (0.5-0.7)
- **Do findings show up automatically in reports?** → Yes, if confidence >0.8 and from past 7 days
- **Can I see what others submitted?** → Yes, use `pnpm obs list`

---

## Next Steps

1. **Today:** Check your MCP services (`pnpm obs mcp-services --role "your-role"`)
2. **Tomorrow:** Submit your first finding
3. **This week:** Check what others discovered (`pnpm obs list`)
4. **Monday:** Look for your findings in the weekly report
5. **Going forward:** Submit findings as you discover them (20 seconds each)

Welcome to the observation lounge! 🚀
