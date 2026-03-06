# Universal Memory - Quick Reference Card

## 🚀 To Get Started

```bash
# 1. Run setup (follow prompts for Supabase credentials)
bash scripts/system/setup-universal-memory.sh

# 2. Build
pnpm build

# 3. Start everything
pnpm dev:universal
```

Opens:
- Dashboards: http://localhost:3000-3004
- VSCode: F5 (debug mode)
- All connected to: **https://your-project.supabase.co**

---

## 📝 Create a Memory (Developer)

**In VSCode while extension is running:**
```
Command Palette (Cmd+Shift+P) → "Create Memory"
Type your insight → Press Enter
```

Memory types:
- `decision` - Architecture choice
- `blocker` - Problem encountered
- `insight` - Performance discovery
- `lesson` - What to avoid
- `best_practice` - Reusable pattern

Instantly visible to:
- ✅ Other developers (VSCode sidebar)
- ✅ Agents (for autonomous execution)
- ✅ Management (web dashboard)

---

## 🔄 The Three Tiers

| Tier | What They Do | Memories Created |
|------|--------------|-----------------|
| **Developer** | Write code locally | decision, blocker, insight, lesson, best_practice |
| **Agent** | Execute autonomously | task_completion, cost_analysis, resource_allocation, autonomous_decision |
| **Management** | Strategic guidance | strategic_decision, business_alignment, resource_constraint, executive_directive |

**All access the same Supabase** → Unified organizational knowledge

---

## 📊 Key Commands

```bash
# Start everything connected to universal Supabase
pnpm dev:universal

# Start individual dashboards
pnpm dev:unified      # localhost:3000
pnpm dev:alex         # localhost:3003
pnpm dev:dj           # localhost:3002
pnpm dev:factory      # localhost:3004

# For detailed setup guide
cat SETUP_UNIVERSAL_MEMORY_NOW.md

# For architecture details
cat UNIVERSAL_MEMORY_SETUP.md

# For strategic overview
cat UNIVERSAL_MEMORY_SUMMARY.md
```

---

## ✨ What Changes?

### Before (Isolated)
```
Your Machine
├── Local Dashboard
├── Local Supabase
└── Your memories only
    (agents can't see them)
    (management has no visibility)
```

### After (Universal)
```
Your Machine                     Remote Supabase
├── Dashboard ─┐                 (Shared Hub)
├── VSCode ────┼──→ https://your-project.supabase.co ←─┬─ Other Devs
└── Extension ─┘                                         ├─ Agents
                                                        └─ Management
```

---

## 🎯 Workflow Example

**Day 1:**
```
You: Discover JWT bug
VSCode: Create Memory "JWT rotation broken"
```

**Day 2:**
```
Agent: Reads your memory
n8n: "Oh, JWT issue. Let me fix RLS policies"
n8n: Records outcome memory
```

**Day 3:**
```
Management: Sees both your discovery + agent's solution
Dashboard: "Infrastructure is bottleneck"
Strategic Memory: "Prioritize security this sprint"
```

**Day 4:**
```
You: See management priority, align work
Close the loop → Organization learns
```

All in **shared Supabase** → true alignment.

---

## 🔐 Security

Memories are stored in **your Supabase project**, not public. Control who has access via Supabase RLS policies.

Sensitive memories (board decisions):
```
Optional: Mark as restricted_audience: ["management"]
```

---

## 📋 Files You'll Use

| File | Purpose |
|------|---------|
| `SETUP_UNIVERSAL_MEMORY_NOW.md` | Step-by-step setup guide |
| `UNIVERSAL_MEMORY_QUICKSTART.md` | 5-minute overview |
| `UNIVERSAL_MEMORY_SETUP.md` | Complete architecture |
| `UNIVERSAL_MEMORY_SUMMARY.md` | Strategic overview |
| `scripts/system/setup-universal-memory.sh` | Automated setup |

---

## ✅ Success Looks Like

- [ ] Dashboard loads (localhost:3000)
- [ ] VSCode extension loads (F5)
- [ ] Can create memory in VSCode
- [ ] Memory appears in dashboard
- [ ] All 4 dashboards work
- [ ] No errors in browser console

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| "Can't connect to Supabase" | Check URL/keys in .env.local |
| "Memory not appearing" | Rebuild: `pnpm build` then `pnpm dev:universal` |
| "VSCode extension won't start" | F5 to debug, check console for errors |
| "Dashboards won't load" | Check .env files exist in each directory |

---

## 📚 Learn More

Read in this order:
1. This file (quick reference) ← You are here
2. `SETUP_UNIVERSAL_MEMORY_NOW.md` ← Next: Setup
3. `UNIVERSAL_MEMORY_QUICKSTART.md` ← How to use
4. `UNIVERSAL_MEMORY_SETUP.md` ← Deep dive
5. `UNIVERSAL_MEMORY_SUMMARY.md` ← Strategic context

---

## 🎬 Next Step

```bash
bash scripts/system/setup-universal-memory.sh
```

Enter your Supabase credentials and follow prompts.

Then:
```bash
pnpm build && pnpm dev:universal
```

Done! Your organization now has **unified, shared memories** across all tiers.

