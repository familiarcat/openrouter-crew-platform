/**
 * Project Sitemap Page
 *
 * Interactive visualization of project domains and dependencies
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import ProjectSitemap from '@/components/ProjectSitemap';

interface SitemapData {
  success: boolean;
  projectId: string;
  projectName: string;
  nodes: any[];
  edges: any[];
  stats: {
    totalDomains: number;
    totalDependencies: number;
    completedDomains: number;
    inProgressDomains: number;
  };
}

async function getSitemapData(projectId: string): Promise<SitemapData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/projects/${projectId}/sitemap`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching sitemap data:', error);
    return null;
  }
}

export default async function ProjectSitemapPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sitemapData = await getSitemapData(id);

  if (!sitemapData || !sitemapData.success) {
    notFound();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: 14, color: 'var(--muted)' }}>
        <Link href="/projects" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
          Projects
        </Link>
        {' / '}
        <Link
          href={`/projects/${id}`}
          style={{ color: 'var(--accent)', textDecoration: 'none' }}
        >
          {sitemapData.projectName}
        </Link>
        {' / '}
        <span>Sitemap</span>
      </div>

      {/* Header Card */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, var(--surface) 0%, rgba(124,92,255,0.15) 100%)',
          borderLeft: '4px solid var(--accent1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <h1 style={{ margin: 0, fontSize: 28 }}>🗺️ Project Sitemap</h1>
            </div>
            <p style={{ margin: '8px 0 0', fontSize: 16, color: 'var(--muted)' }}>
              {sitemapData.projectName} - Domain Dependencies & Architecture
            </p>
          </div>
        </div>

        {/* Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 12,
            marginTop: 16,
          }}
        >
          <div style={{ fontSize: 12 }}>
            <div style={{ color: 'var(--muted)' }}>Total Domains</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--accent1)' }}>
              {sitemapData.stats.totalDomains}
            </div>
          </div>
          <div style={{ fontSize: 12 }}>
            <div style={{ color: 'var(--muted)' }}>Dependencies</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--accent2)' }}>
              {sitemapData.stats.totalDependencies}
            </div>
          </div>
          <div style={{ fontSize: 12 }}>
            <div style={{ color: 'var(--muted)' }}>Completed</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--ok)' }}>
              {sitemapData.stats.completedDomains}
            </div>
          </div>
          <div style={{ fontSize: 12 }}>
            <div style={{ color: 'var(--muted)' }}>In Progress</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--good)' }}>
              {sitemapData.stats.inProgressDomains}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="card">
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12 }}>Legend</div>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: '#10b981',
              }}
            />
            <span>Completed</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: '#3b82f6',
              }}
            />
            <span>In Progress</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: '#6b7280',
              }}
            />
            <span>Planned</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: '#f59e0b',
              }}
            />
            <span>At Risk</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: '#ef4444',
              }}
            />
            <span>Blocked</span>
          </div>
        </div>
      </div>

      {/* Sitemap Visualization */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {sitemapData.nodes.length > 0 ? (
          <ProjectSitemap
            projectId={sitemapData.projectId}
            projectName={sitemapData.projectName}
            nodes={sitemapData.nodes}
            edges={sitemapData.edges}
            height="700px"
          />
        ) : (
          <div
            style={{
              padding: 60,
              textAlign: 'center',
              color: 'var(--muted)',
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>🗺️</div>
            <div style={{ fontSize: 16 }}>No domains found for this project</div>
            <div style={{ fontSize: 14, marginTop: 8 }}>
              Add domains to visualize the project architecture
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="card">
        <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>How to Use</h3>
        <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8, color: 'var(--muted)' }}>
          <li>
            <strong>Click and drag</strong> nodes to rearrange the layout
          </li>
          <li>
            <strong>Scroll</strong> to zoom in/out
          </li>
          <li>
            <strong>Use controls</strong> in bottom-left to zoom, fit view, or lock
          </li>
          <li>
            <strong>Minimap</strong> in bottom-right shows overview of entire graph
          </li>
          <li>
            <strong>Arrows</strong> show dependencies between domains (data flow from source to target)
          </li>
        </ul>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <Link href={`/projects/${id}`} style={{ textDecoration: 'none' }}>
          <div
            className="card"
            style={{
              cursor: 'pointer',
              transition: 'transform 0.2s',
              borderLeft: '3px solid var(--accent1)',
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>📊</div>
            <h3 style={{ margin: '0 0 4px', fontSize: 14 }}>Project Overview</h3>
            <p className="small" style={{ margin: 0, color: 'var(--muted)' }}>
              View project details and timeline
            </p>
          </div>
        </Link>

        <Link href={`/projects/${id}/domains`} style={{ textDecoration: 'none' }}>
          <div
            className="card"
            style={{
              cursor: 'pointer',
              transition: 'transform 0.2s',
              borderLeft: '3px solid var(--accent2)',
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>🏗️</div>
            <h3 style={{ margin: '0 0 4px', fontSize: 14 }}>Domain List</h3>
            <p className="small" style={{ margin: 0, color: 'var(--muted)' }}>
              View all domains in detail
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
