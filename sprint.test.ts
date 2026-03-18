import { program } from '../index';
import { CrewApiClient } from '../apiClient';

// Mock the entire apiClient module
jest.mock('../apiClient');

const MockedCrewApiClient = CrewApiClient as jest.MockedClass<typeof CrewApiClient>;

describe('crew sprint', () => {
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
    test('should call listSprints and print a table', async () => {
      // Arrange
      const projectId = 'proj_123';
      const mockSprints = [
        { id: 'sprint_456', name: 'Sprint 1: Core Setup', status: 'completed' as const, goal: 'Build the basic UI and auth' },
        { id: 'sprint_789', name: 'Sprint 2: Add Features', status: 'active' as const, goal: 'Implement memory and cost tracking' },
      ];
      MockedCrewApiClient.prototype.listSprints.mockResolvedValue(mockSprints);
      const args = ['node', 'crew', 'sprint', 'list', projectId];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(MockedCrewApiClient.prototype.listSprints).toHaveBeenCalledWith(projectId);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(`Sprints for Project: ${projectId}`));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('sprint_456'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Sprint 2: Add Features'));
    });

    test('should show an info message if no sprints are found', async () => {
        MockedCrewApiClient.prototype.listSprints.mockResolvedValue([]);
        const args = ['node', 'crew', 'sprint', 'list', 'proj_123'];
        await program.parseAsync(args);
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No sprints found for this project.'));
    });
  });

  describe('create', () => {
    test('should call createSprint with all options', async () => {
      // Arrange
      const projectId = 'proj_123';
      const sprintName = 'New Sprint';
      const goal = 'A new goal';
      const duration = '21';
      const mockSprint = { id: 'sprint_new', name: sprintName, goal, durationDays: 21 };
      MockedCrewApiClient.prototype.createSprint.mockResolvedValue(mockSprint);

      const args = ['node', 'crew', 'sprint', 'create', projectId, sprintName, '--goal', goal, '--duration', duration];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(MockedCrewApiClient.prototype.createSprint).toHaveBeenCalledWith({
        projectId,
        name: sprintName,
        goal,
        durationDays: 21,
      });
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(`Sprint '${sprintName}' created with ID: ${mockSprint.id}`));
    });

    test('should call createSprint with default options', async () => {
        const projectId = 'proj_123';
        const sprintName = 'New Sprint';
        const mockSprint = { id: 'sprint_new', name: sprintName, goal: 'No goal specified', durationDays: 14 };
        MockedCrewApiClient.prototype.createSprint.mockResolvedValue(mockSprint);
  
        const args = ['node', 'crew', 'sprint', 'create', projectId, sprintName];
  
        await program.parseAsync(args);
  
        expect(MockedCrewApiClient.prototype.createSprint).toHaveBeenCalledWith({
          projectId,
          name: sprintName,
          goal: 'No goal specified',
          durationDays: 14,
        });
    });

    test('should handle API errors gracefully', async () => {
        const apiError = new Error('Project not found');
        MockedCrewApiClient.prototype.createSprint.mockRejectedValue(apiError);
        const args = ['node', 'crew', 'sprint', 'create', 'proj_123', 'New Sprint'];
        await program.parseAsync(args);
        expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining(`Failed to create sprint: ${apiError.message}`));
        expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('show', () => {
    test('should call getSprintById and print details', async () => {
      // Arrange
      const sprintId = 'sprint_789';
      const mockSprint = {
        id: sprintId,
        name: 'Sprint 2: Add Features',
        status: 'active' as const,
        goal: 'Implement memory and cost tracking',
        projectId: 'proj_123'
      };
      MockedCrewApiClient.prototype.getSprintById.mockResolvedValue(mockSprint);

      const args = ['node', 'crew', 'sprint', 'show', sprintId];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(MockedCrewApiClient.prototype.getSprintById).toHaveBeenCalledWith(sprintId);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(`Sprint Details: ${mockSprint.name}`));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(mockSprint.id));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(mockSprint.projectId));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(mockSprint.goal));
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    test('should show an error if sprint is not found', async () => {
      const sprintId = 'sprint_not_found';
      MockedCrewApiClient.prototype.getSprintById.mockResolvedValue(undefined);
      const args = ['node', 'crew', 'sprint', 'show', sprintId];
      await program.parseAsync(args);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining(`Sprint with ID "${sprintId}" not found.`));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    test('should call updateSprint with status', async () => {
      const sprintId = 'sprint_123';
      const status = 'active';
      MockedCrewApiClient.prototype.updateSprint.mockResolvedValue({ success: true, updatedId: sprintId });
      const args = ['node', 'crew', 'sprint', 'update', sprintId, '--status', status];
      await program.parseAsync(args);
      expect(MockedCrewApiClient.prototype.updateSprint).toHaveBeenCalledWith(sprintId, { status });
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(`Sprint with ID "${sprintId}" has been updated.`));
    });

    test('should call updateSprint with goal', async () => {
      const sprintId = 'sprint_123';
      const goal = 'New goal';
      MockedCrewApiClient.prototype.updateSprint.mockResolvedValue({ success: true, updatedId: sprintId });
      const args = ['node', 'crew', 'sprint', 'update', sprintId, '--goal', goal];
      await program.parseAsync(args);
      expect(MockedCrewApiClient.prototype.updateSprint).toHaveBeenCalledWith(sprintId, { goal });
    });

    test('should call updateSprint with both status and goal', async () => {
      const sprintId = 'sprint_123';
      const status = 'completed';
      const goal = 'Final goal';
      MockedCrewApiClient.prototype.updateSprint.mockResolvedValue({ success: true, updatedId: sprintId });
      const args = ['node', 'crew', 'sprint', 'update', sprintId, '--status', status, '--goal', goal];
      await program.parseAsync(args);
      expect(MockedCrewApiClient.prototype.updateSprint).toHaveBeenCalledWith(sprintId, { status, goal });
    });

    test('should show an error if no options are provided', async () => {
      const args = ['node', 'crew', 'sprint', 'update', 'sprint_123'];
      await program.parseAsync(args);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('At least one option (--status or --goal) must be provided.'));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should show an error for invalid status', async () => {
      const args = ['node', 'crew', 'sprint', 'update', 'sprint_123', '--status', 'invalid_status'];
      await program.parseAsync(args);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid status. Must be one of: planned, active, completed.'));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should handle API errors gracefully', async () => {
      const apiError = new Error('Update failed');
      MockedCrewApiClient.prototype.updateSprint.mockRejectedValue(apiError);
      const args = ['node', 'crew', 'sprint', 'update', 'sprint_123', '--status', 'active'];
      await program.parseAsync(args);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining(`Failed to update sprint: ${apiError.message}`));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('start', () => {
    test('should call updateSprint with status "active"', async () => {
      const sprintId = 'sprint_123';
      MockedCrewApiClient.prototype.updateSprint.mockResolvedValue({ success: true, updatedId: sprintId });
      const args = ['node', 'crew', 'sprint', 'start', sprintId];
      await program.parseAsync(args);
      expect(MockedCrewApiClient.prototype.updateSprint).toHaveBeenCalledWith(sprintId, { status: 'active' });
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(`Sprint with ID "${sprintId}" is now active.`));
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    test('should handle API errors gracefully', async () => {
      const apiError = new Error('Start failed');
      MockedCrewApiClient.prototype.updateSprint.mockRejectedValue(apiError);
      const args = ['node', 'crew', 'sprint', 'start', 'sprint_123'];
      await program.parseAsync(args);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining(`Failed to start sprint: ${apiError.message}`));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('complete', () => {
    test('should call updateSprint with status "completed"', async () => {
      const sprintId = 'sprint_123';
      MockedCrewApiClient.prototype.updateSprint.mockResolvedValue({ success: true, updatedId: sprintId });
      const args = ['node', 'crew', 'sprint', 'complete', sprintId];
      await program.parseAsync(args);
      expect(MockedCrewApiClient.prototype.updateSprint).toHaveBeenCalledWith(sprintId, { status: 'completed' });
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(`Sprint with ID "${sprintId}" has been marked as completed.`));
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    test('should handle API errors gracefully', async () => {
      const apiError = new Error('Complete failed');
      MockedCrewApiClient.prototype.updateSprint.mockRejectedValue(apiError);
      const args = ['node', 'crew', 'sprint', 'complete', 'sprint_123'];
      await program.parseAsync(args);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining(`Failed to complete sprint: ${apiError.message}`));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });
});