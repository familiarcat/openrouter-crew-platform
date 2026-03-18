import { program } from '../index';
import { CrewApiClient } from '../apiClient';
import * as fs from 'fs';

// Mock the entire apiClient module
jest.mock('../apiClient');

// Mock fs.writeFileSync
jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});

const MockedCrewApiClient = CrewApiClient as jest.MockedClass<typeof CrewApiClient>;

describe('crew history', () => {
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
    test('should call getAuditLog and print a table', async () => {
      // Arrange
      const mockHistory = [
        { id: 'op_1', timestamp: '2026-03-02T10:00:00Z', actor: 'user@example.com', action: 'project.new', status: 'success' as const, details: 'Created project "AI Dashboard"' },
        { id: 'op_2', timestamp: '2026-03-02T10:01:00Z', actor: 'agent:picard', action: 'memory.create', status: 'success' as const, details: 'Stored sprint plan' },
      ];
      MockedCrewApiClient.prototype.getAuditLog.mockResolvedValue(mockHistory);
      const args = ['node', 'crew', 'history', 'list'];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(MockedCrewApiClient.prototype.getAuditLog).toHaveBeenCalledTimes(1);
      expect(MockedCrewApiClient.prototype.getAuditLog).toHaveBeenCalledWith(20); // default limit
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Operation History'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('ID')); // table header
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('op_1'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('user@example.com'));
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    test('should respect the --limit option', async () => {
        MockedCrewApiClient.prototype.getAuditLog.mockResolvedValue([]);
        const args = ['node', 'crew', 'history', 'list', '--limit', '5'];
        await program.parseAsync(args);
        expect(MockedCrewApiClient.prototype.getAuditLog).toHaveBeenCalledWith(5);
    });

    test('should show an info message if no history is found', async () => {
        MockedCrewApiClient.prototype.getAuditLog.mockResolvedValue([]);
        const args = ['node', 'crew', 'history', 'list'];
        await program.parseAsync(args);
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No history found.'));
        expect(processExitSpy).not.toHaveBeenCalled();
    });

    test('should handle API errors gracefully', async () => {
      const apiError = new Error('Audit log service unavailable');
      MockedCrewApiClient.prototype.getAuditLog.mockRejectedValue(apiError);
      const args = ['node', 'crew', 'history', 'list'];
      await program.parseAsync(args);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining(`Failed to fetch history: ${apiError.message}`));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should show an error for invalid limit', async () => {
      const args = ['node', 'crew', 'history', 'list', '--limit', '-5'];
      await program.parseAsync(args);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid limit. Must be a positive integer.'));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('show', () => {
    test('should call getAuditLogEntry and print details', async () => {
      // Arrange
      const opId = 'op_1';
      const mockEntry = {
        id: opId,
        timestamp: '2026-03-02T10:00:00Z',
        actor: 'user@example.com',
        action: 'project.new',
        status: 'success' as const,
        details: 'Created project "AI Dashboard"',
        metadata: { ip: '127.0.0.1' }
      };
      MockedCrewApiClient.prototype.getAuditLogEntry.mockResolvedValue(mockEntry);

      const args = ['node', 'crew', 'history', 'show', opId];

      // Act
      await program.parseAsync(args);

      // Assert
      expect(MockedCrewApiClient.prototype.getAuditLogEntry).toHaveBeenCalledTimes(1);
      expect(MockedCrewApiClient.prototype.getAuditLogEntry).toHaveBeenCalledWith(opId);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(`Operation Details: ${opId}`));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(mockEntry.actor));
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    test('should show an error if operation is not found', async () => {
      MockedCrewApiClient.prototype.getAuditLogEntry.mockResolvedValue(undefined);
      const args = ['node', 'crew', 'history', 'show', 'op_999'];
      await program.parseAsync(args);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Operation with ID "op_999" not found.'));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('export', () => {
    test('should call exportHistory and print to stdout', async () => {
      const mockCsv = 'id,timestamp,actor,action,status,details\nop_1,2026-03-02T10:00:00Z,user@example.com,project.new,success,"Created project ""AI Dashboard"""';
      MockedCrewApiClient.prototype.exportHistory.mockResolvedValue(mockCsv);
      const args = ['node', 'crew', 'history', 'export'];

      await program.parseAsync(args);

      expect(MockedCrewApiClient.prototype.exportHistory).toHaveBeenCalledWith('csv', 100); // default limit
      expect(consoleLogSpy).toHaveBeenCalledWith(mockCsv);
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    test('should write to file if --output is provided and respect --limit', async () => {
      const mockCsv = 'id,timestamp,actor,action,status,details\nop_1,2026-03-02T10:00:00Z,user@example.com,project.new,success,"Created project ""AI Dashboard"""';
      MockedCrewApiClient.prototype.exportHistory.mockResolvedValue(mockCsv);
      const args = ['node', 'crew', 'history', 'export', '--output', 'history.csv', '--limit', '50'];

      await program.parseAsync(args);

      expect(MockedCrewApiClient.prototype.exportHistory).toHaveBeenCalledWith('csv', 50);
      expect(fs.writeFileSync).toHaveBeenCalledWith('history.csv', mockCsv);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('History exported to history.csv'));
    });

    test('should handle API errors gracefully', async () => {
      const apiError = new Error('Export service is down');
      MockedCrewApiClient.prototype.exportHistory.mockRejectedValue(apiError);
      const args = ['node', 'crew', 'history', 'export'];

      await program.parseAsync(args);

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining(`Failed to export history: ${apiError.message}`));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });
});