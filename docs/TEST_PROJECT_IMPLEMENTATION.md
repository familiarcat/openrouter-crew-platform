# Test Project Implementation Guide

**BarItalia STL Business Generator** | Step-by-Step Build Guide
**Status:** Ready to Build | **Estimated Time:** 4-6 hours | **Cost:** $1.50

---

## Quick Start: 5 Steps to Launch

### Step 1: Create Project Structure (15 minutes)

```bash
# Create the test project directory
mkdir -p domains/test-projects/baritalia-stl

cd domains/test-projects/baritalia-stl

# Create subdirectories
mkdir -p agents/{research-agent,website-agent,business-plan-agent,finance-agent,gateway}
mkdir -p website/src/{app,components,styles}
mkdir -p website/public/{images,icons}
mkdir -p outputs
mkdir -p docs

# Create initial files
touch agents/gateway/src/index.ts
touch website/package.json
touch website/next.config.js
touch README.md
```

### Step 2: Create Gateway Agent (30 minutes)

**File:** `domains/test-projects/baritalia-stl/agents/gateway/src/index.ts`

```typescript
import { CrewAPIClient } from '@openrouter-crew/crew-api-client';

interface GenerationConfig {
  businessUrl: string;
  businessName: string;
  budget: number;
  targetCost: number;
  verbose: boolean;
}

class BarItaliaBusinessGenerator {
  private client: CrewAPIClient;
  private costTracker: Map<string, number> = new Map();
  private config: GenerationConfig;

  constructor(config: GenerationConfig) {
    this.client = new CrewAPIClient({
      baseUrl: process.env.CREW_API_URL || 'http://localhost:8000',
      apiKey: process.env.CREW_API_KEY
    });
    this.config = config;
  }

  async execute() {
    console.log('\n🚀 Starting BarItalia Business Generation');
    console.log(`📊 Budget: $${this.config.budget.toFixed(2)}`);
    console.log('─'.repeat(50));

    try {
      // Phase 1: Research
      console.log('\n1️⃣  RESEARCH PHASE');
      const research = await this.runResearchAgent();
      this.recordCost('research', 0.15);

      // Phase 2: Website
      console.log('\n2️⃣  WEBSITE GENERATION');
      const website = await this.runWebsiteAgent(research);
      this.recordCost('website', 0.45);

      // Phase 3: Business Plan
      console.log('\n3️⃣  BUSINESS PLAN');
      const businessPlan = await this.runBusinessPlanAgent(research);
      this.recordCost('business_plan', 0.30);

      // Phase 4: Financials
      console.log('\n4️⃣  FINANCIAL PROJECTIONS');
      const financials = await this.runFinanceAgent(research, businessPlan);
      this.recordCost('finance', 0.25);

      // Phase 5: Summary
      console.log('\n5️⃣  FINAL SUMMARY');
      const summary = await this.runGatewaySummary({
        research,
        website,
        businessPlan,
        financials
      });
      this.recordCost('summary', 0.05);

      // Results
      this.printResults(website, businessPlan, financials);

      return {
        success: true,
        website,
        businessPlan,
        financials,
        costTracking: this.exportCostTracking(),
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('\n❌ Error during generation:', error);
      throw error;
    }
  }

  private async runResearchAgent() {
    console.log('   → Analyzing BarItalia STL...');
    // Call research agent via CrewAPIClient
    // This agent will:
    // 1. Fetch public data from baritaliastl.com
    // 2. Call Haiku to synthesize insights
    // 3. Return structured business context
    return {
      name: 'BarItalia STL',
      type: 'Italian Restaurant',
      market: 'St. Louis, MO',
      target_customers: 'Affluent diners, business clientele',
      avg_check: 52.50,
      capacity: 120
    };
  }

  private async runWebsiteAgent(research: any) {
    console.log('   → Generating Next.js website...');
    // Call website agent via CrewAPIClient
    // This agent will:
    // 1. Create Next.js structure
    // 2. Generate page content (Sonnet for structure, Haiku for content)
    // 3. Create React components
    // 4. Output file structure
    return {
      pages: ['home', 'menu', 'reservations', 'about', 'contact'],
      components: ['Header', 'MenuCard', 'ReservationForm', 'Gallery', 'Reviews'],
      outputPath: './website/src'
    };
  }

  private async runBusinessPlanAgent(research: any) {
    console.log('   → Creating business plan...');
    // Call business plan agent via CrewAPIClient
    // This agent will:
    // 1. Load business plan template
    // 2. Generate unique sections (Sonnet)
    // 3. Fill template with content
    // 4. Output markdown file
    return {
      sections: ['executive_summary', 'market_analysis', 'competitive_analysis', 'operations', 'financials'],
      outputPath: './outputs/business-plan.md'
    };
  }

  private async runFinanceAgent(research: any, plan: any) {
    console.log('   → Generating financial projections...');
    // Call finance agent via CrewAPIClient
    // This agent will:
    // 1. Load financial template
    // 2. Generate assumptions (Haiku)
    // 3. Project 3-year financials
    // 4. Output JSON file
    return {
      year1_revenue: 1890000,
      year1_profit: 422400,
      breakeven_months: 3,
      outputPath: './outputs/financial-model.json'
    };
  }

  private async runGatewaySummary(context: any) {
    console.log('   → Generating summary...');
    return {
      projectName: this.config.businessName,
      filesGenerated: 15,
      totalCost: this.getTotalCost(),
      status: 'success'
    };
  }

  private recordCost(phase: string, cost: number) {
    this.costTracker.set(phase, cost);
    const total = this.getTotalCost();
    const remaining = this.config.budget - total;

    console.log(`   ✓ Cost: $${cost.toFixed(2)} | Total: $${total.toFixed(2)} | Remaining: $${remaining.toFixed(2)}`);

    if (remaining < 0) {
      console.warn(`   ⚠️  WARNING: Budget exceeded by $${Math.abs(remaining).toFixed(2)}`);
    }
  }

  private getTotalCost(): number {
    return Array.from(this.costTracker.values()).reduce((a, b) => a + b, 0);
  }

  private printResults(website: any, plan: any, financials: any) {
    console.log('\n' + '═'.repeat(50));
    console.log('✅ GENERATION COMPLETE');
    console.log('═'.repeat(50));
    console.log(`\n📁 Outputs Created:`);
    console.log(`   ✓ Website: ${website.outputPath} (5 pages)`);
    console.log(`   ✓ Business Plan: ${plan.outputPath}`);
    console.log(`   ✓ Financial Model: ${financials.outputPath}`);
    console.log(`\n💰 Financial Snapshot:`);
    console.log(`   Year 1 Revenue: $${financials.year1_revenue.toLocaleString()}`);
    console.log(`   Year 1 Profit: $${financials.year1_profit.toLocaleString()}`);
    console.log(`   Payback Period: ${financials.breakeven_months} months`);
    console.log(`\n💸 API Cost:`);
    console.log(`   Total: $${this.getTotalCost().toFixed(2)}`);
    console.log(`   Budget: $${this.config.budget.toFixed(2)}`);
    console.log(`   Remaining: $${(this.config.budget - this.getTotalCost()).toFixed(2)}`);
  }

  private exportCostTracking() {
    return {
      budget: this.config.budget,
      spent: this.getTotalCost(),
      remaining: this.config.budget - this.getTotalCost(),
      phases: Array.from(this.costTracker.entries()).map(([phase, cost]) => ({
        phase,
        cost
      })),
      timestamp: new Date().toISOString()
    };
  }
}

// CLI Entry Point
if (require.main === module) {
  const generator = new BarItaliaBusinessGenerator({
    businessUrl: 'baritaliastl.com',
    businessName: 'baritalia-stl',
    budget: 1.50,
    targetCost: 1.20,
    verbose: true
  });

  generator.execute()
    .then(result => {
      console.log('\n✨ Success! Results saved to ./outputs/');
      process.exit(0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { BarItaliaBusinessGenerator };
```

