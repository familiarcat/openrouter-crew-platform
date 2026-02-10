/**
 * Analytics Components Tests
 * Verify analytics insights, topics, and recommendations components
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AnalyticsInsightsPanel from '@/components/analytics/AnalyticsInsightsPanel';
import AnalyticsTopicsChart from '@/components/analytics/AnalyticsTopicsChart';
import AnalyticsRecommendationsPanel from '@/components/analytics/AnalyticsRecommendationsPanel';

describe('Analytics Components', () => {
  const mockAnalyticsData = {
    crewId: 'crew_1',
    totalMemories: 1250,
    averageConfidence: 0.82,
    retentionRate: 0.94,
    accessPatterns: 3,
  };

  const mockTopics = ['Performance Optimization', 'API Design', 'Database Queries', 'Cache Strategy'];

  describe('AnalyticsInsightsPanel', () => {
    test('renders insights panel with all metrics', () => {
      render(<AnalyticsInsightsPanel analytics={mockAnalyticsData} />);

      expect(screen.getByText('Memory Quality')).toBeInTheDocument();
      expect(screen.getByText('Retention Health')).toBeInTheDocument();
      expect(screen.getByText('Access Patterns')).toBeInTheDocument();
      expect(screen.getByText('Total Memories')).toBeInTheDocument();
    });

    test('displays correct metric values', () => {
      render(<AnalyticsInsightsPanel analytics={mockAnalyticsData} />);

      expect(screen.getByText('82%')).toBeInTheDocument(); // averageConfidence
      expect(screen.getByText('94%')).toBeInTheDocument(); // retentionRate
      expect(screen.getByText('3')).toBeInTheDocument(); // accessPatterns
      expect(screen.getByText('1250')).toBeInTheDocument(); // totalMemories
    });

    test('shows good status for high confidence', () => {
      render(<AnalyticsInsightsPanel analytics={mockAnalyticsData} />);

      const confidenceSection = screen.getByText('82%').closest('div');
      expect(confidenceSection).toHaveClass('bg-green-50');
    });

    test('shows warning status for low retention', () => {
      const lowRetentionData = { ...mockAnalyticsData, retentionRate: 0.75 };
      render(<AnalyticsInsightsPanel analytics={lowRetentionData} />);

      const retentionSection = screen.getByText('75%').closest('div');
      expect(retentionSection).toHaveClass('bg-yellow-50');
    });

    test('displays summary insights', () => {
      render(<AnalyticsInsightsPanel analytics={mockAnalyticsData} />);

      expect(screen.getByText(/memory system is performing well/)).toBeInTheDocument();
      expect(screen.getByText(/Confidence levels are consistently high/)).toBeInTheDocument();
    });

    test('shows progress bars for percentage metrics', () => {
      const { container } = render(<AnalyticsInsightsPanel analytics={mockAnalyticsData} />);

      const progressBars = container.querySelectorAll('.bg-green-500');
      expect(progressBars.length).toBeGreaterThan(0);
    });
  });

  describe('AnalyticsTopicsChart', () => {
    test('renders topics chart with all topics', () => {
      render(<AnalyticsTopicsChart topics={mockTopics} />);

      mockTopics.forEach(topic => {
        expect(screen.getByText(topic)).toBeInTheDocument();
      });
    });

    test('displays week and month timeframe buttons', () => {
      render(<AnalyticsTopicsChart topics={mockTopics} />);

      expect(screen.getByText('Week')).toBeInTheDocument();
      expect(screen.getByText('Month')).toBeInTheDocument();
    });

    test('toggles between timeframes', () => {
      render(<AnalyticsTopicsChart topics={mockTopics} />);

      const weekBtn = screen.getByText('Week');
      fireEvent.click(weekBtn);

      const monthBtn = screen.getByText('Month');
      expect(monthBtn).toBeInTheDocument();
    });

    test('displays frequency bars for each topic', () => {
      const { container } = render(<AnalyticsTopicsChart topics={mockTopics} />);

      const bars = container.querySelectorAll('[style*="width"]');
      expect(bars.length).toBeGreaterThan(0);
    });

    test('shows trend indicators', () => {
      render(<AnalyticsTopicsChart topics={mockTopics} />);

      const trendElements = screen.getAllByText(/↑|↓/);
      expect(trendElements.length).toBeGreaterThan(0);
    });

    test('displays topic insights summary', () => {
      render(<AnalyticsTopicsChart topics={mockTopics} />);

      expect(screen.getByText(/Most accessed topic/)).toBeInTheDocument();
      expect(screen.getByText(/Total unique topics/)).toBeInTheDocument();
    });
  });

  describe('AnalyticsRecommendationsPanel', () => {
    test('renders recommendations panel', () => {
      render(<AnalyticsRecommendationsPanel crewId="crew_1" />);

      expect(screen.getByText('Archive Old Memories')).toBeInTheDocument();
      expect(screen.getByText('Increase Cache TTL')).toBeInTheDocument();
    });

    test('displays recommendation descriptions', () => {
      render(<AnalyticsRecommendationsPanel crewId="crew_1" />);

      expect(screen.getByText(/could be archived to improve performance/)).toBeInTheDocument();
      expect(screen.getByText(/would benefit from longer caching periods/)).toBeInTheDocument();
    });

    test('shows action buttons for each recommendation', () => {
      render(<AnalyticsRecommendationsPanel crewId="crew_1" />);

      const actionButtons = screen.getAllByText(/Archive|Update|Optimize|Review/);
      expect(actionButtons.length).toBeGreaterThan(0);
    });

    test('displays impact levels correctly', () => {
      render(<AnalyticsRecommendationsPanel crewId="crew_1" />);

      expect(screen.getByText(/High Impact/)).toBeInTheDocument();
      expect(screen.getByText(/Medium Impact/)).toBeInTheDocument();
      expect(screen.getByText(/Low Impact/)).toBeInTheDocument();
    });

    test('shows summary stats', () => {
      render(<AnalyticsRecommendationsPanel crewId="crew_1" />);

      expect(screen.getByText('High Priority')).toBeInTheDocument();
      expect(screen.getByText('Medium Priority')).toBeInTheDocument();
      expect(screen.getByText('Low Priority')).toBeInTheDocument();
    });

    test('displays action buttons', () => {
      render(<AnalyticsRecommendationsPanel crewId="crew_1" />);

      expect(screen.getByText('Apply All Recommendations')).toBeInTheDocument();
      expect(screen.getByText('Dismiss')).toBeInTheDocument();
    });

    test('applies correct styling based on impact', () => {
      const { container } = render(<AnalyticsRecommendationsPanel crewId="crew_1" />);

      const redBorders = container.querySelectorAll('.border-red-500');
      expect(redBorders.length).toBeGreaterThan(0);
    });
  });

  describe('Analytics Components Integration', () => {
    test('all components render together', () => {
      const { container } = render(
        <div>
          <AnalyticsInsightsPanel analytics={mockAnalyticsData} />
          <AnalyticsTopicsChart topics={mockTopics} />
          <AnalyticsRecommendationsPanel crewId="crew_1" />
        </div>
      );

      expect(container.innerHTML).toMatch(/Insights|Topics|Recommendations/);
    });
  });

  describe('Accessibility', () => {
    test('insights panel has semantic structure', () => {
      const { container } = render(<AnalyticsInsightsPanel analytics={mockAnalyticsData} />);

      const headings = container.querySelectorAll('h3');
      expect(headings.length).toBeGreaterThan(0);
    });

    test('topics chart has timeframe buttons', () => {
      render(<AnalyticsTopicsChart topics={mockTopics} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    test('recommendations has action buttons', () => {
      render(<AnalyticsRecommendationsPanel crewId="crew_1" />);

      const actionButtons = screen.getAllByRole('button');
      expect(actionButtons.length).toBeGreaterThan(0);
    });
  });
});
