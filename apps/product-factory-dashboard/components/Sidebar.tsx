'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { docsNav } from '../lib/nav';
import { ProjectSummary, getStatusColor } from '../lib/projects';
import { Icon, IconName } from '../lib/icons';

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
        const res = await fetch('/api/projects?status=active');
        const data = await res.json();
        setProjects(data.projects || []);
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
        <div className="brand">
          <div className="logo">
            <Image 
              src="/starfleet-delta.svg" 
              alt="Starfleet Delta" 
              width={isCollapsed ? 32 : 40}
              height={isCollapsed ? 38 : 48}
              priority
            />
          </div>
          {!isCollapsed && (
            <div className="brandText">
              <div className="title">RAG Refresh</div>
              <div className="subtitle">Product Factory</div>
            </div>
          )}
        </div>

        {/* Projects Section - TOP PRIORITY */}
        <div className="navBlock">
          {!isCollapsed && <div className="navHeader"><Icon name="projects" size={14} style={{marginRight: 6}} /> Projects</div>}
          <NavItem href="/portfolio" iconName="portfolio" label="Portfolio Overview" isCollapsed={isCollapsed} isActive={isActive('/portfolio')} onHover={handleNavHover} onLeave={handleNavLeave} />
          <NavItem href="/sprints" iconName="timeline" label="All Sprints" isCollapsed={isCollapsed} isActive={isActive('/sprints')} onHover={handleNavHover} onLeave={handleNavLeave} />

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
          
          <NavItem href="/create" iconName="create" label="Create New" isCollapsed={isCollapsed} isActive={isActive('/create')} onHover={handleNavHover} onLeave={handleNavLeave} />
        </div>

        {/* Factory Navigation */}
        <div className="navBlock">
          {!isCollapsed && <div className="navHeader"><Icon name="delta" size={14} style={{marginRight: 6}} /> Application Factory</div>}
          <NavItem href="/" iconName="home" label="Home" isCollapsed={isCollapsed} isActive={isActive('/') && pathname === '/'} onHover={handleNavHover} onLeave={handleNavLeave} />
          <NavItem href="/categories" iconName="domains" label="Domains" isCollapsed={isCollapsed} isActive={isActive('/categories')} onHover={handleNavHover} onLeave={handleNavLeave} />
          <NavItem href="/ask" iconName="ask" label="Ask" isCollapsed={isCollapsed} isActive={isActive('/ask')} onHover={handleNavHover} onLeave={handleNavLeave} />
          <NavItem href="/diagnostics" iconName="diagnostics" label="Diagnostics" isCollapsed={isCollapsed} isActive={isActive('/diagnostics')} onHover={handleNavHover} onLeave={handleNavLeave} />
          <NavItem href="/deploy-metrics" iconName="metrics" label="Deploy Metrics" isCollapsed={isCollapsed} isActive={isActive('/deploy-metrics')} onHover={handleNavHover} onLeave={handleNavLeave} />
          <NavItem href="/env" iconName="environment" label="Environment" isCollapsed={isCollapsed} isActive={isActive('/env')} onHover={handleNavHover} onLeave={handleNavLeave} />
        </div>

        {/* Crew Navigation */}
        <div className="navBlock">
          {!isCollapsed && <div className="navHeader"><Icon name="crew" size={14} style={{marginRight: 6}} /> Crew</div>}
          <NavItem href="/crew" iconName="crew" label="Crew Roster" isCollapsed={isCollapsed} isActive={isActive('/crew')} onHover={handleNavHover} onLeave={handleNavLeave} />
          <NavItem href="/observation-lounge" iconName="observation" label="Observation Lounge" isCollapsed={isCollapsed} isActive={isActive('/observation-lounge')} onHover={handleNavHover} onLeave={handleNavLeave} />
        </div>

        {/* Factory Docs Navigation */}
        <div className="navBlock">
          {!isCollapsed && <div className="navHeader"><Icon name="docs" size={14} style={{marginRight: 6}} /> Docs</div>}
          {docsNav.map(it => (
            <NavItem
              key={it.route}
              href={it.route}
              iconName={navIconMap[it.route] || 'docs'}
              label={it.label}
              isCollapsed={isCollapsed}
              isActive={isActive(it.route)}
              onHover={handleNavHover}
              onLeave={handleNavLeave}
            />
          ))}
        </div>

        {/* Crew Quick Status - Only when expanded */}
        {!isCollapsed && (
          <div className="crewQuickStatus">
            <div className="quickStatusHeader">Crew Status</div>
            <div className="quickStatusAvatars">
              {crewIds.map(crew => (
                <Link key={crew.id} href={`/crew/${crew.id}`} className="quickStatusAvatar" title={crew.name}>
                  <Image 
                    src={`/crew-avatars/${crew.id}.jpg`} 
                    alt={crew.name}
                    fill
                    sizes="28px"
                    className="avatarImage"
                  />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Collapsed Crew Avatars */}
        {isCollapsed && (
          <div className="collapsedCrewAvatars">
            {crewIds.slice(0, 5).map(crew => (
              <Link key={crew.id} href={`/crew/${crew.id}`} className="collapsedAvatar" title={crew.name}>
                <Image 
                  src={`/crew-avatars/${crew.id}.jpg`} 
                  alt={crew.name}
                  fill
                  sizes="24px"
                  className="avatarImage"
                />
              </Link>
            ))}
            <Link href="/crew" className="collapsedAvatarMore" title="View all crew">
              +{crewIds.length - 5}
            </Link>
          </div>
        )}

        {/* Status Pills - Only when expanded */}
        {!isCollapsed && (
          <div className="hint">
            <span className="pill good">Opportunity</span>
            <span className="pill warn">Tradeoffs</span>
            <span className="pill risk">Risk</span>
          </div>
        )}
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
            border: '1px solid #7c5cff',
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