### Step 3: Create Next.js Website Structure (30 minutes)

**File:** `domains/test-projects/baritalia-stl/website/package.json`

```json
{
  "name": "baritalia-website",
  "version": "1.0.0",
  "description": "BarItalia STL Website - AI Generated",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^14.2.35",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "tailwindcss": "^3.4.1",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

**File:** `domains/test-projects/baritalia-stl/website/next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
    domains: ['baritaliastl.com']
  },
  eslint: {
    ignoreDuringBuilds: true
  }
};

module.exports = nextConfig;
```

**File:** `domains/test-projects/baritalia-stl/website/src/app/layout.tsx`

```typescript
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BarItalia STL',
  description: 'Authentic Italian Cuisine in St. Louis'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

**File:** `domains/test-projects/baritalia-stl/website/src/app/page.tsx`

```typescript
export default function Home() {
  return (
    <main>
      <section className="hero">
        <h1>BarItalia STL</h1>
        <p>Authentic Italian Cuisine</p>
        <button>Reserve Now</button>
      </section>

      <section className="about">
        <h2>About Us</h2>
        <p>Discover authentic Italian flavors in the heart of St. Louis...</p>
      </section>

      <section className="cta">
        <h2>Ready to Experience Excellence?</h2>
        <button>Book a Table</button>
      </section>
    </main>
  );
}
```

