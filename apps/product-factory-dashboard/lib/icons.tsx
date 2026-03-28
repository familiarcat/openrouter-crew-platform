/**
 * Star Trek LCARS-inspired SVG Icon Library
 * 
 * All icons are designed to be:
 * - Minimalist and clean
 * - Themeable via CSS (currentColor)
 * - Consistent in style with LCARS aesthetic
 * - Sized at 24x24 viewBox by default
 */

import React from 'react';

export type IconName =
  // Navigation
  | 'home'
  | 'projects'
  | 'create'
  | 'ask'
  | 'diagnostics'
  | 'metrics'
  | 'environment'
  | 'crew'
  | 'observation'
  | 'docs'
  | 'domains'
  | 'portfolio'
  | 'list'
  // Status
  | 'active'
  | 'draft'
  | 'paused'
  | 'completed'
  | 'archived'
  | 'warning'
  | 'error'
  | 'success'
  // Categories/Scores
  | 'demand'
  | 'effort'
  | 'revenue'
  | 'target'
  | 'risk'
  | 'shield'
  // Actions
  | 'copy'
  | 'refresh'
  | 'save'
  | 'delete'
  | 'edit'
  | 'expand'
  | 'collapse'
  // Crew divisions
  | 'command'
  | 'operations'
  | 'science'
  | 'medical'
  | 'engineering'
  | 'security'
  | 'counselor'
  | 'ferengi'
  // Star Trek specific
  | 'delta'
  | 'combadge'
  | 'warp'
  | 'padd'
  | 'tricorder'
  | 'transporter'
  | 'vulcan'
  | 'timeline'
  | 'roadmap'
  | 'assumptions'
  | 'bestpractices';

interface IconProps {
  name: IconName;
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

// SVG path definitions for each icon
const iconPaths: Record<IconName, React.ReactNode> = {
  // Navigation Icons
  home: (
    <>
      <path d="M3 12l9-9 9 9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor"/>
      <path d="M5 10v9a1 1 0 001 1h3v-6h6v6h3a1 1 0 001-1v-9" strokeWidth="2" fill="none" stroke="currentColor"/>
    </>
  ),
  
  projects: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth="2" fill="none" stroke="currentColor"/>
      <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth="2" fill="none" stroke="currentColor"/>
      <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth="2" fill="none" stroke="currentColor"/>
      <rect x="14" y="14" width="7" height="7" rx="1" strokeWidth="2" fill="none" stroke="currentColor"/>
    </>
  ),
  
  create: (
    // Starfleet shuttle / warp drive
    <>
      <path d="M12 4v16M4 12h16" strokeWidth="2.5" strokeLinecap="round" stroke="currentColor"/>
      <circle cx="12" cy="12" r="3" strokeWidth="2" fill="none" stroke="currentColor"/>
    </>
  ),
  
  ask: (
    // Combadge-style communication
    <>
      <path d="M12 3C7 3 3 7 3 12c0 2.5 1 4.8 2.6 6.4L4 21l3-1.5c1.5.9 3.2 1.5 5 1.5 5 0 9-4 9-9s-4-9-9-9z" strokeWidth="2" fill="none" stroke="currentColor"/>
      <path d="M8 10h8M8 14h5" strokeWidth="2" strokeLinecap="round" stroke="currentColor"/>
    </>
  ),
  
  diagnostics: (
    // LCARS-style console
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2" fill="none" stroke="currentColor"/>
      <path d="M3 9h18M9 9v12" strokeWidth="2" stroke="currentColor"/>
      <circle cx="6" cy="6" r="1" fill="currentColor"/>
    </>
  ),
  
  metrics: (
    // Chart/analytics
    <>
      <path d="M3 20h18" strokeWidth="2" strokeLinecap="round" stroke="currentColor"/>
      <path d="M6 16V10M10 16V6M14 16V12M18 16V8" strokeWidth="2.5" strokeLinecap="round" stroke="currentColor"/>
    </>
  ),
  
  environment: (
    // Engineering wrench/settings
    <>
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" strokeWidth="2" fill="none" stroke="currentColor"/>
    </>
  ),
  
