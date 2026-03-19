import { describe, expect, test, jest, beforeEach, afterEach } from '@jest/globals';
import { program } from '../index';
import { CrewApiClient } from '../apiClient';

// Mock the entire apiClient module
jest.mock('../apiClient');

const MockedCrewApiClient = CrewApiClient as jest.MockedClass<typeof CrewApiClient>;

describe('crew budget', () => {
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

  describe('get', () => {
    test('should call getBudget and print the limits', async () => {
      // Arrange
      const mockBudget = { dailyLimit: 100.00, monthlyLimit: 3000.00 };
      MockedCrewApiClient.prototype.getBudget.mockResolvedValue(mockBudget);
      const args = ['node', 'crew', 'budget', 'get'];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(MockedCrewApiClient.prototype.getBudget).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Current Budget Limits'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(`$${mockBudget.dailyLimit.toFixed(2)}`));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(`$${mockBudget.monthlyLimit.toFixed(2)}`));
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    test('should handle API errors gracefully', async () => {
      // Arrange
      const apiError = new Error('API is down');
      MockedCrewApiClient.prototype.getBudget.mockRejectedValue(apiError);
      const args = ['node', 'crew', 'budget', 'get'];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining(`Failed to fetch budget: ${apiError.message}`));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('set', () => {
    test('should call setBudget with the correct limit', async () => {
      // Arrange
      const limit = '150.50';
      const parsedLimit = 150.50;
      MockedCrewApiClient.prototype.setBudget.mockResolvedValue({ success: true, newDailyLimit: parsedLimit });
      const args = ['node', 'crew', 'budget', 'set', '--limit', limit];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(MockedCrewApiClient.prototype.setBudget).toHaveBeenCalledTimes(1);
      expect(MockedCrewApiClient.prototype.setBudget).toHaveBeenCalledWith({ limit: parsedLimit });
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(`Daily budget limit successfully set to $${parsedLimit.toFixed(2)}.`));
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    test('should show an error if --limit is not provided', async () => {
      const args = ['node', 'crew', 'budget', 'set'];
      await program.parseAsync(args);
      expect(consoleErrorSpy).toHaveBeenCalledWith('The --limit option is required.');
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test.each(['abc', '-10'])('should show an error for invalid limit value: %s', async (invalidLimit) => {
      const args = ['node', 'crew', 'budget', 'set', '--limit', invalidLimit];
      await program.parseAsync(args);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Invalid limit amount. Must be a non-negative number.');
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should handle API errors gracefully', async () => {
      // Arrange
      const apiError = new Error('Permission denied');
      MockedCrewApiClient.prototype.setBudget.mockRejectedValue(apiError);
      const args = ['node', 'crew', 'budget', 'set', '--limit', '100'];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining(`Failed to set budget: ${apiError.message}`));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });
});