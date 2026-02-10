/**
 * Analytics Summary Command
 * Display memory analytics summary for a crew
 */

import { Command, Flags } from '@oclif/core';
import { MemoryAnalyticsService, Memory } from '@openrouter-crew/crew-api-client';

export default class AnalyticsSummary extends Command {
  static description = 'Show memory analytics summary';

  static examples = [
    '<%= config.bin %> analytics summary --crew crew_1',
    '<%= config.bin %> analytics summary --crew crew_1 --format json',
  ];

  static flags = {
    crew: Flags.string({
      char: 'c',
      description: 'Crew identifier',
      required: true,
    }),
    format: Flags.string({
      char: 'f',
      description: 'Output format',
      options: ['table', 'json', 'detailed'],
      default: 'table',
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(AnalyticsSummary);

    try {
      const analyticsService = new MemoryAnalyticsService();

      // In production, fetch memories from database
      const memories: Memory[] = [];

      if (memories.length === 0) {
        this.log(`ℹ️  No memories found for ${flags.crew}`);
        return;
      }

      const analytics = analyticsService.generateAnalytics(flags.crew, memories);

      switch (flags.format) {
        case 'json':
          this.displayJSON(analytics);
          break;

        case 'detailed':
          this.displayDetailed(analytics);
          break;

        case 'table':
        default:
          this.displaySummary(analytics);
      }
    } catch (error) {
      this.error(`Failed to generate analytics: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private displaySummary(analytics: any): void {
    this.log('\n📊 MEMORY ANALYTICS SUMMARY');
    this.log('═'.repeat(50));

    // Overview
    this.log('\n📈 Overview');
    this.log(`  Total Memories: ${analytics.totalMemories}`);
    this.log(`  Insight Confidence: ${analytics.typeDistribution.insight || 0}`);
    this.log(`  Story Count: ${analytics.typeDistribution.story || 0}`);

    // Top Topics
    if (analytics.topTopics.length > 0) {
      this.log('\n🏷️  Top Topics');
      analytics.topTopics.slice(0, 5).forEach((topic: any, idx: number) => {
        const trendIcon = topic.trend === 'emerging' ? '📈' : topic.trend === 'declining' ? '📉' : '→';
        this.log(`  ${idx + 1}. ${topic.topic} (${topic.frequency}) ${trendIcon}`);
      });
    }

    // Insights
    if (analytics.insights.length > 0) {
      this.log('\n💡 Key Insights');
      analytics.insights.slice(0, 3).forEach((insight: any) => {
        const icon = insight.type === 'warning' ? '⚠️' : insight.type === 'opportunity' ? '✨' : 'ℹ️';
        this.log(`  ${icon} ${insight.title}`);
        this.log(`     ${insight.description}`);
      });
    }

    // Retention Metrics
    this.log('\n🔒 Retention Tiers');
    this.log(`  Eternal: ${analytics.retentionMetrics.eternalCount}`);
    this.log(`  Standard: ${analytics.retentionMetrics.standardCount}`);
    this.log(`  Temporary: ${analytics.retentionMetrics.temporaryCount}`);
    this.log(`  Session: ${analytics.retentionMetrics.sessionCount}`);

    this.log('\n' + '═'.repeat(50) + '\n');
  }

  private displayDetailed(analytics: any): void {
    this.displaySummary(analytics);

    // Access Patterns
    if (analytics.accessPatterns.length > 0) {
      this.log('\n📊 Access Patterns (Top 5)');
      analytics.accessPatterns.slice(0, 5).forEach((pattern: any) => {
        this.log(`  ${pattern.memoryId}`);
        this.log(`    Accesses: ${pattern.accessCount}`);
        this.log(`    Frequency: ${pattern.accessFrequency.toFixed(2)} per day`);
        this.log(`    Trend: ${pattern.accessTrend}`);
      });
    }

    // Confidence Decay
    if (analytics.confidenceDecays.length > 0) {
      this.log('\n📉 Confidence Decay (Top 5)');
      analytics.confidenceDecays
        .sort((a: any, b: any) => (b.initialConfidence - b.currentConfidence) - (a.initialConfidence - a.currentConfidence))
        .slice(0, 5)
        .forEach((decay: any) => {
          const loss = ((decay.initialConfidence - decay.currentConfidence) * 100).toFixed(1);
          this.log(`  ${decay.memoryId}: ${decay.currentConfidence.toFixed(2)} (lost ${loss}%)`);
        });
    }
  }

  private displayJSON(analytics: any): void {
    this.log(JSON.stringify(analytics, null, 2));
  }
}
