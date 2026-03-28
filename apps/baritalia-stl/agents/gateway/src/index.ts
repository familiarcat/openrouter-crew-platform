import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// CONFIGURATION & TYPES
// ============================================================================

interface GeneratorConfig {
  businessUrl: string;
  businessName: string;
  budget: number;
  targetCost: number;
  verbose: boolean;
}

interface CostTrackingEntry {
  phase: string;
  model: 'haiku' | 'sonnet' | 'opus';
  inputTokens: number;
  outputTokens: number;
  cost: number;
  timestamp: string;
}

interface GenerationResult {
  success: boolean;
  businessData: any;
  website: string;
  businessPlan: string;
  financialModel: any;
  costTracking: {
    budget: number;
    spent: number;
    remaining: number;
    entries: CostTrackingEntry[];
  };
}

// ============================================================================
// MODEL PRICING CONFIGURATION
// ============================================================================

const MODEL_PRICING = {
  haiku: {
    inputPer1kTokens: 0.8,      // $0.80 per 1M input tokens = $0.0008 per 1K
    outputPer1kTokens: 4.0,     // $4 per 1M output tokens = $0.004 per 1K
    name: 'claude-3.5-haiku'
  },
  sonnet: {
    inputPer1kTokens: 3,        // $3 per 1M = $0.003 per 1K
    outputPer1kTokens: 15,      // $15 per 1M = $0.015 per 1K
    name: 'claude-3.5-sonnet'
  },
  opus: {
    inputPer1kTokens: 15,       // $15 per 1M = $0.015 per 1K
    outputPer1kTokens: 75,      // $75 per 1M = $0.075 per 1K
    name: 'claude-3-opus'
  }
};

// ============================================================================
// BARITALIA BUSINESS GENERATOR
// ============================================================================

class BarItaliaBusinessGenerator {
  private config: GeneratorConfig;
  private costTracking: CostTrackingEntry[] = [];
  private totalSpent: number = 0;
  private businessData: any = null;
  private businessPlan: string = '';
  private financialModel: any = null;

  constructor(config: GeneratorConfig) {
    this.config = config;
    this.log(`🚀 Initializing BarItalia Business Generator`);
    this.log(`📊 Budget: $${config.budget}`);
    this.log(`🎯 Target Cost: $${config.targetCost}`);
  }

  // ========================================================================
  // LOGGING & FORMATTING
  // ========================================================================

  private log(message: string): void {
    if (this.config.verbose) {
      console.log(message);
    }
  }

  private formatCost(dollars: number): string {
    return `$${dollars.toFixed(2)}`;
  }

  private calculateCost(model: 'haiku' | 'sonnet' | 'opus', inputTokens: number, outputTokens: number): number {
    const pricing = MODEL_PRICING[model];
    const inputCost = (inputTokens / 1000) * pricing.inputPer1kTokens / 1000;
    const outputCost = (outputTokens / 1000) * pricing.outputPer1kTokens / 1000;
    return inputCost + outputCost;
  }

  private trackCost(phase: string, model: 'haiku' | 'sonnet' | 'opus', inputTokens: number, outputTokens: number): void {
    const cost = this.calculateCost(model, inputTokens, outputTokens);
    this.totalSpent += cost;
    this.costTracking.push({
      phase,
      model,
      inputTokens,
      outputTokens,
      cost,
      timestamp: new Date().toISOString()
    });

    const remaining = this.config.budget - this.totalSpent;
    this.log(`   ✓ Cost: ${this.formatCost(cost)} | Total: ${this.formatCost(this.totalSpent)} | Remaining: ${this.formatCost(remaining)}`);

    if (this.totalSpent > this.config.budget) {
      this.log(`   ⚠️  WARNING: Budget exceeded!`);
    }
  }

  // ========================================================================
  // API CALLS (MOCK/REAL)
  // ========================================================================

  private async callApi(
    phase: string,
    model: 'haiku' | 'sonnet' | 'opus',
    prompt: string,
    expectedTokens: { input: number; output: number }
  ): Promise<string> {
    this.log(`\n   📡 API Call to ${MODEL_PRICING[model].name}`);

    // Check budget before making call
    const estimatedCost = this.calculateCost(model, expectedTokens.input, expectedTokens.output);
    if (this.totalSpent + estimatedCost > this.config.budget) {
      this.log(`   ❌ Budget exceeded. Cannot proceed with call.`);
      throw new Error(`Budget exceeded: estimated $${(this.totalSpent + estimatedCost).toFixed(2)} > $${this.config.budget}`);
    }

    // In production, this would call OpenRouter API
    // For now, we'll use mock data to demonstrate the flow
    const mockResponse = await this.getMockResponse(phase, model);

    // Track the cost
    this.trackCost(phase, model, expectedTokens.input, expectedTokens.output);

    return mockResponse;
  }

