# 🎬 Live Demo - 5 Minute Walkthrough

Complete visual walkthrough of the unified platform system.

---

## 🚀 Quick Start (Copy & Paste)

```bash
# Step 1: Start the API server
node domains/shared/agent-memory/dist/memory-api.js
```

**Expected output:**
```
Memory System API Server
======================
listening on port 3333

Endpoints:
  GET /api/health
  GET /api/memories/project/:projectId
  GET /api/stats/project/:projectId
  GET /api/retrieve?projectId=X&context=Y

Dashboard available at: http://localhost:3333
```

---

## 📊 Part 1: Dashboard Demo (2 minutes)

### Open the Dashboard
```bash
# In another terminal
open http://localhost:3333
```

### What You'll See

**Top Section - Statistics Cards:**
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  📊 42 Memories    │    🔗 127 Edges    │  73.2% Avg  │
│                                                     │
│  Layer Distribution:                                │
│  Layer 1: 18  │  Layer 2: 12  │  Layer 3: 8  │ L4: 4 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Middle Section - Memory List:**
```
┌─ [Layer 1 - Observation] ────────────────────────────┐
│ │ Found: React useState with objects causes re-renders
│ │ Confidence: 0.87 | Activated: 3x | 2h ago
│ └──────────────────────────────────────────────────
│
├─ [Layer 2 - Pattern] ────────────────────────────────┐
│ │ Pattern: Memoization prevents unnecessary updates
│ │ Confidence: 0.74 | Activated: 5x | 4h ago
│ └──────────────────────────────────────────────────
│
└─ [Layer 3 - Strategy] ───────────────────────────────┐
  │ Strategy: Use React.memo for expensive components
  │ Confidence: 0.82 | Activated: 2x | 1h ago
  └──────────────────────────────────────────────────
```

**Right Section - Search:**
```
Test Retrieval
──────────────────────────
[Search box: "Enter context..."]

Results for "debugging React hooks":
1. [Layer 3] Strategy: useMemo optimizes... (0.89)
2. [Layer 2] Pattern: Dependencies array... (0.76)
3. [Layer 1] Observation: Found issue in... (0.65)
```

### Color Legend
- 🔵 **Blue**: Layer 1 - Raw observations
- 🟣 **Purple**: Layer 2 - Detected patterns
- 🟠 **Amber**: Layer 3 - Successful strategies
- 🔴 **Red**: Layer 4 - Institutional knowledge

### Try These in the Dashboard

1. **Click a memory** → See details in sidebar
2. **Type in search** → Watch retrieval work
3. **Scroll** → See responsive design
4. **Refresh (F5)** → Verifies persistence

---

## 🖥️ Part 2: CLI Tool Demo (2 minutes)

Keep the API server running, open a new terminal.

### Command 1: List Memories

```bash
npx memory-cli list test-project
```

**Output:**
```
📊 Memory List - test-project
════════════════════════════════════════════════════════

Layer 1 - Observations (18 memories)
─────────────────────────────────────
┌─ ID: 550e8400-e29b-41d4-a716-446655440000
│  Title: Found: React hooks require dependency arrays
│  Confidence: ████████░ 0.87
│  Activated: 3 times
│  Tags: react, hooks, javascript
└─ Edges: 5 connections

┌─ ID: 550e8400-e29b-41d4-a716-446655440001
│  Title: Bug: useState with objects causes re-renders
│  Confidence: ████████░ 0.82
│  Activated: 5 times
│  Tags: react, state, performance
└─ Edges: 3 connections

[... more memories ...]

Layer 2 - Patterns (12 memories)
Layer 3 - Strategies (8 memories)
Layer 4 - Institutional Knowledge (4 memories)
```

### Command 2: Show Statistics

```bash
npx memory-cli stats test-project
```

**Output:**
```
📈 Memory Statistics - test-project
════════════════════════════════════════════════════════

Nodes by Layer:
  Layer 1 (Observations):        18 nodes  ████████░ 73%
  Layer 2 (Patterns):            12 nodes  ██████░░░ 48%
  Layer 3 (Strategies):           8 nodes  ███████░░ 68%
  Layer 4 (Institutional):        4 nodes  █████████ 91%

Connectivity:
  Total Edges:                    127
  Average Degree:                 6.4
  Average Edge Weight:            0.56

Retention Distribution:
  Eternal:       ██░░░░░░░  2 nodes (4.2%)
  Standard:      ███████░░░ 32 nodes (66.7%)
  Temporary:     ██░░░░░░░░ 6 nodes (12.5%)
  Session:       █░░░░░░░░░ 2 nodes (4.2%)

Last Activation:     2 hours ago
Average Confidence:  0.734
```

### Command 3: Test Retrieval

```bash
npx memory-cli test test-project "Why is my React component re-rendering too much?"
```

