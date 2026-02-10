/**
 * Cost Dashboard Components Tests
 * Verify cost analytics dashboard and related components
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CostAnalyticsDashboard from '@/components/cost/CostAnalyticsDashboard';
import CostTrendChart from '@/components/cost/CostTrendChart';
import BudgetGauge from '@/components/cost/BudgetGauge';
import CostBreakdownChart from '@/components/cost/CostBreakdownChart';

describe('Cost Dashboard Components', () => {
  const mockMetrics = {
    totalCost: 150.5,
    averageCostPerMemory: 1.2,
    cacheHitRate: 0.75,
    batchSavings: 45.2,
    totalSavingsByCompression: 60.0,
    costReductionRatio: 0.65,
    recommendedActions: ['Increase cache TTL', 'Enable compression'],
  };

  const mockBreakdown = {
    embedding: 80.5,
    compression: 20.0,
    clustering: 30.0,
    storage: 20.0,
    total: 150.5,
  };

  describe('CostAnalyticsDashboard', () => {
    test('renders dashboard with metrics', () => {
      render(
        <CostAnalyticsDashboard metrics={mockMetrics} breakdown={mockBreakdown} />
      );

      expect(screen.getByText('Total Cost')).toBeInTheDocument();
      expect(screen.getByText('Cache Hit Rate')).toBeInTheDocument();
      expect(screen.getByText('Cost Reduction')).toBeInTheDocument();
    });

    test('displays cost values correctly', () => {
      render(
        <CostAnalyticsDashboard metrics={mockMetrics} breakdown={mockBreakdown} />
      );

      expect(screen.getByText('$150.50')).toBeInTheDocument();
      expect(screen.getByText('75.0%')).toBeInTheDocument();
    });

    test('displays loading state when metrics null', () => {
      render(
        <CostAnalyticsDashboard metrics={null} breakdown={null} />
      );

      expect(screen.getByText('Loading metrics...')).toBeInTheDocument();
    });

    test('displays cost breakdown by operation', () => {
      render(
        <CostAnalyticsDashboard metrics={mockMetrics} breakdown={mockBreakdown} />
      );

      expect(screen.getByText('Embedding')).toBeInTheDocument();
      expect(screen.getByText('Compression')).toBeInTheDocument();
      expect(screen.getByText('Clustering')).toBeInTheDocument();
    });

    test('applies correct color coding for cache hit rate', () => {
      const { container } = render(
        <CostAnalyticsDashboard metrics={mockMetrics} breakdown={mockBreakdown} />
      );

      const cacheElement = screen.getByText('75.0%').closest('p');
      expect(cacheElement).toHaveClass('text-green-600');
    });

    test('renders compression savings section', () => {
      render(
        <CostAnalyticsDashboard metrics={mockMetrics} breakdown={mockBreakdown} />
      );

      expect(screen.getByText('Compression & Storage Savings')).toBeInTheDocument();
      expect(screen.getByText('$60.00')).toBeInTheDocument();
    });
  });

  describe('CostTrendChart', () => {
    test('renders trend chart with default month view', () => {
      render(<CostTrendChart />);

      expect(screen.getByText('Week')).toBeInTheDocument();
      expect(screen.getByText('Month')).toBeInTheDocument();
      expect(screen.getByText('Quarter')).toBeInTheDocument();
    });

    test('displays cost statistics', () => {
      render(<CostTrendChart />);

      expect(screen.getByText('Average')).toBeInTheDocument();
      expect(screen.getByText('Peak')).toBeInTheDocument();
      expect(screen.getByText('Lowest')).toBeInTheDocument();
    });

    test('shows trend indicator', () => {
      render(<CostTrendChart />);

      const trendElement = screen.getByText(/Costs declining/);
      expect(trendElement).toBeInTheDocument();
    });

    test('displays timeframe selection buttons', () => {
      render(<CostTrendChart />);

      const weekBtn = screen.getByText('Week');
      const monthBtn = screen.getByText('Month');
      const quarterBtn = screen.getByText('Quarter');

      expect(weekBtn).toBeInTheDocument();
      expect(monthBtn).toBeInTheDocument();
      expect(quarterBtn).toBeInTheDocument();
    });
  });

  describe('BudgetGauge', () => {
    test('renders budget gauge component', () => {
      render(<BudgetGauge crewId="crew_1" />);

      expect(screen.getByText(/Loading budget/)).toBeInTheDocument();
    });

    test('displays budget actions', () => {
      render(<BudgetGauge crewId="crew_1" />);

      expect(screen.getByText('Increase Budget')).toBeInTheDocument();
      expect(screen.getByText('View History')).toBeInTheDocument();
    });
  });

  describe('CostBreakdownChart', () => {
    test('renders pie chart with breakdown', () => {
      render(<CostBreakdownChart breakdown={mockBreakdown} />);

      expect(screen.getByText('$150.50')).toBeInTheDocument();
    });

    test('displays legend with all operations', () => {
      render(<CostBreakdownChart breakdown={mockBreakdown} />);

      expect(screen.getByText('Embedding')).toBeInTheDocument();
      expect(screen.getByText('Compression')).toBeInTheDocument();
      expect(screen.getByText('Clustering')).toBeInTheDocument();
      expect(screen.getByText('Storage')).toBeInTheDocument();
    });

    test('displays percentages correctly', () => {
      render(<CostBreakdownChart breakdown={mockBreakdown} />);

      // Embedding: 80.5 / 150.5 = 53.5%
      const embeddingPercent = screen.getByText('53.5%');
      expect(embeddingPercent).toBeInTheDocument();
    });

    test('handles loading state', () => {
      render(<CostBreakdownChart breakdown={null} />);

      expect(screen.getByText('Loading breakdown...')).toBeInTheDocument();
    });

    test('shows total cost', () => {
      render(<CostBreakdownChart breakdown={mockBreakdown} />);

      expect(screen.getByText('Total Cost')).toBeInTheDocument();
      expect(screen.getByText('$150.50')).toBeInTheDocument();
    });
  });

  describe('Dashboard Integration', () => {
    test('all components render together', () => {
      const { container } = render(
        <div>
          <CostAnalyticsDashboard metrics={mockMetrics} breakdown={mockBreakdown} />
          <CostTrendChart />
          <CostBreakdownChart breakdown={mockBreakdown} />
        </div>
      );

      expect(container.innerHTML).toMatch(/Total Cost/);
      expect(container.innerHTML).toMatch(/Cost Trend/);
      expect(container.innerHTML).toMatch(/Breakdown/);
    });
  });

  describe('Accessibility', () => {
    test('components have semantic HTML', () => {
      const { container } = render(
        <CostAnalyticsDashboard metrics={mockMetrics} breakdown={mockBreakdown} />
      );

      expect(container.querySelectorAll('h3').length).toBeGreaterThan(0);
    });

    test('SVG charts are accessible', () => {
      const { container } = render(
        <CostBreakdownChart breakdown={mockBreakdown} />
      );

      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThan(0);
    });
  });
});
