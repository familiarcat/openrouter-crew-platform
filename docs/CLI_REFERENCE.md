# OpenRouter Crew Platform - CLI Reference

**Complete command reference for the `crew` CLI tool.**

Version: 1.0.0
Author: Claude (Haiku 4.5)
Date: 2026-02-03

---

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Global Options](#global-options)
4. [Crew Commands](#crew-commands)
5. [Project Commands](#project-commands)
6. [Cost Commands](#cost-commands)
7. [Examples](#examples)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The `crew` CLI is the gravitational center of the OpenRouter Crew Platform. It provides a unified interface to:

- **Consult crew members** for assistance
- **Create and manage projects** (features, stories, sprints)
- **Monitor and optimize costs** across AI operations
- **Track async workflows** (request status, polling)

### Key Principles

- ✅ **Cost-first** - Estimate costs before execution
- ✅ **Async-ready** - Support long-running operations
- ✅ **Observable** - Track everything
- ✅ **Constrained** - Enforce budgets and limits

---

## Installation

### From Source

```bash
# Clone repository
git clone https://github.com/bradygeorgen/openrouter-crew-platform.git
cd openrouter-crew-platform

# Install dependencies
pnpm install

# Build CLI
pnpm --filter @openrouter-crew/cli build

# Link globally (optional)
npm link apps/cli
```

### Environment Setup

Create `.env.local` in project root:

```bash
# Required
SUPABASE_URL=https://your-supabase.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
N8N_WEBHOOK_URL=https://n8n.yourdomain.com/webhook
N8N_URL=https://n8n.yourdomain.com
N8N_API_KEY=your-n8n-api-key

# Optional
MCP_URL=http://localhost:3000/api/mcp
PROJECT_BUDGET=100.00
DEBUG=false
```

---

## Global Options

### `--debug`
Enable debug logging (verbose output)

```bash
crew --debug crew roster
```

### `--version` / `-v`
Show CLI version

```bash
crew --version
# Output: 1.0.0
```

### `--help` / `-h`
Show help for command or global help

```bash
crew --help                  # Global help
crew crew --help             # Crew command help
crew cost report --help      # Specific help
```

---

## Crew Commands

**Namespace:** `crew <subcommand>`

The Crew namespace manages AI agents (the computational intelligence body).

### `crew roster`

Show crew roster and availability status.

**Usage:**
```bash
crew roster [options]
```

**Options:**
- `--json` - Output as JSON instead of formatted table

**Output Example:**
```
📋 Crew Roster Status

Member                Role                Status         Workload  Model
──────────────────────────────────────────────────────────────────────────
⭐ Captain Picard      Strategic Leader    Available      45%       claude-sonnet-4
🤖 Commander Data      Data Analytics      Available      72%       claude-sonnet-3.5
🎯 Commander Riker    Tactical Execution  Busy          90%       claude-sonnet-3.5
🎨 Counselor Troi     UX Design           Available      30%       claude-sonnet-3.5
🛡️  Lt. Worf          Security            Available      60%       claude-sonnet-3.5
⚕️  Dr. Crusher       System Health       Available      15%       claude-sonnet-3.5
🔧 Geordi La Forge    Infrastructure      Busy          85%       claude-sonnet-3.5
📡 Lt. Uhura          Communications      Available      40%       claude-sonnet-3.5
🔨 Chief O'Brien      Pragmatic Solutions Available      50%       gemini-flash-1.5
💰 Quark             Business Intelligence Available     25%       gemini-flash-1.5
```

### `crew consult <member> <task>`

Consult a crew member for assistance.

**Usage:**
```bash
crew consult <member> <task> [options]
```

**Arguments:**
- `<member>` - Crew member name (lowercase, e.g., `picard`, `data`, `riker`)
- `<task>` - Task description or question

**Options:**
- `--async` - Execute asynchronously, return request ID immediately
- `--wait` - Wait for async result with timeout (default)
- `--timeout <seconds>` - Timeout for async operations (default: 300)
- `--json` - Output as JSON

**Examples:**

```bash
# Synchronous consultation (< 30 seconds)
crew consult picard "Analyze the strategic implications of this decision"

# Asynchronous consultation (returns immediately)
crew consult data "Analyze dataset structure" --async
# Output: Request ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890

# With custom timeout
crew consult riker "Plan the tactical approach" --wait --timeout 600
```

**Output Example:**
```
🤝 Consulting captain-picard...

✓ Response from Captain Picard

The Federation charter establishes three core principles:
1. Universal rights and dignity of all sentient beings
2. Peaceful resolution through dialogue and cooperation
3. Continuous exploration and understanding of the universe

These principles transcend individual conflicts and provide
a framework for sustainable governance across diverse cultures
and species...

Cost: $0.0075
```

### `crew activate <member>`

Activate a crew member for a task (reserve their capacity).

**Usage:**
```bash
crew activate <member> [options]
```

**Arguments:**
- `<member>` - Crew member name

**Options:**
- `--duration <hours>` - Duration for activation (default: 1)

**Example:**
```bash
crew activate data --duration 2
```

**Output:**
```
⚡ Activating commander-data...

✓ Crew member activated
Member: Commander Data
Duration: 2 hour(s)
Active until: Feb 3, 2026, 12:30 PM
```

### `crew coordinate <task>`

Coordinate crew for multi-agent task.

**Usage:**
```bash
crew coordinate <task> [options]
```

**Arguments:**
- `<task>` - Task description

**Options:**
- `--members <list>` - Specific crew members (comma-separated)
- `--async` - Execute asynchronously

**Example:**
```bash
crew coordinate "Design a new feature" --members picard,data,troi
```

**Output:**
```
🌐 Coordinating crew...

✓ Coordination initiated
Task ID: xyz-789
Members: Captain Picard, Commander Data, Counselor Troi
Status: pending
```

### `crew status [<request-id>]`

Check crew roster OR check async request status (context-dependent).

**Usage:**
```bash
# Show crew availability
crew status
crew roster              # Explicit roster view

# Check async request status
crew status <request-id> [options]
```

**Options (for requests):**
- `--json` - Output as JSON
- `--watch` - Watch for real-time updates

**Example:**
```bash
crew status a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

### `crew wait <request-id>`

Wait for an async workflow request to complete.

**Usage:**
```bash
crew wait <request-id> [options]
```

**Options:**
- `--timeout <seconds>` - Timeout in seconds (default: 300)
- `--json` - Output as JSON

**Example:**
```bash
crew wait a1b2c3d4-e5f6-7890-abcd-ef1234567890 --timeout 600

# Output waits for completion, then returns:
Status: success
Response: "Analysis of the dataset reveals..."
Cost: $0.0150
Duration: 45 seconds
```

---

## Project Commands

**Namespace:** `project <subcommand>`

The Project namespace manages software projects (features, stories, sprints).

### `project list` / `project ls`

List all projects.

**Usage:**
```bash
project list [options]
```

**Options:**
- `--json` - Output as JSON

**Output Example:**
```
📁 Projects

Name                Type              Status      Budget      Used
─────────────────────────────────────────────────────────────────
AI Dashboard        ai-assistant      active      $500.00     $127.50
Feature Platform    product-factory   active      $1000.00    $345.20
Booking System      dj-booking        completed   $300.00     $299.80
```

### `project feature <name>`

Create a new feature.

**Usage:**
```bash
project feature <name> [options]
```

**Arguments:**
- `<name>` - Feature name

**Options:**
- `--description <text>` - Feature description
- `--budget <amount>` - Budget in USD

**Example:**
```bash
project feature "Dark mode toggle" \
  --description "Add dark/light theme switching" \
  --budget 100.00
```

**Output:**
```
✨ Creating feature: Dark mode toggle

✓ Feature created
ID: feature-001
Name: Dark mode toggle
Status: draft
Budget: $100.00
```

### `project story <name>`

Create a new user story.

**Usage:**
```bash
project story <name> [options]
```

**Arguments:**
- `<name>` - Story name

**Options:**
- `--feature <id>` - Parent feature ID
- `--description <text>` - Story description
- `--acceptance <criteria>` - Acceptance criteria

**Example:**
```bash
project story "Theme selector component" \
  --feature feature-001 \
  --description "Implement theme selector in header" \
  --acceptance "User can click to toggle theme; preference persists"
```

### `project sprint <name>`

Create a new sprint.

**Usage:**
```bash
project sprint <name> [options]
```

**Arguments:**
- `<name>` - Sprint name

**Options:**
- `--duration <days>` - Sprint duration (default: 14)
- `--goal <text>` - Sprint goal

**Example:**
```bash
project sprint "Sprint 1: Foundation" \
  --duration 14 \
  --goal "Establish core architecture and theme system"
```

---

## Cost Commands

**Namespace:** `cost <subcommand>`

The Cost namespace monitors and optimizes spending (energy conservation body).

### `cost report`

Show cost summary and trends.

**Usage:**
```bash
cost report [options]
```

**Options:**
- `--period <days>` - Report period (default: 30)
- `--json` - Output as JSON

**Output Example:**
```
💰 Cost Report (Last 30 days)

Summary
  Total: $342.50
  Average/day: $11.42
  Projected/month: $342.50

By Crew Member
Member              Calls    Cost        %
─────────────────────────────────────────
Captain Picard      12       $45.60      13.3%
Commander Data      45       $89.25      26.0%
Quark               120      $18.30      5.3%
Commander Riker     8        $62.40      18.2%
...

By Model
Model                    Calls    Cost        %
───────────────────────────────────────────
claude-sonnet-4          25       $125.00     36.5%
claude-sonnet-3.5        120      $180.00     52.5%
gemini-flash-1.5         75       $15.20      4.4%
...
```

### `cost optimize <member> <task>`

Check cost optimization options for a task.

**Usage:**
```bash
cost optimize <member> <task> [options]
```

**Arguments:**
- `<member>` - Crew member to consult
- `<task>` - Task description

**Options:**
- `--json` - Output as JSON

**Output Example:**
```
🔍 Analyzing cost optimization for commander-data...

Current Option
  Member: Commander Data
  Model: claude-sonnet-3.5
  Estimated cost: $0.0085

Alternatives
Member             Model                 Est. Cost    Savings    Recommended
───────────────────────────────────────────────────────────────────────────
Chief O'Brien      gemini-flash-1.5     $0.0012      -$0.0073    ✓
Quark              gemini-flash-1.5     $0.0012      -$0.0073    ✓
Commander Riker    claude-sonnet-3.5    $0.0085      $0.0000

⚠️ Warning: Task exceeds budget
Budget: $100.00
Required: $0.0085
Remaining: $99.99
```

### `cost budget`

Manage project budgets.

**Usage:**
```bash
cost budget <subcommand> [options]
```

**Subcommands:**
- `set <project> <amount>` - Set project budget
- `view <project>` - View project budget
- `alert <project> <percent>` - Set budget alert threshold

**Example:**
```bash
cost budget set "AI Dashboard" 500.00
cost budget view "AI Dashboard"
cost budget alert "AI Dashboard" 80
```

### `cost track`

Track costs in real-time.

**Usage:**
```bash
cost track [options]
```

**Options:**
- `--interval <seconds>` - Refresh interval (default: 5)

**Output:**
```
📊 Real-time Cost Tracking

Current Rate
  Per minute: $0.0042
  Per hour: $0.252

Today
  Spent: $23.50
  Budget: $100.00
  Remaining: $76.50

Press Ctrl+C to stop
```

---

## Examples

### Example 1: Synchronous Consultation

```bash
# Ask Captain Picard for strategic advice
$ crew consult picard "What is the strategic priority for Q1?"

🤝 Consulting captain-picard...

✓ Response from Captain Picard

Based on the current market position and upcoming product launches,
I recommend prioritizing:

1. **Foundation Stability** (40% effort)
   - Consolidate existing features
   - Improve system reliability

2. **New Market Entry** (35% effort)
   - Expand to international markets
   - Localization infrastructure

3. **AI Integration** (25% effort)
   - LLM-powered features
   - Crew automation

Cost: $0.0120
```

### Example 2: Async Workflow with Polling

```bash
# Submit a long-running analysis asynchronously
$ crew consult data "Analyze 1 million user interactions" --async

⏳ Request submitted (ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890)
Use 'crew status a1b2c3d4...' to check progress

# Do other work while it processes...
$ crew cost report

# Check status
$ crew status a1b2c3d4-e5f6-7890-abcd-ef1234567890

📊 Request Status: a1b2c3d4-e5f6-7890-abcd-ef1234567890

Status: running
Polls: 3
Duration: 15 seconds

# Wait for completion
$ crew wait a1b2c3d4-e5f6-7890-abcd-ef1234567890

⏳ Waiting for request: a1b2c3d4-e5f6-7890-abcd-ef1234567890
Timeout: 300 seconds

[Waits for completion...]

Status: success
Response: "Analysis complete. Key findings:
  - 45% users prefer dark mode
  - Average session: 12.5 minutes
  - Top feature: Search (87% of sessions)
  ..."
Cost: $0.0450
Duration: 2 minutes
```

### Example 3: Project Planning

```bash
# Create a new project sprint
$ crew project sprint "Sprint 2: Dashboard Redesign" \
  --duration 14 \
  --goal "Complete dashboard redesign with dark mode"

✓ Sprint created
ID: sprint-002
Name: Sprint 2: Dashboard Redesign
Start: Feb 3, 2026
End: Feb 17, 2026

# Create features for the sprint
$ crew project feature "Dashboard Dark Mode" \
  --description "Add dark/light theme switching" \
  --budget 150.00

# Create user story
$ crew project story "Theme selector in header" \
  --feature feature-001 \
  --acceptance "User can toggle theme; preference persists in localStorage"

# Check project costs
$ crew cost report --period 7
```

### Example 4: Cost Optimization

```bash
# Check if we should use a cheaper model
$ crew cost optimize data "Analyze competitor strategies"

Current Option
  Member: Commander Data
  Model: claude-sonnet-4
  Estimated cost: $0.0240

Alternatives
  Quark (gemini-flash) costs $0.0015 (saves $0.0225)  ✓ Recommended

# Choose the recommended alternative
$ crew consult quark "Analyze competitor strategies"

✓ Response from Quark
Analysis of 5 major competitors...
Cost: $0.0015
```

---

## Troubleshooting

### Issue: "Cannot connect to MCP server"

**Cause:** MCP server not running or wrong URL

**Solution:**
```bash
# Check environment variables
echo $MCP_URL

# Start MCP server (if needed)
cd domains/alex-ai-universal/dashboard
pnpm dev

# Verify connectivity
curl http://localhost:3000/api/mcp/status
```

### Issue: "Budget exceeded"

**Cause:** Task cost exceeds available budget

**Solution:**
```bash
# Check current costs
crew cost report

# Use cheaper model
crew cost optimize picard "task"

# Set higher budget
crew cost budget set "my-project" 500.00
```

### Issue: "Request timeout"

**Cause:** Async request took too long to complete

**Solution:**
```bash
# Check if request is still running
crew status <request-id>

# Increase timeout
crew wait <request-id> --timeout 600

# Check n8n workflow status
# Visit: https://n8n.yourdomain.com/executions
```

### Issue: "Unknown crew member"

**Cause:** Incorrect crew member name

**Solution:**
```bash
# List available crew
crew roster

# Use lowercase names with proper spelling
crew consult captain-jean-luc-picard "task"   # ✓ Correct
crew consult picard "task"                    # ✓ Also works
crew consult Picard "task"                    # ✗ Wrong (case)
```

---

## Tips & Best Practices

### 1. Always Check Budget Before Large Tasks
```bash
crew cost optimize <member> "<task>"
# Review alternatives before consulting
```

### 2. Use Async for Long Tasks
```bash
# This might timeout:
crew consult data "Analyze 10TB dataset"

# Better:
crew consult data "Analyze 10TB dataset" --async
crew wait <request-id>
```

### 3. Monitor Costs Regularly
```bash
# Daily check
crew cost report --period 1

# Weekly check
crew cost report --period 7
```

### 4. Delegate to Right Crew Member
```bash
# Strategic: Use Picard
crew consult picard "Should we pivot the product?"

# Technical: Use Data or La Forge
crew consult data "How should we structure the database?"
crew consult lafarge "What infrastructure do we need?"

# Cost: Use Quark
crew consult quark "How can we reduce costs?"
```

### 5. Use JSON Output for Scripting
```bash
# Parse output in scripts
RESPONSE=$(crew consult data "task" --json)
COST=$(echo $RESPONSE | jq '.cost')
REQUEST_ID=$(echo $RESPONSE | jq '.requestId')
```

---

## Reference Links

- [Architecture Documentation](./docs/SYSTEM_OVERVIEW.md)
- [Three-Body Philosophy](./docs/THREE_BODY_PHILOSOPHY.md)
- [N8N Callback Patterns](./docs/N8N_CALLBACK_PATTERNS.md)
- [Webhook Consolidation Plan](./docs/WEBHOOK_CLIENT_CONSOLIDATION.md)
- [CLI Source Code](../apps/cli/src/)

---

**Last Updated:** 2026-02-03
**Status:** Production Ready
**Version:** 1.0.0