**Output:**
```
🔍 Memory Retrieval Test
════════════════════════════════════════════════════════
Context: "Why is my React component re-rendering too much?"

Search Strategy:
  Keywords: [react, component, re-rendering, performance]
  Intent: debugging
  Domain: javascript

Ranked Results:
──────────────────────────────────────────────────────

1️⃣  [Layer 3 - Strategy] ▰▰▰▰▰▰▰▰▰░ 0.89
    "Memoization pattern for preventing re-renders"
    → Use React.memo for expensive components

2️⃣  [Layer 2 - Pattern] ▰▰▰▰▰▰▰░░░ 0.76
    "useState with objects causes re-renders"
    → Objects are recreated on each render

3️⃣  [Layer 3 - Strategy] ▰▰▰▰▰▰░░░░ 0.71
    "useMemo optimizes expensive calculations"
    → Cache computed values between renders

4️⃣  [Layer 1 - Observation] ▰▰▰▰▰░░░░░ 0.65
    "Dependency array issues in useCallback"
    → Missing dependencies trigger re-renders

Retrieved 4 relevant memories in 12ms ✓
```

### Command 4: Show Memory Details

```bash
npx memory-cli show 550e8400-e29b-41d4-a716-446655440000
```

**Output:**
```
📋 Memory Details
════════════════════════════════════════════════════════

ID:              550e8400-e29b-41d4-a716-446655440000
Layer:           1 (Observation)
Type:            Bug Finding
Status:          Active

Content:
  "Found: useState with objects causes re-renders because
   the object reference changes on each render, triggering
   dependent hooks"

Summary:
  "setState with objects recreates reference on each render"

Metadata:
  Created:       2026-02-28 10:45:23 UTC
  Last Seen:     2026-03-01 02:15:07 UTC
  Activated:     5 times
  Confidence:    ▰▰▰▰▰▰▰▰░░ 0.82

Tags:
  #react  #state  #performance  #bug

Retention:
  Tier:          standard
  Expires:       2026-05-31 (91 days)
  Decay Rate:    0.001/day

Connected Memories:
  ↔ (0.78) Pattern: Objects vs primitives in useState
  ↔ (0.65) Strategy: Use useCallback for stable references
  ↔ (0.55) Observation: Debugging tools show re-renders

Activity Timeline:
  2026-03-01 02:15 - Activated in conversation about performance
  2026-03-01 00:30 - Used in memory-enriched crew request
  2026-02-28 14:22 - Stored by architecture crew member
```

---

## 🎨 Part 3: Design System Demo (1 minute)

### Visual Consistency Check

Open the documentation/dashboard HTML and verify:

**Color Consistency:**
```
┌──────────────────────────────────────────────────────┐
│ Primary Colors                                       │
├──────────────────────────────────────────────────────┤
│ ████ #3b82f6 Primary Blue (buttons, links)          │
│ ████ #2563eb Dark Blue (hover states)                │
│ ████ #eff6ff Light Blue (backgrounds)                │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│ Layer Colors                                         │
├──────────────────────────────────────────────────────┤
│ ████ #dbeafe Layer 1 Blue (observations)            │
│ ████ #e9d5ff Layer 2 Purple (patterns)              │
│ ████ #fed7aa Layer 3 Amber (strategies)             │
│ ████ #fecaca Layer 4 Red (institutional)            │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│ Spacing Scale                                        │
├──────────────────────────────────────────────────────┤
│ ░░░░░░░░░░ 4px  (xs)   - tight spacing              │
│ ░░░░░░░░░░░░░░░░ 8px  (sm)   - compact spacing       │
│ ░░░░░░░░░░░░░░░░░░░░░░ 12px (md)  - normal spacing   │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 16px (lg)  - loose spacing   │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 24px (xl)  - wide spacing │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│ Typography Scale                                     │
├──────────────────────────────────────────────────────┤
│ Heading 1:    24px, Bold (700)      ← Large titles   │
│ Heading 2:    20px, Semibold (600)  ← Section heads  │
│ Body:         13px, Normal (400)    ← Main content   │
│ Label:        12px, Medium (500)    ← Field labels   │
│ Caption:      11px, Normal (400)    ← Hints/meta     │
└──────────────────────────────────────────────────────┘
```

### Verify in Browser

1. **Inspect element (F12)** → Check computed colors
2. **Device toolbar** → Test responsive design
3. **Light theme** → Verify readability
4. **Different screens** → Check mobile layout

---

## 🔄 Part 4: Complete Integration Flow (Bonus)

### Simulate Real Crew Interaction

**Terminal 1: Start Server**
```bash
node domains/shared/agent-memory/dist/memory-api.js
```