  crew: (
    // Multiple crew silhouettes
    <>
      <circle cx="9" cy="7" r="3" strokeWidth="2" fill="none" stroke="currentColor"/>
      <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" strokeWidth="2" fill="none" stroke="currentColor"/>
      <circle cx="17" cy="7" r="2.5" strokeWidth="2" fill="none" stroke="currentColor"/>
      <path d="M21 21v-1.5a3 3 0 00-2-2.8" strokeWidth="2" strokeLinecap="round" fill="none" stroke="currentColor"/>
    </>
  ),
  
  observation: (
    // Vulcan salute hand
    <>
      <path d="M7 20v-7M11 20v-9M15 20v-9M19 20v-7" strokeWidth="2" strokeLinecap="round" stroke="currentColor"/>
      <path d="M7 13c0-2 1-4 4-4s4 2 4 0c0-2 1-4 4-4" strokeWidth="2" strokeLinecap="round" fill="none" stroke="currentColor"/>
    </>
  ),
  
  docs: (
    // PADD tablet
    <>
      <rect x="5" y="2" width="14" height="20" rx="2" strokeWidth="2" fill="none" stroke="currentColor"/>
      <path d="M9 6h6M9 10h6M9 14h4" strokeWidth="2" strokeLinecap="round" stroke="currentColor"/>
    </>
  ),
  
  domains: (
    // Hierarchical structure
    <>
      <rect x="9" y="2" width="6" height="5" rx="1" strokeWidth="2" fill="none" stroke="currentColor"/>
      <rect x="2" y="17" width="6" height="5" rx="1" strokeWidth="2" fill="none" stroke="currentColor"/>
      <rect x="16" y="17" width="6" height="5" rx="1" strokeWidth="2" fill="none" stroke="currentColor"/>
      <path d="M12 7v4M5 17v-3a3 3 0 013-3h8a3 3 0 013 3v3" strokeWidth="2" stroke="currentColor"/>
    </>
  ),
  
  portfolio: (
    // Tree/hierarchy view
    <>
      <circle cx="12" cy="5" r="3" strokeWidth="2" fill="none" stroke="currentColor"/>
      <path d="M12 8v4" strokeWidth="2" stroke="currentColor"/>
      <path d="M6 16a2 2 0 100-4 2 2 0 000 4zM18 16a2 2 0 100-4 2 2 0 000 4z" strokeWidth="2" fill="none" stroke="currentColor"/>
      <path d="M6 20v-4M18 20v-4M6 14l6-2 6 2" strokeWidth="2" strokeLinecap="round" stroke="currentColor"/>
    </>
  ),
  
  list: (
    // Checklist/manifest
    <>
      <path d="M9 6h11M9 12h11M9 18h11" strokeWidth="2" strokeLinecap="round" stroke="currentColor"/>
      <path d="M4 6h.01M4 12h.01M4 18h.01" strokeWidth="3" strokeLinecap="round" stroke="currentColor"/>
    </>
  ),

  // Status Icons
  active: (
    // Warp engaged
    <>
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeWidth="2" fill="none" stroke="currentColor" strokeLinejoin="round"/>
    </>
  ),
  
  draft: (
    // Pencil/edit
    <>
      <path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" strokeWidth="2" fill="none" stroke="currentColor"/>
    </>
  ),
  
  paused: (
    // Pause bars
    <>
      <rect x="6" y="4" width="4" height="16" rx="1" strokeWidth="2" fill="none" stroke="currentColor"/>
      <rect x="14" y="4" width="4" height="16" rx="1" strokeWidth="2" fill="none" stroke="currentColor"/>
    </>
  ),
  
  completed: (
    // Checkmark in circle
    <>
      <circle cx="12" cy="12" r="10" strokeWidth="2" fill="none" stroke="currentColor"/>
      <path d="M9 12l2 2 4-4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor"/>
    </>
  ),
  
  archived: (
    // Storage container
    <>
      <path d="M21 8v13H3V8" strokeWidth="2" fill="none" stroke="currentColor"/>
      <path d="M1 3h22v5H1V3z" strokeWidth="2" fill="none" stroke="currentColor"/>
      <path d="M10 12h4" strokeWidth="2" strokeLinecap="round" stroke="currentColor"/>
    </>
  ),
  
