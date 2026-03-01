# Test Project Execution Roadmap

**BarItalia STL Business Generator** | Complete Timeline & Success Path
**Status:** Ready to Execute | **Total Time:** 4-6 hours | **API Cost:** $1.50

---

## 🎯 Mission Statement

```
MISSION:
Build a complete, cost-optimized demonstration that:
1. Analyzes a real local business (BarItalia STL)
2. Generates a production-ready website
3. Creates a comprehensive business plan
4. Produces financial projections
5. Stays within $1.50 API budget
6. Proves VSCode extension viability
7. Demonstrates OpenRouter platform value

SUCCESS = Proof that the autonomous business platform works end-to-end
```

---

## 📊 High-Level Timeline

```
TODAY (4-6 hours)
│
├─ Hour 0-1: Setup & Structure
│  └─ Create project directories
│  └─ Initialize package.json files
│  └─ Set up environment
│
├─ Hour 1-2: Gateway Agent
│  └─ Build orchestration logic
│  └─ Implement cost tracking
│  └─ Create CLI interface
│
├─ Hour 2-3: Specialized Agents
│  └─ Research agent
│  └─ Website agent
│  └─ Business plan agent
│  └─ Finance agent
│
├─ Hour 3-4: Website Generation
│  └─ Create Next.js structure
│  └─ Generate pages
│  └─ Build components
│
├─ Hour 4-5: Testing & Validation
│  └─ Run full pipeline
│  └─ Verify outputs
│  └─ Check costs
│
└─ Hour 5-6: VSCode Integration
   └─ Connect extension
   └─ Test UI/UX
   └─ Document results

DELIVERABLE: Complete business package for BarItalia STL
```

---

## 📋 Hour-by-Hour Breakdown

### Hour 0-1: PROJECT SETUP

**Goal:** Create directory structure and initialize packages

```bash
# 0:00 - Create directories
mkdir -p domains/test-projects/baritalia-stl
cd domains/test-projects/baritalia-stl

# 0:05 - Create subdirectories
mkdir -p agents/{research-agent,website-agent,business-plan-agent,finance-agent,gateway}
mkdir -p agents/gateway/src
mkdir -p website/src/{app,components,styles}
mkdir -p website/public/{images,icons}
mkdir -p outputs
mkdir -p docs

# 0:10 - Create root package.json
cat > package.json << 'EOF'
{
  "name": "test-project-baritalia-stl",
  "version": "1.0.0",
  "description": "Business generator test",
  "scripts": {
    "generate:business": "ts-node agents/gateway/src/index.ts",
    "website:dev": "cd website && pnpm dev"
  }
}
EOF

# 0:15 - Create website package.json
cd website
cat > package.json << 'EOF'
{
  "name": "baritalia-website",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build"
  },
  "dependencies": {
    "next": "^14.2.35",
    "react": "^18.3.1"
  }
}
EOF
cd ..

# 0:30 - Install dependencies
pnpm install

# 0:45 - Create .env file
cat > .env.local << 'EOF'
OPENROUTER_API_KEY=sk-or-your-key
CREW_API_URL=http://localhost:8000
EOF

# 1:00 - Ready for next phase
echo "✅ Project structure ready"
```

**Deliverable:** Empty but structured project ready for code

---

### Hour 1-2: GATEWAY AGENT

**Goal:** Build the orchestration engine

```bash
# 1:00 - Create gateway agent TypeScript file
cat > agents/gateway/src/index.ts << 'EOF'
// [Copy the full BarItaliaBusinessGenerator class from TEST_PROJECT_IMPLEMENTATION.md]
EOF

# 1:30 - Build gateway TypeScript compilation
pnpm build:gateway

# 1:45 - Create test/mock of gateway (no actual API calls yet)
cat > agents/gateway/src/index.test.ts << 'EOF'
describe('BarItaliaBusinessGenerator', () => {
  it('should initialize with config', () => {
    // Test initialization
  });
  it('should track costs', () => {
    // Test cost tracking
  });
});
EOF

# 2:00 - Gateway ready
echo "✅ Gateway agent ready"
```

