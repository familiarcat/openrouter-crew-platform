'use client';

import React from 'react';

export interface DomainHealth {
  demand: number;        // 1-10
  effort: number;        // 1-10
  monetization: number;  // 1-10
  differentiation: number; // 1-10
  risk: number;          // 1-10
}

export interface FeatureArea {
  slug: string;
  name: string;
  description: string;
  status: 'planned' | 'in-progress' | 'completed';
  progress: number; // 0-100
  health: DomainHealth;
}

interface DomainHealthChartProps {
  featureAreas: FeatureArea[];
  compact?: boolean;
}

const statusColors = {
  'completed': '#10b981',
  'in-progress': '#3b82f6',
  'planned': '#6b7280',
};

const statusIcons = {
  'completed': '✅',
  'in-progress': '🔄',
  'planned': '📋',
};

function HealthBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ flex: 1, minWidth: 40 }}>
      <div style={{
        fontSize: 9,
        color: 'var(--muted)',
        marginBottom: 3,
        textAlign: 'center',
        fontWeight: 600,
      }}>
        {label}
      </div>
      <div style={{
        height: 4,
        background: 'rgba(255,255,255,0.1)',
        borderRadius: 2,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{
          width: `${value * 10}%`,
          height: '100%',
          background: color,
          borderRadius: 2,
          transition: 'width 0.3s ease',
        }} />
      </div>
      <div style={{
        fontSize: 8,
        color,
        marginTop: 2,
        textAlign: 'center',
        fontWeight: 700,
      }}>
        {value}
      </div>
    </div>
  );
}

export function DomainHealthChart({ featureAreas, compact = false }: DomainHealthChartProps) {
  if (featureAreas.length === 0) {
    return (
      <div style={{
        padding: 12,
        textAlign: 'center',
        color: 'var(--muted)',
        fontSize: 11,
        background: 'rgba(255,255,255,0.02)',
        borderRadius: 8,
        border: '1px solid var(--border)',
      }}>
        No feature areas defined
      </div>
    );
  }

  // Calculate overall progress
  const overallProgress = Math.round(
    featureAreas.reduce((sum, area) => sum + area.progress, 0) / featureAreas.length
  );

  // Calculate average health metrics
  const avgHealth: DomainHealth = {
    demand: Math.round(featureAreas.reduce((sum, area) => sum + area.health.demand, 0) / featureAreas.length),
    effort: Math.round(featureAreas.reduce((sum, area) => sum + area.health.effort, 0) / featureAreas.length),
    monetization: Math.round(featureAreas.reduce((sum, area) => sum + area.health.monetization, 0) / featureAreas.length),
    differentiation: Math.round(featureAreas.reduce((sum, area) => sum + area.health.differentiation, 0) / featureAreas.length),
    risk: Math.round(featureAreas.reduce((sum, area) => sum + area.health.risk, 0) / featureAreas.length),
  };

  if (compact) {
    return (
      <div style={{
        padding: 8,
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 8,
        border: '1px solid var(--border)',
      }}>
        {/* Overall Progress */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}>
          <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>
            Domain Health
          </span>
          <span style={{ fontSize: 11, color: '#3b82f6', fontWeight: 700 }}>
            {overallProgress}%
          </span>
        </div>

        {/* Health Metrics */}
        <div style={{ display: 'flex', gap: 6 }}>
          <HealthBar label="D" value={avgHealth.demand} color="#10b981" />
          <HealthBar label="M" value={avgHealth.monetization} color="#3b82f6" />
          <HealthBar label="Δ" value={avgHealth.differentiation} color="#f59e0b" />
        </div>

        {/* Feature Count */}
        <div style={{
          marginTop: 8,
          paddingTop: 8,
          borderTop: '1px solid var(--border)',
          fontSize: 10,
          color: 'var(--muted)',
          textAlign: 'center',
        }}>
          {featureAreas.filter(a => a.status === 'completed').length} completed • {' '}
          {featureAreas.filter(a => a.status === 'in-progress').length} in progress • {' '}
          {featureAreas.filter(a => a.status === 'planned').length} planned
        </div>
      </div>
    );
  }

  // Full view with individual feature areas
  return (
    <div style={{
      padding: 12,
      background: 'rgba(255,255,255,0.03)',
      borderRadius: 12,
      border: '1px solid var(--border)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
      }}>
        <h4 style={{
          margin: 0,
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--text)',
        }}>
          Domain Structure ({featureAreas.length} areas)
        </h4>
        <div style={{
          padding: '4px 10px',
          background: 'rgba(59,130,246,0.15)',
          border: '1px solid rgba(59,130,246,0.3)',
          borderRadius: 12,
          fontSize: 11,
          fontWeight: 700,
          color: '#3b82f6',
        }}>
          {overallProgress}% Complete
        </div>
      </div>

      {/* Feature Areas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {featureAreas.map((area) => (
          <div
            key={area.slug}
            style={{
              padding: 10,
              background: `${statusColors[area.status]}08`,
              border: `1px solid ${statusColors[area.status]}30`,
              borderRadius: 8,
              transition: 'all 0.2s',
            }}
          >
            {/* Feature Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'start',
              marginBottom: 6,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 2,
                }}>
                  <span>{statusIcons[area.status]}</span>
                  <span style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {area.name}
                  </span>
                </div>
                <div style={{
                  fontSize: 10,
                  color: 'var(--muted)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {area.description}
                </div>
              </div>
              <div style={{
                marginLeft: 8,
                padding: '2px 8px',
                background: statusColors[area.status],
                borderRadius: 10,
                fontSize: 10,
                fontWeight: 700,
                color: 'white',
                whiteSpace: 'nowrap',
              }}>
                {area.progress}%
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{
              height: 6,
              background: 'rgba(0,0,0,0.2)',
              borderRadius: 3,
              overflow: 'hidden',
              marginBottom: 6,
            }}>
              <div style={{
                width: `${area.progress}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${statusColors[area.status]}, ${statusColors[area.status]}dd)`,
                borderRadius: 3,
                transition: 'width 0.3s ease',
              }} />
            </div>

            {/* Health Metrics */}
            <div style={{ display: 'flex', gap: 6 }}>
              <HealthBar label="D" value={area.health.demand} color="#10b981" />
              <HealthBar label="E" value={area.health.effort} color="#f97316" />
              <HealthBar label="M" value={area.health.monetization} color="#3b82f6" />
              <HealthBar label="Δ" value={area.health.differentiation} color="#f59e0b" />
              <HealthBar label="R" value={area.health.risk} color="#ef4444" />
            </div>
          </div>
        ))}
      </div>

      {/* Overall Health Summary */}
      <div style={{
        marginTop: 12,
        paddingTop: 12,
        borderTop: '1px solid var(--border)',
      }}>
        <div style={{
          fontSize: 11,
          color: 'var(--muted)',
          marginBottom: 6,
          fontWeight: 600,
        }}>
          Overall Project Health
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <HealthBar label="Demand" value={avgHealth.demand} color="#10b981" />
          <HealthBar label="Effort" value={avgHealth.effort} color="#f97316" />
          <HealthBar label="Revenue" value={avgHealth.monetization} color="#3b82f6" />
          <HealthBar label="Unique" value={avgHealth.differentiation} color="#f59e0b" />
          <HealthBar label="Risk" value={avgHealth.risk} color="#ef4444" />
        </div>
      </div>
    </div>
  );
}
