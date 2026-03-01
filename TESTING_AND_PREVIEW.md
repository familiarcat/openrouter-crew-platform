# 🧪 Testing & Preview Guide

Complete walkthrough for previewing and testing the unified platform system.

---

## Overview

The system has 5 main components to test:

1. **Memory API Server** — REST API for memory operations
2. **Interactive Dashboard** — Web UI for visualization
3. **CLI Tool** — Command-line interface
4. **Design System** — Colors, spacing, typography consistency
5. **Integration Points** — Memory enrichment hooks

---

## 1️⃣ Start the Memory API Server

This is the backend that serves memory data and the dashboard.

```bash
# Navigate to memory package
cd domains/shared/agent-memory

# Start the API server
node dist/memory-api.js
```

**Expected Output:**
```
Memory System API Server
Port: 3333
Status: Running

API Endpoints:
GET /api/health - Health check
GET /api/memories/project/:projectId - List memories
GET /api/memories/:memoryId - Get single memory
GET /api/stats/project/:projectId - Project statistics
GET /api/retrieve?projectId=X&context=Y - Test retrieval

Dashboard: http://localhost:3333
```

### Verify Server is Running

In another terminal:
```bash
curl http://localhost:3333/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-03-01T04:17:00.000Z",
  "uptime": 2.345
}
```

---

## 2️⃣ Preview the Interactive Dashboard

Open the dashboard in your browser while the API server is running:

```bash
# In your browser, visit:
open http://localhost:3333
```

### What You Should See

**Dashboard UI with:**
- ✅ Memory statistics cards (count, edges, confidence)
- ✅ Layer distribution breakdown
- ✅ Interactive memory list
- ✅ Search/retrieval testing interface
- ✅ Memory detail sidebar
- ✅ Responsive design
- ✅ Unified color scheme (primary blue, layer colors)

### Test Dashboard Features

**1. View Statistics**
- Card showing: "42 memories", "127 edges", "73.2% avg confidence"
- Layer distribution: "Layer 1: 18, Layer 2: 12, Layer 3: 8, Layer 4: 4"

**2. Test Memory Retrieval**
- Input field: "Enter context..."
- Type: "debugging typescript errors"
- Click: "Test Retrieval"
- See: Ranked memories by relevance score

**3. Inspect Memory Details**
- Click any memory in the list
- View: Full content, confidence, activation count, tags
- See: Connected memories (edges)

**4. Verify Design System**
- Colors: Blue primary, purple layer 2, amber layer 3, red layer 4
- Spacing: Consistent padding/margins throughout
- Typography: Clear hierarchy (headers, body, labels)

---

## 3️⃣ Test the CLI Tool

The command-line interface for memory operations.

### Available Commands

**List all memories for a project:**
```bash
npx memory-cli list test-project-id
```

**Expected Output:**
```
📊 Memory List - test-project-id
═══════════════════════════════════════════════════════

Layer 1 - Observations (18 memories)
┌─ ID: 550e8400-e29b-41d4-a716-446655440000
│  Title: Debugging TypeScript strict mode errors
│  Confidence: 0.87
│  Activated: 3 times
│  Tags: typescript, debugging, errors
└─ ...

Layer 2 - Patterns (12 memories)
┌─ ID: 550e8400-e29b-41d4-a716-446655440001
│  Title: Pattern: Recursive type definitions fail with circular refs
│  Confidence: 0.74
└─ ...

Layer 3 - Strategies (8 memories)
Layer 4 - Institutional Knowledge (4 memories)
```

**Show project statistics:**
```bash
npx memory-cli stats test-project-id
```

**Expected Output:**
```
📈 Memory Statistics - test-project-id
═══════════════════════════════════════════════════════

Nodes by Layer:
  Layer 1 (Observations):        18 nodes  (avg confidence: 0.73)
  Layer 2 (Patterns):            12 nodes  (avg confidence: 0.68)
  Layer 3 (Strategies):           8 nodes  (avg confidence: 0.82)
  Layer 4 (Institutional):        4 nodes  (avg confidence: 0.91)

Total Edges:                      127
Average Edge Weight:              0.56

Retention Tiers:
  Eternal:                        2 nodes
  Standard:                       32 nodes
  Temporary:                      6 nodes
  Session:                        2 nodes

Recent Activation: 2 hours ago
```

