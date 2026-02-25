import * as assert from 'assert';
import { refactorCommand } from './refactor.js';
import { CommandTestContext } from '../test/command-test-utils.js';

suite('Refactor Command Test Suite', () => {
    let testContext: CommandTestContext;

    setup(() => {
        testContext = new CommandTestContext();
    });

    teardown(() => {
        testContext.restore();
    });

    test('should execute refactoring with selected quick pick option', async () => {
        testContext.mockQuickPick({ label: 'Improve readability and clarity' });

        let calledInstruction = '';
        testContext.commandExecutor.refactor = async (_code: string, _file: string, instruction: string) => {
            calledInstruction = instruction;
            return { success: true, output: 'done', model: 'test', costUSD: 0 };
        };

        await refactorCommand(
            testContext.commandExecutor,
            testContext.contextProvider,
            testContext.outputLogger
        );

        assert.strictEqual(calledInstruction, 'Improve readability and clarity');
    });

    test('should handle custom instruction input', async () => {
        testContext.mockQuickPick({ label: 'Custom instruction...' });
        testContext.mockInputBox('My custom refactor');

        let calledInstruction = '';
        testContext.commandExecutor.refactor = async (_code: string, _file: string, instruction: string) => {
            calledInstruction = instruction;
            return { success: true, output: 'done', model: 'test', costUSD: 0 };
        };

        await refactorCommand(
            testContext.commandExecutor,
            testContext.contextProvider,
            testContext.outputLogger
        );

        assert.strictEqual(calledInstruction, 'My custom refactor');
    });
});