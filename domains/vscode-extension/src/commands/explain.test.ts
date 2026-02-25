import * as assert from 'assert';
import { explainCommand } from './explain.js';
import { CommandTestContext } from '../test/command-test-utils.js';

suite('Explain Command Test Suite', () => {
    let testContext: CommandTestContext;

    setup(() => {
        testContext = new CommandTestContext();
    });

    teardown(() => {
        testContext.restore();
    });

    test('should explain selected code', async () => {
        // Mock selection
        testContext.contextProvider.getEditorContext = () => ({
            selectedCode: 'function test() {}',
            fileContent: 'function test() {}',
            languageId: 'typescript'
        });

        let capturedCode = '';
        testContext.commandExecutor.explain = async (code: string) => {
            capturedCode = code;
            return { success: true, output: 'Explanation', model: 'test', costUSD: 0 };
        };

        await explainCommand(
            testContext.commandExecutor,
            testContext.contextProvider,
            testContext.outputLogger
        );

        assert.strictEqual(capturedCode, 'function test() {}');
    });
});