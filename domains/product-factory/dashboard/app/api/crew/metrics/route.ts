/**
 * Crew Metrics API
 * Tracks token usage, costs, and collaboration effectiveness
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir } from 'fs/promises';
import path from 'path';

const METRICS_FILE = path.join(process.cwd(), 'data', 'crew-metrics.json');

interface CrewMetric {
  timestamp: string;
  projectId: string;
  domainSlug: string;
  crew: string[];
  tokenUsage: {
    total: number;
    perCrew: number;
    breakdown?: Record<string, number>;
  };
  cost: number;
  progressDelta: number;
  insights: string[];
  models: Record<string, string>;
}

/**
 * POST /api/crew/metrics - Save collaboration metrics
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const metric: CrewMetric = body.metrics;

    // Load existing metrics
    let metrics: CrewMetric[] = [];
    try {
      const content = await readFile(METRICS_FILE, 'utf-8');
      metrics = JSON.parse(content);
    } catch {
      // File doesn't exist, create it
      await mkdir(path.dirname(METRICS_FILE), { recursive: true });
    }

    // Add new metric
    metrics.push(metric);

    // Save
    await writeFile(METRICS_FILE, JSON.stringify(metrics, null, 2));

    return NextResponse.json({
      success: true,
      metricsCount: metrics.length,
    });
  } catch (error) {
    console.error('Error saving crew metrics:', error);
    return NextResponse.json(
      { error: 'Failed to save metrics' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/crew/metrics - Get metrics with analytics
 */
export async function GET() {
  try {
    const content = await readFile(METRICS_FILE, 'utf-8');
    const metrics: CrewMetric[] = JSON.parse(content);

    // Calculate analytics
    const totalCost = metrics.reduce((sum, m) => sum + m.cost, 0);
    const totalTokens = metrics.reduce((sum, m) => sum + m.tokenUsage.total, 0);
    const avgCost = totalCost / metrics.length;
    const avgTokens = totalTokens / metrics.length;

    // Crew usage stats
    const crewUsage: Record<string, number> = {};
    for (const metric of metrics) {
      for (const crewId of metric.crew) {
        crewUsage[crewId] = (crewUsage[crewId] || 0) + 1;
      }
    }

    // Model usage stats
    const modelUsage: Record<string, number> = {};
    for (const metric of metrics) {
      for (const model of Object.values(metric.models)) {
        modelUsage[model] = (modelUsage[model] || 0) + 1;
      }
    }

    return NextResponse.json({
      total: metrics.length,
      analytics: {
        totalCost,
        totalTokens,
        avgCost,
        avgTokens,
        costPer1KTokens: (totalCost / totalTokens) * 1000,
      },
      crewUsage,
      modelUsage,
      recentMetrics: metrics.slice(-10),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'No metrics found' },
      { status: 404 }
    );
  }
}