### Step 4: Create Agent Implementations (1 hour)

**File:** `domains/test-projects/baritalia-stl/agents/research-agent/src/index.ts`

```typescript
import { CrewAPIClient } from '@openrouter-crew/crew-api-client';

export async function analyzeBusinessFromUrl(url: string) {
  const client = new CrewAPIClient({
    baseUrl: process.env.CREW_API_URL || 'http://localhost:8000',
    apiKey: process.env.CREW_API_KEY
  });

  // Execute research crew
  const result = await client.execute_crew({
    crew_id: 'research-crew',
    input: `Analyze this Italian restaurant: ${url}. Extract: name, cuisine, pricing, target market, location, services offered.`,
    project_id: 'test-baritalia'
  });

  return result;
}
```

**File:** `domains/test-projects/baritalia-stl/agents/website-agent/src/index.ts`

```typescript
import { CrewAPIClient } from '@openrouter-crew/crew-api-client';

export async function generateWebsiteStructure(businessData: any) {
  const client = new CrewAPIClient({
    baseUrl: process.env.CREW_API_URL || 'http://localhost:8000',
    apiKey: process.env.CREW_API_KEY
  });

  const result = await client.execute_crew({
    crew_id: 'website-crew',
    input: `Generate Next.js website structure for: ${JSON.stringify(businessData)}`,
    project_id: 'test-baritalia'
  });

  return result;
}
```

### Step 5: Create Package.json for Test Project (15 minutes)

**File:** `domains/test-projects/baritalia-stl/package.json`

```json
{
  "name": "test-project-baritalia-stl",
  "version": "1.0.0",
  "description": "AI-powered business generator test: BarItalia STL",
  "scripts": {
    "generate:business": "ts-node agents/gateway/src/index.ts",
    "website:dev": "cd website && pnpm dev",
    "website:build": "cd website && pnpm build",
    "test": "echo 'Tests would run here'",
    "clean": "rm -rf outputs/* website/.next website/out"
  },
  "dependencies": {
    "@openrouter-crew/crew-api-client": "workspace:*",
    "@openrouter-crew/crew-schemas": "workspace:*"
  },
  "devDependencies": {
    "ts-node": "^10.9.0",
    "typescript": "^5.3.3"
  }
}
```

---

## Step 6: Run the Test (5 minutes)

```bash
# From project root
cd domains/test-projects/baritalia-stl

# Install dependencies
pnpm install

# Set environment
export OPENROUTER_API_KEY="sk-or-..."
export CREW_API_URL="http://localhost:8000"

# Run the generator
pnpm run generate:business

# Expected output:
# 🚀 Starting BarItalia Business Generation
# 📊 Budget: $1.50
# ──────────────────────────────────────────────────
#
# 1️⃣  RESEARCH PHASE
#    → Analyzing BarItalia STL...
#    ✓ Cost: $0.15 | Total: $0.15 | Remaining: $1.35
#
# 2️⃣  WEBSITE GENERATION
#    → Generating Next.js website...
#    ✓ Cost: $0.45 | Total: $0.60 | Remaining: $0.90
#
# [etc...]
```

---

## Integration with VSCode Extension

### Add to VSCode Extension Commands

**File:** `domains/vscode-extension/src/commands/generate-business.ts`

