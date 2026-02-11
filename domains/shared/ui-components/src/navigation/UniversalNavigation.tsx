'use client';

import React, { useState } from 'react';
import { UNIVERSAL_SITEMAP, DomainGroup } from './sitemap';
import { ChevronRight, ChevronDown, ExternalLink } from 'lucide-react';

interface UniversalNavigationProps {
  currentPath?: string;
  variant?: 'sidebar' | 'mega-menu' | 'mobile';
  onNavigate?: (path: string) => void;
}

export const UniversalNavigation: React.FC<UniversalNavigationProps> = ({ 
  currentPath = '/', 
  variant = 'sidebar',
  onNavigate 
}) => {
  const [expandedDomains, setExpandedDomains] = useState<Record<string, boolean>>({
    'unified': true,
    'product-factory': true,
    'dj-booking': false,
    'alex-ai': false
  });

  const toggleDomain = (id: string) => {
    setExpandedDomains(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleLinkClick = (e: React.MouseEvent, path: string) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(path);
    }
  };

  return (
    <nav suppressHydrationWarning className={`universal-nav ${variant === 'sidebar' ? 'w-64 h-full bg-background border-r' : 'w-full'}`}>
      <div className="p-4 border-b mb-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Platform Navigation
        </h2>
      </div>

      <div className="space-y-6 p-2">
        {UNIVERSAL_SITEMAP.map((domain: DomainGroup) => {
          const Icon = domain.icon;
          const isExpanded = expandedDomains[domain.id];
          const isActiveDomain = currentPath.includes(domain.routes[0].path) && domain.id !== 'unified';

          return (
            <div key={domain.id} className="domain-group">
              {/* Domain Header */}
              <button
                onClick={() => toggleDomain(domain.id)}
                className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors hover:bg-accent/50 ${isActiveDomain ? 'bg-accent/30' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-md bg-background border shadow-sm ${domain.color}`}>
                    <Icon size={16} />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-sm">{domain.title}</div>
                    <div className="text-[10px] text-muted-foreground">{domain.description}</div>
                  </div>
                </div>
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>

              {/* Domain Routes */}
              {isExpanded && (
                <div className="mt-1 ml-4 pl-4 border-l space-y-0.5">
                  {domain.routes.map((route) => {
                    const RouteIcon = route.icon;
                    const isActive = currentPath === route.path;

                    return (
                      <a
                        key={route.path}
                        href={route.path}
                        onClick={(e) => handleLinkClick(e, route.path)}
                        className={`
                          group flex items-center justify-between px-3 py-2 rounded-md text-sm transition-all
                          ${isActive 
                            ? 'bg-primary/10 text-primary font-medium' 
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'}
                        `}
                      >
                        <div className="flex items-center gap-2">
                          {RouteIcon && <RouteIcon size={14} className="opacity-70 group-hover:opacity-100" />}
                          <span>{route.title}</span>
                        </div>
                        
                        {route.badge && (
                          <span className="px-1.5 py-0.5 text-[10px] bg-primary text-primary-foreground rounded-full">
                            {route.badge}
                          </span>
                        )}
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
};