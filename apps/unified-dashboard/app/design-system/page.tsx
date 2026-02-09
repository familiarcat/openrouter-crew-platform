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
import ThemeSelector from '@/components/ThemeSelector';
import QuizInline from '@/components/QuizInline';
import WizardInline from '@/components/WizardInline';
import TerminalWindow from '@/components/TerminalWindow';
import SimpleChart from '@/components/SimpleChart';
import StuckOperationWarning from '@/components/StuckOperationWarning';
import ThemeAwareCTA from '@/components/ThemeAwareCTA';

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

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '80px' }}>
      <div style={{ marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
        <h2 style={{
          fontSize: '28px',
          fontWeight: '700',
          color: 'var(--foreground)',
          marginBottom: '8px'
        }}>
          {title}
        </h2>
        {description && (
          <p style={{ color: 'var(--text-muted)', fontSize: '16px', maxWidth: '800px', lineHeight: '1.6' }}>
            {description}
          </p>
        )}
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))',
        gap: '24px'
      }}>
        {children}
      </div>
    </section>
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
        <header style={{ marginBottom: '64px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ maxWidth: '800px' }}>
            <h1 style={{ fontSize: '36px', fontWeight: '800', color: 'var(--accent)', marginBottom: '12px' }}>
              🧩 Component Library
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '18px', lineHeight: '1.6' }}>
              Interactive showcase of all dashboard components in the Bento system.
              Organized by Domain-Driven Design (DDD) contexts and RAG memory structures to reflect the architectural boundaries of the platform.
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
              transition: 'all 0.2s',
              marginTop: '8px'
            }}
          >
            ← Back to Dashboard
          </Link>
        </header>

        <Section title="System Observability & Core" description="Components responsible for real-time monitoring, server synchronization, and core infrastructure health.">
          <ComponentWrapper label="Service Status"><ServiceStatusDisplay /></ComponentWrapper>
          <ComponentWrapper label="Live Refresh"><LiveRefreshDashboard /></ComponentWrapper>
          <ComponentWrapper label="Cross-Server Sync"><CrossServerSyncPanel /></ComponentWrapper>
          <ComponentWrapper label="MCP System"><MCPDashboardSection /></ComponentWrapper>
          <ComponentWrapper label="Security Assessment"><SecurityAssessmentDashboard /></ComponentWrapper>
          <ComponentWrapper label="Cost Optimization"><CostOptimizationMonitor /></ComponentWrapper>
        </Section>

        <Section title="Intelligence & Memory (RAG)" description="Visualizations for AI agent memories, vector retrieval processes, and learning analytics.">
          <ComponentWrapper label="Crew Memory"><CrewMemoryVisualization /></ComponentWrapper>
          <ComponentWrapper label="Agent Memory"><AgentMemoryDisplay agentName="Demo Agent" limit={5} showStats={true} /></ComponentWrapper>
          <ComponentWrapper label="RAG Recommendations"><RAGProjectRecommendations /></ComponentWrapper>
          <ComponentWrapper label="Self Documentation"><RAGSelfDocumentation /></ComponentWrapper>
          <ComponentWrapper label="Learning Analytics"><LearningAnalyticsDashboard /></ComponentWrapper>
          <ComponentWrapper label="AI Impact"><AIImpactAssessment /></ComponentWrapper>
        </Section>

        <Section title="Workflow & Process Automation" description="Interfaces for managing n8n workflows, process documentation, and data source integrations.">
          <ComponentWrapper label="n8n Workflows"><N8NWorkflowBento /></ComponentWrapper>
          <ComponentWrapper label="Process Docs"><ProcessDocumentationSystem /></ComponentWrapper>
          <ComponentWrapper label="Data Sources"><DataSourceIntegrationPanel /></ComponentWrapper>
          <ComponentWrapper label="Debate Panel"><DebatePanel /></ComponentWrapper>
        </Section>

        <Section title="Project Management & Analytics" description="Tools for tracking project progress, prioritizing tasks via vector analysis, and general analytics.">
          <ComponentWrapper label="Project Grid"><ProjectGrid /></ComponentWrapper>
          <ComponentWrapper label="Analytics Dashboard"><AnalyticsDashboard /></ComponentWrapper>
          <ComponentWrapper label="Vector Dashboard"><VectorBasedDashboard /></ComponentWrapper>
          <ComponentWrapper label="Vector Priority"><VectorPrioritySystem /></ComponentWrapper>
          <ComponentWrapper label="Priority Matrix"><PriorityMatrix vectors={[]} /></ComponentWrapper>
          <ComponentWrapper label="Progress Tracker"><ProgressTracker taskId="demo-task" /></ComponentWrapper>
        </Section>

        <Section title="UX & Design System" description="Components for testing themes, comparing UI designs, and monitoring user experience metrics.">
          <ComponentWrapper label="Theme Testing"><ThemeTestingHarness /></ComponentWrapper>
          <ComponentWrapper label="UI Comparison"><UIDesignComparison /></ComponentWrapper>
          <ComponentWrapper label="UX Analytics"><UserExperienceAnalytics /></ComponentWrapper>
          <ComponentWrapper label="Status Ribbon"><StatusRibbon /></ComponentWrapper>
          <ComponentWrapper label="Universal Progress"><UniversalProgressBar current={65} total={100} description="System Load" /></ComponentWrapper>
          <ComponentWrapper label="Error Display"><DesignSystemErrorDisplay error="Sample error message" title="Demo Error" /></ComponentWrapper>
        </Section>

        <Section title="Dynamic Data & Registry" description="Low-level components for rendering dynamic data structures and component registries.">
          <ComponentWrapper label="Data Drilldown"><DynamicDataDrilldown data={{ sample: 'data', nested: { value: 123 } }} title="Sample Drilldown" /></ComponentWrapper>
          <ComponentWrapper label="Data Renderer"><DynamicDataRenderer data={{ key: 'value' }} structure={{ id: 'root', type: 'container' }} /></ComponentWrapper>
          <ComponentWrapper label="Component Grid"><ComponentGrid componentIds={['comp-1', 'comp-2']} /></ComponentWrapper>
        </Section>

        <Section title="Interactive Wizards & Forms" description="Step-by-step guides and interactive forms for user input and configuration.">
          <ComponentWrapper label="Project Wizard"><WizardInline projectId="demo-proj" onApply={(data: any) => console.log(data)} /></ComponentWrapper>
          <ComponentWrapper label="Inline Quiz"><QuizInline projectId="demo-proj" /></ComponentWrapper>
          <ComponentWrapper label="Theme Selector">
            <div className="space-y-8">
              <ThemeSelector value="midnight" onChange={() => {}} mode="gallery" label="Gallery Mode" />
              <ThemeSelector value="midnight" onChange={() => {}} mode="dropdown" label="Dropdown Mode" />
            </div>
          </ComponentWrapper>
        </Section>

        <Section title="Operational Feedback & Visualization" description="Components for displaying system status, logs, and data trends.">
          <ComponentWrapper label="Terminal Window">
            <div className="relative h-[300px]">
              <TerminalWindow title="System Logs" height="100%" />
            </div>
          </ComponentWrapper>
          <ComponentWrapper label="Stuck Operation Warning">
            <StuckOperationWarning operationName="Database Sync" retryCount={3} maxRetries={5} onCancel={() => {}} onRetry={() => {}} error={new Error("Connection timeout")} />
          </ComponentWrapper>
          <ComponentWrapper label="Simple Charts">
            <div className="grid grid-cols-2 gap-4">
              <SimpleChart data={[{label: 'A', value: 30}, {label: 'B', value: 50}, {label: 'C', value: 20}]} chartType="bar" title="Bar Chart" />
              <SimpleChart data={[{label: 'X', value: 10}, {label: 'Y', value: 40}, {label: 'Z', value: 30}]} chartType="pie" title="Pie Chart" />
            </div>
          </ComponentWrapper>
          <ComponentWrapper label="Theme Aware CTA">
            <div className="flex gap-4 items-center justify-center h-full">
              <ThemeAwareCTA href="#" variant="primary">Primary Action</ThemeAwareCTA>
              <ThemeAwareCTA href="#" variant="secondary">Secondary</ThemeAwareCTA>
              <ThemeAwareCTA href="#" variant="outline">Outline</ThemeAwareCTA>
            </div>
          </ComponentWrapper>
        </Section>

        <Section title="Composite Domain Layouts" description="Complex hierarchical combinations of components for specific domain tasks.">
          <ComponentWrapper label="Project Initialization Flow">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
              <WizardInline projectId="new-project" onApply={() => {}} />
              <div className="space-y-6">
                <div className="p-4 bg-white/5 rounded border border-white/10">
                  <h4 className="text-sm font-bold mb-4 text-gray-400">Aesthetic Alignment</h4>
                  <QuizInline projectId="new-project" />
                </div>
                <StuckOperationWarning operationName="Template Hydration" retryCount={1} maxRetries={3} onCancel={() => {}} />
              </div>
            </div>
          </ComponentWrapper>
          <ComponentWrapper label="System Operations Console">
            <div className="flex flex-col gap-4 h-[600px]">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ServiceStatusDisplay />
                <div className="col-span-2 bg-white/5 rounded border border-white/10 p-4">
                   <SimpleChart data={[{label: 'CPU', value: 45}, {label: 'Mem', value: 60}, {label: 'Disk', value: 25}, {label: 'Net', value: 10}]} title="Resource Usage" height={150} />
                </div>
              </div>
              <div className="flex-1 relative">
                <TerminalWindow title="Deployment Logs" height="100%" />
              </div>
            </div>
          </ComponentWrapper>
        </Section>
      </div>
    </div>
  );
}
