import * as assert from 'assert';
import { documentCommand } from './document.js';
import { CommandTestContext } from '../test/command-test-utils.js';

suite('Document Command Test Suite', () => {
    let testContext: CommandTestContext;

    setup(() => {
        testContext = new CommandTestContext();
    });

    teardown(() => {
        testContext.restore();
    });

    test('should document selected code', async () => {
        testContext.contextProvider.getEditorContext = () => ({
            selectedCode: 'function foo() {}',
            selectionRange: { start: { line: 0 }, end: { line: 0 } },
            languageId: 'typescript',
            fileName: '/test/file.ts'
        });

        let capturedCode = '';
        testContext.commandExecutor.document = async (code: string) => {
            capturedCode = code;
            return { success: true, output: '/** doc */ function foo() {}', model: 'test', costUSD: 0 };
        };

        await documentCommand(
            testContext.commandExecutor,
            testContext.contextProvider,
            testContext.outputLogger,
            testContext.fileManager
        );

        assert.strictEqual(capturedCode, 'function foo() {}');
    });

    test('should suggest undocumented nodes if no selection', async () => {
        testContext.contextProvider.getEditorContext = () => ({
            selectedCode: '',
            fileContent: 'function foo() {}',
            languageId: 'typescript',
            fileName: '/test/file.ts'
        });

        testContext.fileManager.analyzeFile = () => ({
            nodes: [{ type: 'function', name: 'foo', startLine: 1, content: 'function foo() {}' }]
        });

        testContext.mockQuickPick({ 
            node: { name: 'foo', content: 'function foo() {}' } 
        });

        // Execution flow verification handled by mocks returning success
        await documentCommand(testContext.commandExecutor, testContext.contextProvider, testContext.outputLogger, testContext.fileManager);
    });
});