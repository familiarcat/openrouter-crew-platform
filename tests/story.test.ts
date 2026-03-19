import { describe, expect, test, jest, beforeEach, afterEach } from '@jest/globals';
import { program } from '../index';
import { CrewApiClient } from '../apiClient';

// Mock the entire apiClient module
jest.mock('../apiClient');

const MockedCrewApiClient = CrewApiClient as jest.MockedClass<typeof CrewApiClient>;

describe('crew story', () => {
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

  describe('list', () => {
    test('should call listStories and print a table', async () => {
      // Arrange
      const sprintId = 'sprint_123';
      const mockStories = [
        { id: 'story_1', title: 'Setup database schema', status: 'done' as const, points: 5, assignee: 'Geordi La Forge' },
        { id: 'story_2', title: 'Create login page UI', status: 'in-progress' as const, points: 3, assignee: 'Counselor Troi' },
      ];
      MockedCrewApiClient.prototype.listStories.mockResolvedValue(mockStories);
      const args = ['node', 'crew', 'story', 'list', sprintId];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(MockedCrewApiClient.prototype.listStories).toHaveBeenCalledWith(sprintId);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(`Stories for Sprint: ${sprintId}`));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('story_1'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Create login page UI'));
    });

    test('should show an info message if no stories are found', async () => {
        MockedCrewApiClient.prototype.listStories.mockResolvedValue([]);
        const args = ['node', 'crew', 'story', 'list', 'sprint_123'];
        await program.parseAsync(args);
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No stories found for this sprint.'));
    });
  });

  describe('create', () => {
    test('should call createStory with all options', async () => {
      // Arrange
      const sprintId = 'sprint_123';
      const storyTitle = 'New Story';
      const points = '5';
      const mockStory = { id: 'story_new', title: storyTitle, points: 5 };
      MockedCrewApiClient.prototype.createStory.mockResolvedValue(mockStory);

      const args = ['node', 'crew', 'story', 'create', sprintId, storyTitle, '--points', points];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(MockedCrewApiClient.prototype.createStory).toHaveBeenCalledWith({
        sprintId,
        title: storyTitle,
        points: 5,
      });
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(`Story '${storyTitle}' created with ID: ${mockStory.id}`));
    });

    test('should call createStory with default points', async () => {
        const sprintId = 'sprint_123';
        const storyTitle = 'New Story';
        const mockStory = { id: 'story_new', title: storyTitle, points: 0 };
        MockedCrewApiClient.prototype.createStory.mockResolvedValue(mockStory);
  
        const args = ['node', 'crew', 'story', 'create', sprintId, storyTitle];
  
        await program.parseAsync(args);
  
        expect(MockedCrewApiClient.prototype.createStory).toHaveBeenCalledWith({
          sprintId,
          title: storyTitle,
          points: 0,
        });
    });

    test('should handle API errors gracefully', async () => {
        const apiError = new Error('Sprint not found');
        MockedCrewApiClient.prototype.createStory.mockRejectedValue(apiError);
        const args = ['node', 'crew', 'story', 'create', 'sprint_123', 'New Story'];
        await program.parseAsync(args);
        expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining(`Failed to create story: ${apiError.message}`));
        expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('show', () => {
    test('should call getStoryById and print details', async () => {
      // Arrange
      const storyId = 'story_2';
      const mockStory = {
        id: storyId,
        title: 'Create login page UI',
        status: 'in-progress' as const,
        points: 3,
        assignee: 'Counselor Troi',
        sprintId: 'sprint_123'
      };
      MockedCrewApiClient.prototype.getStoryById.mockResolvedValue(mockStory);

      const args = ['node', 'crew', 'story', 'show', storyId];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(MockedCrewApiClient.prototype.getStoryById).toHaveBeenCalledWith(storyId);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(`Story Details: ${mockStory.title}`));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(mockStory.id));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(mockStory.sprintId));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(mockStory.assignee));
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    test('should show an error if story is not found', async () => {
      const storyId = 'story_not_found';
      MockedCrewApiClient.prototype.getStoryById.mockResolvedValue(undefined);

      const args = ['node', 'crew', 'story', 'show', storyId];

      await program.parseAsync(args);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining(`Story with ID "${storyId}" not found.`));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    test('should call updateStory with status', async () => {
      const storyId = 'story_1';
      const status = 'in-progress';
      MockedCrewApiClient.prototype.updateStory.mockResolvedValue({ success: true, updatedId: storyId });
      const args = ['node', 'crew', 'story', 'update', storyId, '--status', status];
      await program.parseAsync(args);
      expect(MockedCrewApiClient.prototype.updateStory).toHaveBeenCalledWith(storyId, { status });
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(`Story with ID "${storyId}" has been updated.`));
    });

    test('should call updateStory with assignee', async () => {
      const storyId = 'story_1';
      const assignee = 'Commander Riker';
      MockedCrewApiClient.prototype.updateStory.mockResolvedValue({ success: true, updatedId: storyId });
      const args = ['node', 'crew', 'story', 'update', storyId, '--assignee', assignee];
      await program.parseAsync(args);
      expect(MockedCrewApiClient.prototype.updateStory).toHaveBeenCalledWith(storyId, { assignee });
    });

    test('should call updateStory with both status and assignee', async () => {
      const storyId = 'story_1';
      const status = 'done';
      const assignee = 'Captain Picard';
      MockedCrewApiClient.prototype.updateStory.mockResolvedValue({ success: true, updatedId: storyId });
      const args = ['node', 'crew', 'story', 'update', storyId, '--status', status, '--assignee', assignee];
      await program.parseAsync(args);
      expect(MockedCrewApiClient.prototype.updateStory).toHaveBeenCalledWith(storyId, { status, assignee });
    });

    test('should show an error if no options are provided', async () => {
      const args = ['node', 'crew', 'story', 'update', 'story_1'];
      await program.parseAsync(args);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('At least one option (--status or --assignee) must be provided.'));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should show an error for invalid status', async () => {
      const args = ['node', 'crew', 'story', 'update', 'story_1', '--status', 'invalid_status'];
      await program.parseAsync(args);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid status. Must be one of: todo, in-progress, done, blocked.'));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should handle API errors gracefully', async () => {
      const apiError = new Error('Update failed');
      MockedCrewApiClient.prototype.updateStory.mockRejectedValue(apiError);
      const args = ['node', 'crew', 'story', 'update', 'story_1', '--status', 'done'];
      await program.parseAsync(args);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining(`Failed to update story: ${apiError.message}`));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('delete', () => {
    test('should call deleteStory with --force flag and succeed', async () => {
      // Arrange
      const storyId = 'story_1';
      MockedCrewApiClient.prototype.deleteStory.mockResolvedValue({ success: true, deletedId: storyId });

      const args = ['node', 'crew', 'story', 'delete', storyId, '--force'];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(MockedCrewApiClient.prototype.deleteStory).toHaveBeenCalledTimes(1);
      expect(MockedCrewApiClient.prototype.deleteStory).toHaveBeenCalledWith(storyId);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(`Story with ID "${storyId}" has been permanently deleted.`));
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    test('should handle API errors gracefully when using --force', async () => {
      // Arrange
      const storyId = 'story-fail-id';
      const apiError = new Error('Deletion failed on server.');
      MockedCrewApiClient.prototype.deleteStory.mockRejectedValue(apiError);

      const args = ['node', 'crew', 'story', 'delete', storyId, '--force'];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(MockedCrewApiClient.prototype.deleteStory).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining(`Failed to delete story: ${apiError.message}`));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should show an error if id argument is missing', async () => {
      const args = ['node', 'crew', 'story', 'delete'];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("error: missing required argument 'story-id'"));
      expect(processExitSpy).toHaveBeenCalled();
    });
  });

  describe('assign', () => {
    test('should call updateStory with the correct assignee', async () => {
      // Arrange
      const storyId = 'story_1';
      const memberName = 'Commander Riker';
      MockedCrewApiClient.prototype.updateStory.mockResolvedValue({ success: true, updatedId: storyId });

      const args = ['node', 'crew', 'story', 'assign', storyId, memberName];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(MockedCrewApiClient.prototype.updateStory).toHaveBeenCalledTimes(1);
      expect(MockedCrewApiClient.prototype.updateStory).toHaveBeenCalledWith(storyId, { assignee: memberName });
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(`Story with ID "${storyId}" has been assigned to ${memberName}.`));
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    test('should handle API errors gracefully', async () => {
      // Arrange
      const apiError = new Error('Assign failed');
      MockedCrewApiClient.prototype.updateStory.mockRejectedValue(apiError);
      const args = ['node', 'crew', 'story', 'assign', 'story_1', 'Commander Riker'];
      await program.parseAsync(args);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining(`Failed to assign story: ${apiError.message}`));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should show an error if member-name argument is missing', async () => {
      const args = ['node', 'crew', 'story', 'assign', 'story_1'];
      await program.parseAsync(args);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("error: missing required argument 'member-name'"));
      expect(processExitSpy).toHaveBeenCalled();
    });
  });

  describe('start', () => {
    test('should call updateStory with status "in-progress"', async () => {
      // Arrange
      const storyId = 'story_1';
      MockedCrewApiClient.prototype.updateStory.mockResolvedValue({ success: true, updatedId: storyId });

      const args = ['node', 'crew', 'story', 'start', storyId];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(MockedCrewApiClient.prototype.updateStory).toHaveBeenCalledTimes(1);
      expect(MockedCrewApiClient.prototype.updateStory).toHaveBeenCalledWith(storyId, { status: 'in-progress' });
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(`Story with ID "${storyId}" is now in progress.`));
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    test('should handle API errors gracefully', async () => {
      // Arrange
      const apiError = new Error('Start failed');
      MockedCrewApiClient.prototype.updateStory.mockRejectedValue(apiError);
      const args = ['node', 'crew', 'story', 'start', 'story_1'];
      await program.parseAsync(args);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining(`Failed to start story: ${apiError.message}`));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should show an error if story-id argument is missing', async () => {
      const args = ['node', 'crew', 'story', 'start'];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("error: missing required argument 'story-id'"));
      expect(processExitSpy).toHaveBeenCalled();
    });
  });

  describe('done', () => {
    test('should call updateStory with status "done"', async () => {
      // Arrange
      const storyId = 'story_1';
      MockedCrewApiClient.prototype.updateStory.mockResolvedValue({ success: true, updatedId: storyId });

      const args = ['node', 'crew', 'story', 'done', storyId];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(MockedCrewApiClient.prototype.updateStory).toHaveBeenCalledTimes(1);
      expect(MockedCrewApiClient.prototype.updateStory).toHaveBeenCalledWith(storyId, { status: 'done' });
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(`Story with ID "${storyId}" has been marked as done.`));
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    test('should handle API errors gracefully', async () => {
      // Arrange
      const apiError = new Error('Done failed');
      MockedCrewApiClient.prototype.updateStory.mockRejectedValue(apiError);
      const args = ['node', 'crew', 'story', 'done', 'story_1'];
      await program.parseAsync(args);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining(`Failed to complete story: ${apiError.message}`));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should show an error if story-id argument is missing', async () => {
      const args = ['node', 'crew', 'story', 'done'];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("error: missing required argument 'story-id'"));
      expect(processExitSpy).toHaveBeenCalled();
    });
  });

  describe('estimate', () => {
    test('should call estimateStory and print the estimation', async () => {
      // Arrange
      const storyId = 'story_1';
      const mockEstimation = {
        storyId,
        suggestedPoints: 5,
        reasoning: 'AI reasoning here',
      };
      MockedCrewApiClient.prototype.estimateStory.mockResolvedValue(mockEstimation);

      const args = ['node', 'crew', 'story', 'estimate', storyId];
      await program.parseAsync(args);

      expect(MockedCrewApiClient.prototype.estimateStory).toHaveBeenCalledWith(storyId);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('AI Estimation for Story'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('5'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('AI reasoning here'));
    });

    test('should handle API errors gracefully', async () => {
      const storyId = 'story_fail';
      const apiError = new Error('Estimation failed');
      MockedCrewApiClient.prototype.estimateStory.mockRejectedValue(apiError);
      const args = ['node', 'crew', 'story', 'estimate', storyId];
      await program.parseAsync(args);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining(`Failed to estimate story: ${apiError.message}`));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('block', () => {
    test('should call updateStory with status "blocked"', async () => {
      // Arrange
      const storyId = 'story_1';
      MockedCrewApiClient.prototype.updateStory.mockResolvedValue({ success: true, updatedId: storyId });

      const args = ['node', 'crew', 'story', 'block', storyId];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(MockedCrewApiClient.prototype.updateStory).toHaveBeenCalledTimes(1);
      expect(MockedCrewApiClient.prototype.updateStory).toHaveBeenCalledWith(storyId, { status: 'blocked' });
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(`Story with ID "${storyId}" has been marked as blocked.`));
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    test('should handle API errors gracefully', async () => {
      // Arrange
      const apiError = new Error('Block failed');
      MockedCrewApiClient.prototype.updateStory.mockRejectedValue(apiError);
      const args = ['node', 'crew', 'story', 'block', 'story_1'];
      await program.parseAsync(args);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining(`Failed to block story: ${apiError.message}`));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should show an error if story-id argument is missing', async () => {
      const args = ['node', 'crew', 'story', 'block'];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("error: missing required argument 'story-id'"));
      expect(processExitSpy).toHaveBeenCalled();
    });
  });

  describe('unblock', () => {
    test('should call updateStory with status "todo"', async () => {
      // Arrange
      const storyId = 'story_1';
      MockedCrewApiClient.prototype.updateStory.mockResolvedValue({ success: true, updatedId: storyId });

      const args = ['node', 'crew', 'story', 'unblock', storyId];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(MockedCrewApiClient.prototype.updateStory).toHaveBeenCalledTimes(1);
      expect(MockedCrewApiClient.prototype.updateStory).toHaveBeenCalledWith(storyId, { status: 'todo' });
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(`Story with ID "${storyId}" has been unblocked and moved to To Do.`));
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    test('should handle API errors gracefully', async () => {
      // Arrange
      const apiError = new Error('Unblock failed');
      MockedCrewApiClient.prototype.updateStory.mockRejectedValue(apiError);
      const args = ['node', 'crew', 'story', 'unblock', 'story_1'];
      await program.parseAsync(args);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining(`Failed to unblock story: ${apiError.message}`));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should show an error if story-id argument is missing', async () => {
      const args = ['node', 'crew', 'story', 'unblock'];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("error: missing required argument 'story-id'"));
      expect(processExitSpy).toHaveBeenCalled();
    });
  });
});