'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { docsNav } from '@/lib/nav';
import { ProjectSummary, getStatusColor } from '@/lib/projects';
import { Icon, IconName } from '@/lib/icons';
import { supabase } from '@/lib/supabase';
import { enrichProjectWithDomain } from '@/lib/unified-projects';

const crewIds = [
  { id: 'captain_picard', name: 'Captain Picard' },
  { id: 'commander_data', name: 'Commander Data' },
  { id: 'commander_riker', name: 'Commander Riker' },
  { id: 'geordi_la_forge', name: 'Geordi La Forge' },
  { id: 'lieutenant_worf', name: 'Lieutenant Worf' },
  { id: 'dr_crusher', name: 'Dr. Crusher' },
  { id: 'counselor_troi', name: 'Counselor Troi' },
  { id: 'chief_obrien', name: "Chief O'Brien" },
  { id: 'lieutenant_uhura', name: 'Lieutenant Uhura' },
  { id: 'quark', name: 'Quark' },
];

// Icon mapping for nav items - now using IconName
const navIconMap: Record<string, IconName> = {
  '/': 'home',
  '/categories': 'domains',
  '/create': 'create',
  '/ask': 'ask',
  '/diagnostics': 'diagnostics',
  '/env': 'environment',
  '/crew': 'crew',
  '/observation-lounge': 'observation',
  '/docs/overview': 'list',
  '/docs/timeline': 'timeline',
  '/docs/categories': 'domains',
  '/docs/portfolio': 'portfolio',
  '/docs/roadmap': 'roadmap',
  '/docs/nextjs_product_factory_best_practices': 'bestpractices',
  '/docs/assumptions': 'assumptions',
};

// Status icon mapping
const statusIconMap: Record<string, IconName> = {
  'active': 'active',
  'draft': 'draft',
  'paused': 'paused',
  'completed': 'completed',
  'archived': 'archived',
};

