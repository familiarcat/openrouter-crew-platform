import * as assert from 'assert';
import { terminalCommand } from './terminal.js';
import { CommandTestContext } from '../test/command-test-utils.js';

suite('Terminal Command Test Suite', () => {
    let testContext: CommandTestContext;

    setup(() => {
        testContext = new CommandTestContext();
    });

    teardown(() => {
        testContext.restore();
    });

    test('should execute terminal command', async () => {
        testContext.mockInputBox('list files');
        
        let executedCommand = '';
        testContext.terminalManager.executeCommand = async (command: string) => {
            executedCommand = command;
            return true;
        };

        testContext.commandExecutor.extractCode = () => 'ls -la';

        await terminalCommand(
            testContext.commandExecutor,
            testContext.terminalManager,
            testContext.outputLogger
        );

        assert.strictEqual(executedCommand, 'ls -la');
    });
});