**Test retrieval with custom context:**
```bash
npx memory-cli test test-project-id "I'm debugging a React hook that's not re-rendering when state changes"
```

**Expected Output:**
```
🔍 Memory Retrieval Test
═══════════════════════════════════════════════════════
Context: "I'm debugging a React hook that's not re-rendering..."

Ranked Memories:
1. [Layer 3 - Strategy] Memoization pattern for preventing re-renders (0.87)
2. [Layer 2 - Pattern] useCallback dependency array issues (0.74)
3. [Layer 1 - Observation] Found stale closure in hook dependencies (0.65)
4. [Layer 3 - Strategy] UseEffect cleanup pattern (0.62)

Retrieved 4 relevant memories in 12ms
```

**Show memory details:**
```bash
npx memory-cli show 550e8400-e29b-41d4-a716-446655440000
```

---

## 4️⃣ Test the Design System

Verify that design tokens are consistent across all interfaces.

### HTML/CSS Testing

**Test CSS variables in a file:**
```bash
cat > /tmp/test-design.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="/Users/bradygeorgen/Dev/openrouter-crew-platform/domains/shared/agent-memory/dist/dashboard.css">
  <style>
    body { padding: var(--spacing-xl); }
    .card {
      background: var(--color-primary-50);
      border: 2px solid var(--color-primary-500);
      padding: var(--spacing-lg);
      border-radius: 8px;
    }
    .layer-1 { color: var(--color-layer-1-text); background: var(--color-layer-1-bg); }
    .layer-2 { color: var(--color-layer-2-text); background: var(--color-layer-2-bg); }
    .layer-3 { color: var(--color-layer-3-text); background: var(--color-layer-3-bg); }
    .layer-4 { color: var(--color-layer-4-text); background: var(--color-layer-4-bg); }
  </style>
</head>
<body>
  <div class="card">
    <h1>Design System Test</h1>
    <div class="layer-1">Layer 1 - Blue</div>
    <div class="layer-2">Layer 2 - Purple</div>
    <div class="layer-3">Layer 3 - Amber</div>
    <div class="layer-4">Layer 4 - Red</div>
  </div>
</body>
</html>
EOF
open /tmp/test-design.html
```

