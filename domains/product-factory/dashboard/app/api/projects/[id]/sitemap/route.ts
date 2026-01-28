/**
 * Project Sitemap API
 *
 * Returns domain nodes and dependency edges for React Flow visualization
 *
 * Endpoint: GET /api/projects/[id]/sitemap
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

interface Project {
  id: string;
  name: string;
  domains?: Domain[];
  [key: string]: any;
}

interface Domain {
  slug: string;
  name: string;
  description?: string;
  status: 'completed' | 'in-progress' | 'planned' | 'at-risk' | 'blocked';
  progress: number;
  scores: {
    demand: number;
    effort: number;
    monetization: number;
    differentiation?: number;
    risk?: number;
  };
  features?: string[];
  dependencies?: DomainDependency[];
}

interface DomainDependency {
  targetSlug: string;
  type: 'data-flow' | 'shared-model' | 'event-trigger' | 'technical';
  description?: string;
}

interface SitemapNode {
  id: string;
  type: 'domain';
  position: { x: number; y: number };
  data: {
    slug: string;
    name: string;
    description: string;
    status: string;
    progress: number;
    scores: Domain['scores'];
    features: string[];
  };
}

interface SitemapEdge {
  id: string;
  source: string;
  target: string;
  type: 'default';
  label?: string;
  animated?: boolean;
  data: {
    dependencyType: string;
    description?: string;
  };
}

interface SitemapResponse {
  success: boolean;
  projectId: string;
  projectName: string;
  nodes: SitemapNode[];
  edges: SitemapEdge[];
  stats: {
    totalDomains: number;
    totalDependencies: number;
    completedDomains: number;
    inProgressDomains: number;
  };
}

/**
 * Calculate initial node positions using force-directed layout simulation
 */
function calculateNodePositions(domains: Domain[]): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();

  // Simple circular layout for initial positions
  const centerX = 400;
  const centerY = 300;
  const radius = 250;

  domains.forEach((domain, index) => {
    const angle = (index / domains.length) * 2 * Math.PI;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    positions.set(domain.slug, { x, y });
  });

  return positions;
}

/**
 * Get project data from projects.json
 */
async function getProject(id: string): Promise<Project | null> {
  try {
    const projectsFile = path.join(process.cwd(), 'data', 'projects.json');
    const content = await readFile(projectsFile, 'utf-8');
    const data = JSON.parse(content);
    return data.projects.find((p: Project) => p.id === id) || null;
  } catch (error) {
    console.error('Error loading project:', error);
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await getProject(id);

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    if (!project.domains || project.domains.length === 0) {
      return NextResponse.json({
        success: true,
        projectId: project.id,
        projectName: project.name,
        nodes: [],
        edges: [],
        stats: {
          totalDomains: 0,
          totalDependencies: 0,
          completedDomains: 0,
          inProgressDomains: 0,
        },
      } as SitemapResponse);
    }

    // Calculate node positions
    const positions = calculateNodePositions(project.domains);

    // Create nodes from domains
    const nodes: SitemapNode[] = project.domains.map((domain) => ({
      id: domain.slug,
      type: 'domain',
      position: positions.get(domain.slug) || { x: 0, y: 0 },
      data: {
        slug: domain.slug,
        name: domain.name,
        description: domain.description || '',
        status: domain.status,
        progress: domain.progress,
        scores: domain.scores,
        features: domain.features || [],
      },
    }));

    // Create edges from dependencies
    const edges: SitemapEdge[] = [];
    let edgeId = 0;

    project.domains.forEach((domain) => {
      if (domain.dependencies && domain.dependencies.length > 0) {
        domain.dependencies.forEach((dep) => {
          edges.push({
            id: `edge-${edgeId++}`,
            source: domain.slug,
            target: dep.targetSlug,
            type: 'default',
            label: dep.type,
            animated: domain.status === 'in-progress',
            data: {
              dependencyType: dep.type,
              description: dep.description,
            },
          });
        });
      }
    });

    // Calculate stats
    const stats = {
      totalDomains: project.domains.length,
      totalDependencies: edges.length,
      completedDomains: project.domains.filter((d) => d.status === 'completed').length,
      inProgressDomains: project.domains.filter((d) => d.status === 'in-progress').length,
    };

    return NextResponse.json({
      success: true,
      projectId: project.id,
      projectName: project.name,
      nodes,
      edges,
      stats,
    } as SitemapResponse);
  } catch (error: any) {
    console.error('Sitemap API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate sitemap' },
      { status: 500 }
    );
  }
}