// Nav Item Component - defined before main export for Turbopack compatibility
function NavItem({ 
  href, 
  iconName, 
  label, 
  isCollapsed, 
  isActive,
  onHover,
  onLeave,
}: { 
  href: string; 
  iconName: IconName; 
  label: string; 
  isCollapsed: boolean; 
  isActive: boolean;
  onHover?: (label: string, rect: DOMRect) => void;
  onLeave?: () => void;
}) {
  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isCollapsed && onHover) {
      const rect = e.currentTarget.getBoundingClientRect();
      onHover(label, rect);
    }
  };

  return (
    <Link 
      href={href} 
      className={`navItem ${isActive ? 'active' : ''}`}
      aria-label={label}
      title={isCollapsed ? label : undefined}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onLeave}
    >
      <span className="navIcon">
        <Icon name={iconName} size={18} />
      </span>
      {!isCollapsed && <span className="navLabel">{label}</span>}
    </Link>
  );
}

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [tooltip, setTooltip] = useState<{ label: string; top: number; left: number } | null>(null);
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const pathname = usePathname();

  // Fetch projects
  useEffect(() => {
    async function loadProjects() {
      try {
        const { data } = await supabase
          .from('projects')
          .select('*')
          .eq('status', 'active')
          .order('updated_at', { ascending: false })
          .limit(5);

        if (data) {
          // Map to ProjectSummary format and enrich with domain
          const enrichedProjects = data.map(p => {
            const enriched = enrichProjectWithDomain(p);
            return {
              id: p.id,
              name: p.name,
              status: p.status || 'draft',
              progress: 0, // Calculate from domain features if needed
            } as ProjectSummary;
          });
          setProjects(enrichedProjects);
        }
      } catch (error) {
        console.error('Failed to load projects:', error);
      }
    }
    loadProjects();
  }, [pathname]); // Refresh when navigating

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const handleNavHover = (label: string, rect: DOMRect) => {
    setTooltip({
      label,
      top: rect.top + rect.height / 2,
      left: rect.right + 8,
    });
  };

  const handleNavLeave = () => {
    setTooltip(null);
  };

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button 
        className="mobileMenuBtn"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label={isMobileOpen ? 'Close menu' : 'Open menu'}
      >
        <span className={`hamburger ${isMobileOpen ? 'open' : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="mobileOverlay" 
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobileOpen' : ''}`}>
        {/* Collapse Toggle (Desktop) */}
        <button 
          className="collapseBtn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? '→' : '←'}
        </button>

        {/* Brand */}
        <Link href="/" className="brand" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="logo">
            <Image
              src="/starfleet-delta.svg"
              alt="OpenRouter Crew"
              width={isCollapsed ? 32 : 40}
              height={isCollapsed ? 38 : 48}
              priority
            />
          </div>
          {!isCollapsed && (
            <div className="brandText">
              <div className="title">OpenRouter Crew</div>
              <div className="subtitle">Unified Dashboard</div>
            </div>
          )}
        </Link>

        {/* Projects Section - TOP PRIORITY */}
        <div className="navBlock">
          {!isCollapsed && <div className="navHeader"><Icon name="projects" size={14} style={{marginRight: 6}} /> Overview</div>}
          <NavItem href="/" iconName="home" label="Dashboard" isCollapsed={isCollapsed} isActive={isActive('/') && pathname === '/'} onHover={handleNavHover} onLeave={handleNavLeave} />
          <NavItem href="/domains" iconName="domains" label="All Domains" isCollapsed={isCollapsed} isActive={isActive('/domains')} onHover={handleNavHover} onLeave={handleNavLeave} />

          {/* All Projects Accordion */}
          {!isCollapsed ? (
            <div>
              <button
                onClick={() => setProjectsExpanded(!projectsExpanded)}
                className={`navItem ${isActive('/projects') ? 'active' : ''}`}
                style={{ 
                  width: '100%', 
                  textAlign: 'left',
                  cursor: 'pointer',
                  border: '1px solid transparent',
                }}
              >
                <span className="navIcon">
                  <Icon name="list" size={18} />
                </span>
                <span className="navLabel">All Projects</span>
                <span style={{ 
                  marginLeft: 'auto', 
                  transition: 'transform 0.2s',
                  transform: projectsExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                  opacity: 0.6,
                }}>
                  ▶
                </span>
              </button>
              
              {/* Expanded Project List */}
              {projectsExpanded && (
                <div style={{ 
                  overflow: 'hidden',
                  background: 'rgba(0,0,0,0.15)',
                  borderRadius: 8,
                  margin: '4px 0',
                  padding: '4px 0',
                }}>
                  {projects.length > 0 ? (
                    <>
                      {projects.map(project => (
                        <div key={project.id}>
                          <Link
                            href={`/projects/${project.id}`}
                            className={`navItem ${isActive(`/projects/${project.id}`) && !pathname.includes('/domains') ? 'active' : ''}`}
                            style={{ paddingLeft: 24, margin: '2px 4px', borderRadius: 6 }}
                          >
                            <span className="navIcon" style={{ fontSize: 12 }}>
                              <Icon name={statusIconMap[project.status] || 'active'} size={14} />
                            </span>
                            <span className="navLabel" style={{ 
                              fontSize: 12,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}>
                              {project.name}
                            </span>
                            <span style={{
                              marginLeft: 'auto',
                              fontSize: 9,
                              padding: '1px 4px',
                              background: `${getStatusColor(project.status)}20`,
                              color: getStatusColor(project.status),
                              borderRadius: 3,
                            }}>
                              {project.progress}%
                            </span>
                          </Link>
                        </div>
                      ))}
                      <Link 
                        href="/projects" 
                        style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '8px 24px',
                          fontSize: 11,
                          color: 'var(--accent1)',
                          textDecoration: 'none',
                          borderTop: '1px solid rgba(255,255,255,0.05)',
                          marginTop: 4,
                        }}
                      >
                        <Icon name="list" size={12} /> View all projects →
                      </Link>
                    </>
                  ) : (
                    <div style={{ 
                      padding: '12px 24px', 
                      fontSize: 11, 
                      color: 'var(--muted)',
                      textAlign: 'center',
                    }}>
                      <div style={{ marginBottom: 8, opacity: 0.6 }}>
                        <Icon name="projects" size={24} />
                      </div>
                      No projects yet
                      <div style={{ marginTop: 4, fontSize: 10, opacity: 0.7 }}>
                        Use &quot;Create New&quot; to start
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <NavItem href="/projects" iconName="list" label="All Projects" isCollapsed={isCollapsed} isActive={isActive('/projects')} onHover={handleNavHover} onLeave={handleNavLeave} />
          )}

          <NavItem href="/projects/new" iconName="create" label="Create Project" isCollapsed={isCollapsed} isActive={isActive('/projects/new')} onHover={handleNavHover} onLeave={handleNavLeave} />
        </div>

      </aside>

      {/* Fixed Tooltip for collapsed state */}
      {tooltip && isCollapsed && (
        <div
          style={{
            position: 'fixed',
            top: tooltip.top,
            left: tooltip.left,
            transform: 'translateY(-50%)',
            background: '#1a1f35',
            border: '1px solid #f59e0b',
            padding: '6px 12px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 500,
            whiteSpace: 'nowrap',
            zIndex: 9999,
            boxShadow: '0 4px 16px rgba(0,0,0,.5)',
            color: '#eef1ff',
            pointerEvents: 'none',
          }}
        >
          {tooltip.label}
        </div>
      )}
    </>
  );
}
