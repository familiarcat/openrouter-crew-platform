import * as assert from 'assert';
import { analyzeComplexityCommand } from './analyze-complexity.js';
import { CommandTestContext } from './command-test-utils.js';

suite('Analyze Complexity Command Test Suite', () => {
    let testContext: CommandTestContext;

    setup(() => {
        testContext = new CommandTestContext();
    });

    teardown(() => {
        testContext.restore();
    });

    test('should analyze selected code directly', async () => {
        // Mock selection
        testContext.contextProvider.getEditorContext = () => ({
            selectedCode: 'function complex() { ... }',
            fileContent: 'file content',
            languageId: 'typescript',
            fileName: '/test/file.ts'
        });

        let capturedCode = '';
        testContext.commandExecutor.analyzeComplexity = async (code: string) => {
            capturedCode = code;
            return { success: true, output: 'Complexity: High', model: 'test', costUSD: 0 };
        };

        await analyzeComplexityCommand(
            testContext.commandExecutor,
            testContext.contextProvider,
            testContext.fileManager
        );

        assert.strictEqual(capturedCode, 'function complex() { ... }');
    });

    test('should offer function selection if no code selected', async () => {
        // Mock no selection
        testContext.contextProvider.getEditorContext = () => ({
            selectedCode: '',
            fileContent: 'full file content',
            languageId: 'typescript',
            fileName: '/test/file.ts'
        });

        // Mock file analysis
        testContext.fileManager.analyzeFile = async () => ({
            nodes: [
                { type: 'function', name: 'func1', startLine: 1, content: 'func1 content' },
                { type: 'class', name: 'Class1', startLine: 10, content: 'class1 content' }
            ],
            language: 'typescript',
            issues: [],
            filePath: '/test/file.ts', imports: [], exports: [], complexity: 1
        });

        // Mock QuickPick selection
        testContext.mockQuickPick({ 
            label: '$(symbol-function) func1', 
            node: { content: 'func1 content' } 
        });

        let capturedCode = '';
        testContext.commandExecutor.analyzeComplexity = async (code: string) => {
            capturedCode = code;
            return { success: true, output: 'Complexity: Low', model: 'test', costUSD: 0 };
        };

        await analyzeComplexityCommand(
            testContext.commandExecutor,
            testContext.contextProvider,
            testContext.fileManager
        );

        assert.strictEqual(capturedCode, 'func1 content');
    });

    test('should analyze entire file if selected from QuickPick', async () => {
        // Mock no selection
        testContext.contextProvider.getEditorContext = () => ({
            selectedCode: '',
            fileContent: 'full file content',
            languageId: 'typescript',
            fileName: '/test/file.ts'
        });

        // Mock file analysis to trigger QuickPick
        testContext.fileManager.analyzeFile = async () => ({
            nodes: [{ type: 'function', name: 'func1', startLine: 1, content: 'func1 content' }],
            language: 'typescript',
            issues: [],
            filePath: '/test/file.ts', imports: [], exports: [], complexity: 1
        });

        // Mock QuickPick selection for "Entire File"
        testContext.mockQuickPick({ 
            label: '$(file) Analyze Entire File', 
            node: { content: 'full file content' } 
        });

        let capturedCode = '';
        testContext.commandExecutor.analyzeComplexity = async (code: string) => {
            capturedCode = code;
            return { success: true, output: 'Complexity: Medium', model: 'test', costUSD: 0 };
        };

        await analyzeComplexityCommand(
            testContext.commandExecutor,
            testContext.contextProvider,
            testContext.fileManager
        );

        assert.strictEqual(capturedCode, 'full file content');
    });
});