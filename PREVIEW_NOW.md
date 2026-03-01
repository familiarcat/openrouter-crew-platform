# 🎬 Preview Now - Start in 30 Seconds

The fastest way to see your unified platform in action.

---

## Copy & Paste (3 commands)

```bash
# Command 1: Navigate to project
cd /Users/bradygeorgen/Dev/openrouter-crew-platform

# Command 2: Start the API server
node domains/shared/agent-memory/dist/memory-api.js

# Command 3 (in another terminal): Open dashboard
open http://localhost:3333
```

That's it. You now have the complete system running.

---

## What You'll See

### In Your Terminal
```
Memory System API Server
======================
listening on port 3333

Dashboard available at: http://localhost:3333
```

### In Your Browser
✅ Interactive dashboard with:
- Memory statistics cards
- Layer distribution breakdown
- Search and retrieval testing
- Interactive memory list
- Memory detail inspector
- Unified color scheme (blue, purple, amber, red)

---

## Try These (30 seconds each)

### 1. In the Dashboard
```
Type in the search box: "debugging"
Watch the retrieval system find ranked memories
Click any memory to see full details
```

### 2. In Terminal (new tab)
```bash
npx memory-cli stats test-project
npx memory-cli list test-project
npx memory-cli test test-project "performance issues"
```

### 3. Add Sample Data
```bash
npx memory-cli store test-project "Sample observation" layer1
npx memory-cli store test-project "Sample pattern" layer2
npx memory-cli store test-project "Sample strategy" layer3

# Watch dashboard update in real-time
```

---

## File Locations

Want to explore?

```
📦 Memory System
  └─ domains/shared/agent-memory/dist/
     ├─ index.js              (main package)
     ├─ memory-api.js         (API server)
     ├─ cli.js                (CLI tool)
     └─ dashboard.css         (design system)

📚 Documentation
  └─ /tmp/memory-docs-*/
     ├─ index.html            (interactive docs)
     ├─ dashboard.html        (standalone UI)
     └─ *.md files            (guides)

📋 Configuration
  └─ Project Root
     ├─ MEMORY_INTEGRATION.md     (integration guide)
     ├─ TESTING_AND_PREVIEW.md    (detailed testing)
     └─ LIVE_DEMO.md             (demo walkthrough)
```

---

## Keyboard Shortcuts

**Dashboard (http://localhost:3333):**
- `Ctrl+F` or `Cmd+F` — Search memories
- `Click` memory — View details
- `Esc` — Close sidebar
- `F12` — Open browser dev tools

**Terminal:**
- `Ctrl+C` — Stop API server
- `↑/↓` — Previous/next command

---

## Real Quick (60 seconds or less)

```bash
# Do all this in 60 seconds

# Terminal 1 (10s)
node domains/shared/agent-memory/dist/memory-api.js

# Wait 2 seconds

# Terminal 2 (5s)
open http://localhost:3333

# Wait for browser, then (10s)
# Type "debugging" in search box
# See results appear instantly

# Terminal 3 (15s)
npx memory-cli stats test-project

# Terminal 3 (15s)
npx memory-cli test test-project "your question here"

# Done! (20s left to explore)
```

---

## What's Running?

| Component | Status | Location |
|-----------|--------|----------|
| API Server | ✅ Running | `localhost:3333` |
| Dashboard | ✅ Available | `http://localhost:3333` |
| CLI Tool | ✅ Ready | `npx memory-cli` |
| Memory Data | ✅ In Memory | Test project |
| Design System | ✅ Active | CSS + TypeScript |

---

## Troubleshooting (if needed)

**Port 3333 already in use?**
```bash
# Kill the process
lsof -i :3333
kill -9 <PID>

# Or try different port
PORT=3334 node domains/shared/agent-memory/dist/memory-api.js
```

**Build artifacts missing?**
```bash
cd domains/shared/agent-memory
pnpm clean && pnpm build
```

**CLI tool not found?**
```bash
cd domains/shared/agent-memory
npm link  # Makes npx memory-cli available globally
```

---

## Next Steps After Preview

Once you've seen the dashboard:

1. **Integration** → Follow `MEMORY_INTEGRATION.md`
2. **Testing** → See `TESTING_AND_PREVIEW.md`
3. **Complete Demo** → Run through `LIVE_DEMO.md`
4. **Full Guide** → Read `PLATFORM_UNIFICATION.md`

---

## One Command to Preview Everything

```bash
# Terminal 1
node domains/shared/agent-memory/dist/memory-api.js &

# Terminal 2
sleep 2 && open http://localhost:3333 && npx memory-cli stats test-project
```

That's your complete preview.

---

**Time:** 30 seconds to start, 5 minutes to explore

**Status:** ✅ Everything is ready. Nothing to install or configure.

🚀 **Go to your terminal and run:**
```bash
node domains/shared/agent-memory/dist/memory-api.js
```

Then open: `http://localhost:3333`

Enjoy! 🎉