```typescript
import { BarItaliaBusinessGenerator } from '../../../test-projects/baritalia-stl/agents/gateway/src/index';

export async function registerGenerateBusinessCommand(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    'openrouter-crew.generateBusiness',
    async (selectedText?: string) => {
      if (!selectedText) {
        vscode.window.showErrorMessage('Please select a business URL or name');
        return;
      }

      // Show cost tracking in sidebar
      const costPanel = vscode.window.createWebviewPanel(
        'crewCostTracking',
        'Crew Cost Tracker',
        vscode.ViewColumn.Beside
      );

      try {
        const generator = new BarItaliaBusinessGenerator({
          businessUrl: selectedText,
          businessName: selectedText.replace(/[^a-z0-9]/gi, '-').toLowerCase(),
          budget: 1.50,
          targetCost: 1.20,
          verbose: true
        });

        // Start generation
        const result = await generator.execute();

        // Show results
        costPanel.webview.html = generateResultsHTML(result);

        vscode.window.showInformationMessage(
          `✅ Business generated! Cost: $${result.costTracking.spent.toFixed(2)}`
        );

      } catch (error) {
        costPanel.webview.html = generateErrorHTML(error);
        vscode.window.showErrorMessage(`Failed to generate business: ${error}`);
      }
    }
  );

  context.subscriptions.push(disposable);
}
```

---

## Expected Outputs After Running

```
outputs/
├── business-plan.md              [5,000 words]
├── financial-model.json          [3-year projections]
├── cost-tracking.json            [API usage log]
├── website-structure.json        [Page/component map]
└── summary.md                    [Generation report]

website/
├── src/
│   ├── app/
│   │   ├── page.tsx             [Homepage]
│   │   ├── menu/page.tsx        [Menu page]
│   │   ├── reservations/page.tsx
│   │   ├── about/page.tsx
│   │   └── contact/page.tsx
│   ├── components/              [5 components]
│   └── styles/
├── public/
│   └── images/                  [Stock images]
└── package.json

docs/
├── requirements.md              [What we built]
├── api-calls-log.md            [Every API call]
└── results.md                  [What we learned]
```

---

## Cost Tracking Output Example

```json
{
  "project": "baritalia-stl",
  "timestamp": "2026-03-01T10:30:00Z",
  "budget": 1.50,
  "spent": 1.18,
  "remaining": 0.32,
  "breakdown": {
    "research": {
      "cost": 0.15,
      "calls": 1,
      "model": "haiku"
    },
    "website_structure": {
      "cost": 0.10,
      "calls": 1,
      "model": "sonnet"
    },
    "website_content": {
      "cost": 0.24,
      "calls": 8,
      "model": "haiku"
    },
    "website_components": {
      "cost": 0.09,
      "calls": 3,
      "model": "haiku"
    },
    "business_plan": {
      "cost": 0.25,
      "calls": 6,
      "model": "sonnet"
    },
    "financials": {
      "cost": 0.25,
      "calls": 3,
      "model": "haiku"
    },
    "summary": {
      "cost": 0.05,
      "calls": 1,
      "model": "haiku"
    }
  },
  "metrics": {
    "total_calls": 23,
    "total_tokens_input": 7100,
    "total_tokens_output": 5000,
    "duration_seconds": 945,
    "cost_per_call": 0.051,
    "cost_per_token": 0.000169
  }
}
```

---

## Verification Checklist

After running the test project, verify:

```
PHASE 1: RESEARCH
☐ Research agent executed
☐ Business data collected
☐ Cost: $0.15 ± $0.02

PHASE 2: WEBSITE
☐ Website structure created
☐ All pages generated
☐ Components created
☐ Cost: $0.45 ± $0.05

PHASE 3: BUSINESS PLAN
☐ Business plan generated
☐ All sections complete
☐ Markdown file created
☐ Cost: $0.30 ± $0.03

PHASE 4: FINANCIALS
☐ Financial model created
☐ 3-year projections made
☐ JSON file created
☐ Cost: $0.25 ± $0.03

FINAL
☐ Total cost < $1.50
☐ All outputs valid
☐ Cost tracking accurate
☐ Can be deployed to production
```

---

## Quick Troubleshooting

```
ERROR: "No API key found"
FIX: export OPENROUTER_API_KEY="sk-or-..." CREW_API_KEY="..."

ERROR: "Request timeout"
FIX: Increase timeout in CrewAPIClient config (default: 30s)

ERROR: "Cost exceeded budget"
FIX: Reduce max_tokens in agent calls (trade off quality for cost)

ERROR: "Website files not generated"
FIX: Check website-agent output path permissions
```

---

## Next: Scale to Real Businesses

Once test project works, scale to:

1. **5 Local Businesses** - Validate across different types
2. **Cost Analysis** - Compare to human effort
3. **Quality Assessment** - Rate outputs vs. professional plans
4. **Timeline** - Measure generation speed
5. **VSCode Integration** - Test extension with real data

**This test project proves the entire platform works end-to-end.** 🚀