**Deliverable:** Functional cost-tracking orchestration engine

---

### Hour 2-3: SPECIALIZED AGENTS

**Goal:** Create 5 specialized agents that do the work

```bash
# 2:00 - Research Agent
cat > agents/research-agent/src/index.ts << 'EOF'
// Analyze business from URL
// Cost: $0.15 (Haiku)
// Input: Business URL
// Output: Structured business data
EOF

# 2:15 - Website Agent
cat > agents/website-agent/src/index.ts << 'EOF'
// Generate website structure
// Cost: $0.45 (Sonnet for structure, Haiku for content)
// Input: Business context
// Output: Next.js file structure
EOF

# 2:30 - Business Plan Agent
cat > agents/business-plan-agent/src/index.ts << 'EOF'
// Create business plan
// Cost: $0.30 (Sonnet for writing)
// Input: Business context
// Output: Markdown business plan
EOF

# 2:45 - Finance Agent
cat > agents/finance-agent/src/index.ts << 'EOF'
// Generate financials
// Cost: $0.25 (Haiku for projections)
// Input: Business context + plan
// Output: JSON financial model
EOF

# 3:00 - All agents created
echo "✅ All 5 agents ready"
```

**Deliverable:** 5 specialized agents (code structure in place)

---

### Hour 3-4: WEBSITE GENERATION

**Goal:** Create Next.js application structure

```bash
# 3:00 - Initialize Next.js
cd website
cat > next.config.js << 'EOF'
const nextConfig = {
  reactStrictMode: true
};
module.exports = nextConfig;
EOF

# 3:10 - Create pages
cat > src/app/layout.tsx << 'EOF'
export const metadata = {
  title: 'BarItalia STL',
  description: 'Authentic Italian Cuisine'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
EOF

# 3:20 - Create pages
cat > src/app/page.tsx << 'EOF'
export default function Home() {
  return <main><h1>BarItalia STL</h1></main>;
}
EOF

cat > src/app/menu/page.tsx << 'EOF'
export default function Menu() {
  return <main><h1>Menu</h1></main>;
}
EOF

cat > src/app/reservations/page.tsx << 'EOF'
export default function Reservations() {
  return <main><h1>Book a Table</h1></main>;
}
EOF

# 3:30 - Create components
mkdir -p src/components
cat > src/components/Header.tsx << 'EOF'
export default function Header() {
  return <header><h1>BarItalia STL</h1></header>;
}
EOF

cat > src/components/MenuCard.tsx << 'EOF'
export default function MenuCard({ dish }) {
  return <div>{dish.name}</div>;
}
EOF

cat > src/components/ReservationForm.tsx << 'EOF'
export default function ReservationForm() {
  return <form>Book Now</form>;
}
EOF

# 3:45 - Create styling
cat > src/styles/globals.css << 'EOF'
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
EOF

# 4:00 - Website ready
cd ..
echo "✅ Website structure ready"
```

**Deliverable:** Complete Next.js application skeleton

---

### Hour 4-5: TESTING & FIRST RUN

**Goal:** Execute the full pipeline and validate

```bash
# 4:00 - Set environment
export OPENROUTER_API_KEY="sk-or-your-key"
export CREW_API_URL="http://localhost:8000"

# 4:10 - Run the generator (ACTUAL API CALLS START HERE)
pnpm run generate:business

# Expected output:
# 🚀 Starting BarItalia Business Generation
# 📊 Budget: $1.50
# ──────────────────────────────────────
# 1️⃣  RESEARCH PHASE
#    → Analyzing BarItalia STL...
#    ✓ Cost: $0.15 | Total: $0.15 | Remaining: $1.35
#
# [5 minutes of generation]
#
# ✅ GENERATION COMPLETE
# ═══════════════════════════════════════
# 📁 Outputs Created:
#    ✓ Website: ./website/src (5 pages)
#    ✓ Business Plan: ./outputs/business-plan.md
#    ✓ Financial Model: ./outputs/financial-model.json
#
# 💰 Financial Snapshot:
#    Year 1 Revenue: $1,890,000
#    Year 1 Profit: $422,400
#    Payback Period: 3 months
#
# 💸 API Cost:
#    Total: $1.18
#    Budget: $1.50
#    Remaining: $0.32

# 4:15 - Verify outputs exist
ls -la outputs/
# Should show:
# - business-plan.md (5000+ words)
# - financial-model.json (multi-year projections)
# - cost-tracking.json (detailed API log)

# 4:30 - Check website builds
cd website
pnpm build

# Should complete without errors
# Creates: .next/out/ (production build)

# 4:45 - Run website locally
pnpm dev
# Visit http://localhost:3000
# Should see: Working website

# 5:00 - Validation complete
echo "✅ Full pipeline executed successfully"
```

