/**
 * Archive Components Tests
 * Verify archive list, stats, and actions components
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ArchiveListPanel from '@/components/archive/ArchiveListPanel';
import ArchiveStatsPanel from '@/components/archive/ArchiveStatsPanel';
import ArchiveActionsPanel from '@/components/archive/ArchiveActionsPanel';

describe('Archive Components', () => {
  const mockStats = {
    totalArchived: 245,
    totalSize: '2.3 GB',
    compressionRatio: 0.68,
    averageAge: 92,
    oldestArchive: '2024-06-15',
    newestArchive: '2026-01-20',
  };

  describe('ArchiveListPanel', () => {
    test('renders archive list panel', () => {
      render(<ArchiveListPanel crewId="crew_1" />);

      expect(screen.getByText('Sort By')).toBeInTheDocument();
      expect(screen.getByText('Filter')).toBeInTheDocument();
    });

    test('displays sort options', () => {
      render(<ArchiveListPanel crewId="crew_1" />);

      const sortSelect = screen.getByDisplayValue('Archived Date');
      expect(sortSelect).toBeInTheDocument();
    });

    test('displays filter options', () => {
      render(<ArchiveListPanel crewId="crew_1" />);

      const filterSelect = screen.getByDisplayValue('All Archives');
      expect(filterSelect).toBeInTheDocument();
    });

    test('shows archived memory items', () => {
      render(<ArchiveListPanel crewId="crew_1" />);

      expect(screen.getByText('mem_1234')).toBeInTheDocument();
      expect(screen.getByText('mem_5678')).toBeInTheDocument();
    });

    test('displays action buttons for each archive', () => {
      const { container } = render(<ArchiveListPanel crewId="crew_1" />);

      const restoreButtons = screen.getAllByText('Restore');
      const deleteButtons = screen.getAllByText('Delete');

      expect(restoreButtons.length).toBeGreaterThan(0);
      expect(deleteButtons.length).toBeGreaterThan(0);
    });

    test('shows compression savings', () => {
      render(<ArchiveListPanel crewId="crew_1" />);

      // Check for percentage calculations
      const savedElements = screen.getAllByText(/Saved/);
      expect(savedElements.length).toBeGreaterThan(0);
    });

    test('allows sorting by size', () => {
      render(<ArchiveListPanel crewId="crew_1" />);

      const sortSelect = screen.getByDisplayValue('Archived Date');
      fireEvent.change(sortSelect, { target: { value: 'size' } });

      expect(screen.getByDisplayValue('Original Size')).toBeInTheDocument();
    });
  });

  describe('ArchiveStatsPanel', () => {
    test('renders stats panel with all metrics', () => {
      render(<ArchiveStatsPanel stats={mockStats} />);

      expect(screen.getByText('Total Memories Archived')).toBeInTheDocument();
      expect(screen.getByText('Total Storage')).toBeInTheDocument();
      expect(screen.getByText('Compression Ratio')).toBeInTheDocument();
      expect(screen.getByText('Average Archive Age')).toBeInTheDocument();
    });

    test('displays correct stat values', () => {
      render(<ArchiveStatsPanel stats={mockStats} />);

      expect(screen.getByText('245')).toBeInTheDocument();
      expect(screen.getByText('2.3 GB')).toBeInTheDocument();
      expect(screen.getByText('68%')).toBeInTheDocument();
      expect(screen.getByText('92 days')).toBeInTheDocument();
    });

    test('shows archive timeline information', () => {
      render(<ArchiveStatsPanel stats={mockStats} />);

      expect(screen.getByText('Archive Timeline')).toBeInTheDocument();
      expect(screen.getByText('Oldest Archive')).toBeInTheDocument();
      expect(screen.getByText('Newest Archive')).toBeInTheDocument();
    });

    test('displays archive distribution chart', () => {
      render(<ArchiveStatsPanel stats={mockStats} />);

      expect(screen.getByText('Archive Distribution by Type')).toBeInTheDocument();
      expect(screen.getByText('Insights')).toBeInTheDocument();
      expect(screen.getByText('Interactions')).toBeInTheDocument();
    });

    test('shows summary statistics', () => {
      render(<ArchiveStatsPanel stats={mockStats} />);

      expect(screen.getByText(/memories successfully archived/)).toBeInTheDocument();
      expect(screen.getByText(/of storage space saved/)).toBeInTheDocument();
    });

    test('renders progress bars for distribution', () => {
      const { container } = render(<ArchiveStatsPanel stats={mockStats} />);

      const progressBars = container.querySelectorAll('[style*="width"]');
      expect(progressBars.length).toBeGreaterThan(0);
    });
  });

  describe('ArchiveActionsPanel', () => {
    test('renders actions panel with all action cards', () => {
      render(<ArchiveActionsPanel crewId="crew_1" />);

      expect(screen.getByText('Archive Old Memories')).toBeInTheDocument();
      expect(screen.getByText('Compress Archives')).toBeInTheDocument();
      expect(screen.getByText('Delete Old Archives')).toBeInTheDocument();
    });

    test('displays action buttons', () => {
      render(<ArchiveActionsPanel crewId="crew_1" />);

      expect(screen.getByText('Start')).toBeInTheDocument();
      expect(screen.getByText('Compress')).toBeInTheDocument();
      expect(screen.getByText('Export')).toBeInTheDocument();
    });

    test('marks dangerous actions with warning', () => {
      render(<ArchiveActionsPanel crewId="crew_1" />);

      const dangerousWarning = screen.getByText('⚠️ DANGEROUS');
      expect(dangerousWarning).toBeInTheDocument();
    });

    test('shows confirmation dialog for dangerous actions', () => {
      render(<ArchiveActionsPanel crewId="crew_1" />);

      // Find and click the delete button
      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);

      expect(screen.getByText('Are you sure?')).toBeInTheDocument();
      expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
    });

    test('displays archive configuration section', () => {
      render(<ArchiveActionsPanel crewId="crew_1" />);

      expect(screen.getByText('Archive Configuration')).toBeInTheDocument();
      expect(screen.getByText('Auto-Archive Threshold (days)')).toBeInTheDocument();
      expect(screen.getByText('Enable Compression')).toBeInTheDocument();
    });

    test('shows recent activity', () => {
      render(<ArchiveActionsPanel crewId="crew_1" />);

      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      expect(screen.getByText('Archived')).toBeInTheDocument();
      expect(screen.getByText('Restored')).toBeInTheDocument();
    });

    test('allows configuration input', () => {
      const { container } = render(<ArchiveActionsPanel crewId="crew_1" />);

      const inputs = container.querySelectorAll('input[type="number"]');
      expect(inputs.length).toBeGreaterThan(0);
    });

    test('toggles configuration checkboxes', () => {
      render(<ArchiveActionsPanel crewId="crew_1" />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();

      fireEvent.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });
  });

  describe('Archive Components Integration', () => {
    test('all components render together', () => {
      const { container } = render(
        <div>
          <ArchiveListPanel crewId="crew_1" />
          <ArchiveStatsPanel stats={mockStats} />
          <ArchiveActionsPanel crewId="crew_1" />
        </div>
      );

      expect(container.innerHTML).toMatch(/Archive/);
    });
  });

  describe('Accessibility', () => {
    test('list panel has semantic controls', () => {
      const { container } = render(<ArchiveListPanel crewId="crew_1" />);

      const selects = container.querySelectorAll('select');
      expect(selects.length).toBeGreaterThan(0);
    });

    test('stats panel has progress bars', () => {
      const { container } = render(<ArchiveStatsPanel stats={mockStats} />);

      const bars = container.querySelectorAll('div[style*="width"]');
      expect(bars.length).toBeGreaterThan(0);
    });

    test('actions panel has interactive buttons', () => {
      render(<ArchiveActionsPanel crewId="crew_1" />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });
});
