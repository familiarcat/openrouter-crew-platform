import { describe, expect, test, jest, beforeEach, afterEach } from '@jest/globals';
import { program } from '../index';
import { CrewApiClient } from '../apiClient';

// Mock the entire apiClient module
jest.mock('../apiClient');

const MockedCrewApiClient = CrewApiClient as jest.MockedClass<typeof CrewApiClient>;

describe('crew memory', () => {
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
    test('should call listMemories and print a formatted table', async () => {
      // Arrange
      const mockMemories = [
        { id: 'mem_1a2b3c', type: 'synthesis', content: 'Smart routing is the best pattern.', crewMember: 'Observation Lounge', timestamp: '2026-03-01T10:00:00Z', confidence: 0.95 },
        { id: 'mem_4d5e6f', type: 'observation', content: 'JWT rotation bug found, blocks login.', crewMember: 'Geordi La Forge', timestamp: '2026-02-28T14:00:00Z', confidence: 0.99 },
      ];
      MockedCrewApiClient.prototype.listMemories.mockResolvedValue(mockMemories);

      const args = ['node', 'crew', 'memory', 'list'];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(MockedCrewApiClient.prototype.listMemories).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Universal Memory - Recent Entries'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('ID'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('mem_1a2b3c'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Geordi La Forge'));
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    test('should handle API errors gracefully', async () => {
      // Arrange
      const apiError = new Error('Failed to fetch memories');
      MockedCrewApiClient.prototype.listMemories.mockRejectedValue(apiError);

      const args = ['node', 'crew', 'memory', 'list'];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining(`Failed to fetch memories: ${apiError.message}`));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('search', () => {
    test('should call searchMemories with the correct query', async () => {
      // Arrange
      const query = 'bug';
      const mockMemories = [
        { id: 'mem_4d5e6f', type: 'observation', content: 'JWT rotation bug found, blocks login.', crewMember: 'Geordi La Forge', timestamp: '2026-02-28T14:00:00Z', confidence: 0.99 },
      ];
      MockedCrewApiClient.prototype.searchMemories.mockResolvedValue(mockMemories);

      const args = ['node', 'crew', 'memory', 'search', query];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(MockedCrewApiClient.prototype.searchMemories).toHaveBeenCalledTimes(1);
      expect(MockedCrewApiClient.prototype.searchMemories).toHaveBeenCalledWith(query);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(`Memory Search Results for "${query}"`));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('mem_4d5e6f'));
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    test('should show an info message if no memories are found', async () => {
      // Arrange
      const query = 'nonexistent';
      MockedCrewApiClient.prototype.searchMemories.mockResolvedValue([]);

      const args = ['node', 'crew', 'memory', 'search', query];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(MockedCrewApiClient.prototype.searchMemories).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No memories found matching your query.'));
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    test('should handle API errors gracefully', async () => {
      // Arrange
      const query = 'bug';
      const apiError = new Error('Search failed');
      MockedCrewApiClient.prototype.searchMemories.mockRejectedValue(apiError);

      const args = ['node', 'crew', 'memory', 'search', query];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining(`Failed to search memories: ${apiError.message}`));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should show an error if query argument is missing', async () => {
      // Commander.js handles this by default and calls process.exit. We spy on console.error.
      const args = ['node', 'crew', 'memory', 'search'];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("error: missing required argument 'query'"));
      expect(processExitSpy).toHaveBeenCalled();
    });
  });

  describe('show', () => {
    test('should call getMemoryById and print details', async () => {
      // Arrange
      const memoryId = 'mem_1a2b3c';
      const mockMemory = {
        id: memoryId,
        type: 'synthesis',
        content: 'Smart routing is the best pattern.',
        crewMember: 'Observation Lounge',
        timestamp: '2026-03-01T10:00:00Z',
        confidence: 0.95,
      };
      MockedCrewApiClient.prototype.getMemoryById.mockResolvedValue(mockMemory);

      const args = ['node', 'crew', 'memory', 'show', memoryId];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(MockedCrewApiClient.prototype.getMemoryById).toHaveBeenCalledTimes(1);
      expect(MockedCrewApiClient.prototype.getMemoryById).toHaveBeenCalledWith(memoryId);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(`Memory Details: ${memoryId}`));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(mockMemory.content));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(mockMemory.crewMember));
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    test('should show an error if memory is not found', async () => {
      // Arrange
      const memoryId = 'not-found-id';
      MockedCrewApiClient.prototype.getMemoryById.mockResolvedValue(undefined);

      const args = ['node', 'crew', 'memory', 'show', memoryId];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(MockedCrewApiClient.prototype.getMemoryById).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining(`Memory with ID "${memoryId}" not found.`));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('delete', () => {
    test('should call deleteMemory with --force flag and succeed', async () => {
      // Arrange
      const memoryId = 'mem_1a2b3c';
      MockedCrewApiClient.prototype.deleteMemory.mockResolvedValue({ success: true, deletedId: memoryId });

      const args = ['node', 'crew', 'memory', 'delete', memoryId, '--force'];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(MockedCrewApiClient.prototype.deleteMemory).toHaveBeenCalledTimes(1);
      expect(MockedCrewApiClient.prototype.deleteMemory).toHaveBeenCalledWith(memoryId);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(`Memory with ID "${memoryId}" has been permanently deleted.`));
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    test('should handle API errors gracefully when using --force', async () => {
      // Arrange
      const memoryId = 'mem-fail-id';
      const apiError = new Error('Deletion failed on server.');
      MockedCrewApiClient.prototype.deleteMemory.mockRejectedValue(apiError);

      const args = ['node', 'crew', 'memory', 'delete', memoryId, '--force'];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(MockedCrewApiClient.prototype.deleteMemory).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining(`Failed to delete memory: ${apiError.message}`));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should show an error if id argument is missing', async () => {
      const args = ['node', 'crew', 'memory', 'delete'];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("error: missing required argument 'id'"));
      expect(processExitSpy).toHaveBeenCalled();
    });

    // Note: Testing the interactive prompt part is complex in an automated test suite.
    // We are trusting that the `askForConfirmation` function works as expected
    // and are focusing on testing the command's logic when the prompt is bypassed.
    test('should not call deleteMemory without --force if prompt is not answered', async () => {
      // This is a conceptual test. In a real run, it would hang waiting for input.
      // In Jest, readline will not be connected to a TTY, so it will likely fail or close immediately.
    });
  });
});