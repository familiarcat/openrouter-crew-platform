import { describe, expect, test, jest, beforeEach, afterEach } from '@jest/globals';
import { program } from '../index';
import { CrewApiClient } from '../apiClient';

// Mock the entire apiClient module
jest.mock('../apiClient');

const MockedCrewApiClient = CrewApiClient as jest.MockedClass<typeof CrewApiClient>;

describe('crew cost', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    MockedCrewApiClient.mockClear();

    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    // Mock process.exit to prevent tests from stopping the test runner
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as (code?: number) => never);
  });

  afterEach(() => {
    // Restore original implementations
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe('status', () => {
    test('should call getCostStatus and print a formatted report', async () => {
      // Arrange
      const mockStatus = {
        dailySpent: 23.50,
        dailyBudget: 100.00,
        monthlySpent: 342.50,
        monthlyBudget: 3000.00,
      };
      MockedCrewApiClient.prototype.getCostStatus.mockResolvedValue(mockStatus);

      const args = ['node', 'crew', 'cost', 'status'];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(MockedCrewApiClient.prototype.getCostStatus).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Cost Status'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(`$${mockStatus.dailySpent.toFixed(2)}`));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(`$${mockStatus.monthlySpent.toFixed(2)}`));
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    test('should handle API errors gracefully', async () => {
      // Arrange
      const apiError = new Error('Failed to fetch status');
      MockedCrewApiClient.prototype.getCostStatus.mockRejectedValue(apiError);

      const args = ['node', 'crew', 'cost', 'status'];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining(`Failed to fetch cost status: ${apiError.message}`));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('forecast', () => {
    test('should call getCostForecast with default days (30)', async () => {
      // Arrange
      const mockForecast = { projectedCost: 342.6, periodDays: 30 };
      MockedCrewApiClient.prototype.getCostForecast.mockResolvedValue(mockForecast);

      const args = ['node', 'crew', 'cost', 'forecast'];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(MockedCrewApiClient.prototype.getCostForecast).toHaveBeenCalledTimes(1);
      expect(MockedCrewApiClient.prototype.getCostForecast).toHaveBeenCalledWith({ days: 30 });
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Cost Forecast (30 Days)'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(`$${mockForecast.projectedCost.toFixed(2)}`));
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    test('should call getCostForecast with custom --days value', async () => {
      // Arrange
      const mockForecast = { projectedCost: 160, periodDays: 14 };
      MockedCrewApiClient.prototype.getCostForecast.mockResolvedValue(mockForecast);

      const args = ['node', 'crew', 'cost', 'forecast', '--days', '14'];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(MockedCrewApiClient.prototype.getCostForecast).toHaveBeenCalledTimes(1);
      expect(MockedCrewApiClient.prototype.getCostForecast).toHaveBeenCalledWith({ days: 14 });
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Cost Forecast (14 Days)'));
    });

    test('should handle API errors gracefully', async () => {
      // Arrange
      const apiError = new Error('Forecast failed');
      MockedCrewApiClient.prototype.getCostForecast.mockRejectedValue(apiError);

      const args = ['node', 'crew', 'cost', 'forecast'];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining(`Failed to generate cost forecast: ${apiError.message}`));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test.each(['abc', '0', '-10'])('should exit with an error for invalid days value: %s', async (invalidDays) => {
      const args = ['node', 'crew', 'cost', 'forecast', '--days', invalidDays];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid number of days. Must be a positive integer.'));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });
});