  warning: (
    // Alert triangle
    <>
      <path d="M12 2L2 20h20L12 2z" strokeWidth="2" fill="none" stroke="currentColor" strokeLinejoin="round"/>
      <path d="M12 9v4M12 17h.01" strokeWidth="2.5" strokeLinecap="round" stroke="currentColor"/>
    </>
  ),
  
  error: (
    // X in circle
    <>
      <circle cx="12" cy="12" r="10" strokeWidth="2" fill="none" stroke="currentColor"/>
      <path d="M15 9l-6 6M9 9l6 6" strokeWidth="2.5" strokeLinecap="round" stroke="currentColor"/>
    </>
  ),
  
  success: (
    // Checkmark
    <>
      <path d="M20 6L9 17l-5-5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor"/>
    </>
  ),

  // Category/Score Icons  
  demand: (
    // Upward trend
    <>
      <path d="M3 17l6-6 4 4 8-8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor"/>
      <path d="M17 7h4v4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor"/>
    </>
  ),
  
  effort: (
    // Clock/time
    <>
      <circle cx="12" cy="12" r="10" strokeWidth="2" fill="none" stroke="currentColor"/>
      <path d="M12 6v6l4 2" strokeWidth="2.5" strokeLinecap="round" stroke="currentColor"/>
    </>
  ),
  
  revenue: (
    // Latinum bars (Ferengi style)
    <>
      <ellipse cx="12" cy="6" rx="8" ry="4" strokeWidth="2" fill="none" stroke="currentColor"/>
      <path d="M4 6v6c0 2.2 3.6 4 8 4s8-1.8 8-4V6" strokeWidth="2" fill="none" stroke="currentColor"/>
      <path d="M4 12v6c0 2.2 3.6 4 8 4s8-1.8 8-4v-6" strokeWidth="2" fill="none" stroke="currentColor"/>
    </>
  ),
  
  target: (
    // Crosshairs
    <>
      <circle cx="12" cy="12" r="10" strokeWidth="2" fill="none" stroke="currentColor"/>
      <circle cx="12" cy="12" r="4" strokeWidth="2" fill="none" stroke="currentColor"/>
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" strokeWidth="2" stroke="currentColor"/>
    </>
  ),
  
  risk: (
    // Shield with exclamation
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeWidth="2" fill="none" stroke="currentColor"/>
      <path d="M12 8v4M12 16h.01" strokeWidth="2.5" strokeLinecap="round" stroke="currentColor"/>
    </>
  ),
  
  shield: (
    // Shield
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeWidth="2" fill="none" stroke="currentColor"/>
    </>
  ),

  // Action Icons
  copy: (
    <>
      <rect x="9" y="9" width="13" height="13" rx="2" strokeWidth="2" fill="none" stroke="currentColor"/>
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeWidth="2" fill="none" stroke="currentColor"/>
    </>
  ),
  
  refresh: (
    <>
      <path d="M23 4v6h-6M1 20v-6h6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor"/>
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor"/>
    </>
  ),
  
  save: (
    <>
      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" strokeWidth="2" fill="none" stroke="currentColor"/>
      <path d="M17 21v-8H7v8M7 3v5h8" strokeWidth="2" fill="none" stroke="currentColor"/>
    </>
  ),
  
  delete: (
    <>
      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeWidth="2" fill="none" stroke="currentColor"/>
    </>
  ),
  
  edit: (
    <>
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeWidth="2" fill="none" stroke="currentColor"/>
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeWidth="2" fill="none" stroke="currentColor"/>
    </>
  ),
  
  expand: (
    <>
      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor"/>
    </>
  ),
  
  collapse: (
    <>
      <path d="M4 14h6v6M20 10h-6V4M10 14l-7 7M14 10l7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor"/>
    </>
  ),

  // Crew Division Icons
  command: (
    // Command division delta
    <>
      <path d="M12 2L4 20h16L12 2z" strokeWidth="2" fill="none" stroke="currentColor" strokeLinejoin="round"/>
      <circle cx="12" cy="13" r="2" fill="currentColor"/>
    </>
  ),
  