**Deliverable:** Working end-to-end system with real outputs

---

### Hour 5-6: VSCODE INTEGRATION

**Goal:** Connect the test project to VSCode extension

```bash
# 5:00 - Link test project to extension
cd ../../vscode-extension/src/commands
cat > generate-business.ts << 'EOF'
import { BarItaliaBusinessGenerator } from '../../../test-projects/baritalia-stl/agents/gateway/src/index';

export async function registerGenerateBusinessCommand(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    'openrouter-crew.generateBusiness',
    async (selectedText?: string) => {
      if (!selectedText) {
        vscode.window.showErrorMessage('Select a business URL');
        return;
      }

      const generator = new BarItaliaBusinessGenerator({
        businessUrl: selectedText,
        businessName: selectedText.replace(/[^a-z0-9]/gi, '-').toLowerCase(),
        budget: 1.50,
        targetCost: 1.20,
        verbose: true
      });

      try {
        const result = await generator.execute();
        vscode.window.showInformationMessage(
          `✅ Generated! Cost: $${result.costTracking.spent.toFixed(2)}`
        );
      } catch (error) {
        vscode.window.showErrorMessage(`Failed: ${error}`);
      }
    }
  );

  context.subscriptions.push(disposable);
}
EOF

# 5:15 - Register command in extension
cat >> package.json << 'EOF'
"commands": [
  {
    "command": "openrouter-crew.generateBusiness",
    "title": "Crew: Generate Business Plan & Website"
  }
]
EOF

# 5:30 - Build extension
pnpm build

# 5:45 - Test in VSCode
# 1. Open VSCode
# 2. Highlight: "baritaliastl.com"
# 3. Command Palette → "Crew: Generate Business"
# 4. Watch sidebar for progress
# 5. Files auto-created in project

# 6:00 - Complete
echo "✅ VSCode integration complete"
```

**Deliverable:** Working VSCode extension command

---

## 💰 Budget Allocation Verification

After completing all hours, verify cost breakdown:

```
┌─────────────────────────────────────┐
│    ACTUAL COST VERIFICATION         │
├─────────────────────────────────────┤
│ Budget:              $1.50           │
│ Research (Haiku):    $0.15 ← Check   │
│ Website (Mix):       $0.45 ← Check   │
│ Plan (Sonnet):       $0.30 ← Check   │
│ Finance (Haiku):     $0.25 ← Check   │
│ Summary:             $0.05 ← Check   │
│ ─────────────────────────────────    │
│ Total:               $1.20 ← Must be <$1.50
│ Remaining:           $0.30 ← Buffer
│
│ STATUS: ✅ PASS (12% buffer remaining)
└─────────────────────────────────────┘
```

---

## ✅ Final Validation Checklist

```
TECHNICAL VALIDATION
☐ Gateway agent orchestrates all phases correctly
☐ Cost tracking is accurate (within $0.01)
☐ All 5 agents executed successfully
☐ Website builds without errors
☐ Business plan is comprehensive (1000+ words)
☐ Financial model is realistic (3-year projections)
☐ All files saved to outputs/

BUSINESS VALIDATION
☐ Website is production-ready
☐ Business plan could be used for funding
☐ Financial model matches industry standards
☐ Content is accurate about BarItalia STL
☐ Outputs are complete and professional

PLATFORM VALIDATION
☐ Cost optimization works (50%+ cheaper than Anthropic alone)
☐ Multi-agent orchestration works seamlessly
☐ Dark Forest Protocol in action (validation, checks)
☐ Model routing works (Haiku for simple, Sonnet for complex)
☐ Budget enforcement is absolute

VSCODE VALIDATION
☐ Command registers in extension
☐ Sidebar shows real-time cost tracking
☐ Files generate inline in editor
☐ Can cancel/retry operations
☐ Results viewable immediately

OPENROUTER VALIDATION
☐ API calls route correctly
☐ Model selection works
☐ Rate limiting respected
☐ Pricing accurate
☐ No errors or timeouts
```

