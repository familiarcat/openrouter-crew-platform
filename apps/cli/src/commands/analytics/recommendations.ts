/**
 * Analytics Recommendations Command
 * Get top recommended memories based on importance
 */

import { Command, Flags } from '@oclif/core';
import { MemoryAnalyticsService, Memory } from '@openrouter-crew/crew-api-client';
import * as Table from 'cli-table3';

export default class AnalyticsRecommendations extends Command {
  static description = 'Get top recommended memories for a crew';

  static examples = [
    '<%= config.bin %> analytics recommendations --crew crew_1',
    '<%= config.bin %> analytics recommendations --crew crew_1 --limit 20',
    '<%= config.bin %> analytics recommendations --crew crew_1 --format json',
  ];

  static flags = {
    crew: Flags.string({
      char: 'c',
      description: 'Crew identifier',
      required: true,
    }),
    limit: Flags.integer({
      char: 'l',
      description: 'Number of recommendations',
      default: 10,
    }),
    format: Flags.string({
      char: 'f',
      description: 'Output format',
      options: ['table', 'json', 'list'],
      default: 'table',
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(AnalyticsRecommendations);

    try {
      const analyticsService = new MemoryAnalyticsService();

      // In production, fetch memories from database
      const memories: Memory[] = [];

      if (memories.length === 0) {
        this.log(`ℹ️  No memories found for ${flags.crew}`);
        return;
      }

      const recommendations = analyticsService.getTopRecommendations(memories, flags.limit);

      switch (flags.format) {
        case 'json':
          this.displayJSON(recommendations);
          break;

        case 'list':
          this.displayList(recommendations);
          break;

        case 'table':
        default:
          this.displayTable(recommendations);
      }
    } catch (error) {
      this.error(`Failed to get recommendations: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private displayTable(recommendations: any[]): void {
    this.log('\n📊 TOP MEMORY RECOMMENDATIONS');
    this.log('═'.repeat(70));

    const table = new Table({
      head: ['Rank', 'Memory ID', 'Type', 'Score', 'Confidence', 'Actions'],
      style: { head: [], border: ['cyan'] },
      colWidths: [6, 20, 12, 8, 12, 15],
    });

    recommendations.forEach((rec, idx) => {
      const score = (rec.recommendationScore).toFixed(0);
      const scoreBar = this.getScoreBar(rec.recommendationScore);
      table.push([
        String(idx + 1),
        rec.memory.id.substring(0, 15),
        rec.memory.type,
        `${score}% ${scoreBar}`,
        `${(rec.memory.confidence_level * 100).toFixed(0)}%`,
        '▶ View',
      ]);
    });

    this.log(table.toString());
    this.log('═'.repeat(70) + '\n');
  }

  private displayList(recommendations: any[]): void {
    this.log('\n📌 TOP RECOMMENDATIONS\n');

    recommendations.forEach((rec, idx) => {
      const scoreEmoji =
        rec.recommendationScore >= 80 ? '⭐⭐⭐' :
        rec.recommendationScore >= 60 ? '⭐⭐' :
        '⭐';

      this.log(`${idx + 1}. ${rec.memory.id}`);
      this.log(`   Type: ${rec.memory.type}`);
      this.log(`   Score: ${rec.recommendationScore.toFixed(0)}/100 ${scoreEmoji}`);
      this.log(`   Confidence: ${(rec.memory.confidence_level * 100).toFixed(0)}%`);
      this.log('');
    });
  }

  private displayJSON(recommendations: any[]): void {
    this.log(JSON.stringify(recommendations, null, 2));
  }

  private getScoreBar(score: number): string {
    const filled = Math.round((score / 100) * 10);
    const empty = 10 - filled;
    const color = score >= 80 ? '\x1b[32m' : score >= 60 ? '\x1b[33m' : '\x1b[31m';
    return `${color}${'█'.repeat(filled)}${'\x1b[0m'}${' '.repeat(empty)}`;
  }
}
