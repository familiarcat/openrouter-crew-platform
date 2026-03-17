import { program } from '../index';
import { CrewApiClient } from '../apiClient';

// Mock the entire apiClient module
jest.mock('../apiClient');

const MockedCrewApiClient = CrewApiClient as jest.MockedClass<typeof CrewApiClient>;

describe('crew project', () => {
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

  describe('new', () => {
    test('should call all API methods with correct arguments on success', async () => {
      // Arrange
      const mockProjectId = 'proj_123';
      const mockProject = { id: mockProjectId, name: 'Test Project', createdAt: new Date().toISOString() };
      const mockSprint = { id: 'sprint_456', name: 'Sprint 1', goal: 'Test Goal', durationDays: 10 };

      // Mock the implementation of the API client's prototype methods
      MockedCrewApiClient.prototype.createProject.mockResolvedValue(mockProject);
      MockedCrewApiClient.prototype.setProjectBudget.mockResolvedValue({ success: true, budget: 500 });
      MockedCrewApiClient.prototype.createSprint.mockResolvedValue(mockSprint);

      const args = [
        'node',
        'crew',
        'project',
        'new',
        'Test Project',
        '500',
        'Sprint 1',
        'Test Goal',
        '--duration',
        '10',
      ];

      // Act
      await program.parseAsync(args);

      // Assert
      // Check that createProject was called correctly
      expect(MockedCrewApiClient.prototype.createProject).toHaveBeenCalledTimes(1);
      expect(MockedCrewApiClient.prototype.createProject).toHaveBeenCalledWith({ name: 'Test Project' });

      // Check that setProjectBudget was called correctly
      expect(MockedCrewApiClient.prototype.setProjectBudget).toHaveBeenCalledTimes(1);
      expect(MockedCrewApiClient.prototype.setProjectBudget).toHaveBeenCalledWith({ projectId: mockProjectId, budget: 500 });

      // Check that createSprint was called correctly
      expect(MockedCrewApiClient.prototype.createSprint).toHaveBeenCalledTimes(1);
      expect(MockedCrewApiClient.prototype.createSprint).toHaveBeenCalledWith({
        projectId: mockProjectId,
        name: 'Sprint 1',
        goal: 'Test Goal',
        durationDays: 10,
      });

      // Check for success logs
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("🎉 Project setup complete for 'Test Project'."));
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    test('should use default duration of 14 days if not provided', async () => {
      // Arrange
      const mockProject = { id: 'proj_123', name: 'Test Project', createdAt: new Date().toISOString() };
      MockedCrewApiClient.prototype.createProject.mockResolvedValue(mockProject);
      MockedCrewApiClient.prototype.setProjectBudget.mockResolvedValue({ success: true, budget: 500 });
      MockedCrewApiClient.prototype.createSprint.mockResolvedValue({ id: 'sprint_456', name: 'Sprint 1', goal: 'Test Goal', durationDays: 14 });

      const args = [
        'node',
        'crew',
        'project',
        'new',
        'Test Project',
        '500',
        'Sprint 1',
        'Test Goal',
      ];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(MockedCrewApiClient.prototype.createSprint).toHaveBeenCalledWith(expect.objectContaining({
        durationDays: 14,
      }));
    });

    test('should exit with an error if createProject fails', async () => {
      // Arrange
      const apiError = new Error('API Failed');
      MockedCrewApiClient.prototype.createProject.mockRejectedValue(apiError);

      const args = ['node', 'crew', 'project', 'new', 'Fail Project', '500', 'Sprint 1', 'Test Goal'];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(MockedCrewApiClient.prototype.createProject).toHaveBeenCalledTimes(1);
      expect(MockedCrewApiClient.prototype.setProjectBudget).not.toHaveBeenCalled();
      expect(MockedCrewApiClient.prototype.createSprint).not.toHaveBeenCalled();

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining(`Project setup failed: ${apiError.message}`));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should exit with an error for invalid budget amount', async () => {
      // Arrange
      const mockProject = { id: 'proj_123', name: 'Test Project', createdAt: new Date().toISOString() };
      MockedCrewApiClient.prototype.createProject.mockResolvedValue(mockProject);

      const args = ['node', 'crew', 'project', 'new', 'Test Project', 'not-a-number', 'Sprint 1', 'Test Goal'];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(MockedCrewApiClient.prototype.createProject).toHaveBeenCalledTimes(1);
      expect(MockedCrewApiClient.prototype.setProjectBudget).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid budget amount: "not-a-number"'));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('info', () => {
    test('should call getProjectById and print details', async () => {
      // Arrange
      const projectId = 'proj_123';
      const mockProject = {
        id: projectId,
        name: 'AI Dashboard',
        createdAt: '2026-02-15T10:00:00Z',
        budget: { limit: 500.00, spent: 125.50 },
        sprints: [{ id: 'sprint_456', name: 'Sprint 1: Core Setup', goal: 'Build the basic UI and auth' }],
      };
      MockedCrewApiClient.prototype.getProjectById.mockResolvedValue(mockProject);

      const args = ['node', 'crew', 'project', 'info', projectId];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(MockedCrewApiClient.prototype.getProjectById).toHaveBeenCalledTimes(1);
      expect(MockedCrewApiClient.prototype.getProjectById).toHaveBeenCalledWith(projectId);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(`Project Details: ${mockProject.name}`));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(mockProject.id));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(`$${mockProject.budget.spent.toFixed(2)}`));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('sprint_456'));
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    test('should show an error if project is not found', async () => {
      // Arrange
      const projectId = 'not-found-id';
      MockedCrewApiClient.prototype.getProjectById.mockResolvedValue(undefined);

      const args = ['node', 'crew', 'project', 'info', projectId];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(MockedCrewApiClient.prototype.getProjectById).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining(`Project with ID "${projectId}" not found.`));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('list', () => {
    test('should call listProjects and print a table', async () => {
      // Arrange
      const mockProjects = [
        { id: 'proj_123', name: 'AI Dashboard', status: 'active', budget: { limit: 500, spent: 125 } },
        { id: 'proj_456', name: 'DJ Booking App', status: 'archived', budget: { limit: 1000, spent: 1000 } },
      ];
      MockedCrewApiClient.prototype.listProjects.mockResolvedValue(mockProjects);
      const args = ['node', 'crew', 'project', 'list'];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(MockedCrewApiClient.prototype.listProjects).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('All Projects'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('ID')); // table header
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('proj_123'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('AI Dashboard'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('DJ Booking App'));
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    test('should show an info message if no projects are found', async () => {
        // Arrange
        MockedCrewApiClient.prototype.listProjects.mockResolvedValue([]);
        const args = ['node', 'crew', 'project', 'list'];

        // Act
        await program.parseAsync(args);

        // Assert
        expect(MockedCrewApiClient.prototype.listProjects).toHaveBeenCalledTimes(1);
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No projects found.'));
        expect(processExitSpy).not.toHaveBeenCalled();
    });

    test('should handle API errors gracefully', async () => {
      // Arrange
      const apiError = new Error('Database connection failed');
      MockedCrewApiClient.prototype.listProjects.mockRejectedValue(apiError);
      const args = ['node', 'crew', 'project', 'list'];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining(`Failed to list projects: ${apiError.message}`));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('delete', () => {
    test('should call deleteProject with --force flag and succeed', async () => {
      // Arrange
      const projectId = 'proj_123';
      MockedCrewApiClient.prototype.deleteProject.mockResolvedValue({ success: true, deletedId: projectId });

      const args = ['node', 'crew', 'project', 'delete', projectId, '--force'];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(MockedCrewApiClient.prototype.deleteProject).toHaveBeenCalledTimes(1);
      expect(MockedCrewApiClient.prototype.deleteProject).toHaveBeenCalledWith(projectId);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(`Project with ID "${projectId}" has been permanently deleted.`));
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    test('should handle API errors gracefully when using --force', async () => {
      // Arrange
      const projectId = 'proj-fail-id';
      const apiError = new Error('Deletion failed on server.');
      MockedCrewApiClient.prototype.deleteProject.mockRejectedValue(apiError);

      const args = ['node', 'crew', 'project', 'delete', projectId, '--force'];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(MockedCrewApiClient.prototype.deleteProject).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining(`Failed to delete project: ${apiError.message}`));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should show an error if id argument is missing', async () => {
      const args = ['node', 'crew', 'project', 'delete'];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("error: missing required argument 'id'"));
      expect(processExitSpy).toHaveBeenCalled();
    });
  });

  describe('archive', () => {
    test('should call archiveProject with --force flag and succeed', async () => {
      // Arrange
      const projectId = 'proj_123';
      MockedCrewApiClient.prototype.archiveProject.mockResolvedValue({ success: true, archivedId: projectId });

      const args = ['node', 'crew', 'project', 'archive', projectId, '--force'];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(MockedCrewApiClient.prototype.archiveProject).toHaveBeenCalledTimes(1);
      expect(MockedCrewApiClient.prototype.archiveProject).toHaveBeenCalledWith(projectId);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(`Project with ID "${projectId}" has been archived.`));
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    test('should handle API errors gracefully when using --force', async () => {
      // Arrange
      const projectId = 'proj-fail-id';
      const apiError = new Error('Archival failed on server.');
      MockedCrewApiClient.prototype.archiveProject.mockRejectedValue(apiError);

      const args = ['node', 'crew', 'project', 'archive', projectId, '--force'];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(MockedCrewApiClient.prototype.archiveProject).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining(`Failed to archive project: ${apiError.message}`));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should show an error if id argument is missing', async () => {
      const args = ['node', 'crew', 'project', 'archive'];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("error: missing required argument 'id'"));
      expect(processExitSpy).toHaveBeenCalled();
    });
  });

  describe('restore', () => {
    test('should call restoreProject and succeed', async () => {
      // Arrange
      const projectId = 'proj_123';
      MockedCrewApiClient.prototype.restoreProject.mockResolvedValue({ success: true, restoredId: projectId });

      const args = ['node', 'crew', 'project', 'restore', projectId];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(MockedCrewApiClient.prototype.restoreProject).toHaveBeenCalledTimes(1);
      expect(MockedCrewApiClient.prototype.restoreProject).toHaveBeenCalledWith(projectId);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(`Project with ID "${projectId}" has been restored.`));
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    test('should handle API errors gracefully', async () => {
      // Arrange
      const projectId = 'proj-fail-id';
      const apiError = new Error('Restoration failed on server.');
      MockedCrewApiClient.prototype.restoreProject.mockRejectedValue(apiError);

      const args = ['node', 'crew', 'project', 'restore', projectId];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(MockedCrewApiClient.prototype.restoreProject).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining(`Failed to restore project: ${apiError.message}`));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });
});