**Terminal 2: Simulate Crew Request → Memory Enrichment**
```bash
# Store initial context
npx memory-cli store project-1 "API timeout issues in production" layer1

# Check before retrieval
echo "=== Before enrichment ==="
npx memory-cli test project-1 "Why is the API slow?"

# This simulates: CrewCoordinator gets memory context before calling crew member
```

**Terminal 3: Dashboard Observation**
```bash
# In browser, open http://localhost:3333
# Watch as memory count updates

# In terminal, add more memories
npx memory-cli store project-1 "Cache layer added (Redis)" layer2
npx memory-cli store project-1 "Improved response times by 80%" layer3

# Dashboard updates in real-time
```

**Simulate Outcome Reporting**
```bash
# Show success outcome
npx memory-cli stats project-1
# Notice: confidence of memories increased (success outcome)

# Show failure outcome
npx memory-cli stats project-1
# Notice: confidence might decrease if bad outcomes reported
```

---

## 📱 Responsive Design Demo

Test the design system on different screen sizes:

### Desktop (1920px)
```
┌─────────────────────────────────────────────────┐
│ Stats Cards (4 columns)                         │
│ Memory List (full width)                        │
│ Search Box (top right)                          │
│ Sidebar (right, wide)                           │
└─────────────────────────────────────────────────┘
```

### Tablet (768px)
```
┌──────────────────────┐
│ Stats Cards (2 cols) │
│ Memory List (full)   │
│ Search (below list)  │
│ Sidebar (below)      │
└──────────────────────┘
```

### Mobile (375px)
```
┌─────────────────┐
│ Stats (stacked) │
│ Memory List     │
│ Search          │
│ Sidebar (scroll)│
└─────────────────┘
```

---

## ✅ Demonstration Checklist

As you run through the demo, check off:

- [ ] **API Server** starts without errors
- [ ] **Dashboard** loads and displays data
- [ ] **Colors** are correct (blue, purple, amber, red)
- [ ] **Memory List** is interactive
- [ ] **Search** retrieves ranked results
- [ ] **CLI commands** execute successfully
- [ ] **Statistics** show correct counts
- [ ] **Memory Details** display complete info
- [ ] **Design System** is consistent everywhere
- [ ] **Responsive design** works on all sizes

---

## 🎯 What This Demonstrates

This demo shows:

1. ✅ **Memory System Works** — Stores and retrieves memories
2. ✅ **Visualization Works** — Dashboard and CLI display data
3. ✅ **Design System Works** — Colors, spacing, typography consistent
4. ✅ **API Works** — REST endpoints respond correctly
5. ✅ **Integration Ready** — Can be connected to CrewCoordinator

---

## 📸 Expected Visual Output

### Dashboard Screenshot Description
```
┌─ Header ──────────────────────────────────────────────┐
│ 🧠 Memory System Dashboard                    [ ⚙️ ]  │
├───────────────────────────────────────────────────────┤
│                                                       │
│  Stats:  📊 42  |  🔗 127  |  📈 73%                 │
│                                                       │
│  Layers: Layer1: 18 | Layer2: 12 | Layer3: 8 | L4: 4 │
│                                                       │
├───────────────────────────────────────────────────────┤
│ Memory List                      │ Details        Search│
├───────────────────────────────────┤──────────────────────┤
│ ✓ Layer 1: Observation A          │ Confidence: 87%     │
│ ✓ Layer 2: Pattern B              │ Edges: 5            │
│ ✓ Layer 3: Strategy C             │ Tags: react, hooks  │
│ ✓ Layer 1: Observation D          │ [         Search   ]│
│ ✓ Layer 4: Institutional E        │ Results: 4 ranked  │
│                                   │                     │
└───────────────────────────────────────────────────────┘
```

### CLI Output Style
```
🎯 Command Status
✓ Retrieved 42 memories
✓ Found 127 connections
✓ Ranked 4 results (12ms)
✓ Average confidence: 0.73
```

---

## 🎬 Screen Recording Script

If recording a video demo:

```
1. Start server (5 seconds)
2. Open dashboard (5 seconds)
3. Scroll through list (10 seconds)
4. Test search (10 seconds)
5. Click memory details (10 seconds)
6. Show CLI commands (15 seconds)
7. Test retrieval (10 seconds)
8. Show statistics (10 seconds)

Total: ~90 seconds for complete demo
```

---

## 🚀 Ready to Demo?

### Start Here:
```bash
# Terminal 1
node domains/shared/agent-memory/dist/memory-api.js

# Terminal 2 (wait 2 seconds)
open http://localhost:3333

# Terminal 3 (wait 2 seconds)
npx memory-cli stats test-project
```

**That's it!** You now have a complete, working demo of the unified platform.

---

**Time to run complete demo:** 5 minutes
**Minimum to show system works:** 2 minutes
**Deep dive with all features:** 10 minutes

Choose your demo depth based on your audience! 🎬
