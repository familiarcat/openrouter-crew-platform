import { program } from '../index';
import { CrewApiClient } from '../apiClient';
import * as fs from 'fs';

// Mock the entire apiClient module
jest.mock('../apiClient');

const MockedCrewApiClient = CrewApiClient as jest.MockedClass<typeof CrewApiClient>;

describe('crew analytics', () => {
  // Mock fs.writeFileSync
  jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});

  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    MockedCrewApiClient.mockClear();

    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as (code?: number) => never);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe('summary', () => {
    test('should call getAnalyticsSummary and print metrics', async () => {
      // Arrange
      const mockMetrics = {
        totalProjects: 10,
        activeProjects: 3,
        totalMemories: 1200,
        totalSpend: 350.50,
        budgetUtilization: 60.5
      };
      MockedCrewApiClient.prototype.getAnalyticsSummary.mockResolvedValue(mockMetrics);
      const args = ['node', 'crew', 'analytics', 'summary'];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(MockedCrewApiClient.prototype.getAnalyticsSummary).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Platform Analytics Summary'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(`Total:          ${mockMetrics.totalProjects}`));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(`Total Memories: ${mockMetrics.totalMemories}`));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(`Total Spend:    $${mockMetrics.totalSpend.toFixed(2)}`));
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    test('should handle API errors gracefully', async () => {
      // Arrange
      const apiError = new Error('Service unavailable');
      MockedCrewApiClient.prototype.getAnalyticsSummary.mockRejectedValue(apiError);
      const args = ['node', 'crew', 'analytics', 'summary'];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining(`Failed to fetch analytics: ${apiError.message}`));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('insights', () => {
    test('should call getAnalyticsInsights and print table', async () => {
      // Arrange
      const mockInsights = {
        insights: [
          { type: 'warning' as const, message: 'High decay', impact: 'Knowledge loss' },
          { type: 'opportunity' as const, message: 'Use Haiku', impact: 'Save money' }
        ]
      };
      MockedCrewApiClient.prototype.getAnalyticsInsights.mockResolvedValue(mockInsights);
      const args = ['node', 'crew', 'analytics', 'insights'];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(MockedCrewApiClient.prototype.getAnalyticsInsights).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('AI Optimization Insights'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('WARNING'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('High decay'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('OPPORTUNITY'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Use Haiku'));
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    test('should show info message if no insights found', async () => {
      MockedCrewApiClient.prototype.getAnalyticsInsights.mockResolvedValue({ insights: [] });
      const args = ['node', 'crew', 'analytics', 'insights'];
      await program.parseAsync(args);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No insights available'));
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    test('should handle API errors gracefully', async () => {
      const apiError = new Error('AI engine offline');
      MockedCrewApiClient.prototype.getAnalyticsInsights.mockRejectedValue(apiError);
      const args = ['node', 'crew', 'analytics', 'insights'];
      await program.parseAsync(args);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining(`Failed to fetch insights: ${apiError.message}`));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('export', () => {
    test('should call exportAnalytics and print to stdout if no output file', async () => {
      const mockCsv = 'metric,value\ntest,123';
      MockedCrewApiClient.prototype.exportAnalytics.mockResolvedValue(mockCsv);
      const args = ['node', 'crew', 'analytics', 'export'];
      
      await program.parseAsync(args);
      
      expect(MockedCrewApiClient.prototype.exportAnalytics).toHaveBeenCalledWith('csv');
      expect(consoleLogSpy).toHaveBeenCalledWith(mockCsv);
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    test('should write to file if --output is provided', async () => {
      const mockCsv = 'metric,value\ntest,123';
      MockedCrewApiClient.prototype.exportAnalytics.mockResolvedValue(mockCsv);
      const args = ['node', 'crew', 'analytics', 'export', '--output', 'test.csv'];
      
      await program.parseAsync(args);
      
      expect(fs.writeFileSync).toHaveBeenCalledWith('test.csv', mockCsv);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Analytics exported to test.csv'));
    });

    test('should handle API errors gracefully', async () => {
      const apiError = new Error('Export failed');
      MockedCrewApiClient.prototype.exportAnalytics.mockRejectedValue(apiError);
      const args = ['node', 'crew', 'analytics', 'export'];
      
      await program.parseAsync(args);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining(`Failed to export analytics: ${apiError.message}`));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });
});