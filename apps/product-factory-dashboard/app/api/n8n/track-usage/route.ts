/**
 * n8n Usage Tracking Integration
 *
 * Endpoint: POST /api/n8n/track-usage
 *
 * Tracks token usage and costs across Claude Code and OpenRouter systems.
 * Stores usage data for cost optimization and budget monitoring.
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir } from 'fs/promises';
import path from 'path';

interface UsageRecord {
  timestamp: string;
  source: 'claude-code' | 'openrouter' | 'n8n-workflow';
  task: string;
  tokensUsed: number;
  costUsd: number;
  model?: string;
  tier?: string;
  success: boolean;
  metadata?: Record<string, any>;
}

interface TrackUsageRequest {
  source: 'claude-code' | 'openrouter' | 'n8n-workflow';
  task: string;
  tokensUsed: number;
  costUsd: number;
  model?: string;
  tier?: string;
  success?: boolean;
  metadata?: Record<string, any>;
}

interface UsageStats {
  today: {
    claudeCodeTokens: number;
    openRouterTokens: number;
    totalCostUsd: number;
    requestCount: number;
  };
  thisMonth: {
    claudeCodeTokens: number;
    openRouterTokens: number;
    totalCostUsd: number;
    requestCount: number;
  };
  allTime: {
    claudeCodeTokens: number;
    openRouterTokens: number;
    totalCostUsd: number;
    requestCount: number;
  };
}

const USAGE_FILE = path.join(process.cwd(), 'data', 'usage-tracking.json');

/**
 * Load usage records from file
 */
async function loadUsageRecords(): Promise<UsageRecord[]> {
  try {
    const data = await readFile(USAGE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist yet, return empty array
    return [];
  }
}

/**
 * Save usage records to file
 */
async function saveUsageRecords(records: UsageRecord[]): Promise<void> {
  try {
    // Ensure data directory exists
    await mkdir(path.dirname(USAGE_FILE), { recursive: true });
    await writeFile(USAGE_FILE, JSON.stringify(records, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save usage records:', error);
    throw error;
  }
}

/**
 * Calculate usage statistics
 */
function calculateStats(records: UsageRecord[]): UsageStats {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const stats: UsageStats = {
    today: { claudeCodeTokens: 0, openRouterTokens: 0, totalCostUsd: 0, requestCount: 0 },
    thisMonth: { claudeCodeTokens: 0, openRouterTokens: 0, totalCostUsd: 0, requestCount: 0 },
    allTime: { claudeCodeTokens: 0, openRouterTokens: 0, totalCostUsd: 0, requestCount: 0 },
  };

  for (const record of records) {
    const recordDate = new Date(record.timestamp);
    const tokens = record.tokensUsed;
    const cost = record.costUsd;

    // All-time stats
    stats.allTime.requestCount++;
    stats.allTime.totalCostUsd += cost;
    if (record.source === 'claude-code') {
      stats.allTime.claudeCodeTokens += tokens;
    } else if (record.source === 'openrouter') {
      stats.allTime.openRouterTokens += tokens;
    }

    // This month stats
    if (recordDate >= monthStart) {
      stats.thisMonth.requestCount++;
      stats.thisMonth.totalCostUsd += cost;
      if (record.source === 'claude-code') {
        stats.thisMonth.claudeCodeTokens += tokens;
      } else if (record.source === 'openrouter') {
        stats.thisMonth.openRouterTokens += tokens;
      }
    }

    // Today stats
    if (recordDate >= todayStart) {
      stats.today.requestCount++;
      stats.today.totalCostUsd += cost;
      if (record.source === 'claude-code') {
        stats.today.claudeCodeTokens += tokens;
      } else if (record.source === 'openrouter') {
        stats.today.openRouterTokens += tokens;
      }
    }
  }

  return stats;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as TrackUsageRequest;

    // Validate request
    if (!body.source || !body.task || typeof body.tokensUsed !== 'number' || typeof body.costUsd !== 'number') {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: source, task, tokensUsed, costUsd',
        },
        { status: 400 }
      );
    }

    // Create usage record
    const record: UsageRecord = {
      timestamp: new Date().toISOString(),
      source: body.source,
      task: body.task,
      tokensUsed: body.tokensUsed,
      costUsd: body.costUsd,
      model: body.model,
      tier: body.tier,
      success: body.success !== false, // Default to true
      metadata: body.metadata,
    };

    // Load existing records
    const records = await loadUsageRecords();

    // Add new record
    records.push(record);

    // Save updated records
    await saveUsageRecords(records);

    // Calculate updated stats
    const stats = calculateStats(records);

    return NextResponse.json({
      success: true,
      message: 'Usage tracked successfully',
      record: {
        timestamp: record.timestamp,
        source: record.source,
        tokensUsed: record.tokensUsed,
        costUsd: record.costUsd,
      },
      stats,
    });
  } catch (error: any) {
    console.error('Usage tracking error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to track usage',
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to retrieve usage statistics
 */
export async function GET(request: NextRequest) {
  try {
    const records = await loadUsageRecords();
    const stats = calculateStats(records);

    // Optional: Filter by source
    const searchParams = request.nextUrl.searchParams;
    const source = searchParams.get('source') as 'claude-code' | 'openrouter' | null;
    const limit = parseInt(searchParams.get('limit') || '100');

    let filteredRecords = records;
    if (source) {
      filteredRecords = records.filter((r) => r.source === source);
    }

    // Return most recent records
    const recentRecords = filteredRecords.slice(-limit).reverse();

    return NextResponse.json({
      success: true,
      stats,
      recentRecords,
      totalRecords: records.length,
    });
  } catch (error: any) {
    console.error('Failed to retrieve usage stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to retrieve usage statistics',
      },
      { status: 500 }
    );
  }
}
