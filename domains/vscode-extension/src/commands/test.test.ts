import * as assert from 'assert';
import { testCommand } from './test.js';
import { CommandTestContext } from '../test/command-test-utils.js';

suite('Test Generation Command Test Suite', () => {
    let testContext: CommandTestContext;

    setup(() => {
        testContext = new CommandTestContext();
    });

    teardown(() => {
        testContext.restore();
    });

    test('should generate tests for selected code', async () => {
        testContext.contextProvider.getEditorContext = () => ({
            selectedCode: 'function add(a,b) { return a+b; }',
            languageId: 'typescript',
            fileName: '/test/file.ts'
        });

        let capturedCode = '';
        testContext.commandExecutor.generateTests = async (code: string) => {
            capturedCode = code;
            return { success: true, output: 'tests', model: 'test', costUSD: 0 };
        };

        await testCommand(
            testContext.commandExecutor,
            testContext.contextProvider,
            testContext.outputLogger,
            testContext.fileManager
        );

        assert.strictEqual(capturedCode, 'function add(a,b) { return a+b; }');
    });
});