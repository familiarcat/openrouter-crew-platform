import { program } from '../index';
import * as configManager from '../configManager';
import * as prompts from '../prompts';

jest.mock('../configManager');
jest.mock('../prompts');

const mockedReadConfig = configManager.readConfig as jest.Mock;
const mockedWriteConfig = configManager.writeConfig as jest.Mock;
const mockedAskForConfirmation = prompts.askForConfirmation as jest.Mock;

describe('crew config', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as (code?: number) => never);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe('view', () => {
    test('should print the current configuration', async () => {
      const mockConfig = { apiKey: 'test-key', defaultModel: 'claude-3.5-sonnet' };
      mockedReadConfig.mockReturnValue(mockConfig);
      const args = ['node', 'crew', 'config', 'view'];
      await program.parseAsync(args);
      expect(mockedReadConfig).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith(JSON.stringify(mockConfig, null, 2));
    });

    test('should print an info message if config is empty', async () => {
      mockedReadConfig.mockReturnValue({});
      const args = ['node', 'crew', 'config', 'view'];
      await program.parseAsync(args);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No configuration set.'));
    });
  });

  describe('get', () => {
    test('should get and print a single string value', async () => {
      mockedReadConfig.mockReturnValue({ key: 'value' });
      const args = ['node', 'crew', 'config', 'get', 'key'];
      await program.parseAsync(args);
      expect(mockedReadConfig).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith('value');
    });

    test('should get and print an object value as JSON', async () => {
      const nestedObject = { a: 1, b: 'test' };
      mockedReadConfig.mockReturnValue({ key: nestedObject });
      const args = ['node', 'crew', 'config', 'get', 'key'];
      await program.parseAsync(args);
      expect(mockedReadConfig).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith(JSON.stringify(nestedObject, null, 2));
    });

    test('should show a warning if key does not exist', async () => {
      mockedReadConfig.mockReturnValue({ key: 'value' });
      const args = ['node', 'crew', 'config', 'get', 'nonexistent'];
      await program.parseAsync(args);
      expect(mockedReadConfig).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Key 'nonexistent' not found"));
    });
  });

  describe('set', () => {
    test('should set a new configuration value', async () => {
      mockedReadConfig.mockReturnValue({ existing: 'value' });
      const args = ['node', 'crew', 'config', 'set', 'newKey', 'newValue'];
      await program.parseAsync(args);
      expect(mockedWriteConfig).toHaveBeenCalledWith({ existing: 'value', newKey: 'newValue' });
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Set 'newKey' to 'newValue'"));
    });

    test('should overwrite an existing configuration value', async () => {
      mockedReadConfig.mockReturnValue({ key: 'oldValue' });
      const args = ['node', 'crew', 'config', 'set', 'key', 'newValue'];
      await program.parseAsync(args);
      expect(mockedWriteConfig).toHaveBeenCalledWith({ key: 'newValue' });
    });
  });

  describe('unset', () => {
    test('should remove a configuration value', async () => {
      mockedReadConfig.mockReturnValue({ key: 'value', otherKey: 'otherValue' });
      const args = ['node', 'crew', 'config', 'unset', 'key'];
      await program.parseAsync(args);
      expect(mockedWriteConfig).toHaveBeenCalledWith({ otherKey: 'otherValue' });
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Unset 'key'"));
    });

    test('should show a warning if key does not exist', async () => {
      mockedReadConfig.mockReturnValue({ key: 'value' });
      const args = ['node', 'crew', 'config', 'unset', 'nonexistent'];
      await program.parseAsync(args);
      expect(mockedWriteConfig).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Key 'nonexistent' not found"));
    });
  });

  describe('reset', () => {
    test('should reset the configuration after confirmation', async () => {
      mockedAskForConfirmation.mockResolvedValue(true);
      const args = ['node', 'crew', 'config', 'reset'];
      await program.parseAsync(args);
      expect(mockedAskForConfirmation).toHaveBeenCalled();
      expect(mockedWriteConfig).toHaveBeenCalledWith({});
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Configuration has been reset.'));
    });

    test('should not reset the configuration if not confirmed', async () => {
      mockedAskForConfirmation.mockResolvedValue(false);
      const args = ['node', 'crew', 'config', 'reset'];
      await program.parseAsync(args);
      expect(mockedAskForConfirmation).toHaveBeenCalled();
      expect(mockedWriteConfig).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Reset cancelled.'));
    });
  });
});