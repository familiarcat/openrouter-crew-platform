/**
 * Project Graph API
 * Returns project architecture as a graph for visualization
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import {
  ProjectGraphBuilder,
  ViewDimension,
  Project,
} from '@/lib/visualization';

const PROJECTS_FILE = path.join(process.cwd(), 'data', 'projects.json');

interface ProjectsData {
  projects: Project[];
  meta?: Record<string, unknown>;
}

/**
 * GET /api/projects/[id]/graph
 * Query params:
 *   - dimension: 'domains' | 'tech-stack' | 'crew' | 'milestones' | 'full'
 *   - format: 'cytoscape' | 'mermaid'
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const dimension = (searchParams.get('dimension') ||
      'domains') as ViewDimension;
    const format = searchParams.get('format') || 'cytoscape';

    // Load projects
    const content = await readFile(PROJECTS_FILE, 'utf-8');
    const data: ProjectsData = JSON.parse(content);
    const project = data.projects.find((p) => p.id === id);

    if (!project) {
      return NextResponse.json(
        { error: `Project ${id} not found` },
        { status: 404 }
      );
    }

    // Build graph
    const builder = new ProjectGraphBuilder();
    const graph = builder.build(project, dimension);

    // Validate graph
    const validation = graph.validate();
    if (!validation.valid) {
      console.warn('Graph validation warnings:', validation.errors);
    }

    // Return in requested format
    if (format === 'mermaid') {
      return NextResponse.json({
        format: 'mermaid',
        diagram: graph.toMermaidDiagram(),
        stats: graph.getStats(),
      });
    }

    // Default: Cytoscape format
    return NextResponse.json({
      format: 'cytoscape',
      elements: graph.toCytoscapeElements(),
      stats: graph.getStats(),
      metadata: {
        projectId: project.id,
        projectName: project.name,
        dimension,
      },
    });
  } catch (error) {
    console.error('Error generating project graph:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate project graph',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