  operations: (
    // Operations gear
    <>
      <circle cx="12" cy="12" r="3" strokeWidth="2" fill="none" stroke="currentColor"/>
      <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" strokeWidth="2" strokeLinecap="round" stroke="currentColor"/>
    </>
  ),
  
  science: (
    // Science tricorder/scanner
    <>
      <circle cx="12" cy="12" r="10" strokeWidth="2" fill="none" stroke="currentColor"/>
      <path d="M12 2a10 10 0 0110 10" strokeWidth="2" fill="none" stroke="currentColor"/>
      <circle cx="12" cy="12" r="4" strokeWidth="2" fill="none" stroke="currentColor"/>
      <circle cx="12" cy="12" r="1" fill="currentColor"/>
    </>
  ),
  
  medical: (
    // Medical cross
    <>
      <path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3z" strokeWidth="2" fill="none" stroke="currentColor" strokeLinejoin="round"/>
    </>
  ),
  
  engineering: (
    // Engineering circuits
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" strokeWidth="2" fill="none" stroke="currentColor"/>
      <path d="M9 4v4M15 4v4M4 9h4M4 15h4M9 16v4M15 16v4M16 9h4M16 15h4" strokeWidth="2" strokeLinecap="round" stroke="currentColor"/>
      <circle cx="12" cy="12" r="2" fill="currentColor"/>
    </>
  ),
  
  security: (
    // Security phaser
    <>
      <path d="M22 12l-10 6V6l10 6z" strokeWidth="2" fill="none" stroke="currentColor" strokeLinejoin="round"/>
      <rect x="2" y="8" width="10" height="8" rx="1" strokeWidth="2" fill="none" stroke="currentColor"/>
    </>
  ),
  
  counselor: (
    // Empathy/heart-mind
    <>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" strokeWidth="2" fill="none" stroke="currentColor"/>
    </>
  ),
  
  ferengi: (
    // Ferengi latinum bar
    <>
      <ellipse cx="12" cy="8" rx="8" ry="4" strokeWidth="2" fill="none" stroke="currentColor"/>
      <path d="M4 8v8c0 2.2 3.6 4 8 4s8-1.8 8-4V8" strokeWidth="2" fill="none" stroke="currentColor"/>
      <ellipse cx="12" cy="12" rx="4" ry="2" strokeWidth="1.5" fill="none" stroke="currentColor"/>
    </>
  ),

  // Star Trek Specific
  delta: (
    // Starfleet delta
    <>
      <path d="M12 2C14 6 18 10 20 20L12 16 4 20C6 10 10 6 12 2z" strokeWidth="2" fill="none" stroke="currentColor" strokeLinejoin="round"/>
      <path d="M12 8l1.5 4-1.5 2-1.5-2L12 8z" fill="currentColor"/>
    </>
  ),
  
  combadge: (
    // TNG-style combadge
    <>
      <ellipse cx="12" cy="12" rx="10" ry="10" strokeWidth="2" fill="none" stroke="currentColor"/>
      <path d="M12 4c2 4 5 7 7 14l-7-4-7 4c2-7 5-10 7-14z" strokeWidth="1.5" fill="none" stroke="currentColor"/>
    </>
  ),
  
  warp: (
    // Warp speed lines
    <>
      <circle cx="12" cy="12" r="2" fill="currentColor"/>
      <path d="M2 12h4M18 12h4M4 6h3M17 6h3M4 18h3M17 18h3" strokeWidth="2.5" strokeLinecap="round" stroke="currentColor"/>
    </>
  ),
  
  padd: (
    // PADD device
    <>
      <rect x="6" y="2" width="12" height="20" rx="2" strokeWidth="2" fill="none" stroke="currentColor"/>
      <path d="M10 5h4M10 8h4M10 11h2" strokeWidth="1.5" strokeLinecap="round" stroke="currentColor"/>
      <rect x="9" y="15" width="6" height="4" rx="0.5" strokeWidth="1.5" fill="none" stroke="currentColor"/>
    </>
  ),
  
