import { describe, expect, test, jest, beforeEach, afterEach } from '@jest/globals';
import { program } from '../index';
import { CrewApiClient } from '../apiClient';

// Mock the entire apiClient module
jest.mock('../apiClient');

const MockedCrewApiClient = CrewApiClient as jest.MockedClass<typeof CrewApiClient>;

describe('crew team', () => {
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

  describe('list', () => {
    test('should call listTeamMembers and print a formatted table', async () => {
      // Arrange
      const mockTeam = [
        { name: 'Captain Picard', role: 'Strategic Leader', status: 'Available', workload: 45, model: 'claude-3.5-sonnet' },
        { name: 'Commander Riker', role: 'Tactical Execution', status: 'Busy', workload: 90, model: 'claude-3.5-sonnet' },
      ];
      MockedCrewApiClient.prototype.listTeamMembers.mockResolvedValue(mockTeam);

      const args = ['node', 'crew', 'team', 'list'];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(MockedCrewApiClient.prototype.listTeamMembers).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Crew Roster Status'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Member'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Captain Picard'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Commander Riker'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Available'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Busy'));
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    test('should handle API errors gracefully', async () => {
      // Arrange
      const apiError = new Error('Failed to fetch roster');
      MockedCrewApiClient.prototype.listTeamMembers.mockRejectedValue(apiError);

      const args = ['node', 'crew', 'team', 'list'];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining(`Failed to fetch team list: ${apiError.message}`));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('assign', () => {
    test('should call assignTask with correct member and task', async () => {
      // Arrange
      const member = 'Commander Data';
      const task = 'Analyze cost overruns';
      const mockResponse = { success: true, taskId: 'task_123' };
      MockedCrewApiClient.prototype.assignTask.mockResolvedValue(mockResponse);

      const args = ['node', 'crew', 'team', 'assign', member, task];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(MockedCrewApiClient.prototype.assignTask).toHaveBeenCalledTimes(1);
      expect(MockedCrewApiClient.prototype.assignTask).toHaveBeenCalledWith({ member, task });
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(`Task assigned successfully to ${member}.`));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(`Task ID: ${mockResponse.taskId}`));
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    test('should handle API errors gracefully', async () => {
      // Arrange
      const member = 'Commander Data';
      const task = 'Analyze cost overruns';
      const apiError = new Error('Assignment failed');
      MockedCrewApiClient.prototype.assignTask.mockRejectedValue(apiError);

      const args = ['node', 'crew', 'team', 'assign', member, task];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining(`Failed to assign task: ${apiError.message}`));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should show an error if required arguments are missing', async () => {
      // Commander.js handles this by default and calls process.exit. We spy on console.error.
      const args = ['node', 'crew', 'team', 'assign', 'JustOneArg'];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("error: missing required argument 'task'"));
      expect(processExitSpy).toHaveBeenCalled();
    });
  });
});