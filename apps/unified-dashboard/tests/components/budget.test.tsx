/**
 * Budget Components Tests
 * Verify budget allocation, history, and settings components
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import BudgetAllocationChart from '@/components/budget/BudgetAllocationChart';
import BudgetHistoryChart from '@/components/budget/BudgetHistoryChart';
import BudgetAlertSettings from '@/components/budget/BudgetAlertSettings';

describe('Budget Components', () => {
  const mockBudgetData = {
    limit: 500,
    spent: 320,
    remaining: 180,
    percentUsed: 64,
  };

  describe('BudgetAllocationChart', () => {
    test('renders allocation chart with budget data', () => {
      render(<BudgetAllocationChart budget={mockBudgetData} />);

      expect(screen.getByText('64%')).toBeInTheDocument();
      expect(screen.getByText('$500.00')).toBeInTheDocument();
    });

    test('displays spent and remaining amounts', () => {
      render(<BudgetAllocationChart budget={mockBudgetData} />);

      expect(screen.getByText('$320.00')).toBeInTheDocument();
      expect(screen.getByText('$180.00')).toBeInTheDocument();
    });

    test('shows warning when usage is above 75%', () => {
      const highUsageBudget = { ...mockBudgetData, percentUsed: 78, spent: 390, remaining: 110 };
      render(<BudgetAllocationChart budget={highUsageBudget} />);

      expect(screen.getByText('⚠️ Budget usage is high. Consider optimizing costs.')).toBeInTheDocument();
    });

    test('does not show warning for low usage', () => {
      const lowUsageBudget = { ...mockBudgetData, percentUsed: 50, spent: 250, remaining: 250 };
      render(<BudgetAllocationChart budget={lowUsageBudget} />);

      expect(screen.queryByText(/Budget usage is high/)).not.toBeInTheDocument();
    });

    test('renders progress bars correctly', () => {
      const { container } = render(<BudgetAllocationChart budget={mockBudgetData} />);

      const bars = container.querySelectorAll('[style*="width"]');
      expect(bars.length).toBeGreaterThan(0);
    });
  });

  describe('BudgetHistoryChart', () => {
    test('renders history chart with default month view', () => {
      render(<BudgetHistoryChart crewId="crew_1" />);

      expect(screen.getByText('Week')).toBeInTheDocument();
      expect(screen.getByText('Month')).toBeInTheDocument();
    });

    test('displays week data when week button clicked', () => {
      render(<BudgetHistoryChart crewId="crew_1" />);

      const weekBtn = screen.getByText('Week');
      fireEvent.click(weekBtn);

      expect(screen.getByText('Mon')).toBeInTheDocument();
      expect(screen.getByText('Sun')).toBeInTheDocument();
    });

    test('displays month data by default', () => {
      render(<BudgetHistoryChart crewId="crew_1" />);

      expect(screen.getByText('Week 1')).toBeInTheDocument();
      expect(screen.getByText('Week 4')).toBeInTheDocument();
    });

    test('shows chart legend', () => {
      render(<BudgetHistoryChart crewId="crew_1" />);

      expect(screen.getByText('Amount Spent')).toBeInTheDocument();
      expect(screen.getByText('Budget Limit')).toBeInTheDocument();
    });

    test('renders bars for each time period', () => {
      const { container } = render(<BudgetHistoryChart crewId="crew_1" />);

      const bars = container.querySelectorAll('[style*="height"]');
      expect(bars.length).toBeGreaterThan(0);
    });
  });

  describe('BudgetAlertSettings', () => {
    test('renders alert settings component', () => {
      render(<BudgetAlertSettings crewId="crew_1" currentUsage={50} />);

      expect(screen.getByText('Alert Thresholds')).toBeInTheDocument();
      expect(screen.getByText('Notification Channels')).toBeInTheDocument();
    });

    test('displays warning and critical thresholds', () => {
      render(<BudgetAlertSettings crewId="crew_1" currentUsage={50} />);

      expect(screen.getByText('Warning Threshold')).toBeInTheDocument();
      expect(screen.getByText('Critical Threshold')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText('90%')).toBeInTheDocument();
    });

    test('shows email notification option', () => {
      render(<BudgetAlertSettings crewId="crew_1" currentUsage={50} />);

      expect(screen.getByText('📧 Email Notifications')).toBeInTheDocument();
    });

    test('shows webhook notification option', () => {
      render(<BudgetAlertSettings crewId="crew_1" currentUsage={50} />);

      expect(screen.getByText('🔗 Webhook Notifications')).toBeInTheDocument();
    });

    test('toggles notification channels', () => {
      render(<BudgetAlertSettings crewId="crew_1" currentUsage={50} />);

      const emailCheckbox = screen.getByRole('checkbox', { name: /Email Notifications/ });
      fireEvent.click(emailCheckbox);

      expect(emailCheckbox).not.toBeChecked();
    });

    test('shows webhook URL input when enabled', () => {
      render(<BudgetAlertSettings crewId="crew_1" currentUsage={50} />);

      const webhookCheckbox = screen.getByRole('checkbox', { name: /Webhook Notifications/ });
      fireEvent.click(webhookCheckbox);

      expect(screen.getByPlaceholderText('https://example.com/webhook')).toBeInTheDocument();
    });

    test('displays current usage status', () => {
      render(<BudgetAlertSettings crewId="crew_1" currentUsage={64} />);

      expect(screen.getByText('64.0% Used')).toBeInTheDocument();
    });

    test('shows save button and success message', () => {
      render(<BudgetAlertSettings crewId="crew_1" currentUsage={50} />);

      const saveBtn = screen.getByText('Save Settings');
      expect(saveBtn).toBeInTheDocument();

      fireEvent.click(saveBtn);
      expect(screen.getByText('✅ Saved!')).toBeInTheDocument();
    });

    test('applies correct status colors based on usage', () => {
      const { rerender } = render(<BudgetAlertSettings crewId="crew_1" currentUsage={95} />);

      expect(screen.getByText('95.0% Used')).toHaveClass('text-red-600');

      rerender(<BudgetAlertSettings crewId="crew_1" currentUsage={50} />);
      expect(screen.getByText('50.0% Used')).toHaveClass('text-green-600');
    });
  });

  describe('Budget Components Integration', () => {
    test('all components render together', () => {
      const { container } = render(
        <div>
          <BudgetAllocationChart budget={mockBudgetData} />
          <BudgetHistoryChart crewId="crew_1" />
          <BudgetAlertSettings crewId="crew_1" currentUsage={mockBudgetData.percentUsed} />
        </div>
      );

      expect(container.innerHTML).toMatch(/Budget/);
      expect(container.innerHTML).toMatch(/History/);
      expect(container.innerHTML).toMatch(/Alert/);
    });
  });

  describe('Accessibility', () => {
    test('budget allocation chart has semantic structure', () => {
      const { container } = render(<BudgetAllocationChart budget={mockBudgetData} />);

      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    test('budget history chart has semantic structure', () => {
      const { container } = render(<BudgetHistoryChart crewId="crew_1" />);

      expect(container.querySelector('svg')).not.toBeInTheDocument(); // Uses divs instead
    });

    test('alert settings has accessible form controls', () => {
      render(<BudgetAlertSettings crewId="crew_1" currentUsage={50} />);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });
  });
});
