'use client';

import React from 'react';
import Link from 'next/link';
import ServiceStatusDisplay from '@/components/ServiceStatusDisplay';
import CrossServerSyncPanel from '@/components/CrossServerSyncPanel';
import LiveRefreshDashboard from '@/components/LiveRefreshDashboard';
import MCPDashboardSection from '@/components/MCPDashboardSection';
import LearningAnalyticsDashboard from '@/components/LearningAnalyticsDashboard';
import CrewMemoryVisualization from '@/components/CrewMemoryVisualization';
import RAGProjectRecommendations from '@/components/RAGProjectRecommendations';
import N8NWorkflowBento from '@/components/N8NWorkflowBento';
import RAGSelfDocumentation from '@/components/RAGSelfDocumentation';
import SecurityAssessmentDashboard from '@/components/SecurityAssessmentDashboard';
import CostOptimizationMonitor from '@/components/CostOptimizationMonitor';
import UserExperienceAnalytics from '@/components/UserExperienceAnalytics';
import AIImpactAssessment from '@/components/AIImpactAssessment';
import ProcessDocumentationSystem from '@/components/ProcessDocumentationSystem';
import DataSourceIntegrationPanel from '@/components/DataSourceIntegrationPanel';
import ProjectGrid from '@/components/ProjectGrid';
import ThemeTestingHarness from '@/components/ThemeTestingHarness';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import VectorBasedDashboard from '@/components/VectorBasedDashboard';
import VectorPrioritySystem from '@/components/VectorPrioritySystem';
import UIDesignComparison from '@/components/UIDesignComparison';
import ProgressTracker from '@/components/ProgressTracker';
import PriorityMatrix from '@/components/PriorityMatrix';
import DynamicDataDrilldown from '@/components/DynamicDataDrilldown';
import DynamicDataRenderer from '@/components/DynamicDataRenderer';
import { ComponentGrid } from '@/components/DynamicComponentRegistry';
import DebatePanel from '@/components/DebatePanel';
import AgentMemoryDisplay from '@/components/AgentMemoryDisplay';
import StatusRibbon from '@/components/StatusRibbon';
import UniversalProgressBar from '@/components/UniversalProgressBar';
import DesignSystemErrorDisplay from '@/components/DesignSystemErrorDisplay';

function ComponentWrapper({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{
      position: 'relative',
      background: 'var(--card-bg)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      minHeight: '300px',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        background: 'rgba(124, 92, 255, 0.15)',
        color: 'var(--accent)',
        fontSize: '10px',
        fontWeight: 600,
        padding: '4px 10px',
        borderBottomRightRadius: '8px',
        borderRight: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        zIndex: 20,
        backdropFilter: 'blur(4px)',
        letterSpacing: '0.5px',
        textTransform: 'uppercase'
      }}>
        {label}
      </div>
      <div style={{ flex: 1, padding: '24px', overflow: 'auto' }}>
        {children}
      </div>
    </div>
  );
}

export default function ComponentLibraryPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--background)',
      color: 'var(--foreground)',
      padding: '40px 24px'
    }}>
      <div style={{ maxWidth: '1800px', margin: '0 auto' }}>
        <header style={{ marginBottom: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '36px', fontWeight: '800', color: 'var(--accent)', marginBottom: '8px' }}>
              🧩 Component Library
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>
              Interactive showcase of all dashboard components in the Bento system.
            </p>
          </div>
          <Link
            href="/dashboard"
            style={{
              padding: '12px 24px',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              color: 'var(--text)',
              textDecoration: 'none',
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
          >
            ← Back to Dashboard
          </Link>
        </header>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))',
          gap: '24px'
        }}>
          <ComponentWrapper label="Service Status"><ServiceStatusDisplay /></ComponentWrapper>
          <ComponentWrapper label="Live Refresh"><LiveRefreshDashboard /></ComponentWrapper>
          <ComponentWrapper label="Cross-Server Sync"><CrossServerSyncPanel /></ComponentWrapper>
          <ComponentWrapper label="MCP System"><MCPDashboardSection /></ComponentWrapper>
          <ComponentWrapper label="Learning Analytics"><LearningAnalyticsDashboard /></ComponentWrapper>
          <ComponentWrapper label="Crew Memory"><CrewMemoryVisualization /></ComponentWrapper>
          <ComponentWrapper label="RAG Recommendations"><RAGProjectRecommendations /></ComponentWrapper>
          <ComponentWrapper label="n8n Workflows"><N8NWorkflowBento /></ComponentWrapper>
          <ComponentWrapper label="Self Documentation"><RAGSelfDocumentation /></ComponentWrapper>
          <ComponentWrapper label="Security Assessment"><SecurityAssessmentDashboard /></ComponentWrapper>
          <ComponentWrapper label="Cost Optimization"><CostOptimizationMonitor /></ComponentWrapper>
          <ComponentWrapper label="UX Analytics"><UserExperienceAnalytics /></ComponentWrapper>
          <ComponentWrapper label="AI Impact"><AIImpactAssessment /></ComponentWrapper>
          <ComponentWrapper label="Process Docs"><ProcessDocumentationSystem /></ComponentWrapper>
          <ComponentWrapper label="Data Sources"><DataSourceIntegrationPanel /></ComponentWrapper>
          <ComponentWrapper label="Project Grid"><ProjectGrid /></ComponentWrapper>
          <ComponentWrapper label="Theme Testing"><ThemeTestingHarness /></ComponentWrapper>
          <ComponentWrapper label="Analytics Dashboard"><AnalyticsDashboard /></ComponentWrapper>
          <ComponentWrapper label="Vector Dashboard"><VectorBasedDashboard /></ComponentWrapper>
          <ComponentWrapper label="Vector Priority"><VectorPrioritySystem /></ComponentWrapper>
          <ComponentWrapper label="UI Comparison"><UIDesignComparison /></ComponentWrapper>
          <ComponentWrapper label="Progress Tracker"><ProgressTracker taskId="demo-task" /></ComponentWrapper>
          <ComponentWrapper label="Priority Matrix"><PriorityMatrix vectors={[]} /></ComponentWrapper>
          <ComponentWrapper label="Data Drilldown"><DynamicDataDrilldown data={{ sample: 'data' }} title="Sample Drilldown" /></ComponentWrapper>
          <ComponentWrapper label="Data Renderer"><DynamicDataRenderer data={{}} structure={{ id: 'root', type: 'container' }} /></ComponentWrapper>
          <ComponentWrapper label="Component Grid"><ComponentGrid componentIds={['comp-1', 'comp-2']} /></ComponentWrapper>
          <ComponentWrapper label="Debate Panel"><DebatePanel /></ComponentWrapper>
          <ComponentWrapper label="Agent Memory"><AgentMemoryDisplay agentName="Demo Agent" limit={5} showStats={true} /></ComponentWrapper>
          <ComponentWrapper label="Status Ribbon"><StatusRibbon /></ComponentWrapper>
          <ComponentWrapper label="Universal Progress"><UniversalProgressBar current={65} total={100} description="System Load" /></ComponentWrapper>
          <ComponentWrapper label="Error Display"><DesignSystemErrorDisplay error="Sample error message" title="Demo Error" /></ComponentWrapper>
        </div>
      </div>
    </div>
  );
}