  tricorder: (
    // Tricorder scanner
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" strokeWidth="2" fill="none" stroke="currentColor"/>
      <path d="M3 10h18" strokeWidth="2" stroke="currentColor"/>
      <circle cx="8" cy="15" r="2" strokeWidth="2" fill="none" stroke="currentColor"/>
      <path d="M12 13v4M15 13v4M18 13v4" strokeWidth="2" strokeLinecap="round" stroke="currentColor"/>
    </>
  ),
  
  transporter: (
    // Transporter effect
    <>
      <path d="M12 2v4M12 18v4M6 6v12M18 6v12" strokeWidth="2" strokeLinecap="round" stroke="currentColor" strokeDasharray="2 2"/>
      <circle cx="12" cy="12" r="4" strokeWidth="2" fill="none" stroke="currentColor"/>
    </>
  ),
  
  vulcan: (
    // Vulcan IDIC
    <>
      <circle cx="12" cy="12" r="10" strokeWidth="2" fill="none" stroke="currentColor"/>
      <path d="M12 6v12M7 9l5 6 5-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor"/>
    </>
  ),
  
  timeline: (
    // Timeline/calendar
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2" fill="none" stroke="currentColor"/>
      <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2" stroke="currentColor"/>
      <path d="M8 14h2M14 14h2M8 18h2" strokeWidth="2" strokeLinecap="round" stroke="currentColor"/>
    </>
  ),
  
  roadmap: (
    // Navigation path
    <>
      <circle cx="6" cy="6" r="3" strokeWidth="2" fill="none" stroke="currentColor"/>
      <circle cx="18" cy="18" r="3" strokeWidth="2" fill="none" stroke="currentColor"/>
      <path d="M9 6h6c2.2 0 4 1.8 4 4v4M15 18H9c-2.2 0-4-1.8-4-4v-4" strokeWidth="2" fill="none" stroke="currentColor"/>
    </>
  ),
  
  assumptions: (
    // Lightbulb/idea
    <>
      <path d="M9 18h6M10 22h4" strokeWidth="2" strokeLinecap="round" stroke="currentColor"/>
      <path d="M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z" strokeWidth="2" fill="none" stroke="currentColor"/>
    </>
  ),
  
  bestpractices: (
    // Book/manual
    <>
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" strokeWidth="2" fill="none" stroke="currentColor"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" strokeWidth="2" fill="none" stroke="currentColor"/>
      <path d="M8 7h8M8 11h5" strokeWidth="2" strokeLinecap="round" stroke="currentColor"/>
    </>
  ),
};

/**
 * Icon Component
 * 
 * Usage:
 * <Icon name="delta" size={24} className="text-accent" />
 * 
 * All icons use currentColor so they can be styled via CSS:
 * .icon-primary { color: var(--accent1); }
 */
export function Icon({ 
  name, 
  size = 24, 
  className = '', 
  style = {},
  title,
}: IconProps) {
  const paths = iconPaths[name];
  
  if (!paths) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`icon icon-${name} ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
      aria-hidden={!title}
      role={title ? 'img' : undefined}
      aria-label={title}
    >
      {title && <title>{title}</title>}
      {paths}
    </svg>
  );
}

// Convenience mapping from old emoji icons to new icon names
export const emojiToIcon: Record<string, IconName> = {
  '🏠': 'home',
  '📦': 'projects',
  '🚀': 'create',
  '💬': 'ask',
  '⚙️': 'diagnostics',
  '📊': 'metrics',
  '🔧': 'environment',
  '👥': 'crew',
  '🖖': 'observation',
  '📚': 'docs',
  '🏗️': 'domains',
  '🌳': 'portfolio',
  '📋': 'list',
  '📈': 'demand',
  '💰': 'revenue',
  '⏱️': 'effort',
  '🎯': 'target',
  '⚠️': 'warning',
  '✅': 'completed',
  '❌': 'error',
  '📝': 'draft',
  '💡': 'assumptions',
  '📅': 'timeline',
  '🗺️': 'roadmap',
  '📘': 'bestpractices',
  '💼': 'portfolio',
  '🏷️': 'domains',
  '⚡': 'warp',
  '🎬': 'padd',
  '🔄': 'refresh',
  '🛡️': 'shield',
};

export default Icon;





