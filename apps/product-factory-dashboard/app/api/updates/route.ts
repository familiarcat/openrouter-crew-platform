/**
 * Hot Reload Updates API
 *
 * Provides real-time updates to VSCode extension via polling
 * Returns changes to projects, crew status, metrics, etc.
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { createHash } from 'crypto';
import path from 'path';

interface Update {
  type: 'projects_updated' | 'crew_updated' | 'metrics_updated' | 'data_updated';
  data?: any;
  timestamp: number;
}

/**
 * Generate ETag from file content
 */
async function generateETag(filePaths: string[]): Promise<string> {
  const hash = createHash('md5');

  for (const filePath of filePaths) {
    try {
      const content = await readFile(filePath, 'utf-8');
      hash.update(content);
    } catch {
      // File doesn't exist or can't be read
      hash.update('');
    }
  }

  return hash.digest('hex');
}

/**
 * Get file modification time
 */
async function getFileTimestamp(filePath: string): Promise<number> {
  try {
    const fs = await import('fs/promises');
    const stats = await fs.stat(filePath);
    return stats.mtimeMs;
  } catch {
    return 0;
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const force = searchParams.get('force') === 'true';
    const ifNoneMatch = request.headers.get('if-none-match');

    // Files to monitor for changes
    const dataDir = path.join(process.cwd(), 'data');
    const monitoredFiles = [
      path.join(dataDir, 'projects.json'),
      path.join(dataDir, 'crew_memories.json'),
      path.join(dataDir, 'deploy-metrics.json'),
      path.join(dataDir, 'collaboration_log.json'),
    ];

    // Generate current ETag
    const currentETag = await generateETag(monitoredFiles);

    // If ETag matches and not forced, return 304 Not Modified
    if (!force && ifNoneMatch && ifNoneMatch === currentETag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          'ETag': currentETag,
          'Cache-Control': 'no-cache',
        },
      });
    }

    // Collect updates
    const updates: Update[] = [];
    const now = Date.now();

    // Check projects.json
    try {
      const projectsFile = path.join(dataDir, 'projects.json');
      const projectsContent = await readFile(projectsFile, 'utf-8');
      const projectsData = JSON.parse(projectsContent);

      updates.push({
        type: 'projects_updated',
        data: {
          projects: projectsData.projects || [],
          count: projectsData.projects?.length || 0,
        },
        timestamp: await getFileTimestamp(projectsFile),
      });
    } catch (error) {
      console.error('Error reading projects:', error);
    }

    // Check crew_memories.json
    try {
      const crewFile = path.join(dataDir, 'crew_memories.json');
      const crewContent = await readFile(crewFile, 'utf-8');
      const crewData = JSON.parse(crewContent);

      updates.push({
        type: 'crew_updated',
        data: {
          memories: crewData.memories || [],
          count: crewData.memories?.length || 0,
        },
        timestamp: await getFileTimestamp(crewFile),
      });
    } catch (error) {
      console.error('Error reading crew memories:', error);
    }

    // Check deploy-metrics.json
    try {
      const metricsFile = path.join(dataDir, 'deploy-metrics.json');
      const metricsContent = await readFile(metricsFile, 'utf-8');
      const metricsData = JSON.parse(metricsContent);

      updates.push({
        type: 'metrics_updated',
        data: metricsData,
        timestamp: await getFileTimestamp(metricsFile),
      });
    } catch (error) {
      console.error('Error reading metrics:', error);
    }

    // Return updates with new ETag
    return NextResponse.json(
      {
        changes: updates,
        timestamp: now,
        etag: currentETag,
      },
      {
        status: 200,
        headers: {
          'ETag': currentETag,
          'Cache-Control': 'no-cache, must-revalidate',
          'Access-Control-Allow-Origin': '*', // Allow extension to poll
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'If-None-Match, Content-Type',
          'Access-Control-Expose-Headers': 'ETag',
        },
      }
    );
  } catch (error: any) {
    console.error('Error in updates API:', error);
    return NextResponse.json(
      {
        error: 'Failed to get updates',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'If-None-Match, Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