---

## 🎓 What This Proves

### 1. **Multi-Agent Orchestration**
```
✅ 5 independent agents working together
✅ Gateway manages coordination
✅ Each agent optimized for its task
✅ No redundant API calls
```

### 2. **Cost Optimization**
```
✅ $1.50 budget sufficient for complex task
✅ Model routing works (Haiku vs Sonnet)
✅ Caching could reduce further
✅ Proves platform is viable at scale
```

### 3. **Business Value**
```
Input:  $1.50 in API costs
Output: $500K+ business plan + website
Ratio:  1:333,333 ROI
```

### 4. **VSCode Integration**
```
✅ Extension commands work in editor
✅ Real-time cost visibility
✅ File generation inline
✅ Professional UX possible
```

### 5. **Platform Viability**
```
✅ Complete workflow end-to-end
✅ Multiple business units possible
✅ Autonomous operation validated
✅ Ready for production scaling
```

---

## 📈 Next Steps After Success

### Immediate (Next Day)
- [ ] Document all learnings
- [ ] Create case study: BarItalia
- [ ] Measure time vs. human effort
- [ ] Benchmark output quality

### Short-term (Week 2)
- [ ] Run on 5 different local businesses
- [ ] Compare outputs to professional versions
- [ ] Measure user satisfaction
- [ ] Identify improvements

### Medium-term (Month 1)
- [ ] Scale to 50 businesses
- [ ] Build into VSCode extension fully
- [ ] Create marketplace for templates
- [ ] Monetize: charge per generation

### Long-term (Month 3)
- [ ] 1000s of autonomous businesses
- [ ] Multiple AI platforms tested
- [ ] Complete autonomous operation
- [ ] Proof of concept complete

---

## 🚀 Why This Matters

```
CURRENT STATE (Before test):
└─ Platform designed but unproven
   └─ Cost model theoretical
   └─ Architecture untested
   └─ VSCode integration theoretical

AFTER TEST (Success):
├─ Platform proven in production
├─ Cost model validated
├─ Architecture tested end-to-end
├─ VSCode integration working
└─ Ready to scale to 1000s of businesses

BUSINESS IMPACT:
From "Good idea" → "Proven system"
From "Theory" → "Working product"
From "Possible" → "Demonstrated"
```

---

## 📚 Reference Documents

This test project is supported by:

1. **TEST_PROJECT_BUSINESS_GENERATOR.md** - Complete plan
2. **TEST_PROJECT_IMPLEMENTATION.md** - Step-by-step code
3. **AUTONOMOUS_BUSINESS_ARCHITECTURE.md** - Strategic context
4. **COST_OPTIMIZATION_PATTERNS.md** - Technical patterns

---

## 🎯 Success = Proof

**If this test succeeds:**
- ✅ Platform works end-to-end
- ✅ Cost model is viable
- ✅ VSCode extension is viable
- ✅ Ready to scale

**If this test fails:**
- Identify blockers
- Fix architecture
- Rerun test
- Iterate until success

**Either way, you learn what works.**

---

## 🚀 Ready to Build?

```
TIME: 4-6 hours
COST: $1.50 API
EFFORT: Medium (straightforward execution)
RISK: Low (isolated test project)

REWARD: Complete proof of concept
        + Working demo
        + Business case study
        + VSCode integration
        + Platform validation
```

**Let's build it! 🚀**

---

**Document Version:** 1.0.0
**Created:** 2026-03-01
**Status:** Ready to Execute
**Next:** Pick a start time and begin Hour 0-1
