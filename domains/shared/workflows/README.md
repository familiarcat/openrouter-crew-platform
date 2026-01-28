# n8n Workflows Package

This package contains all n8n workflow definitions for the OpenRouter Crew Platform.

## Structure

```
n8n-workflows/
├── subflows/          # 8 cost optimization subflows (reusable)
├── crew/              # 10 crew member workflows
└── projects/          # Project-specific workflows
```

## Cost Optimization Pipeline (8 Subflows)

These workflows are chained together to form the complete cost optimization pipeline:

1. **01_token_cost_meter.json** - Measure tokens and estimate cost
2. **02_context_compressor.json** - Compress context to reduce tokens
3. **03_hybrid_model_router.json** - Route to cheapest viable model
4. **04_llm_executor_openrouter.json** - Execute OpenRouter API call
5. **05_budget_enforcer.json** - Block if over budget
6. **06_reflection_self_tuner.json** - Learn from historical patterns
7. **07_usage_logger.json** - Log usage to Supabase
8. **08_workflow_change_watcher.json** - Detect workflow modifications

## Crew Workflows (10 Members)

Each crew member has a dedicated workflow that:
- Receives requests via webhook
- Executes the 6-step optimization pipeline (02→03→05→04→07→06)
- Logs all usage to Supabase `llm_usage_events` table
- Returns response to caller

### Crew Members:

- **captain_picard** - Strategic leadership (premium tier)
- **commander_data** - Data analytics (standard tier)
- **commander_riker** - Tactical execution (standard tier)
- **counselor_troi** - User experience (standard tier)
- **lt_worf** - Security & compliance (standard tier)
- **dr_crusher** - System health (standard tier)
- **geordi_la_forge** - Infrastructure (standard tier)
- **lt_uhura** - Communications (standard tier)
- **chief_obrien** - Pragmatic solutions (budget tier)
- **quark** - Business intelligence (budget tier)

## Workflow Sync

### Export from n8n to git

```bash
pnpm export
```

This will:
- Fetch all workflows from n8n via API
- Save them to appropriate directories (subflows/crew/projects)
- Preserve workflow structure and configuration

### Import from git to n8n

```bash
pnpm sync
```

This will:
- Read all workflow files from this directory
- Create or update workflows in n8n
- Activate workflows if needed

## Webhook URLs

Crew member webhooks follow this pattern:
```
{N8N_BASE_URL}/webhook/crew-{member_name}
```

Example:
```
https://n8n.yourdomain.com/webhook/crew-captain-picard
https://n8n.yourdomain.com/webhook/crew-commander-data
```

## Configuration

Workflows expect these environment variables in n8n:

```bash
# OpenRouter API
OPENROUTER_API_KEY=sk-or-v1-...

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Budget Limits (optional)
DAILY_BUDGET_USD=100
MONTHLY_BUDGET_USD=1000
PER_REQUEST_LIMIT_USD=1.00
```

## Testing Workflows

Test a crew member workflow:

```bash
curl -X POST https://n8n.yourdomain.com/webhook/crew-captain-picard \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "uuid-here",
    "message": "Analyze this architecture for improvements",
    "context": {
      "code": "...",
      "language": "typescript"
    }
  }'
```

Expected response:

```json
{
  "content": "Based on my analysis...",
  "model": "anthropic/claude-sonnet-4",
  "tokens_used": 1500,
  "estimated_cost": 0.0045,
  "crew_member": "captain_picard",
  "metadata": {
    "execution_time_ms": 2500,
    "routing_mode": "premium"
  }
}
```

## Development

When creating new workflows:

1. Create in n8n UI with proper naming:
   - Subflows: `{number}_{name}.json` (e.g., `09_new_subflow.json`)
   - Crew: `crew-{member}.json` (e.g., `crew-new-member.json`)
   - Projects: `{project}-{name}.json` (e.g., `dj-booking-playlist.json`)

2. Export from n8n:
   ```bash
   pnpm export
   ```

3. Commit to git:
   ```bash
   git add packages/n8n-workflows/
   git commit -m "feat: add new workflow"
   ```

4. Deploy to production n8n:
   ```bash
   pnpm sync
   ```

## Monitoring

View workflow execution status:
- **n8n UI**: https://n8n.yourdomain.com/workflows
- **Supabase**: Query `workflow_executions` table
- **Dashboard**: http://localhost:3000 (shows real-time activity)

## Cost Tracking

All workflow executions are logged to:
- Table: `llm_usage_events`
- Real-time updates via Supabase subscriptions
- Historical analysis via `project_cost_summary` view

## Troubleshooting

**Issue**: Webhooks not responding
- Check n8n is running and accessible
- Verify webhook URLs are correct
- Check n8n logs for errors

**Issue**: Workflows not syncing
- Verify N8N_API_KEY is set
- Check N8N_BASE_URL is accessible
- Ensure workflows are active in n8n

**Issue**: High costs
- Review `project_cost_summary` view
- Check if budget enforcer is active
- Verify model routing is working (should use cheaper models when possible)

## References

- [n8n Documentation](https://docs.n8n.io/)
- [OpenRouter API](https://openrouter.ai/docs)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