  private async getMockResponse(phase: string, model: 'haiku' | 'sonnet' | 'opus'): Promise<string> {
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 100));

    const responses: Record<string, Record<string, string>> = {
      'research': {
        'haiku': JSON.stringify({
          businessName: 'BarItalia STL',
          type: 'Italian Restaurant',
          location: 'St. Louis, MO',
          cuisine: 'Authentic Italian',
          establishedYear: 2015,
          keyOfferings: ['Pasta', 'Risotto', 'Wood-fired Pizza'],
          targetMarket: 'Italian food enthusiasts, upscale dining',
          avgPrice: '$45-75 per person',
          reviews: 4.7,
          strengths: ['Quality ingredients', 'Authentic recipes', 'Professional service'],
          opportunities: ['Online ordering', 'Catering', 'Private events']
        })
      },
      'website-structure': {
        'sonnet': JSON.stringify({
          pages: ['Home', 'Menu', 'Reservations', 'About', 'Contact'],
          components: ['Header', 'MenuCard', 'ReservationForm', 'GalleryCarousel', 'ReviewsSection'],
          styling: 'Tailwind CSS with Italian color palette (red, gold, cream)'
        })
      },
      'website-content': {
        'haiku': 'Generated content for website section'
      },
      'business-plan': {
        'sonnet': `# BarItalia STL Business Plan

## Executive Summary
BarItalia STL is a high-end Italian restaurant in St. Louis offering authentic Italian cuisine.
The business demonstrates strong market demand with 4.7-star reviews and consistent customer base.

## Market Analysis
- St. Louis Italian restaurant market: Growing demand for authentic cuisine
- Target market: Affluent professionals aged 35-65
- Market size: ~2.5M potential customers in metro area
- Growth rate: 8% annually in upscale dining

## Financial Projections
- Year 1 Revenue: $1,890,000
- Year 1 Profit: $422,400
- Break-even: 3 months
- Operating margin: 22.4%

## Strategic Recommendations
1. Implement online reservation system
2. Expand catering services (high margin)
3. Launch wine club membership program
4. Develop corporate event packages`
      },
      'financial-model': {
        'haiku': JSON.stringify({
          baseCase: {
            year1: { revenue: 1890000, cogs: 567000, operatingExpenses: 900600, profit: 422400 },
            year2: { revenue: 2268000, cogs: 680400, operatingExpenses: 1080720, profit: 506880 },
            year3: { revenue: 2721600, cogs: 816480, operatingExpenses: 1296864, profit: 608256 }
          },
          conservativeCase: {
            year1: { revenue: 1417500, cogs: 425250, operatingExpenses: 708750, profit: 283500 }
          },
          optimisticCase: {
            year1: { revenue: 2362500, cogs: 708750, operatingExpenses: 1181250, profit: 472500 }
          },
          metrics: {
            paybackPeriod: '3 months',
            roiYear1: '95%',
            roiYear3: '270%'
          }
        })
      }
    };

    return responses[phase]?.[model] || 'Mock response';
  }

  // ========================================================================
  // GENERATION PHASES
  // ========================================================================

  async executePhase1Research(): Promise<void> {
    this.log('\n1️⃣  RESEARCH PHASE');
    this.log('   → Analyzing business from web...');

    const response = await this.callApi('research', 'haiku',
      `Analyze the business at ${this.config.businessUrl}`,
      { input: 100, output: 500 }
    );

    this.businessData = JSON.parse(response);
    this.log(`   ✓ Business data captured`);
  }

  async executePhase2Website(): Promise<void> {
    this.log('\n2️⃣  WEBSITE GENERATION PHASE');

    // Step 1: Website structure
    this.log('   → Generating website structure...');
    const structureResponse = await this.callApi('website-structure', 'sonnet',
      `Generate Next.js structure for ${this.businessData.businessName}`,
      { input: 300, output: 800 }
    );

    const structure = JSON.parse(structureResponse);
    this.log(`   ✓ Structure: ${structure.pages.join(', ')}`);

    // Step 2: Generate pages and components (using Haiku for efficiency)
    for (const page of structure.pages) {
      this.log(`   → Generating page: ${page}`);
      await this.callApi(`website-content-${page}`, 'haiku',
        `Generate content for ${page} page`,
        { input: 150, output: 300 }
      );
    }

    for (const component of structure.components) {
      this.log(`   → Generating component: ${component}`);
      await this.callApi(`website-component-${component}`, 'haiku',
        `Generate React component: ${component}`,
        { input: 150, output: 250 }
      );
    }

    this.log(`   ✓ Website structure complete`);
  }

  async executePhase3BusinessPlan(): Promise<void> {
    this.log('\n3️⃣  BUSINESS PLAN PHASE');
    this.log('   → Creating comprehensive business plan...');

    const response = await this.callApi('business-plan', 'sonnet',
      `Create detailed business plan for ${this.businessData.businessName}`,
      { input: 400, output: 2000 }
    );

    this.businessPlan = response;
    this.log(`   ✓ Business plan generated (${response.split('\n').length} lines)`);
  }

  async executePhase4Finance(): Promise<void> {
    this.log('\n4️⃣  FINANCIAL MODEL PHASE');
    this.log('   → Building financial projections...');

    const response = await this.callApi('financial-model', 'haiku',
      `Generate 3-year financial model for ${this.businessData.businessName}`,
      { input: 200, output: 1000 }
    );

    this.financialModel = JSON.parse(response);
    this.log(`   ✓ Financial model complete`);
  }

  async executePhase5Summary(): Promise<void> {
    this.log('\n5️⃣  SUMMARY PHASE');
    this.log('   → Creating executive summary...');

    await this.callApi('summary', 'haiku',
      `Summarize results for ${this.businessData.businessName}`,
      { input: 100, output: 200 }
    );

    this.log(`   ✓ Summary generated`);
  }

  // ========================================================================
  // OUTPUT GENERATION
  // ========================================================================

  private ensureOutputDir(): void {
    const outputDir = path.join(process.cwd(), 'outputs');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  }

  private saveOutputs(): void {
    this.ensureOutputDir();
    const outputDir = path.join(process.cwd(), 'outputs');

    // Save business plan
    fs.writeFileSync(
      path.join(outputDir, 'business-plan.md'),
      this.businessPlan || ''
    );

    // Save financial model
    fs.writeFileSync(
      path.join(outputDir, 'financial-model.json'),
      JSON.stringify(this.financialModel, null, 2)
    );

    // Save cost tracking
    fs.writeFileSync(
      path.join(outputDir, 'cost-tracking.json'),
      JSON.stringify({
        budget: this.config.budget,
        spent: this.totalSpent,
        remaining: this.config.budget - this.totalSpent,
        entries: this.costTracking,
        summary: {
          totalCalls: this.costTracking.length,
          totalTokens: this.costTracking.reduce((sum, e) => sum + e.inputTokens + e.outputTokens, 0),
          averageCostPerCall: this.totalSpent / this.costTracking.length,
          percentOfBudget: ((this.totalSpent / this.config.budget) * 100).toFixed(2) + '%'
        }
      }, null, 2)
    );

    this.log(`\n   ✓ Cost Tracking: ./outputs/cost-tracking.json`);
    this.log(`   ✓ Business Plan: ./outputs/business-plan.md`);
    this.log(`   ✓ Financial Model: ./outputs/financial-model.json`);
  }

  // ========================================================================
  // MAIN EXECUTION
  // ========================================================================

  async execute(): Promise<GenerationResult> {
    const startTime = Date.now();

    try {
      console.log('\n═══════════════════════════════════════════════════════════════');
      console.log('🚀 Starting BarItalia Business Generation');
      console.log('═══════════════════════════════════════════════════════════════');

      await this.executePhase1Research();
      await this.executePhase2Website();
      await this.executePhase3BusinessPlan();
      await this.executePhase4Finance();
      await this.executePhase5Summary();

      this.saveOutputs();

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);

      console.log('\n✅ GENERATION COMPLETE');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log(`📁 Outputs Created in ./outputs/`);
      console.log(`⏱️  Duration: ${duration} seconds`);
      console.log(`💰 API Cost: ${this.formatCost(this.totalSpent)} / ${this.formatCost(this.config.budget)}`);
      console.log(`📊 Remaining Budget: ${this.formatCost(this.config.budget - this.totalSpent)}`);
      console.log('═══════════════════════════════════════════════════════════════\n');

      return {
        success: true,
        businessData: this.businessData,
        website: 'Generated in ./website/src',
        businessPlan: 'outputs/business-plan.md',
        financialModel: this.financialModel,
        costTracking: {
          budget: this.config.budget,
          spent: this.totalSpent,
          remaining: this.config.budget - this.totalSpent,
          entries: this.costTracking
        }
      };
    } catch (error) {
      console.error('\n❌ GENERATION FAILED');
      console.error(error);
      throw error;
    }
  }
}

// ============================================================================
// CLI EXECUTION
// ============================================================================

async function main() {
  const config: GeneratorConfig = {
    businessUrl: process.env.BUSINESS_URL || 'https://baritaliastl.com',
    businessName: process.env.BUSINESS_NAME || 'BarItalia STL',
    budget: parseFloat(process.env.BUDGET || '1.50'),
    targetCost: parseFloat(process.env.TARGET_COST || '1.20'),
    verbose: process.env.VERBOSE === 'true'
  };

  const generator = new BarItaliaBusinessGenerator(config);

  try {
    const result = await generator.execute();
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { BarItaliaBusinessGenerator };