**Verify:**
- ✅ Layer 1 is blue (#3b82f6)
- ✅ Layer 2 is purple (#a855f7)
- ✅ Layer 3 is amber (#f59e0b)
- ✅ Layer 4 is red (#ef4444)
- ✅ Spacing is consistent

### React/TypeScript Testing

**Test TypeScript token imports:**
```bash
cat > /tmp/test-design.ts << 'EOF'
import { colors, spacing, typography } from '/Users/bradygeorgen/Dev/openrouter-crew-platform/domains/shared/agent-memory/dist/index.js';

// Test colors
console.log('Primary Blue:', colors.primary[500]);      // #3b82f6
console.log('Layer 1 Blue:', colors.layer[1].bg);       // #dbeafe
console.log('Layer 2 Purple:', colors.layer[2].bg);     // #e9d5ff

// Test spacing
console.log('Large padding:', spacing.lg);              // 16px
console.log('Extra large padding:', spacing.xl);        // 24px

// Test typography
console.log('Base font size:', typography.fontSize.base); // 13px
console.log('Bold weight:', typography.fontWeight.bold);   // 700

console.log('✅ All tokens imported successfully!');
EOF
node /tmp/test-design.ts
```

**Expected Output:**
```
Primary Blue: #3b82f6
Layer 1 Blue: #dbeafe
Layer 2 Purple: #e9d5ff
Large padding: 16px
Extra large padding: 24px
Base font size: 13px
Bold weight: 700
✅ All tokens imported successfully!
```

---

## 5️⃣ Test Integration Points

These are the hooks where the memory system integrates with CrewCoordinator.

### 5A. Memory Retrieval Hook

**Test retrieving memories before a crew call:**

```typescript
// Simulated CrewCoordinator integration
import { createMemoryService } from '@openrouter-crew/agent-memory';

const memoryService = createMemoryService(supabaseClient); // Mock client

// Simulate a crew request
const crewRequest = {
  projectId: 'test-project-id',
  crewMember: 'architect',
  message: 'Design a caching strategy for our API endpoints'
};

// Test memory enrichment
const { enrichedMessage, contextId } = await memoryService.retrieve({
  projectId: crewRequest.projectId,
  context: crewRequest.message,
  requestingCrewId: crewRequest.crewMember
});

console.log('✅ Retrieval successful');
console.log('Context ID:', contextId);
console.log('Original message:', crewRequest.message);
console.log('Enriched message:', enrichedMessage);
// Should show memory context prepended to message
```

### 5B. Outcome Reporting Hook

**Test capturing outcomes:**

```typescript
// After crew member responds
const response = {
  crewMember: 'architect',
  content: 'Use Redis with 24-hour TTL for API responses',
  success: true
};

// Report outcome
await memoryService.reportOutcome({
  sessionId: 'session-12345',
  activatedNodeIds: ['memory-1', 'memory-2'],
  outcome: response.success ? 'success' : 'failure',
  outcomeDelta: response.success ? 0.05 : -0.10,
  crewMember: response.crewMember
});

console.log('✅ Outcome reported');
// This updates memory confidence weights
```

### 5C. Memory Storage Hook

**Test storing crew responses as observations:**

```typescript
// Store response as Layer 1 observation
await memoryService.store({
  crewId: response.crewMember,
  layer: 1,
  content: response.content,
  summary: 'Redis caching strategy for API endpoints',
  retentionTier: 'standard',
  projectId: crewRequest.projectId,
  tags: ['caching', 'redis', 'api']
});

console.log('✅ Memory stored');
// Should be retrievable in future requests
```

---

## 6️⃣ End-to-End Flow Test

Complete workflow from request to response to learning:

```bash
# 1. Start API server
node domains/shared/agent-memory/dist/memory-api.js &

# 2. In another terminal, view current state
npx memory-cli stats test-project-id

# 3. Test retrieval before any memories
npx memory-cli test test-project-id "debugging issue"

# 4. Simulate storing a response
npx memory-cli store test-project-id "Resolved by checking error logs" layer1

# 5. View updated statistics
npx memory-cli stats test-project-id

# 6. Open dashboard to see new memory
open http://localhost:3333

# 7. Search for the stored memory
# In dashboard, type: "error logs" → should find your memory
```

---

## 7️⃣ Performance Testing

Verify the system performs well under load.

### Test Retrieval Speed

```bash
# Test with 1000 memories
for i in {1..1000}; do
  npx memory-cli store test-project "Memory $i" layer1 &
done

# Then test retrieval speed
time npx memory-cli test test-project "performance test"
```

**Expected Performance:**
- Retrieval: < 100ms
- Ranking: < 50ms
- Total: < 150ms

### Test Memory Growth

```bash
# Monitor memory usage
watch -n 1 'du -sh domains/shared/agent-memory/dist/'

# As you add memories, check database size
# Each memory: ~200 bytes
# 10k memories: ~2MB
```

---

## 8️⃣ API Testing

Direct HTTP testing of the API.

### Health Check
```bash
curl http://localhost:3333/api/health
```

### List Memories
```bash
curl http://localhost:3333/api/memories/project/test-project-id
```

### Get Statistics
```bash
curl http://localhost:3333/api/stats/project/test-project-id
```

### Test Retrieval
```bash
curl "http://localhost:3333/api/retrieve?projectId=test-project-id&context=debugging%20errors"
```

### Get Single Memory
```bash
curl http://localhost:3333/api/memories/550e8400-e29b-41d4-a716-446655440000
```

---

## 📋 Complete Testing Checklist

### Memory System
- [ ] API server starts without errors
- [ ] Health check endpoint responds
- [ ] Database connection successful
- [ ] Memory CRUD operations work

### Dashboard
- [ ] Loads at localhost:3333
- [ ] Statistics cards display correctly
- [ ] Memory list is interactive
- [ ] Search/retrieval works
- [ ] Memory details sidebar opens
- [ ] Responsive on mobile

### CLI Tool
- [ ] List command shows memories
- [ ] Stats command displays metrics
- [ ] Test command performs retrieval
- [ ] Show command displays details
- [ ] Debug command provides info

### Design System
- [ ] CSS variables work in HTML
- [ ] TypeScript tokens import successfully
- [ ] Colors render correctly
- [ ] Spacing is consistent
- [ ] Typography hierarchy works
- [ ] Layer colors differentiate properly

### Integration
- [ ] Retrieval hook works
- [ ] Outcome reporting works
- [ ] Memory storage works
- [ ] Confidence weights update
- [ ] Memories are retrievable next call

### Performance
- [ ] Retrieval < 150ms
- [ ] Dashboard loads < 2s
- [ ] CLI tool responds < 500ms
- [ ] No memory leaks on long runs

---

## 🎯 Demo Scenario

**Run this complete scenario to showcase the system:**

```bash
# 1. Start server
node domains/shared/agent-memory/dist/memory-api.js &
echo "Server running at http://localhost:3333"

# 2. Open dashboard
sleep 2 && open http://localhost:3333

# 3. In another terminal, add sample memories
npx memory-cli store test-project "React hooks require dependency arrays" layer2
npx memory-cli store test-project "useState with objects causes re-renders" layer1
npx memory-cli store test-project "useMemo optimizes expensive calculations" layer3

# 4. Show statistics
echo "=== Memory System Statistics ==="
npx memory-cli stats test-project

# 5. Test retrieval
echo "=== Testing Retrieval ==="
npx memory-cli test test-project "Why is my React component re-rendering?"

# 6. Show individual memory
echo "=== Memory Details ==="
npx memory-cli list test-project
```

---

## ✅ Success Criteria

Your system is working correctly when:

✅ **API Server**
- Starts without errors
- Responds to health check
- Serves memory data

✅ **Dashboard**
- Loads and displays data
- Interactive and responsive
- Shows correct colors and spacing

✅ **CLI Tool**
- All commands execute successfully
- Output is formatted correctly
- Retrieval returns ranked results

✅ **Design System**
- Colors consistent across interfaces
- Spacing uniform
- Typography hierarchy clear

✅ **Integration**
- Memory enrichment works
- Outcomes update weights
- Retrieval improves over time

---

## 🐛 Troubleshooting

### API Server Won't Start

```bash
# Check if port 3333 is in use
lsof -i :3333

# Kill existing process
kill -9 <PID>

# Try different port
PORT=3334 node dist/memory-api.js
```

### CLI Tool Errors

```bash
# Verify build
pnpm build

# Check if dist/ exists
ls dist/

# Try with full path
node dist/cli.js list test-project
```

### Dashboard Shows No Data

```bash
# Check API is running
curl http://localhost:3333/api/health

# Check network tab in browser (F12)
# Should see successful API calls
```

### Design System Colors Wrong

```bash
# Check CSS file exists
ls dist/dashboard.css

# Verify colors in source
grep "color-primary-500" dist/dashboard.css

# Rebuild if needed
pnpm clean && pnpm build
```

---

## 📊 Suggested Test Data

To test with realistic data:

```bash
# Create test project with 50 memories
for i in {1..50}; do
  layer=$((RANDOM % 4 + 1))
  npx memory-cli store test-project "Memory description $i" layer$layer
done

# Verify distribution
npx memory-cli stats test-project
```

---

## Next Steps

After testing:

1. ✅ Verify all components work
2. ✅ Test with your crew system
3. ✅ Monitor performance
4. ✅ Adjust retention tiers if needed
5. ✅ Deploy to production

---

**Ready to test?** Start with:
```bash
node domains/shared/agent-memory/dist/memory-api.js
```

Then open: `http://localhost:3333`
